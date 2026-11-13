require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const mongoose = require("mongoose");
const connectDB = require("./config/db");

async function migrate() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for single 'users' collection migration...");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const colNames = collections.map((c) => c.name);

    console.log("Current collections in database:", colNames);

    const usersCol = db.collection("users");

    // 1. Migrate any documents from 'candidates' collection if it exists
    if (colNames.includes("candidates")) {
      console.log("Migrating 'candidates' collection into 'users'...");
      const candidateDocs = await db.collection("candidates").find({}).toArray();
      for (const doc of candidateDocs) {
        const { _id, ...rest } = doc;
        await usersCol.updateOne(
          { $or: [{ _id }, { email: doc.email }, { user: doc.user }] },
          {
            $set: {
              ...rest,
              role: "candidate",
            },
          },
          { upsert: true }
        );
      }
      console.log(`Migrated ${candidateDocs.length} candidate record(s) into 'users'.`);
      await db.collection("candidates").drop();
      console.log("Dropped legacy 'candidates' collection.");
    }

    // 2. Migrate any documents from 'employees' collection if it exists
    if (colNames.includes("employees")) {
      console.log("Migrating 'employees' collection into 'users'...");
      const employeeDocs = await db.collection("employees").find({}).toArray();
      for (const doc of employeeDocs) {
        const { _id, ...rest } = doc;
        await usersCol.updateOne(
          { $or: [{ _id }, { empId: doc.empId }, { user: doc.user }] },
          {
            $set: {
              ...rest,
              role: doc.type === "intern" ? "intern" : "employee",
            },
          },
          { upsert: true }
        );
      }
      console.log(`Migrated ${employeeDocs.length} employee record(s) into 'users'.`);
      await db.collection("employees").drop();
      console.log("Dropped legacy 'employees' collection.");
    }

    // 3. Migrate any documents from 'interns' collection if it exists
    if (colNames.includes("interns")) {
      console.log("Migrating 'interns' collection into 'users'...");
      const internDocs = await db.collection("interns").find({}).toArray();
      for (const doc of internDocs) {
        const { _id, ...rest } = doc;
        await usersCol.updateOne(
          { $or: [{ _id }, { email: doc.email }, { user: doc.user }] },
          {
            $set: {
              ...rest,
              role: "intern",
            },
          },
          { upsert: true }
        );
      }
      console.log(`Migrated ${internDocs.length} intern record(s) into 'users'.`);
      await db.collection("interns").drop();
      console.log("Dropped legacy 'interns' collection.");
    }

    const remainingCollections = await db.listCollections().toArray();
    console.log(
      "Migration complete! All user records now reside in the single 'users' collection."
    );
    console.log("Remaining collections:", remainingCollections.map((c) => c.name));

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
