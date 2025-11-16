const mongoose = require("mongoose");

const peopleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, //remove white spaces from front and back
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  {
    timestamps: true, //save hole created at and updated at duita filed auto create hbe.
  }
);
const People =
  mongoose.models.People || mongoose.model("People", peopleSchema); //people namer ekta model create korechi users der jnno

module.exports = People;