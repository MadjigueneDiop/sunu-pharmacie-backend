import express from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  supplyProduct
} from "../controllers/productController.js";

import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js"; // ✅ AJOUT ICI

const router = express.Router();

router.get("/", getProducts);

// ✅ upload ajouté correctement
router.post("/", protect, upload.single("image"), createProduct);

router.put("/:id", protect, upload.single("image"), updateProduct); 

router.delete("/:id", protect, deleteProduct);
router.put("/supply/:id", protect, supplyProduct);


export default router;