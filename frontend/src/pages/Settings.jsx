import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { 
  Settings as SettingsIcon, User, Lock, Key, Copy, 
  Check, ShieldAlert, Users, Bell, Code, RefreshCw
} from 'lucide-react';

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuthStore();
  const { activeProject, rotateApiKey, deleteProject } = useProjectStore();

  // Profile forms
  const [profileName, setProfileName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Statuses
  const [profileStatus, setProfileStatus] = useState({ success: null, message: '' });
  const [passwordStatus, setPasswordStatus] = useState({ success: null, message: '' });
  const [keyStatus, setKeyStatus] = useState({ success: null, message: '' });
  
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileStatus({ success: null, message: '' });
    try {
      await updateProfile(profileName);
      setProfileStatus({ success: true, message: 'Profile name updated successfully!' });
    } catch (err) {
      setProfileStatus({ success: false, message: err.message || 'Failed to update name.' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ success: null, message: '' });

    if (newPassword !== confirmNewPassword) {
      return setPasswordStatus({ success: false, message: 'New passwords do not match.' });
    }

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordStatus({ success: true, message: 'Password modified successfully!' });
    } catch (err) {
      setPasswordStatus({ success: false, message: err.message || 'Failed to edit credentials.' });
    }
  };

  const handleKeyRotation = async () => {
    if (!activeProject?._id) return;
    setKeyStatus({ success: null, message: '' });
    
    const confirmRotate = window.confirm('Are you sure you want to rotate the API key? Old key will be immediately invalidated, preventing tracking on websites currently using it.');
    if (!confirmRotate) return;

    try {
      await rotateApiKey(activeProject._id);
      setKeyStatus({ success: true, message: 'Tracking key successfully rotated!' });
      setTimeout(() => setKeyStatus({ success: null, message: '' }), 4000);
    } catch (err) {
      setKeyStatus({ success: false, message: 'Failed to rotate key.' });
    }
  };

  const handleDeleteProject = async () => {
    if (!activeProject?._id) return;
    
    const confirmDelete = window.confirm(`WARNING: Are you sure you want to delete project "${activeProject.name}"? This action is permanent and will cascade-delete all historical tracked events.`);
    if (!confirmDelete) return;

    try {
      await deleteProject(activeProject._id);
      alert('Project deleted successfully.');
      window.location.reload(); // refresh context
    } catch (err) {
      alert('Failed to delete project.');
    }
  };

  // Embeddable tracking script template — reads server URL from env
  const serverUrl = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
  const trackingScriptCode = `<!-- Pulse Analytics Tracking Code -->
<script>
  window.PULSE_API_KEY = "${activeProject?.apiKey || 'YOUR_PROJECT_API_KEY'}";
  window.PULSE_SERVER_URL = "${serverUrl}";
</script>
<script src="${serverUrl}/tracker.js" async></script>`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(trackingScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const copyKeyToClipboard = () => {
    if (!activeProject?.apiKey) return;
    navigator.clipboard.writeText(activeProject.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Project & Profile Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">Control API integrations, update profiles, and retrieve SDK keys.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Profile & Password Configs (Left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User profile details */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-indigo-400" />
              Account details
            </h3>

            {profileStatus.message && (
              <div className={`rounded-lg px-3 py-2 text-xs border text-center
                ${profileStatus.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}
              `}>
                {profileStatus.message}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950/60 py-2.5 px-3.5 text-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-neon transition-colors"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Password update */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-indigo-400" />
              Credentials Management
            </h3>

            {passwordStatus.message && (
              <div className={`rounded-lg px-3 py-2 text-xs border text-center
                ${passwordStatus.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}
              `}>
                {passwordStatus.message}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-neon transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>

          {/* Tracking Script Generator Card */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Code className="h-4.5 w-4.5 text-indigo-400" />
                Dynamic SDK Embedding Code
              </h3>
              <button
                onClick={copyScriptToClipboard}
                className="flex items-center gap-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 py-1 text-[10px] text-slate-300 transition-colors font-semibold"
              >
                {copiedScript ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                {copiedScript ? 'Copied script' : 'Copy script'}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copy and paste this snippet directly into your HTML headers or templates. The loader downloads the Pulse Client SDK dynamically and begins recording automatically.
            </p>

            <pre className="w-full rounded-lg bg-slate-950 p-4 font-mono text-[10px] text-indigo-300 border border-slate-900 overflow-x-auto">
              {trackingScriptCode}
            </pre>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-300">SDK Usage Examples:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-[9px] font-mono">
                <div className="rounded border border-slate-900 p-2.5 bg-slate-950/40">
                  <p className="text-indigo-400 font-semibold mb-1">// Identify Customers</p>
                  <code>pulse("identify", "user_9876");</code>
                </div>
                <div className="rounded border border-slate-900 p-2.5 bg-slate-950/40">
                  <p className="text-indigo-400 font-semibold mb-1">// Track Custom Actions</p>
                  <code>pulse("track", "Purchase", &#123; amount: 50 &#125;);</code>
                </div>
                <div className="rounded border border-slate-900 p-2.5 bg-slate-950/40">
                  <p className="text-indigo-400 font-semibold mb-1">// Record Page view</p>
                  <code>pulse("page");</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel (Projects keys, teams, danger) (Right 1/3) */}
        <div className="space-y-6">
          
          {/* Active project API keys */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-indigo-400" />
              API Key Management
            </h3>

            {keyStatus.message && (
              <div className={`rounded-lg px-2 py-1.5 text-[10px] border text-center font-semibold
                ${keyStatus.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}
              `}>
                {keyStatus.message}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Project</span>
                <p className="font-bold text-slate-200 text-sm">{activeProject?.name}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Project tracking Key</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    disabled
                    value={activeProject?.apiKey || ''}
                    className="flex-1 rounded-lg border border-slate-900 bg-slate-950 px-3 py-1.5 font-mono text-[10px] text-slate-400 outline-none select-all"
                  />
                  <button
                    onClick={copyKeyToClipboard}
                    className="rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 px-2 py-1.5 text-slate-300"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleKeyRotation}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-600/30 hover:border-indigo-500 bg-indigo-600/5 hover:bg-indigo-600/10 py-2 font-semibold text-indigo-400 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Rotate Tracker API Key
                </button>
              </div>
            </div>
          </div>

          {/* Team Members List (Bonus feature) */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-indigo-400" />
              Shared Access Team (3)
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-300">Alex Pulse (You)</p>
                  <p className="text-[10px] text-slate-500">demo@pulse.com</p>
                </div>
                <span className="rounded bg-indigo-600/10 px-2 py-0.5 text-[9px] font-bold text-indigo-400">Owner</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-300">Taylor Admin</p>
                  <p className="text-[10px] text-slate-500">taylor@pulse.com</p>
                </div>
                <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400">Admin</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-300">Jordan Analyst</p>
                  <p className="text-[10px] text-slate-500">jordan@pulse.com</p>
                </div>
                <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400">Viewer</span>
              </div>
            </div>
          </div>

          {/* Email Notification Controls (Bonus feature) */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-indigo-400" />
              Email Notification Alerts
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Weekly Analytics digest</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-800 bg-slate-950 accent-indigo-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Spike anomaly triggers</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-800 bg-slate-950 accent-indigo-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Rate limit warnings</span>
                <input type="checkbox" className="h-4 w-4 rounded border-slate-800 bg-slate-950 accent-indigo-600" />
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="glass-card border-red-500/20 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-red-400 border-b border-slate-900 pb-3 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5" />
              Danger Zone
            </h3>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Permanently delete this project. All associated event telemetry data will be immediately and irrevocably purged.
            </p>

            <button
              onClick={handleDeleteProject}
              className="w-full rounded-lg bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white py-2 text-xs font-bold transition-all duration-200"
            >
              Delete "{activeProject?.name}" Project
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
