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

  useEffect(() => {
    if (id) {
      api.get(`/resumes/${id}`).then((res) => {
        setResume(res.data.data.resume);
      });
    }
  }, [id]);

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
          <button
            onClick={() => setShowHtml(!showHtml)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-xs hover:bg-gray-50 transition"
          >
            <Code className="w-4 h-4" /> {showHtml ? 'Show Render' : 'ATS HTML Source'}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-xs transition"
          >
            <Printer className="w-4 h-4" /> Print / Export PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200 print:border-none print:shadow-none print:p-0">
        {showHtml ? (
          <pre className="p-4 bg-gray-900 text-green-400 text-xs font-mono rounded-lg overflow-x-auto whitespace-pre-wrap">
            {resume.tiptapHtml}
          </pre>
        ) : (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: resume.tiptapHtml }}
          />
        )}
      </div>
    </div>
  );
}
