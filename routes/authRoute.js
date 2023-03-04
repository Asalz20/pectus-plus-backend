const express = require("express");
const {
  createUser,
  loginUserCtrl,
  getAllUsers,
  getSingleUser,
  deleteSingleUser,
  updateSingleUser,
} = require("../controllers/userCtrl");
const { authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUserCtrl);
router.get("/all-users", getAllUsers);
router.get("/:id", authMiddleware, getSingleUser);
router.delete("/:id", deleteSingleUser);
router.put("/:id", updateSingleUser);

module.exports = router;
