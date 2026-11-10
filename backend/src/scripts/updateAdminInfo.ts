import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://parsekarparth_db_user:65o49nIkk2JzM6tw@kys-cluster.1ivczqq.mongodb.net/kys?retryWrites=true&w=majority';

async function updateAdmins() {
  await mongoose.connect(MONGODB_URI);

  // Update Parth Parsekar's accounts to admin role
  await User.updateOne(
    { email: 'parsekarparth@gmail.com' },
    { $set: { role: 'admin', name: 'Parth Parsekar' } }
  );

  await User.updateOne(
    { email: 'parth@example.com' },
    { $set: { role: 'admin', name: 'Parth Parsekar' } }
  );

  // Update primary admin demo account info to Parth Parsekar
  await User.updateOne(
    { email: 'admin@kys.app' },
    { $set: { name: 'Parth Parsekar', role: 'admin' } }
  );

  const admins = await User.find({ role: 'admin' });
  console.log('Admins in database:');
  admins.forEach((a) => {
    console.log(`- ${a.name} (${a.email}) [role: ${a.role}]`);
  });

  await mongoose.disconnect();
}

updateAdmins().catch((e) => {
  console.error(e);
  process.exit(1);
});
