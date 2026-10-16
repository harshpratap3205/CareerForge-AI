import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env.js';
import { ChatSession, ChatMessage, IChatMessage } from './chat.model.js';
import mongoose from 'mongoose';

const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.8-flash'];

export class ChatService {
  private static getGeminiModel(modelName?: string) {
    if (!config.gemini.apiKey) {
      return null;
    }
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const selectedModel = modelName || 'gemini-flash-latest';
    return genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction:
        'You are an executive career consultant, resume strategist, and technical interview coach. Provide structured, actionable, candid, and high-impact career guidance.',
    });
  }

  private static sanitizeHistory(messages: Array<{ role: string; content: string }>) {
    const clean: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
    let expectedRole: 'user' | 'model' = 'user';

    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== 'string') continue;

      if (
        msg.content.includes('temporarily experiencing high demand') ||
        msg.content.includes('Error connecting to Gemini API') ||
        msg.content.includes('[Development Mode]')
      ) {
        continue;
      }

      const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
      if (role === expectedRole) {
        clean.push({ role, parts: [{ text: msg.content.trim() }] });
        expectedRole = role === 'user' ? 'model' : 'user';
      }
    }

    if (clean.length > 0 && clean[clean.length - 1].role === 'user') {
      clean.pop();
    }

    return clean;
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
    userMessage: string,
    modelName?: string
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

    const recent = await ChatMessage.find({ sessionId: sId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const previousMessages = recent.reverse().slice(0, -1);
    const history = this.sanitizeHistory(previousMessages);

    let botReply = '';
    const modelsToTry = [
      modelName || 'gemini-flash-latest',
      ...FALLBACK_MODELS,
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let succeeded = false;
    for (const candidate of modelsToTry) {
      const model = this.getGeminiModel(candidate);
      if (!model) break;

      try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(userMessage);
        botReply = result.response.text();
        succeeded = true;
        break;
      } catch (err: any) {
        console.warn(`[Chat] Candidate ${candidate} failed: ${err.message}. Retrying fallback...`);
      }
    }

    if (!succeeded) {
      if (!config.gemini.apiKey) {
        botReply = `[Development Mode] Set GEMINI_API_KEY in server/.env to enable live AI responses. Received: "${userMessage}".`;
      } else {
        botReply =
          'I apologize, but the advisory service is currently experiencing high demand. Please try sending your message again in a moment.';
      }
    }

    const botMsg = await ChatMessage.create({
      sessionId: sId,
      userId: uId,
      role: 'model',
      content: botReply,
      tokenCount: Math.ceil(botReply.length / 4),
    });

    if (session.title === 'New Career Discussion') {
      session.title = userMessage.slice(0, 30).trim() + (userMessage.length > 30 ? '...' : '');
    }
    session.updatedAt = new Date();
    await session.save();

    return { userMsg, botMsg };
  }

  static async streamMessage(
    sessionId: string,
    userId: string,
    userMessage: string,
    onChunk: (chunk: string) => void,
    modelName?: string
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

    const previousMessages = recent.reverse().slice(0, -1);
    const history = this.sanitizeHistory(previousMessages);

    let fullReply = '';
    const modelsToTry = [
      modelName || 'gemini-flash-latest',
      ...FALLBACK_MODELS,
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let succeeded = false;

    for (const candidate of modelsToTry) {
      const model = this.getGeminiModel(candidate);
      if (!model) break;

      try {
        console.log(`[Chat] Streaming session ${sessionId} with model: ${candidate}`);
        const chat = model.startChat({ history });
        const resultStream = await chat.sendMessageStream(userMessage);

        for await (const chunk of resultStream.stream) {
          const text = chunk.text();
          fullReply += text;
          onChunk(text);
        }

        succeeded = true;
        console.log(`[Chat] Stream completed successfully (${fullReply.length} chars)`);
        break;
      } catch (err: any) {
        console.warn(`[Chat] Candidate ${candidate} failed: ${err.message}`);
        if (fullReply.length > 0) {
          succeeded = true;
          break;
        }
      }
    }

    if (!succeeded) {
      if (!config.gemini.apiKey) {
        const demoReply = `[Development Mode] Set GEMINI_API_KEY in server/.env to stream live responses. Query: "${userMessage}".`;
        for (const word of demoReply.split(' ')) {
          onChunk(word + ' ');
          fullReply += word + ' ';
        }
      } else {
        const fallbackText =
          fullReply ||
          'I apologize, but the advisory service is currently experiencing high demand. Please try sending your message again in a moment.';
        onChunk(fallbackText);
        fullReply = fallbackText;
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
