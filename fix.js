require('dotenv').config();
const connectDB = require('./config/db');
const mongoose = require('mongoose');

connectDB().then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  let count = 0;
  for (const u of users) {
    if (u.homeFeatures && u.homeFeatures.length > 0) {
      const feat = u.homeFeatures[0];
      if (typeof feat === 'object' || (typeof feat === 'string' && feat.includes('{'))) {
        console.log('Found legacy in', u.email);
        await db.collection('users').updateOne(
          { _id: u._id },
          { $set: { homeFeatures: [] } }
        );
        count++;
      }
    }
  }
  console.log('Fixed ' + count + ' users');
  process.exit(0);
});
