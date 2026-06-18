import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is missing.");
    }
    
    // Generous timeouts for free tier cloud environments
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // Wait 15s for DB to respond before failing
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // DO NOT process.exit(1) here. Let the server start so Render health checks 
    // can see it, and developers can read the logs.
    console.log("⚠️ Server will continue running without DB. API calls may fail.");
  }
};

export default connectDB;
