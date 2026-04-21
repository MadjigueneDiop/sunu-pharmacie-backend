import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Notification from "../models/Notifications.js";

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { products } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Non connecté" });
    }

    let total = 0;

    for (const item of products) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: "Produit introuvable" });
      }

      total += product.price * item.quantity;
    }

    // ✅ ICI TU CRÉES LA COMMANDE
   const order = await Order.create({
  userId: req.user._id,
  products,
  total,
  supplierId: null // ou un vrai supplier
});

    // ✅ ICI TU AJOUTES LA NOTIFICATION
    await Notification.create({
      userId: req.user._id,
      message: `Votre commande ${order._id.toString().slice(0, 6)} a été créée`,
      type: "order",
    });

    return res.status(201).json(order);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("products.productId", "name price image");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// UPDATE STATUS
export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ORDER (OPTIONNEL)
export const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Commande supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const validateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    for (const item of order.products) {
      const productId = item.productId?._id || item.productId;

      if (!productId) continue;

      await Product.findByIdAndUpdate(
        productId,
        { $inc: { quantity: -item.quantity } }
      );
    }

    // ✅ UPDATE SAFE (sans save)
    await Order.updateOne(
      { _id: order._id },
      { status: "Validée" }
    );

    await Notification.create({
      userId: order.userId,
      message: `Commande ${order._id.toString().slice(0, 6)} validée`,
      type: "order",
      isRead: false,
    });

    return res.json({
      message: "Commande validée + stock mis à jour",
    });

  } catch (err) {
    console.log("❌ validateOrder ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "prenom nom email")
      .populate("products.productId", "name price image");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
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