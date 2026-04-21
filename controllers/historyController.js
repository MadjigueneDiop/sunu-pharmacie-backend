import History from "../models/History.js";

// 📊 GET ALL HISTORY (PHARMACIEN / ADMIN)
export const getHistory = async (req, res) => {
  try {
    const history = await History.find()
      .populate("user", "prenom nom email")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};