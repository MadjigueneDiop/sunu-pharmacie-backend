import Supplier from "../models/Supplier.js";
import Notification from "../models/Notifications.js";
import SupplyOrder from "../models/SupplyOrder.js";

export const checkLowStockAndAlert = async (product) => {
  try {
    if (product.quantity >= 5) return;

    const supplier = await Supplier.findById(product.supplierId);

    if (!supplier) return;

    await Notification.create({
      userId: supplier._id,
      message: `⚠️ Stock faible: ${product.name} (${product.quantity})`,
      type: "stock_alert",
    });

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