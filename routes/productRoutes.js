import express from "express";
import Product from "../models/Product.js"; // 🔥 IMPORTANT

import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  supplyProduct,
  getProductById
} from "../controllers/productController.js";

import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// =====================
// PRODUCTS ROUTES
// =====================
router.put("/fix-prices", async (req, res) => {
  try {
    const result = await Product.updateMany(
      {
        $or: [
          { price: { $lte: 0 } },
          { price: "0" },
          { price: "" },
          { price: null },
          { price: { $exists: false } }
        ]
      },
      { $set: { price: 1000 } }
    );

    res.json({
      message: "Prix corrigés",
      modified: result.modifiedCount
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur correction" });
  }
});
router.put("/fix-stock", async (req, res) => {
  try {
    const result = await Product.updateMany(
      {
        $or: [
          { quantity: { $lte: 0 } },
          { quantity: "0" },
          { quantity: "" },
          { quantity: null },
          { quantity: { $exists: false } }
        ]
      },
      { $set: { quantity: 10 } } // 👈 valeur par défaut (modifiable)
    );

    res.json({
      message: "Stock corrigé",
      modified: result.modifiedCount
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur correction stock" });
  }
});
router.get("/", getProducts);

router.post("/", protect, upload.single("image"), createProduct);

router.put("/:id", protect, upload.single("image"), updateProduct);

router.delete("/:id", protect, deleteProduct);

router.put("/supply/:id", protect, supplyProduct);

router.get("/:id", getProductById);

// =====================
// FIX PRICES ROUTE (ADMIN)
// =====================

export default router;