const express = require('express');
const router = express.Router();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { trackEvent, getEvents, exportEventsCsv } = require('./event.controller');
const { protect } = require('../../middleware/auth');

// Throttling tracking uploads: max 100 queries/min per client IP
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: 'Rate limit exceeded: Max 100 tracking API requests per minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Serving the Pulse Analytics Client SDK script dynamically
router.get('/tracker.js', (req, res) => {
  const trackerScript = `
(function() {
  var apiKey = window.PULSE_API_KEY || '';
  var serverUrl = window.PULSE_SERVER_URL || 'http://localhost:5000';
  var userIdKey = 'pulse_user_id';
  var sessionIdKey = 'pulse_session_id';

  function generateId() {
    return 'pulse_sid_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Get or Create Session
  var sessionId = sessionStorage.getItem(sessionIdKey);
  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem(sessionIdKey, sessionId);
  }

  // Get User ID
  var userId = localStorage.getItem(userIdKey) || 'anonymous';

  function track(eventName, properties) {
    if (!apiKey) {
      console.warn('Pulse Analytics: Tracking aborted. PULSE_API_KEY is not defined.');
      return;
    }
    
    var payload = {
      apiKey: apiKey,
      eventName: eventName,
      userId: localStorage.getItem(userIdKey) || userId || 'anonymous',
      sessionId: sessionId,
      properties: properties || {},
      timestamp: new Date().toISOString()
    };

    fetch(serverUrl + '/api/events/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': navigator.userAgent
      },
      body: JSON.stringify(payload),
      mode: 'cors'
    }).catch(function(err) {
      console.error('Pulse Track Failed:', err);
    });
  }

  function identify(id) {
    if (id) {
      localStorage.setItem(userIdKey, id);
      userId = id;
      // Auto record standard identification meta event
      track('$identify', { newUserId: id });
    }
  }

  function page() {
    track('$pageview', {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer
    });
  }

  // Expose API
  var pulseQueue = window.pulse ? window.pulse.q || [] : [];
  window.pulse = function() {
    var args = Array.prototype.slice.call(arguments);
    var action = args[0];
    if (action === 'track') {
      track(args[1], args[2]);
    } else if (action === 'identify') {
      identify(args[1]);
    } else if (action === 'page') {
      page();
    }
  };

  // Re-run early queues
  for (var i = 0; i < pulseQueue.length; i++) {
    window.pulse.apply(null, pulseQueue[i]);
  }

  // Autocapture pageview by default unless disabled
  if (window.PULSE_AUTOPAGE !== false) {
    page();
  }
})();
  `;
  res.setHeader('Content-Type', 'application/javascript');
  res.status(200).send(trackerScript);
});

// Public Rate Limited Tracking Endpoint
router.options('/track', cors({ origin: '*' }));
router.post('/track', cors({ origin: '*' }), trackingLimiter, trackEvent);

// Private Analytical Query Endpoints
router.get('/', protect, getEvents);
router.get('/export', protect, exportEventsCsv);

module.exports = router;
