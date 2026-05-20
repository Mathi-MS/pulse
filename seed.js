const mongoose = require('./backend/node_modules/mongoose');
const bcrypt = require('bcryptjs');

// Import Schemas using backend source structure
const User = require('./backend/src/modules/auth/User');
const Workspace = require('./backend/src/modules/projects/Workspace');
const Project = require('./backend/src/modules/projects/Project');
const Event = require('./backend/src/modules/events/Event');

const MONGO_URI = 'mongodb://127.0.0.1:27017/pulse_analytics';

const browsers = ['Chrome', 'Chrome', 'Chrome', 'Firefox', 'Safari', 'Safari', 'Edge', 'Brave'];
const devices = ['Desktop', 'Desktop', 'Desktop', 'Mobile', 'Mobile', 'Tablet'];
const locations = ['United States', 'United States', 'Germany', 'India', 'United Kingdom', 'Canada', 'France', 'Australia'];
const plans = ['Basic', 'Premium', 'Enterprise'];

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected. Cleaning collections...');

    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Project.deleteMany({});
    await Event.deleteMany({});

    console.log('Collections cleared. Generating demo user...');
    
    const demoUser = await User.create({
      name: 'Alex Pulse',
      email: 'demo@pulse.com',
      password: 'Password123',
      avatar: 'https://www.gravatar.com/avatar/pulse_demo?d=identicon&s=150'
    });

    const demoWorkspace = await Workspace.create({
      name: 'Pulse Workspace',
      ownerId: demoUser._id
    });

    const demoProject = await Project.create({
      name: 'Pulse SaaS Platform',
      apiKey: 'pulse_pk_demo_key_9876543210',
      workspaceId: demoWorkspace._id
    });

    console.log(`Demo user created: demo@pulse.com (Password123)`);
    console.log(`Demo project created with key: pulse_pk_demo_key_9876543210`);
    console.log('Generating seed events (chronological funnel flows)...');

    const totalUsers = 250;
    const eventsBatch = [];

    for (let u = 0; u < totalUsers; u++) {
      const userId = `usr_${10000 + u}`;
      const sessionId = `sess_${Math.random().toString(36).substring(2, 10)}`;
      
      const browser = browsers[Math.floor(Math.random() * browsers.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];

      // Pick a starting day within the last 14 days
      const daysAgo = Math.floor(Math.random() * 14);
      const hour = 8 + Math.floor(Math.random() * 14); // active daytime: 8am - 10pm
      const minute = Math.floor(Math.random() * 60);
      
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - daysAgo);
      startTime.setHours(hour, minute, 0, 0);

      let eventTime = new Date(startTime);

      // Step 1: Landing Page View
      eventsBatch.push({
        eventName: 'Landing Page View',
        projectId: demoProject._id,
        userId,
        sessionId,
        properties: { path: '/home', source: 'google_search' },
        timestamp: new Date(eventTime),
        browser,
        device,
        location
      });

      // 75% advance to Pricing Page View
      if (Math.random() > 0.25) {
        eventTime = new Date(eventTime.getTime() + (1 + Math.floor(Math.random() * 8)) * 60 * 1000); // 1-8 mins later
        eventsBatch.push({
          eventName: 'Pricing Page View',
          projectId: demoProject._id,
          userId,
          sessionId,
          properties: { path: '/pricing', billing: 'annually' },
          timestamp: new Date(eventTime),
          browser,
          device,
          location
        });

        // 55% advance to Signup Started
        if (Math.random() > 0.45) {
          eventTime = new Date(eventTime.getTime() + (1 + Math.floor(Math.random() * 4)) * 60 * 1000); // 1-4 mins later
          eventsBatch.push({
            eventName: 'Signup Started',
            projectId: demoProject._id,
            userId,
            sessionId,
            properties: { referer: '/pricing' },
            timestamp: new Date(eventTime),
            browser,
            device,
            location
          });

          // 85% complete signup
          if (Math.random() > 0.15) {
            eventTime = new Date(eventTime.getTime() + (1 + Math.floor(Math.random() * 3)) * 60 * 1000); // 1-3 mins later
            eventsBatch.push({
              eventName: 'Signup Completed',
              projectId: demoProject._id,
              userId,
              sessionId,
              properties: { method: 'email', verified: true },
              timestamp: new Date(eventTime),
              browser,
              device,
              location
            });

            // 60% go to Checkout
            if (Math.random() > 0.40) {
              eventTime = new Date(eventTime.getTime() + (2 + Math.floor(Math.random() * 6)) * 60 * 1000); // 2-6 mins later
              eventsBatch.push({
                eventName: 'Checkout Page View',
                projectId: demoProject._id,
                userId,
                sessionId,
                properties: { plan: plans[Math.floor(Math.random() * plans.length)], duration: 'monthly' },
                timestamp: new Date(eventTime),
                browser,
                device,
                location
              });

              // 65% purchase successfully
              if (Math.random() > 0.35) {
                eventTime = new Date(eventTime.getTime() + (1 + Math.floor(Math.random() * 3)) * 60 * 1000); // 1-3 mins later
                const planChosen = plans[Math.floor(Math.random() * plans.length)];
                const price = planChosen === 'Basic' ? 29 : planChosen === 'Premium' ? 79 : 249;

                eventsBatch.push({
                  eventName: 'Purchase Successful',
                  projectId: demoProject._id,
                  userId,
                  sessionId,
                  properties: { plan: planChosen, amount: price, currency: 'USD' },
                  timestamp: new Date(eventTime),
                  browser,
                  device,
                  location
                });
              }
            }
          }
        }
      }
    }

    console.log(`Inserting ${eventsBatch.length} events into the database...`);
    await Event.insertMany(eventsBatch);
    console.log('Seeding completed successfully!');
    
    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Seeding encountered an error:', error);
    process.exit(1);
  }
}

seedDatabase();
