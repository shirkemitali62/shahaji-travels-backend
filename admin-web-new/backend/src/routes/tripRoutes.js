import express from "express";
import { getTrips, getTripById } from "../controllers/tripController.js";

const router = express.Router();

router.get("/", getTrips);
router.get("/:id", getTripById);

export default router;