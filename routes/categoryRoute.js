const express = require("express");
const {
  createCategory,
  updateCategory,
} = require("../controllers/categoryCtrl");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createCategory);
router.post("/:id", authMiddleware, isAdmin, updateCategory);

module.exports = router;
