import { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service.js';

export class ChatController {
  static async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title } = req.body;
      const session = await ChatService.createSession(req.user!.userId, title);
      res.status(201).json({ success: true, data: { session } });
    } catch (error) {
      next(error);
    }
  }

  static async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await ChatService.getUserSessions(req.user!.userId);
      res.status(200).json({ success: true, data: { sessions } });
    } catch (error) {
      next(error);
    }
  }

  static async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await ChatService.getSession(req.params.id, req.user!.userId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Chat session not found' });
        return;
      }
      const messages = await ChatService.getSessionMessages(req.params.id, req.user!.userId);
      res.status(200).json({ success: true, data: { session, messages } });
    } catch (error) {
      next(error);
    }
  }

  static async renameSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title } = req.body;
      const updated = await ChatService.renameSession(req.params.id, req.user!.userId, title);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }
      res.status(200).json({ success: true, data: { session: updated } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await ChatService.deleteSession(req.params.id, req.user!.userId);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Session deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, model } = req.body;
      const { userMsg, botMsg } = await ChatService.sendMessage(
        req.params.id,
        req.user!.userId,
        message,
        model
      );
      res.status(200).json({ success: true, data: { userMsg, botMsg } });
    } catch (error) {
      next(error);
    }
  }

  static async streamMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, model } = req.body;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      await ChatService.streamMessage(
        req.params.id,
        req.user!.userId,
        message,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        },
        model
      );

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      } else {
        next(error);
      }
    }
  }
}
