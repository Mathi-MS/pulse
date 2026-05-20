const express = require('express');
const router = express.Router();
const { getStats, getFunnel } = require('./analytics.controller');
const { protect } = require('../../middleware/auth');

router.get('/stats', protect, getStats);
router.post('/funnel', protect, getFunnel);

module.exports = router;
