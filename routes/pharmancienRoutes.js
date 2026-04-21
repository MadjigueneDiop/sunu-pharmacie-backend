import express from "express";

import { protect, authorizeRoles } from "../middleware/auth.js";

// PRODUCTS (déjà existant)
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";

// ORDERS
import {
  getOrders,
  updateOrderStatus
} from "../controllers/orderController.js";

const router = express.Router();

// 🔐 PROTECTION PHARMACIEN + ADMIN
router.use(protect);
router.use(authorizeRoles("pharmacien", "admin"));

/* =======================
   💊 PRODUCTS (STOCK)
======================= */
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

/* =======================
   🧾 ORDERS
======================= */
router.get("/orders", getOrders);

// changer statut commande (préparation)
router.put("/orders/:id", updateOrderStatus);

export default router;