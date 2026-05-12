import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import Supplier from "../models/Supplier.js";
import mongoose from "mongoose";


//TOKEN (VERSION PRO)//
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

//  REGISTER //
export const registerUser = async (req, res) => {
  try {
    const {
      prenom,
      nom,
      email,
      password,
      adresse,
      telephone,
      role,
    } = req.body;

    const files = req.files || {};

    const safePath = (f) =>
      f?.[0]?.path?.replace(/\\/g, "/") || null;

    const exist = await User.findOne({ email });
    if (exist)
      return res.status(400).json({ message: "Email existe" });

    const hashed = await bcrypt.hash(password, 10);

    const isClient = !role || role === "client";

    const user = await User.create({
      prenom,
      nom,
      email,
      password: hashed,
      adresse,
      telephone,
      role: role || "client",
      isVerified: isClient ? true : false,

      proofDocuments: {
        cni: safePath(files.cni),
        diploma: safePath(files.diploma),
        pharmacyLicense: safePath(files.pharmacyLicense),
        rc: safePath(files.rc),
        ninea: safePath(files.ninea),
        drivingLicense: safePath(files.drivingLicense),
        vehicleCard: safePath(files.vehicleCard),
        selfie: safePath(files.selfie),
      },
    });

    // 🔥 réponse immédiate (API rapide)
    res.status(201).json(user);

    // 📧 email en background (NE bloque PAS API)
    (async () => {
      try {
        if (isClient) {
          await sendEmail(
            email,
            "Bienvenue sur SunuPharmacie",
            `Bonjour ${prenom},

Votre compte a été créé avec succès 🎉

SunuPharmacie`
          );
        } else {
          await sendEmail(
            email,
            "Demande en cours de validation",
            `Bonjour ${prenom},

Votre inscription est en attente de validation.

SunuPharmacie`
          );
        }
      } catch (emailError) {
        console.log("❌ EMAIL ERROR (ignored):", emailError.message);
      }
    })();

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
//LOGIN
// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User introuvable" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // 🔥 1. COMPTE BLOQUÉ
    if (user.isBlocked) {
      return res.status(403).json({
        message: "ACCOUNT_BLOCKED",
      });
    }

    // 🔥 2. COMPTE REJETÉ
    if (user.requestStatus === "rejected") {
      return res.status(403).json({
        message: "ACCOUNT_REJECTED",
      });
    }

    // 🔥 3. EN ATTENTE
    const needValidation =
      ["pharmacien", "fournisseur", "livreur"].includes(user.role) &&
      user.isVerified === false;

    if (needValidation) {
      return res.status(403).json({
        message: "ACCOUNT_PENDING",
        pending: true,
      });
    }

   const token = jwt.sign(
  { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
    const safeUser = {
      _id: user._id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      requestStatus: user.requestStatus,
    };

    res.json({ token, user: safeUser });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET USERS 
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $ne: "admin" },
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE USER 
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER 
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

   await sendEmail(
  email,
  "Réinitialisation du mot de passe",
  `
Bonjour,

Vous avez demandé à réinitialiser votre mot de passe.

Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :
${resetLink}

⚠️ Ce lien expire dans 15 minutes.

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.

Merci,
L'équipe SunuPharmacie
`
);

    res.json({ message:  "Un email de réinitialisation a été envoyé. Vérifiez votre boîte mail." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//RESET PASSWORD 
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Mot de passe mis à jour" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//UPDATE ROLE 
// export const updateUserRole = async (req,res)=>{
//   const {role} = req.body;

//   const user = await User.findById(req.params.id);

//   user.role = role;

//   if(role === "pharmacien" || role === "fournisseur"){
//     user.isVerified = false;
//   }

//   if(role === "livreur"){
//     user.isVerified = true;
//   }

//   user.tokenVersion++;

//   await user.save();

//   res.json(user);
// };
// BLOCK / UNBLOCK USER
export const toggleBlockUser = async (req, res) => {
  try {
    console.log("🔥 toggleBlockUser appelé");

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const wasBlocked = user.isBlocked === true;

    user.isBlocked = !wasBlocked;

    await user.save();

    console.log("✅ USER SAVED");

    const isBlockedNow = user.isBlocked === true;

    try {
      console.log("📧 AVANT SENDEMAIL");

      if (!wasBlocked && isBlockedNow) {
        await sendEmail(
          user.email,
          "Compte bloqué 🚫",
          `Bonjour ${user.prenom},

Votre compte a été bloqué.

SunuPharmacie`
        );
      }

      if (wasBlocked && !isBlockedNow) {
        await sendEmail(
          user.email,
          "Compte réactivé ✅",
          `Bonjour ${user.prenom},

Votre compte a été réactivé.

SunuPharmacie`
        );
      }

      console.log("✅ APRÈS SENDEMAIL");

    } catch (emailError) {
      console.log("❌ EMAIL ERROR:", emailError);
    }

    return res.json({
      message: "Statut mis à jour",
      user: {
        _id: user._id,
        isBlocked: user.isBlocked,
      },
    });

  } catch (error) {
    console.log("❌ TOGGLE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const validateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    user.isVerified = true;
    user.tokenVersion += 1;

    await user.save();

    // 🔥 EMAIL VALIDATION
    await sendEmail(
      user.email,
      "Compte validé ✅",
      `
Bonjour ${user.prenom},

🎉 Félicitations !

Votre compte (${user.role}) a été validé.

Vous pouvez maintenant accéder à votre espace.

Merci,
SunuPharmacie
      `
    );

    res.json({
      message: "Utilisateur validé",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      isVerified: false,
      role: { $ne: "client" }
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { roleRequest } = req.body;

    const allowed = ["pharmacien", "fournisseur", "livreur"];

    if (!allowed.includes(roleRequest)) {
      return res.status(400).json({ message: "Rôle interdit" });
    }

    if (user.requestStatus === "pending") {
      return res.status(400).json({ message: "Déjà une demande en cours" });
    }

    user.roleRequest = roleRequest;
    user.requestStatus = "pending";
    user.isVerified = false;

    if (req.file) {
      user.proofDocument = req.file.path;
    }

    await user.save();

    res.json({ message: "Demande envoyée à l'admin" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const handleRoleRequest = async (req, res) => {
  try {
    const { status } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User introuvable" });

    if (user.requestStatus !== "pending") {
      return res.status(400).json({ message: "Pas de demande active" });
    }

    if (status === "approved") {
      user.role = user.roleRequest;
      user.isVerified = true;
    }

    if (status === "rejected") {
      user.roleRequest = "none";
    }

    user.requestStatus = status;
    user.tokenVersion++;

    await user.save();

    res.json({ message: "Traitement effectué", user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET USERS EN ATTENTE DE VALIDATION DOCUMENTS
export const getPendingDocuments = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["pharmacien", "fournisseur", "livreur"] },
      isVerified: false,
    }).select("-password");

    console.log("PENDING USERS:", users);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    user.isVerified = false;
    user.requestStatus = "rejected";

    await user.save();

    await sendEmail(
      user.email,
      "Demande rejetée ❌",
      `
Bonjour ${user.prenom},

Votre demande (${user.role}) a été rejetée.

👉 Vos documents sont invalides.

SunuPharmacie
      `
    );

    res.json({ message: "Utilisateur rejeté" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 UPDATE ROLE (ADMIN - VERSION PRO)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const allowedRoles = [
      "client",
      "pharmacien",
      "livreur",
      "fournisseur",
      "admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // 🚫 éviter update inutile
    if (user.role === role) {
      return res.json({
        message: "Aucun changement",
        user,
      });
    }

    const oldRole = user.role;

    // 🔄 UPDATE ROLE
    user.role = role;

    // 🔥 LOGIQUE MÉTIER
    if (["pharmacien", "fournisseur"].includes(role)) {
      user.isVerified = false;
      user.requestStatus = "pending";
    }

    if (role === "livreur") {
      user.isVerified = true;
    }

    if (role === "client") {
      user.isVerified = true;
    }

    // 🔐 INVALIDER TOKENS
    user.tokenVersion += 1;

    await user.save();

    // 📧 EMAIL NOTIFICATION
    await sendEmail(
      user.email,
      "Changement de rôle",
      `
Bonjour ${user.prenom},

Votre rôle a été modifié.

Ancien rôle : ${oldRole}
Nouveau rôle : ${role}

${
  user.isVerified
    ? "Votre compte est actif."
    : "Votre compte nécessite une validation."
}

SunuPharmacie
`
    );

    res.json({
      message: "Rôle mis à jour avec succès",
      user: {
        _id: user._id,
        role: user.role,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};