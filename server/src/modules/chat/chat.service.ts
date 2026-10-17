import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { config } from '../../config/env.js';
import { ChatSession, ChatMessage, IChatMessage } from './chat.model.js';
import mongoose from 'mongoose';

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];

export class ChatService {
  private static getGroqClient(): Groq | null {
    if (!config.groq.apiKey) return null;
    return new Groq({ apiKey: config.groq.apiKey });
  }

  static resolveGroqModel(modelName: string): string {
    if (modelName === 'openai/gpt-oss-120b' || modelName.includes('oss') || modelName.includes('gpt')) {
      return 'llama-3.3-70b-versatile';
    }
    if (modelName === 'qwen/qwen3.8-27b' || modelName.includes('qwen')) {
      return 'llama-3.1-8b-instant';
    }
    return modelName || 'llama-3.3-70b-versatile';
  }

  static resolveGeminiModel(modelName?: string): string {
    if (!modelName || modelName.includes('3.5') || modelName.includes('3.8') || modelName.includes('latest')) {
      return 'gemini-1.5-flash';
    }
    return modelName;
  }

  private static getGeminiModel(modelName?: string) {
    if (!config.gemini.apiKey) return null;
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const selectedModel = this.resolveGeminiModel(modelName);
    return genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction:
        'You are an executive career consultant, resume strategist, and technical interview coach. Provide structured, actionable, candid, and high-impact career guidance.',
    });
  }

  private static isGroqModel(modelName: string): boolean {
    return (
      modelName.startsWith('openai/') ||
      modelName.startsWith('qwen/') ||
      modelName.startsWith('meta-llama/') ||
      modelName.includes('llama') ||
      modelName.includes('oss')
    );
  }

  private static sanitizeHistory(messages: Array<{ role: string; content: string }>) {
    const clean: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
    let expectedRole: 'user' | 'model' = 'user';

    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== 'string') continue;

      if (
        msg.content.includes('temporarily experiencing high demand') ||
        msg.content.includes('Error connecting to') ||
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
      modelName || 'openai/gpt-oss-120b',
      ...GROQ_MODELS,
      ...GEMINI_MODELS,
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let succeeded = false;

    for (const candidate of modelsToTry) {
      try {
        if (this.isGroqModel(candidate)) {
          const groq = this.getGroqClient();
          if (!groq) continue;

          console.log(`[Chat] Querying Groq with model: ${candidate}`);
          const groqMessages = [
            {
              role: 'system',
              content:
                'You are an executive career consultant, resume strategist, and technical interview coach. Provide structured, actionable, and candid guidance.',
            },
            ...previousMessages.map((m) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
            { role: 'user', content: userMessage },
          ];

          const resolvedModel = this.resolveGroqModel(candidate);
          const comp = await groq.chat.completions.create({
            model: resolvedModel,
            messages: groqMessages as any,
          });

          botReply = comp.choices[0]?.message?.content || '';
          succeeded = true;
          break;
        } else {
          const gemini = this.getGeminiModel(candidate);
          if (!gemini) continue;

          console.log(`[Chat] Querying Gemini with model: ${candidate}`);
          const chat = gemini.startChat({ history });
          const res = await chat.sendMessage(userMessage);
          botReply = res.response.text();
          succeeded = true;
          break;
        }
      } catch (err: any) {
        console.warn(`[Chat] Candidate ${candidate} failed: ${err.message}. Retrying fallback...`);
      }
    }

    if (!succeeded) {
      if (!config.groq.apiKey && !config.gemini.apiKey) {
        botReply = `[Development Mode] Set GROQ_API_KEY or GEMINI_API_KEY in server/.env. Query: "${userMessage}".`;
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
      modelName || 'openai/gpt-oss-120b',
      ...GROQ_MODELS,
      ...GEMINI_MODELS,
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let succeeded = false;

    for (const candidate of modelsToTry) {
      try {
        if (this.isGroqModel(candidate)) {
          const groq = this.getGroqClient();
          if (!groq) continue;

          console.log(`[Chat] Streaming session ${sessionId} with Groq model: ${candidate}`);
          const groqMessages = [
            {
              role: 'system',
              content:
                'You are an executive career consultant, resume strategist, and technical interview coach. Provide structured, actionable, and candid guidance.',
            },
            ...previousMessages.map((m) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
            { role: 'user', content: userMessage },
          ];

          const resolvedModel = this.resolveGroqModel(candidate);
          const stream = await groq.chat.completions.create({
            model: resolvedModel,
            messages: groqMessages as any,
            stream: true,
          });

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              fullReply += text;
              onChunk(text);
            }
          }

          succeeded = true;
          console.log(`[Chat] Groq stream completed successfully (${fullReply.length} chars)`);
          break;
        } else {
          const gemini = this.getGeminiModel(candidate);
          if (!gemini) continue;

          console.log(`[Chat] Streaming session ${sessionId} with Gemini model: ${candidate}`);
          const chat = gemini.startChat({ history });
          const resultStream = await chat.sendMessageStream(userMessage);

          for await (const chunk of resultStream.stream) {
            const text = chunk.text();
            fullReply += text;
            onChunk(text);
          }

          succeeded = true;
          console.log(`[Chat] Gemini stream completed successfully (${fullReply.length} chars)`);
          break;
        }
      } catch (err: any) {
        console.warn(`[Chat] Candidate ${candidate} failed: ${err.message}`);
        if (fullReply.length > 0) {
          succeeded = true;
          break;
        }
      }
    }

    if (!succeeded) {
      if (!config.groq.apiKey && !config.gemini.apiKey) {
        const demoReply = `[Development Mode] Set GROQ_API_KEY or GEMINI_API_KEY in server/.env to stream live responses. Query: "${userMessage}".`;
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
