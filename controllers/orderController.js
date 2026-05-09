import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Delivery from "../models/Delivery.js";

// ================= CREATE ORDER =================
export const createOrder = async (req, res) => {
  try {
    const products = JSON.parse(req.body.products || "[]");
    const total = Number(req.body.total || 0);

    if (!req.user) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    const dbProducts = await Product.find({
      _id: { $in: products.map(p => p.productId) }
    });

    const needsPrescription = dbProducts.some(
      (p) => p.requiresPrescription === true
    );

    // 🔥 DEBUG IMPORTANT
    console.log("FILE RECEIVED:", req.file);

    if (needsPrescription && !req.file) {
      return res.status(400).json({
        message: "📄 Ordonnance obligatoire"
      });
    }

    let finalTotal = 0;

    const formattedProducts = products.map((p) => {
      const product = dbProducts.find(
        (db) => db._id.toString() === p.productId
      );

      const price = product?.price || 0;
      const quantity = Number(p.quantity || 1);

      finalTotal += price * quantity;

      return {
        productId: p.productId,
        quantity,
        price,
        category: product?.category,
      };
    });

    const order = await Order.create({
      userId: req.user._id,
      products: formattedProducts,
      total: total || finalTotal,

      status: needsPrescription
        ? "En attente ordonnance"
        : "En attente",

      // 🔥 FIX IMPORTANT
      prescription: req.file
        ? {
            url: req.file.filename,
            status: "En attente",
          }
        : null,
    });
console.log("FILE RECEIVED:", req.file);
    return res.status(201).json(order);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};
// ================= GET MY ORDERS (IMPORTANT FIX) =================
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("products.productId", "name price image category")
      .lean(); // 🔥 IMPORTANT pour éviter bug mongoose

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



// ================= GET ALL ORDERS =================
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "prenom nom email")
      .populate("products.productId", "name price image category")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ================= DELETE ORDER =================
export const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Commande supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ================= UPDATE ORDER (🔥 REMIS PROPREMENT) =================
export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    // 🔥 mise à jour flexible
    Object.keys(req.body).forEach((key) => {
      order[key] = req.body[key];
    });

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ================= UPDATE STATUS ORDER =================
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    order.status = status;

    if (!order.tracking) order.tracking = [];

    order.tracking.push({
      status,
      by: req.user._id,
      role: req.user.role,
      date: new Date(),
    });

    if (status === "Livrée") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ================= VALIDATE PRESCRIPTION =================
export const validatePrescription = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    if (!order.prescription?.url) {
      return res.status(400).json({ message: "Pas d'ordonnance" });
    }

    order.prescription.status = "Validée";
    order.prescriptionStatus = "Validée";

    await order.save();

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ================= REJECT PRESCRIPTION =================
export const rejectPrescription = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    order.prescription.status = "Rejetée";
    order.prescriptionStatus = "Rejetée";

    order.status = "Annulée";

    await order.save();

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ================= VALIDATE ORDER =================
export const validateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId");

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    if (
      order.prescription &&
      order.prescription.status !== "Validée"
    ) {
      return res.status(400).json({
        message: "Ordonnance non validée",
      });
    }

    // ✅ STATUT PHARMACIEN
    order.status = "Validée";
    order.deliveryStatus = "en attente"; // 🔥 TRÈS IMPORTANT
    order.validatedAt = new Date();

    await order.save();

    // ✅ CHECK SI DELIVERY EXISTE
    const exists = await Delivery.findOne({ orderId: order._id });

    if (!exists) {
      await Delivery.create({
        orderId: order._id,
        userId: order.userId._id,
        adresse: order.userId.adresse,
        telephone: order.userId.telephone,
        deliveryStatus: "en attente", // 🔥 ici c’est pour Delivery
      });
    }

    return res.json(order);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
// ================= GET ORDER BY ID =================
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "prenom nom email")
      .populate("products.productId", "name price image");

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};