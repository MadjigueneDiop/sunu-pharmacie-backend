import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    adresse: String,
    telephone: String,

    deliveryStatus: {
      type: String,
      enum: ["en attente", "en livraison", "livré"],
      default: "en attente",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Delivery", deliverySchema);