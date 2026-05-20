const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/pulse_analytics';

console.log('Connecting to:', MONGO_URI);

mongoose.connection.on('connecting', () => console.log('Mongoose: connecting...'));
mongoose.connection.on('connected', () => console.log('Mongoose: connected!'));
mongoose.connection.on('error', (err) => console.error('Mongoose: connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose: disconnected.'));

async function run() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // fail fast in 5 seconds
    });
    console.log('Successfully connected!');
    process.exit(0);
  } catch (err) {
    console.error('Failed in catch:', err);
    process.exit(1);
  }
}

run();
