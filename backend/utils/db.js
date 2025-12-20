import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
        console.log("DB URI:", process.env.MONGO_URI);

    } catch (error) {
        console.error("❌ MongoDB Connection Failed");
        console.error(error.message);
        console.log("DB URI:", process.env.MONGO_URI);


        // Retry connection after 5 seconds
        setTimeout(connectDB, 5000);
    }
};

export default connectDB;

