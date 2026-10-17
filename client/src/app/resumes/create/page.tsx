'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { api } from '../../../lib/api';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq, Ultra Fast)' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq, Instant)' },
  { id: 'gemini-1.5-flash', name: 'Google Gemini 1.5 Flash' },
  { id: 'gemini-2.0-flash', name: 'Google Gemini 2.0 Flash' },
];

export default function CreateResumePage() {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Engineer');
  const [yearsOfExperience, setYearsOfExperience] = useState(3);
  const [rawSkills, setRawSkills] = useState('TypeScript, React, Node.js, Next.js, MongoDB, Redis, Docker, AWS');
  const [userBio, setUserBio] = useState('Full stack engineer specialized in high-performance cloud applications and microservices.');
  const [templateId, setTemplateId] = useState<'modern' | 'ats-classic'>('modern');
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');

    try {
      const aiRes = await api.post('/resumes/generate-ai', {
        targetRole,
        yearsOfExperience: Number(yearsOfExperience),
        rawSkills: rawSkills.split(',').map((s) => s.trim()).filter(Boolean),
        userBio,
        model: selectedModel,
      });

      const structuredContent = aiRes.data.data;

      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;

      const createRes = await api.post('/resumes', {
        title: `${targetRole} Resume`,
        templateId,
        personalInfo: {
          fullName: currentUser?.name || 'Jane Doe',
          email: currentUser?.email || 'jane.doe@example.com',
          phone: currentUser?.phone || '+1 555-0199',
          location: 'San Francisco, CA',
        },
        ...structuredContent,
      });

      const newResume = createRes.data.data.resume;
      router.push(`/resumes/${newResume._id}/edit`);
    } catch (err: any) {
      console.error('Error generating resume:', err);
      setError(err.response?.data?.message || 'Failed to generate resume. Please retry.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-4">
        <Link
          href="/resumes"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Resumes
        </Link>

        <div className="bg-white border border-neutral-200 rounded p-6">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-neutral-800" />
            <h1 className="text-base font-semibold text-neutral-900">Create Structured Resume</h1>
          </div>
          <p className="text-xs text-neutral-500">Provide position criteria to generate structured ATS resume sections</p>

          {error && (
            <div className="p-2.5 my-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4 mt-5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Target Role Title</label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                placeholder="Senior Full-Stack Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Template Format</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value as any)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 bg-white focus:outline-none focus:border-neutral-900"
                >
                  <option value="modern">Modern Professional</option>
                  <option value="ats-classic">ATS Classic (Strict Single-Column)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Skills (Comma-separated)</label>
              <input
                type="text"
                value={rawSkills}
                onChange={(e) => setRawSkills(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                placeholder="TypeScript, Node.js, React, MongoDB..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Candidate Profile Notes</label>
              <textarea
                rows={3}
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                placeholder="Summary notes about accomplishments and engineering background..."
              />
            </div>

            <div className="pt-2 border-t border-neutral-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium text-neutral-700 whitespace-nowrap">
                  AI Generator Engine:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full max-w-xs px-2.5 py-1.5 border border-neutral-300 rounded text-xs text-neutral-900 bg-white focus:outline-none focus:border-neutral-900"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded text-xs transition disabled:opacity-50"
              >
                {generating ? 'Generating Resume Content...' : 'Generate Resume with AI'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
