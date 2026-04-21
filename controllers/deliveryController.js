import Delivery from "../models/Delivery.js";

export const getDeliveries = async (req, res) => {
  res.json(await Delivery.find());
};

export const createDelivery = async (req, res) => {
  const delivery = await Delivery.create(req.body);
  res.json(delivery);
};

export const updateDelivery = async (req, res) => {
  const delivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(delivery);
};