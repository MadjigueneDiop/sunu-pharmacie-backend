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
  rejectPrescription,
  //   getPayments,
  // updatePaymentStatus

} from "../controllers/orderController.js";
const router = express.Router();

router.post(
  "/",
  protect,
  upload.single("prescription"),
  createOrder
);
router.get("/pharmancien-orders", protect, getOrders); 
router.get("/my-orders", protect, getMyOrders); 
router.get("/suivi-orders/:id", protect, getOrderById);
router.put("/:id", protect, updateOrder);
router.delete("/:id", protect, deleteOrder);
router.put("/:id/validate", protect, validateOrder);
router.put("/orders/:id/status", protect, updateOrderStatus);
router.put("/:id/prescription/validate", protect, validatePrescription);
router.put("/:id/prescription/reject", protect, rejectPrescription);

// router.get("/", getPayments);

// router.put("/:id", updatePaymentStatus);
export default router;