const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const dbConnect = () => {
  try {
    const conn = mongoose.connect(process.env.MONGO_DB_STRING);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Database Error");
  }
};

module.exports = dbConnect;
