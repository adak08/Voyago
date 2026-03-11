import express from "express";
const router = express.Router();
import { body, param } from "express-validator";
import {
    addExpense,
    getTripExpenses,
    getTripBalances,
    deleteExpense,
    createSettlement,
    getTripSettlements,
} from "../controllers/expense.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { receiptUpload } from "../config/cloudinary.config.js";
import { validate } from "../middlewares/validate.middleware.js";

const addExpenseValidation = [
    body("tripId").isMongoId().withMessage("Valid tripId is required"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("splitType")
        .isIn(["equal", "exact", "percentage"])
        .withMessage("splitType must be one of equal, exact, percentage"),
];

const tripParamValidation = [
    param("tripId").isMongoId().withMessage("Valid tripId is required"),
];

const expenseIdValidation = [
    param("id").isMongoId().withMessage("Valid expense id is required"),
];

const settleValidation = [
    body("tripId").isMongoId().withMessage("Valid tripId is required"),
    body("to").isMongoId().withMessage("Valid recipient user id is required"),
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
];

router.use(protect);
router.post("/", receiptUpload.single("receipt"), addExpenseValidation, validate, addExpense);
router.get("/:tripId", tripParamValidation, validate, getTripExpenses);
router.get("/:tripId/balances", tripParamValidation, validate, getTripBalances);
router.get("/:tripId/settlements", tripParamValidation, validate, getTripSettlements);
router.post("/settle", settleValidation, validate, createSettlement);
router.delete("/:id", expenseIdValidation, validate, deleteExpense);

export default router;
