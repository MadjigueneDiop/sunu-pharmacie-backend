import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // 🔥 lien obligatoire avec le user connecté
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Supplier", supplierSchema);