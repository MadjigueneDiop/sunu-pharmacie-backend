import Supplier from "../models/Supplier.js";
import Notification from "../models/Notifications.js";
import SupplyOrder from "../models/SupplyOrder.js";

// 🔥 STOCK FAIBLE → ALERTE + COMMANDE AUTO
export const checkLowStockAndAlert = async (product) => {
  try {
    // seuil de stock
    if (product.quantity >= 5) return;

    // récupérer fournisseur lié au produit
    const supplier = await Supplier.findById(product.supplierId);

    if (!supplier) return;

    // 🔔 notification fournisseur
    await Notification.create({
      userId: supplier._id,
      message: `⚠️ Stock faible: ${product.name} (${product.quantity})`,
      type: "stock_alert",
    });

    // 📦 commande automatique fournisseur
    await SupplierOrder.create({
      supplierId: supplier._id,
      products: [
        {
          productId: product._id,
          quantity: 20,
          price: product.price,
        },
      ],
      total: product.price * 20,
      status: "En attente",
    });

  } catch (err) {
    console.log("LOW STOCK ERROR:", err.message);
  }
};