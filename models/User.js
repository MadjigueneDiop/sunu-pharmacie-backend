import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    prenom: { type: String, required: true },
    nom: { type: String, required: true },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    adresse: String,
    telephone: String,

    role: {
      type: String,
      enum: ["admin", "client", "pharmacien", "fournisseur", "livreur"],
      default: "client",
    },

    // 🔐 VALIDATION
    isVerified: { type: Boolean, default: false },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // 🔁 DEMANDE DE ROLE
    roleRequest: {
      type: String,
      enum: ["none", "pharmacien", "fournisseur", "livreur"],
      default: "none",
    },

    requestStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },

    // 📄 DOCUMENTS
    proofDocuments: {
      cni: String,
      diploma: String,
      pharmacyLicense: String,
      rc: String,
      ninea: String,
      drivingLicense: String,
      vehicleCard: String,
      selfie: String,
    },

    // 🔐 TOKEN SECURITY
    tokenVersion: { type: Number, default: 0 },

    // 🔑 RESET PASSWORD
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);