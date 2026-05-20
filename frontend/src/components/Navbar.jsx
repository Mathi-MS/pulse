import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  FolderGit2, 
  ChevronDown, 
  Plus, 
  User, 
  LogOut,
  Settings
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ setSidebarOpen }) {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const { user } = useAuthStore();
  const { 
    projects, 
    activeProject, 
    setActiveProject, 
    createProject 
  } = useProjectStore();

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProjectChange = (project) => {
    setActiveProject(project);
    setProjectDropdownOpen(false);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsSubmitting(true);
    try {
      await createProject(newProjectName);
      setNewProjectName('');
      setNewProjectModalOpen(false);
      setProjectDropdownOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-900 bg-[#060913] bg-opacity-70 backdrop-blur-md px-6 shadow-sm">
      {/* Left side: Hamburger (mobile) + Project selector */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Project Switcher Dropdown */}
        <div className="relative z-40">
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 bg-opacity-50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all duration-200"
          >
            <FolderGit2 className="h-4 w-4 text-indigo-400" />
            <span className="max-w-[130px] truncate">
              {activeProject ? activeProject.name : 'Select Project'}
            </span>
            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {projectDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-52 rounded-lg border border-slate-800 bg-[#0c101b] shadow-2xl p-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2.5 py-1.5">
                Projects
              </div>
              <div className="max-h-40 overflow-y-auto mb-1.5 space-y-0.5">
                {projects.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => handleProjectChange(p)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors
                      ${activeProject?._id === p._id
                        ? 'bg-indigo-600 bg-opacity-15 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                      }
                    `}
                  >
                    <FolderGit2 className="h-3.5 w-3.5" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
                {projects.length === 0 && (
                  <div className="text-[11px] text-slate-500 italic px-2.5 py-2">
                    No projects found
                  </div>
                )}
              </div>
              <div className="border-t border-slate-900 pt-1.5">
                <button
                  onClick={() => setNewProjectModalOpen(true)}
                  className="flex w-full items-center justify-center gap-1 rounded-md bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-1.5 text-xs font-semibold transition-all duration-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Search, Notifications, Avatar */}
      <div className="flex items-center gap-4.5">
        {/* Search Input Placeholder */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search events..."
            className="w-48 md:w-60 rounded-lg border border-slate-900 bg-slate-950 bg-opacity-60 py-2 pl-9 pr-4 text-xs text-slate-300 placeholder-slate-500 focus:border-slate-800 focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Notifications Alert */}
        <button className="relative rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500"></span>
        </button>

        {/* Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 rounded-full border border-slate-800 p-0.5 hover:border-slate-700 transition-colors"
          >
            <img
              src={user?.avatar || 'https://www.gravatar.com/avatar/default?d=identicon'}
              alt={user?.name || 'User'}
              className="h-8.5 w-8.5 rounded-full object-cover"
            />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-56 rounded-lg border border-slate-800 bg-[#0c101b] shadow-2xl p-2 z-50">
              <div className="px-3 py-2.5 border-b border-slate-900">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1.5 space-y-0.5 text-xs font-medium text-slate-400">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left hover:bg-slate-900 hover:text-slate-200"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left hover:bg-slate-900 hover:text-slate-200"
                >
                  <Settings className="h-4 w-4" />
                  API Management
                </button>
              </div>
              <div className="border-t border-slate-900 pt-1.5 text-xs font-medium">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#0d121f] p-6 shadow-2xl glass-card">
            <h3 className="text-base font-bold text-slate-100">Create New Project</h3>
            <p className="mt-1.5 text-xs text-slate-400">
              Projects group all incoming analytics data and generate dedicated client SDK keys.
            </p>
            <form onSubmit={handleCreateProject} className="mt-4">
              <input
                type="text"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Production iOS Mobile App"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <div className="mt-5 flex justify-end gap-2.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setNewProjectModalOpen(false)}
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
    </header>
  );
}
