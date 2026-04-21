
import Supplier from "../models/Supplier.js";
import SupplyOrder from "../models/SupplyOrder.js";
import Product from "../models/Product.js";

/* =========================================================
   1. CRÉER FOURNISSEUR
========================================================= */
export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create({
      ...req.body,
      userId: req.user._id,
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   2. LISTE FOURNISSEURS
========================================================= */
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   3. STOCK FAIBLE
========================================================= */
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ quantity: { $lte: 5 } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   4. CRÉER / FUSIONNER COMMANDE (ANTI-DOUBLON)
========================================================= */
export const createSupplyOrder = async (req, res) => {
  try {
    // 1. Sécurité rôle
    if (req.user.role !== "pharmacien") {
      return res.status(403).json({ message: "Réservé au pharmacien" });
    }

    const { products, supplierId } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Aucun produit" });
    }

    let supplier;

    // 🔥 PRIORITÉ : fournisseur choisi manuellement
    if (supplierId) {
      supplier = await Supplier.findById(supplierId);
    } else {
      // fallback automatique via produit
      const firstProduct = await Product.findById(products[0].productId);

      if (!firstProduct?.supplierId) {
        return res.status(400).json({
          message: "Produit sans fournisseur"
        });
      }

      supplier = await Supplier.findById(firstProduct.supplierId);
    }

    if (!supplier) {
      return res.status(404).json({
        message: "Fournisseur introuvable"
      });
    }

    // 2. création commande
    const order = await SupplyOrder.create({
      products,
      supplierId: supplier._id,
      pharmacienId: req.user._id,
      status: "Demandé",
      total: 0
    });

    // 3. calcul total propre
    let total = 0;

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (product) {
        total += product.price * item.quantity;
      }
    }

    order.total = total;
    await order.save();

    console.log("✅ COMMANDE CRÉÉE :", order);

    res.status(201).json(order);

  } catch (err) {
    console.log("❌ ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
/* =========================================================
   5. GET COMMANDES
========================================================= */
export const getSupplyOrders = async (req, res) => {
  try {
    if (req.user.role !== "fournisseur") {
      return res.status(403).json({ message: "Réservé au fournisseur" });
    }

    const supplier = await Supplier.findOne({ userId: req.user._id });

    console.log("USER:", req.user._id);
    console.log("SUPPLIER:", supplier);

    if (!supplier) {
      return res.json([]);
    }

    const orders = await SupplyOrder.find({
      supplierId: supplier._id,
    })
      .populate("supplierId", "name email phone")
      .populate("pharmacienId", "prenom nom email")
      .populate("products.productId", "name price");

    console.log("ORDERS:", orders);

    return res.json(orders);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   6. LIVRAISON (MAJ STOCK + SÉCURITÉ)
========================================================= */
export const deliverSupplyOrder = async (req, res) => {
  try {
    const order = await SupplyOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    if (order.status === "Livré") {
      return res.status(400).json({ message: "Déjà livrée" });
    }

    if (order.status === "Annulé") {
      return res.status(400).json({ message: "Commande annulée" });
    }

    // 🔥 UPDATE STOCK
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.quantity },
      });
    }

    order.status = "Livré";
    order.deliveredAt = new Date();

    await order.save();

    res.json({ message: "Commande livrée + stock mis à jour" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   7. ANNULER COMMANDE
========================================================= */
export const deleteSupplyOrder = async (req, res) => {
  try {
    const order = await SupplyOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    if (order.status === "Livré") {
      return res.status(400).json({
        message: "Impossible d'annuler une commande livrée",
      });
    }

    order.status = "Annulé";
    await order.save();

    res.json({ message: "Commande annulée" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   8. DÉTAIL COMMANDE
========================================================= */
export const getSupplyOrderById = async (req, res) => {
  try {
    const order = await SupplyOrder.findById(req.params.id)
      .populate("supplierId")
      .populate("products.productId");

    if (!order) {
      return res.status(404).json({ message: "Introuvable" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   9. AUTO COMMANDES INTELLIGENTES
========================================================= */
export const autoCreateSupplyOrders = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({ quantity: { $lte: 5 } });

    if (!lowStockProducts.length) {
      return res.json({ message: "Aucun stock faible" });
    }

    const supplier = await Supplier.findOne({
      userId: req.user._id,
    });

    if (!supplier) {
      return res.status(404).json({
        message: "Fournisseur introuvable",
      });
    }

    const products = lowStockProducts.map((p) => {
      let qty = p.quantity === 0 ? 30 : p.quantity <= 2 ? 20 : 10;

      return {
        productId: p._id,
        quantity: qty,
      };
    });

    let total = 0;

    for (const item of products) {
      const product = await Product.findById(item.productId);
      total += product.price * item.quantity;
    }

    const order = await SupplyOrder.create({
      supplierId: supplier._id,
      pharmacienId: req.user._id,
      products,
      total,
      status: "Demandé",
    });

    res.status(201).json({
      message: "Commandes générées intelligemment",
      order,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   10. UPDATE STATUS (SAFE)
========================================================= */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await SupplyOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    if (status === "Livré") {
      return res.status(400).json({
        message: "Utilisez /deliver pour livrer",
      });
    }

    if (order.status === "Livré") {
      return res.status(400).json({
        message: "Déjà livrée",
      });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Statut mis à jour", order });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPharmacienOrders = async (req, res) => {
  try {
    const orders = await SupplyOrder.find({
      pharmacienId: req.user._id,
    })
      .populate("supplierId", "name email phone")
      .populate("products.productId", "name price");

    res.json(orders);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const ensureSupplierExists = async (req, res, next) => {
  try {
    if (req.user.role !== "fournisseur") return next();

    let supplier = await Supplier.findOne({ userId: req.user._id });

    if (!supplier) {
      supplier = await Supplier.create({
        name: req.user.prenom + " " + req.user.nom,
        email: req.user.email,
        userId: req.user._id,
      });
    }

    req.supplier = supplier;

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};