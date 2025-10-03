// routes/garageRoutes.js
import express from "express";
import {
  createGarage,
  getGarages,
  getGarageById,
  getGarageByUserId,
  updateGarage,
  deleteGarage,
  findNearestGarage, // ✅ Import the new controller function
} from "../controllers/garageController.js";
import { updateGarageToken as updateTokenController } from "../controllers/garageController.js";
const router = express.Router();

// @route   POST /api/garages
// @desc    Create a new garage
// @access  Public
router.post("/", createGarage);

// @route   GET /api/garages
// @desc    Get all garages
// @access  Public
router.get("/", getGarages);

router.post("/nearest", findNearestGarage); // ✅ Add the new route here
router.post("/updateToken", async (req, res) => {
  const { garageId, fcmToken } = req.body;

  try {
    const garage = await updateTokenController(garageId, fcmToken);
    res.json({ success: true, message: "Token updated", garage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// @route   GET /api/garages/:id
// @desc    Get single garage by ID
// @access  Public
router.get("/:id", getGarageById);
router.get("/user/:userId", getGarageByUserId);

// @route   PUT /api/garages/:id
// @desc    Update a garage
// @access  Public
router.put("/:id", updateGarage);

// @route   DELETE /api/garages/:id
// @desc    Delete a garage
// @access  Public
router.delete("/:id", deleteGarage);

export default router;
