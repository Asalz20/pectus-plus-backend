const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwToken");

// const createUser = async (req, res) => {
//   const email = req.body.email;
//   const findUser = await User.findOne({ email: email });
//   if (!findUser) {
//     //create a new user
//     const newUser = await User.create(req.body);
//     res.json(newUser); // why send json to client?
//     // res.redirect("/"); do we redirect or use line 10 instead?
//   } else {
//     //user already exists
//     res.json({
//       msg: "User Already Exists",
//       success: false,
//     });
//   }
// };

const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const findUser = await User.findOne({ email: email });
  if (!findUser) {
    //create a new user
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    //user already exists
    throw new Error("User already exists");
  }
});

const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Check if user exists
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    res.json({
      _id: findUser._id,
      firstName: findUser.firstName,
      lastName: findUser.lastName,
      email: findUser.email,
      token: generateToken(findUser._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

module.exports = { createUser, loginUserCtrl };
