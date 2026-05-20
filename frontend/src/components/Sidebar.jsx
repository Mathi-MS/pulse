import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Database, 
  GitMerge, 
  Settings, 
  ChevronDown, 
  Plus, 
  Briefcase,
  Layers,
  LogOut
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const { 
    workspaces, 
    activeWorkspace, 
    setActiveWorkspace, 
    createWorkspace 
  } = useProjectStore();

  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [newWorkspaceModalOpen, setNewWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWorkspaceChange = async (workspace) => {
    await setActiveWorkspace(workspace);
    setWorkspaceDropdownOpen(false);
    navigate('/');
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsSubmitting(true);
    try {
      await createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setNewWorkspaceModalOpen(false);
      setWorkspaceDropdownOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Events Feed', to: '/events', icon: Database },
    { name: 'Realtime', to: '/realtime', icon: Activity },
    { name: 'Funnels', to: '/funnels', icon: GitMerge },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-60 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-40 flex w-64 flex-col
        border-r border-slate-800 bg-darkbg-950 transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:static lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="flex h-16 items-center px-6 gap-2.5 border-b border-slate-800">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-neon">
            <span className="text-lg font-bold text-white">P</span>
            <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border border-darkbg-950 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              PULSE
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-widest -mt-1 uppercase">Analytics</p>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="relative px-4 py-4 border-b border-slate-900 z-50">
          <button 
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-900 bg-opacity-40 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 px-3.5 py-2.5 text-left text-sm font-medium text-slate-200 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
              <span className="truncate max-w-[130px]">
                {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${workspaceDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Workspace Dropdown Panel */}
          {workspaceDropdownOpen && (
            <div className="absolute left-4 right-4 mt-1.5 rounded-lg border border-slate-800 bg-[#0c101b] shadow-2xl p-1.5 z-50">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2.5 py-1.5">
                Workspaces
              </div>
              <div className="max-h-40 overflow-y-auto mb-1.5 space-y-0.5">
                {workspaces.map((w) => (
                  <button
                    key={w._id}
                    onClick={() => handleWorkspaceChange(w)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors
                      ${activeWorkspace?._id === w._id 
                        ? 'bg-indigo-600 bg-opacity-20 text-indigo-400 border border-indigo-500/20' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                      }
                    `}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span className="truncate">{w.name}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-900 pt-1.5">
                <button
                  onClick={() => setNewWorkspaceModalOpen(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2.5 py-2 text-xs font-semibold transition-all duration-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 border
                  ${isActive 
                    ? 'bg-indigo-600 bg-opacity-10 border-indigo-600/30 text-indigo-400 shadow-glass shadow-indigo-600/5 font-semibold' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-800'
                  }
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Workspace Info / Logout */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 bg-opacity-40">
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* New Workspace Modal */}
      {newWorkspaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0d121f] p-6 shadow-2xl glass-card">
            <h3 className="text-base font-bold text-slate-100">Create New Workspace</h3>
            <p className="mt-1.5 text-xs text-slate-400">
              Workspaces hold multiple analytics projects. You can share access with team members.
            </p>
            <form onSubmit={handleCreateWorkspace} className="mt-4">
              <input
                type="text"
                required
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Corp Operations"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <div className="mt-5 flex justify-end gap-2.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setNewWorkspaceModalOpen(false)}
                  className="rounded-lg border border-slate-800 hover:bg-slate-900 px-4 py-2 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-white shadow-neon"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
