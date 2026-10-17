'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { api } from '../../../lib/api';
import { ArrowLeft, FileText, Sparkles, User, Briefcase, Code, GraduationCap } from 'lucide-react';
import Link from 'next/link';

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq, Ultra Fast)' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq, Instant)' },
  { id: 'gemini-1.5-flash', name: 'Google Gemini 1.5 Flash' },
  { id: 'gemini-2.0-flash', name: 'Google Gemini 2.0 Flash' },
];

export default function CreateResumePage() {
  const router = useRouter();

  // Personal Info Form State (Defaults loaded dynamically from Profile)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  // Career Criteria Form State
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number | ''>(3);
  const [rawSkills, setRawSkills] = useState('');
  const [userBio, setUserBio] = useState('');
  const [keyAchievements, setKeyAchievements] = useState('');
  const [educationContext, setEducationContext] = useState('');

  // Template & Model
  const [templateId, setTemplateId] = useState<'modern' | 'ats-classic'>('modern');
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const res = await api.get('/users/profile');
        const user = res.data?.data?.user;
        if (user) {
          setFullName(user.name || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
          if (user.profile) {
            if (user.profile.headline) setTargetRole(user.profile.headline);
            if (user.profile.experienceYears !== undefined) {
              setYearsOfExperience(user.profile.experienceYears);
            }
            if (user.profile.skills && Array.isArray(user.profile.skills)) {
              setRawSkills(user.profile.skills.join(', '));
            }
            if (user.profile.bio) setUserBio(user.profile.bio);
          }
        }
      } catch {
        // Fall back to localStorage if profile fetch fails
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.name) setFullName(parsed.name);
            if (parsed.email) setEmail(parsed.email);
            if (parsed.phone) setPhone(parsed.phone);
          }
        } catch {
          // Ignore
        }
      } finally {
        setLoadingProfile(false);
      }
    }

    loadUserProfile();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !targetRole.trim()) {
      setError('Please provide your Full Name, Email, and Target Role.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const skillsArray = rawSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const aiRes = await api.post('/resumes/generate-ai', {
        targetRole,
        yearsOfExperience: Number(yearsOfExperience) || 0,
        rawSkills: skillsArray,
        userBio,
        targetIndustry,
        keyAchievements,
        educationContext,
        model: selectedModel,
      });

      const structuredContent = aiRes.data.data;

      // Construct accurate personalInfo using actual user inputs without any hardcoded fallback
      const personalInfo: Record<string, string> = {
        fullName: fullName.trim(),
        email: email.trim(),
      };
      if (phone.trim()) personalInfo.phone = phone.trim();
      if (location.trim()) personalInfo.location = location.trim();
      if (linkedin.trim()) personalInfo.linkedin = linkedin.trim();
      if (github.trim()) personalInfo.github = github.trim();

      const createRes = await api.post('/resumes', {
        title: `${targetRole.trim()} Resume`,
        templateId,
        personalInfo,
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
      <div className="max-w-3xl mx-auto space-y-5 pb-16">
        <Link
          href="/resumes"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Resumes
        </Link>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">AI Resume Generator</h1>
              <p className="text-xs text-neutral-500">
                Personalized from your profile & customized with tailored role parameters
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 my-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-6 mt-6">
            {/* Section 1: Candidate Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <User className="w-4 h-4 text-neutral-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Candidate Contact Information (Loaded from Profile)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    disabled={loadingProfile}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    disabled={loadingProfile}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0123"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Location / City</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. New York, NY"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="e.g. linkedin.com/in/username"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">GitHub / Portfolio</label>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="e.g. github.com/username"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Career & Target Parameters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <Briefcase className="w-4 h-4 text-neutral-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Target Career & Role Context
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Target Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer / Full-Stack Developer"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Years Experience</label>
                  <input
                    type="number"
                    min={0}
                    max={35}
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Target Industry / Domain</label>
                  <input
                    type="text"
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    placeholder="e.g. Fintech, Cloud SaaS, Healthcare, E-Commerce"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Resume Template</label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 bg-white focus:outline-none focus:border-indigo-600 transition font-medium"
                  >
                    <option value="modern">Modern Professional (Icons & Indigo Accents)</option>
                    <option value="ats-classic">ATS Classic (Strict Single-Column & Monochrome)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Technical Skills & Accomplishments */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <Code className="w-4 h-4 text-neutral-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Technical Stack & Highlights
                </h2>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Skills & Technologies (Comma-separated)
                </label>
                <input
                  type="text"
                  value={rawSkills}
                  onChange={(e) => setRawSkills(e.target.value)}
                  placeholder="e.g. TypeScript, React, Node.js, Next.js, PostgreSQL, Redis, Docker, AWS"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Key Accomplishments / Metrics (Optional)
                </label>
                <input
                  type="text"
                  value={keyAchievements}
                  onChange={(e) => setKeyAchievements(e.target.value)}
                  placeholder="e.g. Reduced API latency by 45%, managed team of 6 engineers, launched payment microservice"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Candidate Profile Summary & Notes
                </label>
                <textarea
                  rows={3}
                  value={userBio}
                  onChange={(e) => setUserBio(e.target.value)}
                  placeholder="Detail your engineering focus, architectural experience, or career goals..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* Section 4: Education Background */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <GraduationCap className="w-4 h-4 text-neutral-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Education & Credentials (Optional)
                </h2>
              </div>

              <div>
                <input
                  type="text"
                  value={educationContext}
                  onChange={(e) => setEducationContext(e.target.value)}
                  placeholder="e.g. B.S. in Computer Science from University of California, 2018 - 2022"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* Section 5: Engine & Submit */}
            <div className="pt-4 border-t border-neutral-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
                <label className="text-xs font-medium text-neutral-700">AI Model Provider:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs text-neutral-900 bg-white focus:outline-none focus:border-indigo-600 transition font-medium"
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-xs hover:shadow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? 'Crafting ATS Structured Resume...' : 'Generate Resume with AI'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
