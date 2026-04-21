import express from "express";
import {
  createSupplier,
  getSuppliers,
  getLowStockProducts,
  createSupplyOrder,
  getSupplyOrders,
  deliverSupplyOrder,
  deleteSupplyOrder,
  getSupplyOrderById,
  autoCreateSupplyOrders,
  updateOrderStatus,
  getPharmacienOrders,
} from "../controllers/supplierController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createSupplier);
router.get("/", protect, getSuppliers);

router.get("/low-stock", protect, getLowStockProducts);

router.post("/orders", protect, createSupplyOrder);
router.get("/orders", protect, getSupplyOrders);

router.get("/orders/:id", protect, getSupplyOrderById);

router.put("/orders/:id/deliver", protect, deliverSupplyOrder);

router.delete("/orders/:id", protect, deleteSupplyOrder);

router.post("/auto-orders", protect, autoCreateSupplyOrders);

router.put("/orders/:id/status", protect, updateOrderStatus);

router.get("/pharmacien/orders", protect, getPharmacienOrders);

export default router;