import User from "../models/User.js";
import Delivery from "../models/Delivery.js";

// CREATE DELIVERY (snapshot propre)
export const createDelivery = async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    // 🚨 IMPORTANT : sécurité métier
    if (order.status !== "Validée") {
      return res.status(400).json({
        message: "Commande pas encore validée par le pharmacien",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User introuvable" });
    }

    const delivery = await Delivery.create({
      orderId,
      userId,

      adresse: user.adresse?.trim() || "",
      telephone: user.telephone?.trim() || "",

      deliveryStatus: "en attente",
    });

    return res.json(delivery);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
// GET DELIVERIES
export const getDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate("userId")
      .populate("orderId")
      .sort({ createdAt: -1 });

    const formatted = deliveries
      .filter((d) => d.orderId?.status === "Validée") // 🔥 IMPORTANT
      .map((d) => {
        const user = d.userId || {};
        const order = d.orderId || {};

        return {
          _id: d._id,
          deliveryStatus: d.deliveryStatus,

          adresse: d.adresse?.trim() || user.adresse?.trim() || "",
          telephone: d.telephone?.trim() || user.telephone?.trim() || "",

          total: order.total || 0,

          orderStatus: order.status, // 🔥 AJOUT IMPORTANT

          userId: user,
          orderId: order,
        };
      });

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// UPDATE DELIVERY STATUS
export const updateDelivery = async (req, res) => {
  try {
    const allowed = ["en attente", "en cours", "livrée"];

    if (!allowed.includes(req.body.deliveryStatus)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: req.body.deliveryStatus },
      { new: true }
    );

    return res.json(delivery);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};