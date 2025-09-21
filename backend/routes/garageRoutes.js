// routes/garageRoutes.js
import express from "express";
import {
  createGarage,
  getGarages,
  getGarageById,
  getNearbyGarages,
  updateGarage,
  deleteGarage,
} from "../controllers/garageController.js";

const router = express.Router();

// @route   POST /api/garages
// @desc    Create a new garage
// @access  Public
router.post("/", createGarage);

// @route   GET /api/garages
// @desc    Get all garages
// @access  Public
router.get("/", getGarages);

// @route   GET /api/garages/nearby?lat=xx&lng=yy&radius=5000
// @desc    Get nearby garages using coordinates
// @access  Public
router.get("/nearby", getNearbyGarages);

// @route   GET /api/garages/:id
// @desc    Get single garage by ID
// @access  Public
router.get("/:id", getGarageById);

// @route   PUT /api/garages/:id
// @desc    Update a garage
// @access  Public
router.put("/:id", updateGarage);

// @route   DELETE /api/garages/:id
// @desc    Delete a garage
// @access  Public
router.delete("/:id", deleteGarage);

export default router;
