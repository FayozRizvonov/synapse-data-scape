import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Mail, User as UserIcon, Lock, ShieldCheck, Smartphone, KeyRound, QrCode, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CLAIRE_LOGO_SRC } from '@/constants/branding';

const Profile: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASecret] = useState('JBSWY3DPEHPK3PXP');
  const [twoFARecoveryCodes] = useState([
    'A7F2-93KD-1XZQ',
    'K91L-0QWZ-7RPA',
    'J3MD-2LPA-9QWE',
    'Z9QX-2MNO-1ABC',
    'RK4T-88PL-5UYZ',
  ]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleChooseAvatar = () => fileInputRef.current?.click();
  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  useEffect(() => {
    if (!user) return;
    const initialName = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || '';
    setDisplayName(initialName);
    setEmail(user.email || '');
  }, [user]);

  const saveAccount = async () => {
    if (!user) return;
    setSavingAccount(true);
    setAccountMessage(null);
    try {
      // update name in user metadata
      await supabase.auth.updateUser({ data: { full_name: displayName } });

      // update email if changed
      if (email && email !== (user.email || '')) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        setAccountMessage('We sent a confirmation link to your new email.');
      } else {
        setAccountMessage('Profile updated');
      }
    } catch (e: any) {
      setAccountMessage(e?.message || 'Failed to update profile');
    } finally {
      setSavingAccount(false);
      setTimeout(() => setAccountMessage(null), 2500);
    }
  };

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const savePassword = async () => {
    setPasswordError(null);
    if (!user || !email) return;
          if (!newPassword || newPassword.length < 8) { setPasswordError('Minimum 8 characters'); return; }
          if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    setPasswordLoading(true);
    try {
      // Reauthenticate with current password to validate user input
      const { error: signinError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
              if (signinError) { throw new Error('Current password is incorrect'); }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 1500);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
              setPasswordError(e?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const toggle2FA = () => setTwoFAEnabled(v => !v);

  const otpAuthUrl = useMemo(() => {
    const label = encodeURIComponent(`CLAIRE:${email}`);
    const issuer = encodeURIComponent('CLAIRE');
    return `otpauth://totp/${label}?secret=${twoFASecret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  }, [email, twoFASecret]);

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(twoFARecoveryCodes.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 1200);
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-white/70">Manage your account information, password, and security.</p>
      </div>

      {/* Avatar and Basic Info */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 bg-gradient-to-br from-white/80 to-white/50 dark:from-white/[0.06] dark:to-white/[0.03] backdrop-blur-xl shadow-blue-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="relative h-24 w-24 shrink-0">
            <div className="h-24 w-24 rounded-xl border border-gray-200/60 dark:border-white/10 bg-white overflow-hidden flex items-center justify-center">
              <img
                src={avatarUrl || CLAIRE_LOGO_SRC}
                alt="Avatar"
                className="max-h-full max-w-full object-contain object-center p-1"
              />
            </div>
            <button
              type="button"
              onClick={handleChooseAvatar}
              className="absolute -top-1 -right-1 inline-flex items-center justify-center h-8 w-8 rounded-full border border-cyan-500/30 bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white shadow-blue-md hover:from-cyan-500 hover:to-blue-500 z-10"
              title="Change avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70"><UserIcon className="w-4 h-4" /> Name</span>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="Your name"
              />
            </label>
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70"><Mail className="w-4 h-4" /> Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="you@company.com"
              />
            </label>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={saveAccount} disabled={savingAccount} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 border border-cyan-500/40 shadow-blue-md transition-colors disabled:opacity-70">
            {savingAccount ? 'Saving…' : 'Save changes'}
          </button>
        </div>
        {accountMessage && (
          <div className="mt-2 text-xs text-gray-700 dark:text-white/70">{accountMessage}</div>
        )}
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Lock className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-gray-900 dark:text-white">Change Password</div>
            <div className="text-xs text-gray-500 dark:text-white/60">Update your password regularly to keep your account secure</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="grid gap-2">
            <span className="text-sm text-gray-600 dark:text-white/70">Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder="••••••••"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-gray-600 dark:text-white/70">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder="At least 8 characters"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-gray-600 dark:text-white/70">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder="Repeat new password"
            />
          </label>
        </div>
        <div className="flex items-center justify-between mt-4">
          {passwordError && <div className="text-xs text-red-400">{passwordError}</div>}
          <button onClick={savePassword} disabled={passwordLoading} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 border border-cyan-500/40 shadow-blue-md transition-colors disabled:opacity-70">
            {passwordSaved ? (<><Check className="w-4 h-4" /> Saved</>) : (<><KeyRound className="w-4 h-4" /> {passwordLoading ? 'Updating…' : 'Update password'}</>)}
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-gray-900 dark:text-white">Two‑Factor Authentication (2FA)</div>
            <div className="text-xs text-gray-500 dark:text-white/60">Protect your account with an extra layer of security</div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-5">
          <div className="flex-1 grid gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-white/80">Status</div>
              <button
                onClick={toggle2FA}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border transition-colors ${twoFAEnabled ? 'bg-cyan-500/20 text-blue-700 dark:text-cyan-300 border-cyan-500/30' : 'bg-transparent text-gray-700 dark:text-white/70 border-gray-300 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/10'}`}
              >
                {twoFAEnabled ? 'Enabled' : 'Enable 2FA'}
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-white/70">
              Use an authenticator app (e.g., Google Authenticator, 1Password, Authy) to scan the code and verify.
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-28 w-28 rounded-lg border border-dashed border-gray-300/60 dark:border-white/10 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-gray-400 dark:text-white/30" />
            </div>
            <div className="text-xs text-gray-500 dark:text-white/60 break-all">
              {otpAuthUrl}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-sm text-gray-700 dark:text-white/80">Recovery codes</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {twoFARecoveryCodes.map(code => (
              <div key={code} className="rounded-md border border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-2 text-xs text-gray-800 dark:text-white/80">
                {code}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={copyRecoveryCodes} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/10">
              {copiedCodes ? (<><Check className="w-4 h-4" /> Copied</>) : (<><Copy className="w-4 h-4" /> Copy codes</>)}
            </button>
          </div>
        </div>
      </div>

      {/* Devices */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Smartphone className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-gray-900 dark:text-white">Active Devices & Sessions</div>
            <div className="text-xs text-gray-500 dark:text-white/60">Sign out sessions you do not recognize</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-white/5 p-3 text-sm text-gray-800 dark:text-white/80">
            Chrome • Windows • Last seen 2m ago
          </div>
          <div className="rounded-md border border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-white/5 p-3 text-sm text-gray-800 dark:text-white/80">
            Safari • iPhone • Last seen 1h ago
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-red-300/60 text-red-700 dark:text-red-300 hover:bg-red-500/10">
            Sign out all sessions
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;


