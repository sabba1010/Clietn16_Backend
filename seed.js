require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const User = require('./models/User');

// Fix DNS resolution issues on Windows for MongoDB SRV records in Node.js 18+
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🚀 Connected to MongoDB for seeding...');

    const users = [
      {
        username: 'admin',
        email: 'admin@houseandpaw.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Admin',
        role: 'admin'
      },
      {
        username: 'superuser',
        email: 'superuser@houseandpaw.com',
        password: 'super123',
        firstName: 'Super',
        lastName: 'User',
        role: 'superuser'
      },
      {
        username: 'seller',
        email: 'seller@houseandpaw.com',
        password: 'seller123',
        firstName: 'John',
        lastName: 'Sitter',
        role: 'sitter'
      }
    ];

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`✅ Created ${u.role} user: ${u.email}`);
      } else {
        console.log(`ℹ️ User ${u.email} already exists.`);
      }
    }

    console.log('🎉 Seeding completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
