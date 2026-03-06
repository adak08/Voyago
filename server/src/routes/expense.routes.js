import express from "express";
const router = express.Router();
import {
    addExpense,
    getTripExpenses,
    getTripBalances,
    deleteExpense,
    createSettlement,
    getTripSettlements,
} from "../controllers/expense.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../config/cloudinary.config.js";

router.use(protect);
router.post("/", upload.single("receipt"), addExpense);
router.get("/:tripId", getTripExpenses);
router.get("/:tripId/balances", getTripBalances);
router.get("/:tripId/settlements", getTripSettlements);
router.post("/settle", createSettlement);
router.delete("/:id", deleteExpense);

export default router;
