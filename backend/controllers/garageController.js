import Garage from "../models/Garage.js";

// Create a new garage
export const createGarage = async (req, res) => {
  try {
    const garage = new Garage(req.body);
    await garage.save();
    res.status(201).json(garage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all garages
export const getGarages = async (req, res) => {
  try {
    const garages = await Garage.find();
    res.json(garages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
