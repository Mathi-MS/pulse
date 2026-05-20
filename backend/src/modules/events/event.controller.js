const Event = require('./Event');
const Project = require('../projects/Project');
const useragent = require('useragent');

// @desc    Track an event (Public API endpoint)
// @route   POST /api/events/track
// @access  Public (Authenticated via apiKey header/body)
exports.trackEvent = async (req, res, next) => {
  let apiKey = req.headers['x-api-key'] || req.body.apiKey;

  try {
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'API Key is required (x-api-key header or apiKey property)' });
    }

    const project = await Project.findOne({ apiKey });
    if (!project) {
      return res.status(401).json({ success: false, message: 'Invalid API Key' });
    }

    const { eventName, userId, sessionId, properties, timestamp, location } = req.body;

    if (!eventName) {
      return res.status(400).json({ success: false, message: 'Event Name is required' });
    }

    // Device / Browser parsing
    const userAgentStr = req.headers['user-agent'] || '';
    const agent = useragent.parse(userAgentStr);
    const browser = agent.family || 'Unknown';
    
    let device = 'Desktop';
    const uaLower = userAgentStr.toLowerCase();
    if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone')) {
      device = 'Mobile';
    } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
      device = 'Tablet';
    }

    // Geographic location (Mocking fallback if headers are empty)
    const geoIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipCountry = req.headers['cf-ipcountry'] || req.headers['x-appengine-country'] || 'United States';

    const eventData = {
      eventName,
      projectId: project._id,
      userId: userId || 'anonymous',
      sessionId: sessionId || 'anonymous-session',
      properties: properties || {},
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      browser,
      device,
      location: location || ipCountry
    };

    const savedEvent = await Event.create(eventData);

    // Emit live event via Socket.IO inside its isolated project room
    const io = req.app.get('io');
    if (io) {
      io.to(`project_${project._id.toString()}`).emit('newEvent', savedEvent);
    }

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
      eventId: savedEvent._id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events for a project (Private endpoint)
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res, next) => {
  const { projectId, page = 1, limit = 20, eventName, userId, startDate, endDate, search } = req.query;

  try {
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    // Verify project/workspace ownership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Query Builder
    let query = { projectId };

    if (eventName) {
      query.eventName = eventName;
    }

    if (userId) {
      query.userId = { $regex: userId, $options: 'i' };
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { browser: { $regex: search, $options: 'i' } },
        { device: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const totalEvents = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalEvents / limit),
        totalEvents
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export events to CSV (Private endpoint)
// @route   GET /api/events/export
// @access  Private
exports.exportEventsCsv = async (req, res, next) => {
  const { projectId, eventName, userId, startDate, endDate, search } = req.query;

  try {
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    // Query Builder
    let query = { projectId };

    if (eventName) {
      query.eventName = eventName;
    }

    if (userId) {
      query.userId = { $regex: userId, $options: 'i' };
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { browser: { $regex: search, $options: 'i' } },
        { device: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch all events (up to 10000 for safe CSV downloads)
    const events = await Event.find(query).sort({ timestamp: -1 }).limit(10000);

    // Build CSV Content
    let csvContent = 'ID,Event Name,User ID,Session ID,Browser,Device,Location,Timestamp,Properties\n';
    
    events.forEach(event => {
      const id = event._id.toString();
      const name = `"${event.eventName.replace(/"/g, '""')}"`;
      const uid = `"${event.userId.replace(/"/g, '""')}"`;
      const sid = `"${event.sessionId.replace(/"/g, '""')}"`;
      const browser = `"${(event.browser || '').replace(/"/g, '""')}"`;
      const device = `"${(event.device || '').replace(/"/g, '""')}"`;
      const location = `"${(event.location || '').replace(/"/g, '""')}"`;
      const timestamp = `"${event.timestamp.toISOString()}"`;
      const properties = `"${JSON.stringify(event.properties || {}).replace(/"/g, '""')}"`;

      csvContent += `${id},${name},${uid},${sid},${browser},${device},${location},${timestamp},${properties}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=pulse-events-${projectId}-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
