/**
 * Reset a user's password by email (MongoDB must match your app's MONGODB_URI).
 * Usage (from backend/):
 *   NEW_PASSWORD='YourNewPass1' node scripts/reset-password.js user@example.com
 *
 * Does not print the password. Use after verifying the account exists and is active.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/models/User.js';
import { normalizeAuthEmail } from '../src/utils/authEmail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const emailArg = process.argv[2];
const newPassword = process.env.NEW_PASSWORD;

async function main() {
  if (!emailArg || !newPassword) {
    console.error('Usage: NEW_PASSWORD=... node scripts/reset-password.js <email>');
    process.exit(1);
  }
  const email = normalizeAuthEmail(emailArg);
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/invenzaa';
  await mongoose.connect(uri);
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.error('No user found for that email (after normalization).');
    await mongoose.disconnect();
    process.exit(1);
  }
  user.password = newPassword;
  user.refreshToken = null;
  await user.save();
  console.log(`Password updated for ${email} (status: ${user.status}).`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
