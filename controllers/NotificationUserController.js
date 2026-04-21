import Notification from "../models/Notifications.js";

// 🔔 Récupérer les notifications du user connecté
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id, // 🔐 sécurité
      },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: "Notification introuvable" });
    }

    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id, // 🔐 sécurité
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification introuvable" });
    }

    res.json({ message: "Notification supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};