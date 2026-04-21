import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import Supplier from "../models/Supplier.js";

//TOKEN (VERSION PRO)//
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion, // IMPORTANT
    },
    "SECRET_KEY",
    { expiresIn: "7d" }
  );
};


//  REGISTER //
export const registerUser = async (req, res) => {
  try {
    const { prenom, nom, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const allowedRoles = [
      "client",
      "livreur",
      "fournisseur",
      "pharmacien"
    ];

    const roleFinal = allowedRoles.includes(role) ? role : "client";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      prenom,
      nom,
      email,
      password: hashedPassword,
      role: roleFinal,
    });

    // 🔥 FIX ICI
    if (roleFinal === "fournisseur") {
      await Supplier.create({
        name: `${prenom} ${nom}`,
        email,
        userId: user._id,
        phone: "",
        address: "",
      });
    }

    await sendEmail(
      email,
      "Inscription réussie",
      `Bonjour ${prenom}, votre compte a été créé 🎉`
    );

    res.status(201).json({
      message: "Utilisateur créé",
      token: generateToken(user),
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Utilisateur introuvable" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    user.isOnline = true;
    await user.save();

    res.json({
      message: "Connexion réussie",
      token: generateToken(user), //IMPORTANT
      user,
    });
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
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    user.role = role;
    user.tokenVersion += 1;

    await user.save();

    // 🔥 SI devient fournisseur → créer Supplier si absent
    if (role === "fournisseur") {
      const existingSupplier = await Supplier.findOne({
        userId: user._id,
      });

      if (!existingSupplier) {
        await Supplier.create({
          name: `${user.prenom} ${user.nom}`,
          email: user.email,
          userId: user._id,
          phone: "",
          address: "",
        });
      }
    }

    res.json({
      message: "Rôle mis à jour",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};