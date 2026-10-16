import mongoose, { Document, Schema } from 'mongoose';

export interface IResumeVersion {
  versionNumber: number;
  data: any;
  tiptapHtml?: string;
  createdAt: Date;
}

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  templateId: 'modern' | 'ats-classic';
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    gpa?: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    bullets: string[];
  }>;
  skills: {
    technical: string[];
    soft?: string[];
    tools?: string[];
  };
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    github?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    url?: string;
  }>;
  achievements: string[];
  tiptapContent?: any;
  tiptapHtml?: string;
  versions: IResumeVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Software Engineer Resume',
    },
    templateId: {
      type: String,
      enum: ['modern', 'ats-classic'],
      default: 'modern',
    },
    personalInfo: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    summary: { type: String, default: '' },
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startDate: String,
        endDate: String,
        current: Boolean,
        gpa: String,
      },
    ],
    experience: [
      {
        company: String,
        position: String,
        location: String,
        startDate: String,
        endDate: String,
        current: Boolean,
        bullets: [String],
      },
    ],
    skills: {
      technical: [String],
      soft: [String],
      tools: [String],
    },
    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
        link: String,
        github: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        issueDate: String,
        url: String,
      },
    ],
    achievements: [String],
    tiptapContent: { type: Schema.Types.Mixed },
    tiptapHtml: { type: String, default: '' },
    versions: [
      {
        versionNumber: Number,
        data: Schema.Types.Mixed,
        tiptapHtml: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ResumeSchema.index({ userId: 1, updatedAt: -1 });

export const Resume = mongoose.model<IResume>('Resume', ResumeSchema);
