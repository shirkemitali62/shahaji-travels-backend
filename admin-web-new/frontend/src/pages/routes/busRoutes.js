import express from "express";
import {
  getBuses,
  createBus,
  updateBus,
  deleteBus,
} from "../controllers/busController.js";

const router = express.Router();

router.get("/", getBuses);
router.post("/", createBus);
router.put("/:id", updateBus);
router.delete("/:id", deleteBus);

export default router;