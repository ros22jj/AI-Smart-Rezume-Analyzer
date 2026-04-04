// const mongoose = require("mongoose");

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 30000,
//       connectTimeoutMS: 30000,
//     });
//     console.log("✅ MongoDB connected!");
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;







const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Agar pehle se connected hai toh dubara connect karne ki zarurat nahi (Vercel optimization)
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log("✅ MongoDB connected!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    // process.exit(1); // Vercel par isse pura instance kill ho jata hai, isliye sirf error log kaafi hai
  }
};

module.exports = connectDB;