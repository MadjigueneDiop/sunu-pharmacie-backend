import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Pas de token" });

    const decoded = jwt.verify(token, "SECRET_KEY");

    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ message: "User introuvable" });

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: "Session expirée" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Compte bloqué" });
    }

    req.user = user;
    next();

  } catch {
    res.status(401).json({ message: "Token invalide" });
  }
};

// ROLE
export const authorizeRoles = (...roles) => {
  return (req,res,next)=>{
    if(!roles.includes(req.user.role)){
      return res.status(403).json({message:"Accès refusé"});
    }
    next();
  };
};

// VERIFICATION
export const requireVerification = (role) => {
  return (req, res, next) => {
    if (req.user.role === "admin") return next();

    const isPartner = ["pharmacien", "fournisseur", "livreur"].includes(req.user.role);

    if (isPartner && req.user.role === role) {
      if (req.user.isVerified === false) {
        return res.status(403).json({
          message: "Compte non validé par l'admin",
        });
      }
    }

    next();
  };
};