const mongoose = require('mongoose');

const connectDb = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/leadmanagement");
        console.log("database connected successfully")
    } catch (error) {
        console.error("MongoDB connection error:" , error);
    }

}

module.exports = connectDb;
