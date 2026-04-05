const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finance-app';
  await mongoose.connect(uri);

  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const name = process.env.ADMIN_NAME || 'Admin User';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin user already exists:', email);
    process.exit(0);
  }

  const user = new User({ name, email, password, role: 'admin', status: 'active' });
  await user.save();
  console.log('Admin user created:', email);
  console.log('Password:', password);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});