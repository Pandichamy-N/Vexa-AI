// One-time cleanup: drops the leftover `jamendoId_1` unique index from
// the `tracks` collection (created back when Jamendo was still in use).
// Safe to run multiple times — if the index is already gone, it just
// logs that and exits.
//
// Run with:  node server/scripts/dropJamendoIndex.js

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    try {
        await mongoose.connection.db.collection("tracks").dropIndex("jamendoId_1");
        console.log("✅ Dropped legacy 'jamendoId_1' index from tracks collection.");
    } catch (error) {
        if (error.codeName === "IndexNotFound") {
            console.log("ℹ️  'jamendoId_1' index doesn't exist — nothing to drop.");
        } else {
            console.error("❌ Failed to drop index:", error.message);
        }
    }

    await mongoose.disconnect();
    process.exit(0);

};

run();
