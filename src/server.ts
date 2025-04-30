import app from './app';
import config from './app/config';
import mongoose from 'mongoose';

// Check if running on Vercel
if (process.env.VERCEL) {
  console.log('Running on Vercel, setting NODE_ENVIRONMENT to production');
  process.env.NODE_ENVIRONMENT = 'production';
}

// Log current environment
console.log('Current environment:', process.env.NODE_ENVIRONMENT);

// main().catch(err => console.log(err));

async function main() {
  try {
    await mongoose.connect(config.databaseUrl as string);
    console.log('Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`Server is listening on port ${config.port}`);
    });
  } catch (error) {
    console.log('Failed to start server:', error);
  }
}

main();
