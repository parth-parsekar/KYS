import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://parsekarparth_db_user:65o49nIkk2JzM6tw@kys-cluster.1ivczqq.mongodb.net/kys?retryWrites=true&w=majority';

async function listUsers() {
  await mongoose.connect(MONGODB_URI);

  const users = await User.find({}).sort({ createdAt: 1 });
  const subscriptions = await Subscription.find({});

  const subCountMap: Record<string, number> = {};
  subscriptions.forEach((s) => {
    const uId = s.user.toString();
    subCountMap[uId] = (subCountMap[uId] || 0) + 1;
  });

  const emailCounts: Record<string, number> = {};
  users.forEach((u) => {
    emailCounts[u.email] = (emailCounts[u.email] || 0) + 1;
  });

  const formatted = users.map((u, i) => {
    const isDemoSeeded = u.email !== 'parsekarparth@gmail.com' && u.email !== 'parth@example.com' && u.email !== 'parth@ex.com';
    const isDuplicate = emailCounts[u.email] > 1;
    return {
      num: i + 1,
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      currency: u.preferredCurrency,
      timezone: u.timezone,
      subscriptionsCount: subCountMap[u._id.toString()] || 0,
      isDemo: isDemoSeeded,
      isDuplicate,
      createdAt: u.createdAt,
    };
  });

  console.log(JSON.stringify(formatted, null, 2));
  await mongoose.disconnect();
}

listUsers().catch((e) => {
  console.error(e);
  process.exit(1);
});

