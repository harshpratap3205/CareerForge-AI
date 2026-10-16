'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import { api } from '../../../../lib/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Save,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Heading1,
  Heading2,
  ExternalLink,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function EditResumePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [resume, setResume] = useState<any>(null);
  const [templateId, setTemplateId] = useState<'modern' | 'ats-classic'>('modern');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '<p>Loading resume editor...</p>',
  });

  useEffect(() => {
    if (id) {
      loadResume();
    }
  }, [id]);

  const loadResume = async () => {
    try {
      const res = await api.get(`/resumes/${id}`);
      const r = res.data.data.resume;
      setResume(r);
      setTemplateId(r.templateId || 'modern');
      if (editor && r.tiptapHtml) {
        editor.commands.setContent(r.tiptapHtml);
      }
    } catch (err) {
      console.error('Error loading resume:', err);
    }
  };

  useEffect(() => {
    if (editor && resume?.tiptapHtml) {
      editor.commands.setContent(resume.tiptapHtml);
    }
  }, [editor, resume]);

  const handleSave = async (silent = false) => {
    if (!editor) return;
    if (!silent) setSaving(true);

    try {
      const html = editor.getHTML();
      const json = editor.getJSON();

      await api.put(`/resumes/${id}`, {
        templateId,
        tiptapHtml: html,
        tiptapContent: json,
      });

      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error saving resume:', err);
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleTemplateSwitch = async (newTemplate: 'modern' | 'ats-classic') => {
    setTemplateId(newTemplate);
    setSaving(true);
    try {
      const res = await api.put(`/resumes/${id}`, { templateId: newTemplate });
      const updated = res.data.data.resume;
      setResume(updated);
      if (editor && updated.tiptapHtml) {
        editor.commands.setContent(updated.tiptapHtml);
      }
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error switching template:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-gray-900 truncate">{resume?.title || 'Resume Editor'}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>Template: <strong className="text-indigo-600">{templateId === 'modern' ? 'Modern Professional' : 'ATS Classic'}</strong></span>
              {lastSaved && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Saved at {lastSaved}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={templateId}
              onChange={(e) => handleTemplateSwitch(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-800"
            >
              <option value="modern">Modern Professional</option>
              <option value="ats-classic">ATS Classic</option>
            </select>

            <Link
              href={`/resumes/${id}/preview`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> ATS Preview
            </Link>

            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {editor && (
          <div className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-2 rounded-xl text-gray-700 shadow-xs flex-wrap">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-indigo-50 text-indigo-600' : ''}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-indigo-50 text-indigo-600' : ''}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-indigo-50 text-indigo-600' : ''}`}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-50 text-indigo-600' : ''}`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-50 text-indigo-600' : ''}`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-indigo-50 text-indigo-600' : ''}`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs min-h-[600px]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </AppShell>
  );
}
