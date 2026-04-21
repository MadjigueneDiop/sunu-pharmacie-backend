import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Vérifier token
export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Pas de token" });
    }

    const decoded = jwt.verify(token, "SECRET_KEY");

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }

    // IMPORTANT : vérifier version token
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: "Session expirée, reconnectez-vous"
      });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
};
// Vérifier rôle
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "⛔ Accès refusé pour ce rôle"
      });
    }
    next();
  };
};
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
};

export const checkRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
};