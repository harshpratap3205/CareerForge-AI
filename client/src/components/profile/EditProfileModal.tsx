'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { X, User, Phone, Briefcase, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [headline, setHeadline] = useState(user?.profile?.headline || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setHeadline(user.profile?.headline || '');
      setBio(user.profile?.bio || '');
      setError(null);
      setSuccess(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.put('/users/profile', {
        name: name.trim(),
        phone: phone.trim(),
        profile: {
          ...(user?.profile || {}),
          headline: headline.trim(),
          bio: bio.trim(),
        },
      });

      if (res.data?.data?.user) {
        updateUser(res.data.data.user);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Edit Profile</h2>
            <p className="text-xs text-neutral-500">Update your personal and career details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 text-sm bg-neutral-50 text-neutral-500 border border-neutral-200 rounded-xl cursor-not-allowed"
            />
            <p className="text-[11px] text-neutral-400 mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Professional Headline
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition"
                placeholder="Senior Full-Stack Engineer | React & Node.js"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Short Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition resize-none"
                placeholder="Passionate engineer with 4+ years building cloud-scale applications."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
