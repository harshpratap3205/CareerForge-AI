'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Printer, ArrowLeft, Code, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ResumePreviewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [resume, setResume] = useState<any>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/resumes/${id}`).then((res) => {
        setResume(res.data.data.resume);
      });
    }
  }, [id]);

  const handleTemplateSwitch = async (newTemplate: 'modern' | 'ats-classic') => {
    if (resume?.templateId === newTemplate || switching) return;
    setSwitching(true);
    try {
      const res = await api.put(`/resumes/${id}`, {
        templateId: newTemplate,
        tiptapHtml: resume?.tiptapHtml,
        reRenderTemplate: true,
      });
      setResume(res.data.data.resume);
    } catch (err) {
      console.error('Failed to change template:', err);
    } finally {
      setSwitching(false);
    }
  };

  if (!resume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/resumes/${id}/edit`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Editor
        </Link>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-gray-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => handleTemplateSwitch('modern')}
              disabled={switching}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                resume.templateId !== 'ats-classic'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Modern Professional
            </button>
            <button
              onClick={() => handleTemplateSwitch('ats-classic')}
              disabled={switching}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                resume.templateId === 'ats-classic'
                  ? 'bg-neutral-900 text-white shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ATS Classic (Monochrome)
            </button>
          </div>

          <button
            onClick={() => setShowHtml(!showHtml)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-xs hover:bg-gray-50 transition cursor-pointer"
          >
            <Code className="w-4 h-4" /> {showHtml ? 'Show Render' : 'ATS HTML Source'}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Export PDF
          </button>
        </div>
      </div>

      <div className={`bg-white p-10 transition-all print:border-none print:shadow-none print:p-0 ${
        resume.templateId === 'ats-classic'
          ? 'font-serif text-black max-w-3xl mx-auto shadow-sm border border-neutral-300 rounded-md'
          : 'font-sans text-neutral-900 max-w-4xl mx-auto shadow-md border-t-4 border-indigo-600 border-x border-b border-neutral-200 rounded-xl'
      }`}>
        {showHtml ? (
          <pre className="p-4 bg-neutral-900 text-emerald-400 text-xs font-mono rounded overflow-x-auto whitespace-pre-wrap">
            {resume.tiptapHtml}
          </pre>
        ) : (
          <div
            className={`prose max-w-none ${
              resume.templateId === 'ats-classic'
                ? 'prose-headings:font-serif prose-headings:text-black prose-headings:font-bold prose-headings:tracking-normal prose-hr:border-neutral-800'
                : 'prose-headings:font-sans prose-h1:text-indigo-950 prose-h2:text-indigo-700 prose-h2:border-indigo-100'
            }`}
            dangerouslySetInnerHTML={{ __html: resume.tiptapHtml }}
          />
        )}
      </div>
    </div>
  );
}
