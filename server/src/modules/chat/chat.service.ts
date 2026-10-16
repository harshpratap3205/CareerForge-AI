import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env.js';
import { ChatSession, ChatMessage, IChatMessage } from './chat.model.js';
import mongoose from 'mongoose';

export class ChatService {
  private static getGeminiModel() {
    if (!config.gemini.apiKey) {
      return null;
    }
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    return genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      systemInstruction:
        'You are an expert career consultant, executive resume strategist, and technical interview coach. Provide actionable, concise, and structured advice.',
    });
  }

  static async createSession(userId: string, title?: string) {
    const session = new ChatSession({
      userId: new mongoose.Types.ObjectId(userId),
      title: title || 'New Career Discussion',
    });
    return session.save();
  }

  static async getUserSessions(userId: string) {
    return ChatSession.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({
      updatedAt: -1,
    });
  }

  static async getSession(sessionId: string, userId: string) {
    return ChatSession.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  static async renameSession(sessionId: string, userId: string, title: string) {
    return ChatSession.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(sessionId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { title },
      { new: true }
    );
  }

  static async deleteSession(sessionId: string, userId: string) {
    const sId = new mongoose.Types.ObjectId(sessionId);
    const uId = new mongoose.Types.ObjectId(userId);
    await ChatMessage.deleteMany({ sessionId: sId, userId: uId });
    return ChatSession.findOneAndDelete({ _id: sId, userId: uId });
  }

  static async getSessionMessages(sessionId: string, userId: string) {
    return ChatMessage.find({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: 1 });
  }

  static async sendMessage(
    sessionId: string,
    userId: string,
    userMessage: string
  ): Promise<{ userMsg: IChatMessage; botMsg: IChatMessage }> {
    const sId = new mongoose.Types.ObjectId(sessionId);
    const uId = new mongoose.Types.ObjectId(userId);

    const session = await ChatSession.findOne({ _id: sId, userId: uId });
    if (!session) {
      const err: any = new Error('Chat session not found');
      err.statusCode = 404;
      throw err;
    }

    const userMsg = await ChatMessage.create({
      sessionId: sId,
      userId: uId,
      role: 'user',
      content: userMessage,
      tokenCount: Math.ceil(userMessage.length / 4),
    });

    const recentMessages = await ChatMessage.find({ sessionId: sId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const history = recentMessages.reverse().map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    let botReply = '';
    const model = this.getGeminiModel();

    if (model) {
      try {
        const chat = model.startChat({
          history: history.slice(0, -1),
        });
        const result = await chat.sendMessage(userMessage);
        botReply = result.response.text();
      } catch (err: any) {
        console.error('Gemini error:', err);
        botReply =
          'I encountered a brief connection issue with the AI provider. Please verify your GEMINI_API_KEY or retry in a few seconds.';
      }
    } else {
      botReply = `[Development Mode] Set GEMINI_API_KEY in your server/.env to enable live Google Gemini responses. Received query: "${userMessage}".`;
    }

    const botMsg = await ChatMessage.create({
      sessionId: sId,
      userId: uId,
      role: 'model',
      content: botReply,
      tokenCount: Math.ceil(botReply.length / 4),
    });

    if (session.title === 'New Career Discussion') {
      const autoTitle = userMessage.slice(0, 30).trim() + (userMessage.length > 30 ? '...' : '');
      session.title = autoTitle;
    }
    session.updatedAt = new Date();
    await session.save();

    return { userMsg, botMsg };
  }

  static async streamMessage(
    sessionId: string,
    userId: string,
    userMessage: string,
    onChunk: (chunk: string) => void
  ): Promise<IChatMessage> {
    const sId = new mongoose.Types.ObjectId(sessionId);
    const uId = new mongoose.Types.ObjectId(userId);

    const session = await ChatSession.findOne({ _id: sId, userId: uId });
    if (!session) {
      const err: any = new Error('Chat session not found');
      err.statusCode = 404;
      throw err;
    }

    await ChatMessage.create({
      sessionId: sId,
      userId: uId,
      role: 'user',
      content: userMessage,
      tokenCount: Math.ceil(userMessage.length / 4),
    });

    const recent = await ChatMessage.find({ sessionId: sId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const history = recent.reverse().map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    let fullReply = '';
    const model = this.getGeminiModel();

    if (model) {
      try {
        const chat = model.startChat({ history: history.slice(0, -1) });
        const resultStream = await chat.sendMessageStream(userMessage);
        for await (const chunk of resultStream.stream) {
          const text = chunk.text();
          fullReply += text;
          onChunk(text);
        }
      } catch (err: any) {
        const fallbackText =
          fullReply ||
          'Error connecting to Gemini API. Please ensure your GEMINI_API_KEY is valid.';
        onChunk(fallbackText);
        fullReply = fallbackText;
      }
    } else {
      const demoReply = `[Development Mode] Set GEMINI_API_KEY in server/.env to stream live Gemini responses. Query: "${userMessage}".`;
      for (const word of demoReply.split(' ')) {
        onChunk(word + ' ');
        fullReply += word + ' ';
      }
    }

    const botMsg = await ChatMessage.create({
      sessionId: sId,
      userId: uId,
      role: 'model',
      content: fullReply.trim(),
      tokenCount: Math.ceil(fullReply.length / 4),
    });

    if (session.title === 'New Career Discussion') {
      session.title = userMessage.slice(0, 30).trim() + (userMessage.length > 30 ? '...' : '');
    }
    session.updatedAt = new Date();
    await session.save();

    return botMsg;
  }
}
