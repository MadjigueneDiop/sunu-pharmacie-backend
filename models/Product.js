import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    // 🔥 AJOUT IMPORTANT
supplierId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Supplier",
  required: false
}
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);