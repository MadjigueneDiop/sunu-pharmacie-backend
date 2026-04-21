import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    prenom: {
      type: String,
      required: true,
      trim: true,
    },

    nom: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: [
        "admin",
        "pharmacien",
        "client",
        "livreur",
        "fournisseur",
        "support",
      ],
      default: "client",
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    // 🔐 RESET PASSWORD
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
    },

    // 🚨 AJOUT IMPORTANT (VERSION TOKEN)
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);