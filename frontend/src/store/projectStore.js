import { create } from 'zustand';
import api from '../services/api';

export const useProjectStore = create((set, get) => ({
  workspaces: [],
  projects: [],
  activeWorkspace: JSON.parse(localStorage.getItem('pulse_active_workspace')) || null,
  activeProject: JSON.parse(localStorage.getItem('pulse_active_project')) || null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/projects/workspaces');
      const workspaces = response.data.workspaces || [];
      set({ workspaces, isLoading: false });

      // Auto-select first workspace if none active
      const currentActive = get().activeWorkspace;
      if (workspaces.length > 0 && !currentActive) {
        await get().setActiveWorkspace(workspaces[0]);
      } else if (currentActive) {
        // Refresh active workspace metadata if list loaded
        const freshActive = workspaces.find(w => w._id === currentActive._id);
        if (freshActive) {
          set({ activeWorkspace: freshActive });
        } else if (workspaces.length > 0) {
          await get().setActiveWorkspace(workspaces[0]);
        }
      }
      return workspaces;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load workspaces';
      set({ error: message, isLoading: false });
      return [];
    }
  },

  createWorkspace: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/projects/workspaces', { name });
      const workspace = response.data.workspace;
      
      set(state => ({
        workspaces: [...state.workspaces, workspace],
        isLoading: false
      }));

      // Select new workspace
      await get().setActiveWorkspace(workspace);
      return workspace;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create workspace';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  fetchProjects: async (workspaceId) => {
    if (!workspaceId) return [];
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/projects/workspace/${workspaceId}`);
      const projects = response.data.projects || [];
      set({ projects, isLoading: false });

      // Auto-select first project if none is active or if active belongs to another workspace
      const currentProject = get().activeProject;
      const projectBelongsToWorkspace = currentProject && projects.some(p => p._id === currentProject._id);

      if (projects.length > 0 && (!currentProject || !projectBelongsToWorkspace)) {
        get().setActiveProject(projects[0]);
      } else if (projects.length === 0) {
        set({ activeProject: null });
        localStorage.removeItem('pulse_active_project');
      }
      return projects;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load projects';
      set({ error: message, isLoading: false, projects: [] });
      return [];
    }
  },

  createProject: async (name) => {
    const workspace = get().activeWorkspace;
    if (!workspace) throw new Error('No active workspace selected');

    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/projects/workspace/${workspace._id}`, { name });
      const project = response.data.project;

      set(state => ({
        projects: [...state.projects, project],
        isLoading: false
      }));

      // Select newly created project
      get().setActiveProject(project);
      return project;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create project';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  rotateApiKey: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/projects/${projectId}/rotate-key`);
      const { apiKey, project } = response.data;

      set(state => ({
        projects: state.projects.map(p => p._id === projectId ? project : p),
        activeProject: state.activeProject?._id === projectId ? project : state.activeProject,
        isLoading: false
      }));

      if (get().activeProject?._id === projectId) {
        localStorage.setItem('pulse_active_project', JSON.stringify(project));
      }

      return apiKey;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to rotate API Key';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  deleteProject: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/projects/${projectId}`);

      set(state => {
        const filteredProjects = state.projects.filter(p => p._id !== projectId);
        let nextProject = state.activeProject;
        
        if (state.activeProject?._id === projectId) {
          nextProject = filteredProjects.length > 0 ? filteredProjects[0] : null;
        }

        if (nextProject) {
          localStorage.setItem('pulse_active_project', JSON.stringify(nextProject));
        } else {
          localStorage.removeItem('pulse_active_project');
        }

        return {
          projects: filteredProjects,
          activeProject: nextProject,
          isLoading: false
        };
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete project';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  setActiveWorkspace: async (workspace) => {
    if (!workspace) return;
    localStorage.setItem('pulse_active_workspace', JSON.stringify(workspace));
    set({ activeWorkspace: workspace });
    await get().fetchProjects(workspace._id);
  },

  setActiveProject: (project) => {
    if (!project) {
      set({ activeProject: null });
      localStorage.removeItem('pulse_active_project');
      return;
    }
    localStorage.setItem('pulse_active_project', JSON.stringify(project));
    set({ activeProject: project });
  },

  bootstrap: async (defaultWorkspace) => {
    const activeW = get().activeWorkspace;
    if (!activeW && defaultWorkspace) {
      await get().setActiveWorkspace(defaultWorkspace);
    } else {
      await get().fetchWorkspaces();
      if (get().activeWorkspace) {
        await get().fetchProjects(get().activeWorkspace._id);
      }
    }
  }
}));
