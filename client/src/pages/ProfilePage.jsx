import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, ShieldAlert, KeyRound, Check } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfileState, refreshUser } = useAuth();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Name is required');
      return;
    }

    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await api.put('/users/profile', {
        name: name.trim(),
        avatar: avatar.trim()
      });

      if (response.data.success) {
        updateProfileState(response.data.data);
        setProfileSuccess('Profile updated successfully!');
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const response = await api.put('/users/profile/password', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <User className="text-brand-500" /> Account Settings
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Manage your personal details, profile picture, and login credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="glass-card flex flex-col items-center text-center p-6 h-fit">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-24 w-24 rounded-full border-2 border-brand-500/20 object-cover shadow-xl"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-3xl uppercase shadow-xl">
              {user?.name.charAt(0)}
            </div>
          )}
          <h2 className="text-base font-bold text-slate-200 mt-4">{user?.name}</h2>
          <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
          <span className="inline-block px-2.5 py-1 mt-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-slate-400">
            {user?.role} Badge
          </span>
          <p className="text-[10px] text-slate-500 mt-4">
            Registered on:{' '}
            {user?.createdAt && new Date(user.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Edit Profile & Password Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile */}
          <div className="glass-card">
            <h3 className="text-sm font-bold text-slate-200 mb-4 pb-2 border-b border-white/5">
              Personal Information
            </h3>

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <Check size={14} /> {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-xs text-red-200">
                {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input text-sm"
                  required
                  disabled={profileLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full glass-input text-sm"
                  disabled={profileLoading}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="glass-btn-primary py-2 px-6 text-sm"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="glass-card">
            <h3 className="text-sm font-bold text-slate-200 mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
              <KeyRound size={16} className="text-brand-400" />
              Change Password
            </h3>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <Check size={14} /> {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-xs text-red-200">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full glass-input text-sm"
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full glass-input text-sm"
                    required
                    disabled={passwordLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full glass-input text-sm"
                    required
                    disabled={passwordLoading}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="glass-btn-primary py-2 px-6 text-sm"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
