const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    cart: {
      type: Array,
      default: [],
    },
    address: [{ type: ObjectId, ref: "Address" }],
    wishList: [{ type: ObjectId, ref: "Product" }],
    refreshToken: {
      type: String,
    },
  },
  {
    timeStamps: true,
  }
);

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSaltSync(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
