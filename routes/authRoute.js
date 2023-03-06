const express = require("express");
const {
  createUser,
  loginUser,
  handleRefreshToken,
  getAllUsers,
  getSingleUser,
  deleteSingleUser,
  updateSingleUser,
  blockUser,
  unblockUser,
} = require("../controllers/userCtrl");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/all-users", getAllUsers);
router.get("/refresh", handleRefreshToken);
router.get("/:id", authMiddleware, isAdmin, getSingleUser);
router.delete("/:id", deleteSingleUser);
router.put("/edit-user", authMiddleware, updateSingleUser);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);

module.exports = router;
