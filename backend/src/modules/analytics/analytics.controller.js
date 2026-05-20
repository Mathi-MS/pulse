const Event = require('../events/Event');
const Project = require('../projects/Project');

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// @desc    Get overall stats for the dashboard
// @route   GET /api/analytics/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  const { projectId } = req.query;

  try {
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Date limit: last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // 1. Total Events
    const totalEvents = await Event.countDocuments({ projectId });

    // 2. Total Unique Active Users
    const activeUsers = await Event.distinct('userId', { projectId });
    const totalActiveUsers = activeUsers.length;

    // 3. Daily Events aggregation (last 14 days)
    const dailyEventsRaw = await Event.aggregate([
      {
        $match: {
          projectId: project._id,
          timestamp: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Daily Active Users (DAU) aggregation (last 14 days)
    const dailyUsersRaw = await Event.aggregate([
      {
        $match: {
          projectId: project._id,
          timestamp: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            userId: "$userId"
          }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 5. Device distribution
    const deviceStats = await Event.aggregate([
      { $match: { projectId: project._id } },
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 }
        }
      }
    ]);

    // 6. Browser distribution
    const browserStats = await Event.aggregate([
      { $match: { projectId: project._id } },
      {
        $group: {
          _id: "$browser",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Fill dates gaps to ensure continuous chart flow
    const dailyEventsMap = {};
    const dailyUsersMap = {};
    
    dailyEventsRaw.forEach(item => dailyEventsMap[item._id] = item.count);
    dailyUsersRaw.forEach(item => dailyUsersMap[item._id] = item.count);

    const dailyEvents = [];
    const dailyActiveUsers = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);

      dailyEvents.push({
        date: dateStr,
        events: dailyEventsMap[dateStr] || 0
      });

      dailyActiveUsers.push({
        date: dateStr,
        users: dailyUsersMap[dateStr] || 0
      });
    }

    res.json({
      success: true,
      stats: {
        totalEvents,
        totalActiveUsers,
        dailyEvents,
        dailyActiveUsers,
        devices: deviceStats.map(d => ({ name: d._id || 'Unknown', value: d.count })),
        browsers: browserStats.map(b => ({ name: b._id || 'Unknown', value: b.count }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze Funnel conversion steps chronologically
// @route   POST /api/analytics/funnel
// @access  Private
exports.getFunnel = async (req, res, next) => {
  const { projectId, steps } = req.body;

  try {
    if (!projectId || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ success: false, message: 'Project ID and steps (array of strings) are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Fetch all events for the project in chronological order
    const events = await Event.find({ projectId: project._id })
      .sort({ timestamp: 1 })
      .select('userId eventName timestamp');

    // Group events by userId: Map of userId -> Array of events (sorted by timestamp)
    const userJourneys = {};
    events.forEach(e => {
      if (!userJourneys[e.userId]) {
        userJourneys[e.userId] = [];
      }
      userJourneys[e.userId].push({
        eventName: e.eventName,
        timestamp: new Date(e.timestamp).getTime()
      });
    });

    // Funnel Steps completion checklist
    // Initialize results counters
    const stepCounts = steps.map(() => 0);

    // Analyze each user journey
    Object.keys(userJourneys).forEach(userId => {
      const userEvents = userJourneys[userId];
      
      let currentStepIndex = 0;
      let lastTimestamp = -1;

      for (let i = 0; i < userEvents.length; i++) {
        const event = userEvents[i];
        
        // Match the current step eventName
        if (event.eventName === steps[currentStepIndex]) {
          // Verify strict chronological sequence (timestamp2 > timestamp1)
          if (event.timestamp > lastTimestamp) {
            stepCounts[currentStepIndex]++;
            lastTimestamp = event.timestamp;
            currentStepIndex++;

            // If user completed all steps, stop checking this user
            if (currentStepIndex === steps.length) {
              break;
            }
          }
        }
      }
    });

    // Compile Funnel conversion analytics reports
    const funnelResults = steps.map((step, index) => {
      const count = stepCounts[index];
      const step1Count = stepCounts[0] || 1;
      const prevStepCount = index > 0 ? stepCounts[index - 1] : count;

      const percentage = stepCounts[0] > 0 ? Number(((count / step1Count) * 100).toFixed(1)) : 0;
      const dropOffCount = index > 0 ? prevStepCount - count : 0;
      const dropOffPercentage = prevStepCount > 0 ? Number(((dropOffCount / prevStepCount) * 100).toFixed(1)) : 0;

      return {
        stepName: step,
        count,
        percentage,
        dropOffCount,
        dropOffPercentage
      };
    });

    // Calculate absolute conversion rate: last step count / first step count
    const absoluteConversion = stepCounts[0] > 0 
      ? Number(((stepCounts[steps.length - 1] / stepCounts[0]) * 100).toFixed(1)) 
      : 0;

    res.json({
      success: true,
      funnel: {
        steps: funnelResults,
        absoluteConversion,
        totalFunnelUsers: stepCounts[0]
      }
    });
  } catch (error) {
    next(error);
  }
};
