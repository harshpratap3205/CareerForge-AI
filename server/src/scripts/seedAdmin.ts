import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../modules/auth/user.model.js';

async function seedAdmin() {
  try {
    await connectDB();

    const email = (process.env.ADMIN_EMAIL || 'admin@careerforge.ai').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const name = process.env.ADMIN_NAME || 'Platform Administrator';

    let admin = await User.findOne({ email });
    const passwordHash = await bcrypt.hash(password, 10);

    if (admin) {
      admin.role = 'ADMIN';
      admin.passwordHash = passwordHash;
      await admin.save();
      console.log(`[Seed] Updated existing user ${email} to ADMIN role.`);
    } else {
      admin = await User.create({
        name,
        email,
        passwordHash,
        role: 'ADMIN',
      });
      console.log(`[Seed] Created new platform administrator: ${email}`);
    }

    console.log(`[Seed] Admin Email: ${email}`);
    console.log(`[Seed] Admin Password: ${password}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Failed to seed administrator:', error);
    process.exit(1);
  }
}

seedAdmin();
