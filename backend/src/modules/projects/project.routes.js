const express = require('express');
const router = express.Router();
const {
  getWorkspaces,
  createWorkspace,
  getProjects,
  createProject,
  rotateApiKey,
  deleteProject
} = require('./project.controller');
const { protect } = require('../../middleware/auth');

router.get('/workspaces', protect, getWorkspaces);
router.post('/workspaces', protect, createWorkspace);
router.get('/workspace/:workspaceId', protect, getProjects);
router.post('/workspace/:workspaceId', protect, createProject);
router.put('/:projectId/rotate-key', protect, rotateApiKey);
router.delete('/:projectId', protect, deleteProject);

module.exports = router;
