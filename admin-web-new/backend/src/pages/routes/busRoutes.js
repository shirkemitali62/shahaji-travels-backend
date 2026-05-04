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


router.get("/search", async (req, res) => {
  try {
    const { from, to } = req.query;

    const buses = await Bus.find({
      from: { $regex: `^${from}$`, $options: "i" },
      to: { $regex: `^${to}$`, $options: "i" },
    });

    res.json({ buses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;