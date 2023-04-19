const express = require("express");
const {
  createProduct,
  getProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productCtrl");
const { isAdmin, authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", isAdmin, authMiddleware, createProduct);
router.get("/:id", getProduct);
router.put("/:id", isAdmin, authMiddleware, updateProduct);
router.delete("/:id", isAdmin, authMiddleware, deleteProduct);
router.get("/", getAllProduct);

module.exports = router;
