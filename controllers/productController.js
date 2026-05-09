import Product from "../models/Product.js";
import History from "../models/History.js";
import SupplyOrder from "../models/SupplyOrder.js";
import Supplier from "../models/Supplier.js";

import { generatePackaging } from "../utils/generatePackaging.js";
import { generateDosages } from "../utils/generateDosages.js";
import { checkLowStockAndAlert } from "../utils/checkLowStockAndAlert.js";

// =======================
// ➕ CREATE PRODUCT (SAFE)
// =======================
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      quantity,
      category,
      form,
      description,
      composition,
      usage,
      howItWorks,
      indications,
      contraindications,
      sideEffects,
      faq,
    } = req.body;

    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);

    // 🔥 VALIDATION STRICTE
    if (!name || !category || !form) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // ❌ BLOQUE LES PRIX INVALIDES (FIX IMPORTANT)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "Prix invalide" });
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: "Stock invalide" });
    }

    const product = await Product.create({
      name,
      price: parsedPrice,
      quantity: parsedQuantity,
      category,
      form,

      dosages: generateDosages(parsedPrice),
      packaging: form === "Comprimé" ? generatePackaging(parsedPrice) : [],

      description,
      composition,
      usage,
      howItWorks,
      indications,
      contraindications,
      sideEffects,
      faq,

      image: req.file ? req.file.filename : "",
    });

    await checkLowStockAndAlert(product);

    return res.status(201).json(product);

  } catch (err) {
    console.log("CREATE PRODUCT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// =======================
// ✏️ UPDATE PRODUCT (SAFE FIX)
// =======================
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      quantity,
      category,
      form,
      description,
      composition,
      usage,
      howItWorks,
      indications,
      contraindications,
      sideEffects,
      faq,
    } = req.body;

    const updateData = {};

    if (name) updateData.name = name;

    // 🔥 PRICE SAFE FIX (IMPORTANT BUG FIX)
    if (price !== undefined) {
      const parsedPrice = Number(price);

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: "Prix invalide" });
      }

      updateData.price = parsedPrice;
      updateData.dosages = generateDosages(parsedPrice);
    }

    if (quantity !== undefined) {
      const parsedQty = Number(quantity);

      if (!Number.isFinite(parsedQty) || parsedQty < 0) {
        return res.status(400).json({ message: "Stock invalide" });
      }

      updateData.quantity = parsedQty;
    }

    if (category) updateData.category = category;
    if (form) updateData.form = form;

    updateData.description = description || "";
    updateData.composition = composition || "";
    updateData.usage = usage || "";
    updateData.howItWorks = howItWorks || "";
    updateData.indications = indications || "";
    updateData.contraindications = contraindications || "";
    updateData.sideEffects = sideEffects || "";
    updateData.faq = faq || "";

    if (price && form === "Comprimé") {
      updateData.packaging = generatePackaging(Number(price));
    }

    if (req.file) updateData.image = req.file.filename;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    await checkLowStockAndAlert(product);

    await History.create({
      user: req.user.id,
      action: "MODIFICATION PRODUIT",
      details: `${product.name} modifié`,
    });

    res.json(product);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// =======================
// 📦 GET PRODUCTS
// =======================
export const getProducts = async (req, res) => {
  try {
    const { category } = req.query;

    const products = await Product.find(
      category ? { category } : {}
    );

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// 📦 SUPPLY PRODUCT
// =======================
export const supplyProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const qty = Number(req.body.quantity);

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: "Quantité invalide" });
    }

    product.quantity += qty;
    await product.save();

    await checkLowStockAndAlert(product);

    await History.create({
      user: req.user.id,
      action: "APPROVISIONNEMENT",
      details: `${product.name} +${qty}`,
    });

    if (product.quantity <= 5) {
      const supplier = await Supplier.findOne();

      if (supplier) {
        await SupplyOrder.create({
          supplierId: supplier._id,
          products: [
            {
              productId: product._id,
              quantity: 20,
            },
          ],
          total: product.price * 20,
          status: "Demandé",
        });
      }
    }

    res.json({ message: "Stock mis à jour", product });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// ❌ DELETE PRODUCT
// =======================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    await History.create({
      user: req.user.id,
      action: "SUPPRESSION PRODUIT",
      details: `${product.name} supprimé`,
    });

    res.json({ message: "Produit supprimé" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// 🔍 GET PRODUCT BY ID
// =======================
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};