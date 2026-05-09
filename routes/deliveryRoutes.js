import express from "express";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * 📦 COMMANDES LIVREUR
 * 👉 IMPORTANT: on utilise deliveryStatus et PAS status
 */
router.get("/delivery", protect, async (req, res) => {
  try {
    if (req.user.role !== "livreur") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // ✅ SEULEMENT commandes validées par pharmacien
    const orders = await Order.find({
      status: { $in: ["Validée", "Expédiée", "Livrée"] },
      deliveryStatus: { $in: ["en attente", "en livraison", "livré"] }
    })
      .populate("userId", "prenom nom telephone adresse");

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
/**
 * 🚚 START DELIVERY
 */
router.put("/:id/start-delivery", protect, async (req, res) => {
  try {
    if (req.user.role !== "livreur") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    order.deliveryStatus = "en livraison";

    // optionnel (ne casse pas le filtre)
    order.status = "Expédiée";

    await order.save();

    res.json({ message: "Livraison démarrée 🚚" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * ✅ CONFIRM DELIVERY
 */
router.put("/:id/confirm-delivery", protect, async (req, res) => {
  try {
    if (req.user.role !== "livreur") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    order.deliveryStatus = "livré";

    // cohérence globale
    order.status = "Livrée";

    await order.save();

    res.json({ message: "Commande livrée ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;