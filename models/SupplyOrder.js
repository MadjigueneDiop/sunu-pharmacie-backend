// models/SupplyOrder.js

import mongoose from "mongoose";

const supplyOrderSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    pharmacienId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
      },
    ],

    status: {
      type: String,
      enum: ["Demandé", "Préparation", "Expédié", "Livré", "Annulé"],
      default: "Demandé",
    },

    total: {
      type: Number,
      required: true,
    },

    deliveredAt: Date, // 🔥 ajout important
  },
  { timestamps: true }
);

export default mongoose.model("SupplyOrder", supplyOrderSchema);