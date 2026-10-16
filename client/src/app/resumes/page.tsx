'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { api } from '../../lib/api';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  Edit3,
} from 'lucide-react';

interface ResumeSummary {
  _id: string;
  title: string;
  templateId: 'modern' | 'ats-classic';
  updatedAt: string;
}

export default function ResumesListPage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes');
      setResumes(res.data.data.resumes || []);
    } catch (err) {
      console.error('Error fetching resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.post(`/resumes/${id}/duplicate`);
      setResumes([res.data.data.resume, ...resumes]);
    } catch (err) {
      console.error('Error duplicating resume:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      setResumes(resumes.filter((r) => r._id !== id));
    } catch (err) {
      console.error('Error deleting resume:', err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Resumes</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Structured ATS-compliant resume documents.
            </p>
          </div>
          <Link
            href="/resumes/create"
            className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium px-3.5 py-2 rounded"
          >
            <Plus className="w-3.5 h-3.5" /> Create Resume
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white border border-neutral-200 rounded animate-pulse" />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded p-10 text-center">
            <FileText className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h3 className="font-semibold text-neutral-900 text-sm">No resumes created yet</h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-0.5 mb-4">
              Create your first structured resume document using ATS-friendly templates.
            </p>
            <Link
              href="/resumes/create"
              className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium px-3 py-1.5 rounded"
            >
              <Plus className="w-3.5 h-3.5" /> Create Resume
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="bg-white border border-neutral-200 rounded p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded font-medium uppercase tracking-wider">
                      {resume.templateId === 'modern' ? 'Modern Professional' : 'ATS Classic'}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {new Date(resume.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm text-neutral-900 truncate">{resume.title}</h3>
                </div>

                <div className="border-t border-neutral-100 pt-3 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/resumes/${resume._id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 hover:underline"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </Link>
                    <Link
                      href={`/resumes/${resume._id}/preview`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      <ExternalLink className="w-3 h-3" /> Preview
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(resume._id)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="p-1 text-neutral-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
