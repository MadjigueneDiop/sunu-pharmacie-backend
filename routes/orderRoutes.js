import express from "express";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
  getMyOrders,
  getOrderById,
  validateOrder,
  updateOrderStatus,
  validatePrescription,
  rejectPrescription
} from "../controllers/orderController.js";
const router = express.Router();

// 🔐 USER PROTECTED ROUTES
router.post(
  "/",
  protect,
  upload.single("prescription"),
  createOrder
);
router.get("/pharmancien-orders", protect, getOrders); // ADMIN seulement
router.get("/my-orders", protect, getMyOrders); // USER seulement
router.get("/suivi-orders/:id", protect, getOrderById);
// ADMIN / UPDATE
router.put("/:id", protect, updateOrder);
router.delete("/:id", protect, deleteOrder);
router.put("/:id/validate", protect, validateOrder);
router.put("/orders/:id/status", protect, updateOrderStatus);
router.put("/:id/prescription/validate", protect, validatePrescription);
router.put("/:id/prescription/reject", protect, rejectPrescription);
export default router;