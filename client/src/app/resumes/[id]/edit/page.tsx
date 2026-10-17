'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
  ArrowLeft,
  History,
  X,
  RotateCcw,
  Loader2,
  Cloud,
} from 'lucide-react';
import Link from 'next/link';

export default function EditResumePage() {
  const params = useParams();
  const id = params?.id as string;

  const [resume, setResume] = useState<any>(null);
  const [templateId, setTemplateId] = useState<'modern' | 'ats-classic'>('modern');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved'>('idle');
  const [showVersionModal, setShowVersionModal] = useState(false);

  const isLoadedRef = useRef(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '<p>Loading resume editor...</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none min-h-[500px] cursor-text',
      },
    },
    onUpdate: ({ editor }) => {
      if (!isLoadedRef.current) return;
      setSaveStatus('unsaved');
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      autosaveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        await handleSave(true, editor);
      }, 1500);
    },
  });

  const loadResume = useCallback(async () => {
    try {
      const res = await api.get(`/resumes/${id}`);
      const r = res.data.data.resume;
      setResume(r);
      setTemplateId(r.templateId || 'modern');

      if (editor && r.tiptapHtml && !isLoadedRef.current) {
        editor.commands.setContent(r.tiptapHtml);
        isLoadedRef.current = true;
      }
    } catch (err) {
      console.error('Error loading resume:', err);
    }
  }, [id, editor]);

  useEffect(() => {
    if (id) {
      loadResume();
    }
  }, [id, loadResume]);

  useEffect(() => {
    if (editor && resume?.tiptapHtml && !isLoadedRef.current) {
      editor.commands.setContent(resume.tiptapHtml);
      isLoadedRef.current = true;
    }
  }, [editor, resume]);

  const handleSave = async (silent = false, currentEditor = editor) => {
    if (!currentEditor) return;
    if (!silent) setSaving(true);
    setSaveStatus('saving');

    try {
      const html = currentEditor.getHTML();
      const json = currentEditor.getJSON();

      const res = await api.put(`/resumes/${id}`, {
        templateId,
        tiptapHtml: html,
        tiptapContent: json,
      });

      if (res.data?.data?.resume) {
        setResume(res.data.data.resume);
      }

      setLastSaved(new Date().toLocaleTimeString());
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error saving resume:', err);
      setSaveStatus('unsaved');
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleTemplateSwitch = async (newTemplate: 'modern' | 'ats-classic') => {
    setTemplateId(newTemplate);
    setSaving(true);
    try {
      const currentHtml = editor ? editor.getHTML() : resume?.tiptapHtml;
      const currentJson = editor ? editor.getJSON() : undefined;

      const res = await api.put(`/resumes/${id}`, {
        templateId: newTemplate,
        tiptapHtml: currentHtml,
        tiptapContent: currentJson,
        reRenderTemplate: true,
      });

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

  const handleRestoreVersion = async (v: any) => {
    if (!editor || !v.tiptapHtml) return;
    if (!confirm(`Restore Version #${v.versionNumber}? This will load the saved snapshot into your editor.`)) {
      return;
    }

    editor.commands.setContent(v.tiptapHtml);
    setShowVersionModal(false);
    await handleSave(false, editor);
  };

  return (
    <AppShell>
      <div className="space-y-4 max-w-5xl mx-auto pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center gap-3">
            <Link
              href="/resumes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition"
              title="Back to Resumes Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Resumes
            </Link>

            <div className="h-6 w-px bg-neutral-200 hidden sm:block" />

            <div>
              <h1 className="text-lg font-bold text-neutral-900 truncate">
                {resume?.title || 'Resume Editor'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                <span>
                  Template:{' '}
                  <strong className="text-neutral-900">
                    {templateId === 'modern' ? 'Modern Professional' : 'ATS Classic'}
                  </strong>
                </span>
                {saveStatus === 'saving' ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse text-[11px]">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-600" /> Autosaving...
                  </span>
                ) : saveStatus === 'unsaved' ? (
                  <span className="inline-flex items-center gap-1.5 text-indigo-700 font-medium bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" /> Editing (saving shortly...)
                  </span>
                ) : lastSaved ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Autosaved at {lastSaved}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-neutral-500 font-medium bg-neutral-100 px-2.5 py-0.5 rounded-full text-[11px]">
                    <Cloud className="w-3 h-3 text-neutral-400" /> Autosave Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVersionModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition"
              title="View version snapshots"
            >
              <History className="w-3.5 h-3.5 text-neutral-600" />
              <span>Versions ({resume?.versions?.length || 1})</span>
            </button>

            <select
              value={templateId}
              onChange={(e) => handleTemplateSwitch(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-medium border border-neutral-300 rounded bg-white text-neutral-800 focus:outline-none"
            >
              <option value="modern">Modern Professional</option>
              <option value="ats-classic">ATS Classic</option>
            </select>

            <Link
              href={`/resumes/${id}/preview`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> ATS Preview
            </Link>

            <button
              onClick={() => handleSave(false)}
              disabled={saving || saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded transition disabled:opacity-50"
            >
              {saving || saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {editor && (
          <div className="flex items-center gap-1 bg-white border border-neutral-200 px-3 py-2 rounded-xl text-neutral-700 flex-wrap">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-neutral-100 ${
                editor.isActive('bold') ? 'bg-neutral-200 font-bold text-neutral-900' : ''
              }`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-neutral-100 ${
                editor.isActive('italic') ? 'bg-neutral-200 italic text-neutral-900' : ''
              }`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded hover:bg-neutral-100 ${
                editor.isActive('underline') ? 'bg-neutral-200 underline text-neutral-900' : ''
              }`}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-neutral-200 mx-1" />
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded hover:bg-neutral-100 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-neutral-200 font-bold text-neutral-900' : ''
              }`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded hover:bg-neutral-100 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200 font-bold text-neutral-900' : ''
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded hover:bg-neutral-100 ${
                editor.isActive('bulletList') ? 'bg-neutral-200 text-neutral-900' : ''
              }`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-neutral-200 mx-1" />
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div
          onClick={() => editor?.chain().focus().run()}
          className={`bg-white border border-neutral-200 rounded-xl p-8 min-h-[600px] cursor-text transition-all ${
            templateId === 'ats-classic'
              ? 'font-serif text-black max-w-3xl mx-auto'
              : 'font-sans text-neutral-800 max-w-4xl mx-auto'
          }`}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Version History Modal */}
        {showVersionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Resume Version History</h3>
                    <p className="text-[11px] text-neutral-500">
                      Rolling snapshots created on each save (up to 10 versions)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-2.5">
                {(!resume?.versions || resume.versions.length === 0) ? (
                  <p className="text-xs text-neutral-500 text-center py-6">
                    No prior version snapshots recorded yet.
                  </p>
                ) : (
                  [...resume.versions]
                    .reverse()
                    .map((v: any, index: number) => {
                      const isLatest = index === 0;
                      return (
                        <div
                          key={v._id || index}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                            isLatest
                              ? 'bg-indigo-50/50 border-indigo-200'
                              : 'bg-neutral-50 border-neutral-200 hover:bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-900">
                                Version #{v.versionNumber || resume.versions.length - index}
                              </span>
                              {isLatest && (
                                <span className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              Saved on {new Date(v.createdAt).toLocaleString()}
                            </p>
                          </div>

                          {!isLatest && (
                            <button
                              onClick={() => handleRestoreVersion(v)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                )}
              </div>

              <div className="p-3.5 bg-neutral-50 border-t border-neutral-100 flex justify-end">
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
