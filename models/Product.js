import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },

    form: {
      type: String,
      enum: ["Comprimé", "Sirop", "Pommade", "Gélule", "Injection", "Autre"],
      required: true,
    },

    image: { type: String, default: "" },

    // 🔥 AJOUT OBLIGATOIRE
    price: {
      type: Number,
      default: 0,
    },

    quantity: {
      type: Number,
      default: 0,
    },

    // 💊 DOSAGES
    dosages: [
      {
        value: Number,
        unit: { type: String, enum: ["mg", "ml", "g", "UI"] },
        price: Number,
      }
    ],

    // 📦 PACKAGING
    packaging: [
      {
        label: String,
        quantity: Number,
        price: Number,
        total: Number,
        discount: Number,
      }
    ],

    // 📖 FICHE
    description: String,
    composition: String,
    usage: String,
    howItWorks: String,
    indications: String,
    contraindications: String,
    sideEffects: String,
    faq: String,
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);