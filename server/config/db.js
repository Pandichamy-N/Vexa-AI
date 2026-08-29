import mongoose from "mongoose";

// One-time cleanup: the `tracks` collection has a leftover unique index
// on `jamendoId` from when Jamendo was still integrated. That field no
// longer exists on the schema, so every new (fieldless) doc collides on
// the same missing-value key. Dropping it is safe and idempotent — if
// it's already gone (e.g. on a fresh DB), this just no-ops silently.
const dropLegacyJamendoIndex = async () => {
    try {
        await mongoose.connection.db.collection("tracks").dropIndex("jamendoId_1");
        console.log("🧹 Dropped legacy 'jamendoId_1' index from tracks collection.");
    } catch (error) {
        if (error.codeName !== "IndexNotFound" && error.codeName !== "NamespaceNotFound") {
            console.error("⚠️  Couldn't drop legacy 'jamendoId_1' index (non-fatal):", error.message);
        }
    }
};

const connectDB = async () => {
    try {
        console.log(process.env.MONGODB_URI);

        const connection = await mongoose.connect(process.env.MONGODB_URI);

       // console.log("Connected DB:", connection.connection.name);//

        console.log("✅ MongoDB Connected Successfully");
        console.log(`📂 Database Host: ${connection.connection.host}`);

        await dropLegacyJamendoIndex();
    } catch (error) {
        console.error("❌ MongoDB Connection Failed");
        console.error(error.message);

        process.exit(1);
    }
};

export default connectDB;