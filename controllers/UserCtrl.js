const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwToken");
const { generateRefreshToken } = require("../config/refreshToken");
const validateMongoDbId = require("../utils/validateMongoDbId");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const uniqid = require("uniqid");
const { sendEmail } = require("./emailCtrl");
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
  // FindOne is a query function from mongoose
  const findUser = await User.findOne({ email: req.body.email });
  if (!findUser) {
    //create a new user
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    //user already exists
    throw new Error("User already exists");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Check if user exists
  // May be more expensive because finding full document
  // const findUser = await User.findOne({ email });
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    // generateRefreshToken assigns a jwt to the specific id passed through
    const refreshToken = await generateRefreshToken(findUser._id);
    const updateUser = await User.findByIdAndUpdate(
      findUser.id,
      { refreshToken: refreshToken },
      { new: true }
    );
    // Assigns refresh token to cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
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

// Admin login
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Check if user exists
  // May be more expensive because finding full document
  // const findUser = await User.findOne({ email });
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorized");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    // generateRefreshToken assigns a jwt to the specific id passed through
    const refreshToken = await generateRefreshToken(findAdmin._id);
    const updateUser = await User.findByIdAndUpdate(
      findAdmin.id,
      { refreshToken: refreshToken },
      { new: true }
    );
    // Assigns refresh token to cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin._id,
      firstName: findAdmin.firstName,
      lastName: findAdmin.lastName,
      email: findAdmin.email,
      token: generateToken(findAdmin._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// Handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie.refreshToken) {
    throw new Error("No refresh token in Cookies");
  }
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new Error("No refresh token present in DB / matched");
  }
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("Issue with refresh token");
    } else {
      const accessToken = generateToken(user._id);
      res.json({ accessToken });
    }
  });
});

// Logout
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    throw new Error("No refresh token in Cookies");
  }
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findOneAndUpdate(refreshToken, {
    refreshToken: "",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // forbidden
});

// Save user address
const saveAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const updateUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req.body.address,
      },
      {
        new: true,
      }
    );
    res.json(updateUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find();
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user
const getSingleUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const getUser = await User.findById(id);
    res.json({
      getUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Delete a single user
const deleteSingleUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deleteUser = await User.findByIdAndDelete(id);
    res.json({
      deleteUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Update a user
const updateSingleUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const updateUser = await User.findByIdAndUpdate(
      _id,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
      },
      {
        new: true,
      }
    );
    res.json(updateUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Block a user
const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const blocked = await User.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true }
    );
    res.json(blocked);
  } catch (error) {
    throw new Error(error);
  }
});

// Unblock a user
const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const unblocked = await User.findByIdAndUpdate(
      id,
      { isBlocked: false },
      { new: true }
    );
    res.json({
      message: "User unblocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Update Password
const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken();
    // after generating token, we save user
    await user.save();
    const resetURL = `Hello, please follow this link to reset your password. This link is valid for 10 minutes. <a href='http://localhost:3002/api/user/reset-password/${token}'>Click Here</a>`;
    const data = {
      to: email,
      text: "Hello User",
      subject: "Forgot Password Link",
      htm: resetURL,
    };
    sendEmail(data);
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  console.log(user);
  if (!user) throw new Error("Token Expired. Please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});

const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

const userCart = asyncHandler(async (req, res) => {
  const { cart } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    let products = [];
    const user = await User.findById(_id);
    // check if user already has products in cart
    const alreadyExistCart = await Cart.findOne({ orderby: user._id });
    if (alreadyExistCart) {
      alreadyExistCart.remove();
    }
    for (let i = 0; i < cart.length; i++) {
      let object = {};
      object.product = cart[i]._id;
      object.count = cart[i].count;
      object.color = cart[i].color;
      let getPrice = await Product.findById(cart[i]._id).select("price").exec();
      object.price = getPrice.price;
      products.push(object);
    }
    let cartTotal = 0;
    for (let i = 0; i < products.length; i++) {
      cartTotal += products[i].price * products[i].count;
    }
    // console.log(products, cartTotal);
    let newCart = await new Cart({
      products,
      cartTotal,
      orderby: user._id,
    }).save();
    console.log(newCart);
    res.json(newCart);
  } catch (error) {
    throw new Error(error);
  }
});

const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const getCart = await Cart.findOne({ orderby: _id }).populate(
      "products.product"
    );
    res.json(getCart);
  } catch (error) {
    throw new Error(error);
  }
});

const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const user = await User.findOne({ _id });
    const cart = await Cart.findOneAndRemove({ orderby: user._id });
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

const createOrder = asyncHandler(async (req, res) => {
  const { NP } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    if (!NP) throw new Error("Failed to create order");
    const user = await User.findById(_id);
    const userCart = await Cart.findOne({ orderby: user._id });
    let finalAmount = userCart.cartTotal;
    let newOrder = await new Order({
      products: userCart.products,
      paymentIntent: {
        id: uniqid(),
        method: "card",
        amount: finalAmount,
        status: "Not Processed",
        created: Date.now(),
        currency: "USD",
      },
      orderby: user._id,
      orderStatus: "Not Processed",
    }).save();
    let update = userCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { quantity: -item.count, sold: +item.count } },
        },
      };
    });
    const updated = await Product.bulkWrite(update);
    res.json({ message: "Order created successfully" });
  } catch (error) {
    throw new Error(error);
  }
});

const getOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const userOrders = await Order.find({ orderby: _id })
      .populate("products.product")
      .exec();
    res.json(userOrders);
  } catch (error) {
    throw new Error(error);
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updateOrderStatus = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus: status,
        paymentIntent: {
          status: status,
        },
      },
      { new: true }
    );
    res.json(updateOrderStatus);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createUser,
  loginUser,
  handleRefreshToken,
  getAllUsers,
  getSingleUser,
  deleteSingleUser,
  updateSingleUser,
  blockUser,
  unblockUser,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  getWishlist,
  saveAddress,
  userCart,
  getUserCart,
  emptyCart,
  createOrder,
  getOrders,
  updateOrderStatus,
};
