import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  toggleBlockUser,
  validateUser,
  getPendingUsers,
  requestRole,
  handleRoleRequest,
  getPendingDocuments,
  rejectUser,
  updateUserRole // ✅ AJOUT ICI
} from "../controllers/userController.js";

import upload from "../middleware/upload.js";

import {
  protect,
  authorizeRoles,
  requireVerification,
} from "../middleware/auth.js";

import rateLimit from "express-rate-limit";

const router = express.Router();


// 🔥 RATE LIMIT (sécurité anti spam role request)
const roleRequestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: "Trop de demandes, réessayez dans une minute",
});


// =========================
// 🔐 AUTH
// =========================
router.post(
  "/register",
  upload.fields([
    { name: "cni", maxCount: 1 },
    { name: "diploma", maxCount: 1 },
    { name: "pharmacyLicense", maxCount: 1 },
    { name: "rc", maxCount: 1 },
    { name: "ninea", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "vehicleCard", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  registerUser
);

router.post("/login", loginUser);


// =========================
// 👤 USER (ADMIN ONLY)
// =========================
router.get("/", protect, authorizeRoles("admin"), getUsers);

router.put("/:id", protect, authorizeRoles("admin"), updateUser);

router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);


// ✅ 🔥 CHANGE ROLE (IMPORTANT POUR TON FRONT)
router.put(
  "/:id/role",
  protect,
  authorizeRoles("admin"),
  updateUserRole
);


// =========================
// 🔑 PASSWORD
// =========================
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);


// =========================
// 🚫 BLOCK / VALIDATION
// =========================
router.put("/:id/block", protect, authorizeRoles("admin"), toggleBlockUser);

router.put("/:id/validate", protect, authorizeRoles("admin"), validateUser);

router.get("/pending", protect, authorizeRoles("admin"), getPendingUsers);

router.put("/:id/reject", protect, authorizeRoles("admin"), rejectUser);


// =========================
// 🟡 ROLE REQUEST (PARTENAIRE)
// =========================
router.post(
  "/role-request",
  protect,
  authorizeRoles("client"),
  roleRequestLimiter,
  upload.single("document"),
  requestRole
);


// =========================
// 👑 ADMIN ROLE REQUEST HANDLER
// =========================
router.put(
  "/role-request/:id",
  protect,
  authorizeRoles("admin"),
  handleRoleRequest
);


// =========================
// 🏥 DASHBOARDS PROTEGÉS
// =========================
router.get(
  "/pharmacien/dashboard",
  protect,
  authorizeRoles("pharmacien"),
  requireVerification("pharmacien"),
  (req, res) => res.json({ message: "Dashboard pharmacien" })
);

router.get(
  "/fournisseur/dashboard",
  protect,
  authorizeRoles("fournisseur"),
  requireVerification("fournisseur"),
  (req, res) => res.json({ message: "Dashboard fournisseur" })
);

router.get(
  "/livreur/dashboard",
  protect,
  authorizeRoles("livreur"),
  requireVerification("livreur"),
  (req, res) => res.json({ message: "Dashboard livreur" })
);


// =========================
// 📄 DOCUMENTS EN ATTENTE
// =========================
router.get(
  "/pending-documents",
  protect,
  authorizeRoles("admin"),
  getPendingDocuments
);

export default router;