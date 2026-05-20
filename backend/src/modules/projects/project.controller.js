const Workspace = require('./Workspace');
const Project = require('./Project');
const Event = require('../events/Event');
const crypto = require('crypto');

// Generate unique secure API key
const generateApiKey = () => {
  return `pulse_pk_${crypto.randomBytes(24).toString('hex')}`;
};

// @desc    Get all workspaces for the logged in user
// @route   GET /api/projects/workspaces
// @access  Private
exports.getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ ownerId: req.user.id });
    res.json({ success: true, workspaces });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a workspace
// @route   POST /api/projects/workspaces
// @access  Private
exports.createWorkspace = async (req, res, next) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      ownerId: req.user.id
    });

    res.status(201).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects in a workspace
// @route   GET /api/projects/workspace/:workspaceId
// @access  Private
exports.getProjects = async (req, res, next) => {
  const { workspaceId } = req.params;

  try {
    // Verify user owns the workspace
    const workspace = await Workspace.findOne({ _id: workspaceId, ownerId: req.user.id });
    if (!workspace) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this workspace' });
    }

    const projects = await Project.find({ workspaceId });
    res.json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a project under a workspace
// @route   POST /api/projects/workspace/:workspaceId
// @access  Private
exports.createProject = async (req, res, next) => {
  const { workspaceId } = req.params;
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    // Verify workspace ownership
    const workspace = await Workspace.findOne({ _id: workspaceId, ownerId: req.user.id });
    if (!workspace) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this workspace' });
    }

    const project = await Project.create({
      name,
      apiKey: generateApiKey(),
      workspaceId
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate/Rotate API key for a project
// @route   PUT /api/projects/:projectId/rotate-key
// @access  Private
exports.rotateApiKey = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify workspace ownership
    const workspace = await Workspace.findOne({ _id: project.workspaceId, ownerId: req.user.id });
    if (!workspace) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this project' });
    }

    project.apiKey = generateApiKey();
    await project.save();

    res.json({ success: true, apiKey: project.apiKey, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project and cascading delete of events
// @route   DELETE /api/projects/:projectId
// @access  Private
exports.deleteProject = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify workspace ownership
    const workspace = await Workspace.findOne({ _id: project.workspaceId, ownerId: req.user.id });
    if (!workspace) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    // Cascading delete events
    await Event.deleteMany({ projectId: project._id });
    
    // Delete project
    await Project.findByIdAndDelete(project._id);

    res.json({ success: true, message: 'Project and all associated events deleted successfully' });
  } catch (error) {
    next(error);
  }
};
