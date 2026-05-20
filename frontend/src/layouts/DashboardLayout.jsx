import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const defaultWorkspace = useAuthStore(state => state.defaultWorkspace);
  const { bootstrap, activeWorkspace, activeProject } = useProjectStore();

  useEffect(() => {
    // Bootstrap user workspace and project connections on load
    bootstrap(defaultWorkspace);
  }, [defaultWorkspace, bootstrap]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-darkbg-950">
      {/* Sidebar Navigation */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {!activeWorkspace ? (
            <div className="flex h-full w-full flex-col items-center justify-center text-center p-8">
              <div className="h-12 w-12 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              <p className="mt-4 text-sm text-slate-400">Loading workspaces and configurations...</p>
            </div>
          ) : !activeProject ? (
            <div className="flex h-full w-full flex-col items-center justify-center text-center p-8">
              <div className="relative h-16 w-16 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/25 mb-4 animate-pulse">
                ⚡
              </div>
              <h2 className="text-lg font-bold text-slate-200">Welcome to Pulse Analytics</h2>
              <p className="mt-1.5 text-xs text-slate-400 max-w-sm">
                Get started by creating a new project in the top header. Projects generate the tracking key credentials.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
