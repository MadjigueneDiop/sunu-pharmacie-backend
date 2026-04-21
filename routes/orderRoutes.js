import express from "express";
import { protect } from "../middleware/auth.js";

import {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
  getMyOrders,
  getOrderById,
  validateOrder
} from "../controllers/orderController.js";

const router = express.Router();

// 🔐 USER PROTECTED ROUTES
router.post("/", protect, createOrder);
router.get("/pharmancien-orders", protect, getOrders); // ADMIN seulement
router.get("/my-orders", protect, getMyOrders); // USER seulement
router.get("/suivi-orders/:id", protect, getOrderById);
// ADMIN / UPDATE
router.put("/:id", protect, updateOrder);
router.delete("/:id", protect, deleteOrder);
router.put("/:id/validate", protect, validateOrder);

export default router;