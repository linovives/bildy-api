import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
