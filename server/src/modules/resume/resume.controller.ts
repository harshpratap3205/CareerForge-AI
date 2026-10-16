import { Request, Response, NextFunction } from 'express';
import { ResumeService } from './resume.service.js';

export class ResumeController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resumes = await ResumeService.listResumes(req.user!.userId);
      res.status(200).json({ success: true, data: { resumes } });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await ResumeService.getResume(req.params.id, req.user!.userId);
      if (!resume) {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }
      res.status(200).json({ success: true, data: { resume } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await ResumeService.createResume(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: { resume } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await ResumeService.updateResume(req.params.id, req.user!.userId, req.body);
      res.status(200).json({ success: true, data: { resume } });
    } catch (error) {
      next(error);
    }
  }

  static async duplicate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await ResumeService.duplicateResume(req.params.id, req.user!.userId);
      res.status(201).json({ success: true, data: { resume } });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await ResumeService.deleteResume(req.params.id, req.user!.userId);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async generateAI(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const generated = await ResumeService.generateResumeContent(req.body);
      res.status(200).json({ success: true, data: generated });
    } catch (error) {
      next(error);
    }
  }
}
