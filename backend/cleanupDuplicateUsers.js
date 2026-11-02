const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hr_operations";

async function cleanupDuplicates() {
  try {
    console.log("Connecting to MongoDB at:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // 1. Find all users
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`Total documents in 'users' collection: ${allUsers.length}`);

    // Group by lowercase email
    const emailMap = new Map();
    for (const doc of allUsers) {
      if (!doc.email) continue;
      const email = String(doc.email).trim().toLowerCase();
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email).push(doc);
    }

    let duplicatesFound = 0;
    let duplicatesRemoved = 0;

    for (const [email, docs] of emailMap.entries()) {
      if (docs.length > 1) {
        duplicatesFound += (docs.length - 1);
        console.log(`Found ${docs.length} records for email: ${email}`);

        // Sort: prioritize document with password / passwordHash, then most complete profile
        docs.sort((a, b) => {
          const aHasPass = (a.password || a.passwordHash) ? 1 : 0;
          const bHasPass = (b.password || b.passwordHash) ? 1 : 0;
          if (aHasPass !== bHasPass) return bHasPass - aHasPass;
          // Prefer earlier createdAt or doc with name
          return (a.createdAt || 0) < (b.createdAt || 0) ? -1 : 1;
        });

        const primaryDoc = docs[0];
        const secondaryDocs = docs.slice(1);

        // Merge any non-empty fields from secondary docs into primary
        const updates = {};
        for (const sec of secondaryDocs) {
          if (!primaryDoc.phone && sec.phone) updates.phone = sec.phone;
          if (!primaryDoc.position && sec.position) updates.position = sec.position;
          if (!primaryDoc.resumeUrl && sec.resumeUrl) updates.resumeUrl = sec.resumeUrl;
        }

        if (Object.keys(updates).length > 0) {
          await usersCollection.updateOne({ _id: primaryDoc._id }, { $set: updates });
          console.log(`Updated primary record ${primaryDoc._id} with merged fields:`, updates);
        }

        // Delete secondary duplicates
        for (const sec of secondaryDocs) {
          await usersCollection.deleteOne({ _id: sec._id });
          duplicatesRemoved++;
          console.log(`Deleted duplicate record ${sec._id} for ${email}`);
        }
      }
    }

    console.log(`\nCleanup complete! Duplicates found: ${duplicatesFound}, Removed: ${duplicatesRemoved}`);
    const remainingUsers = await usersCollection.countDocuments();
    console.log(`Remaining unique documents in 'users': ${remainingUsers}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (error) {
    console.error("Cleanup error:", error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  cleanupDuplicates();
}

module.exports = cleanupDuplicates;
