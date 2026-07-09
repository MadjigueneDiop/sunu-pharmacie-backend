import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

   products: [
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: Number,

    category: String,
    price: Number,
    dosage: String,
  },
],

    total: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "En attente",
        "Validée",
        "Préparation",
        "Expédiée",
        "Livrée",
        "Annulée",
      ],
      default: "En attente",
    },

    deliveryStatus: {
      type: String,
      enum: ["en attente", "en livraison", "livré"],
      default: "en attente",
    },

    deliveredAt: Date,

    seenByPharmacien: {
      type: Boolean,
      default: false,
    },
    prescription: {
      url: String,
      status: {
        type: String,
        default: "En attente",
      }
    },
    paymentMethod: {
  type: String,
  enum: ["cash", "wave", "orange_money"],
  required: true,
},

paymentStatus: {
  type: String,
  enum: ["pending", "success", "failed"],
  default: "pending",
},
requiresPrescription: {
  type: Boolean,
  default: false,
},
    tracking: [
      {
        status: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);