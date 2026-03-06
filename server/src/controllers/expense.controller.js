import Expense from "../models/expense.model.js";
import Settlement from "../models/settlement.model.js";
import Trip from "../models/trip.model.js";
import { calculateBalances } from "../utils/expenseCalculator.js";
import { createNotification } from "../services/notification.service.js";
import { getIO } from "../config/socket.config.js";

// @POST /api/expenses - Add expense
export const addExpense = async (req, res, next) => {
    try {
        const {
            tripId,
            title,
            amount,
            category,
            splitType,
            splits,
            currency,
            date,
            notes,
        } = req.body;

        const trip = await Trip.findById(tripId);
        if (!trip)
            return res
                .status(404)
                .json({ success: false, message: "Trip not found" });

        const isMember = trip.members.some(
            (m) => m.user.toString() === req.user.id
        );
        if (!isMember)
            return res
                .status(403)
                .json({ success: false, message: "Not a member" });

        let finalSplits = splits;

        // Auto-calculate equal split
        if (splitType === "equal") {
            const memberCount = trip.members.length;
            const perPerson = parseFloat((amount / memberCount).toFixed(2));
            finalSplits = trip.members.map((m) => ({
                user: m.user,
                amount: perPerson,
                paid: m.user.toString() === req.user.id,
            }));
        }

        const expense = await Expense.create({
            tripId,
            title,
            amount,
            category,
            paidBy: req.user.id,
            splitType,
            splits: finalSplits,
            currency,
            date,
            notes,
            receipt: req.file?.path || null,
        });

        const populated = await expense.populate([
            { path: "paidBy", select: "name avatar" },
            { path: "splits.user", select: "name avatar" },
        ]);

        // Notify members
        const otherMembers = trip.members
            .filter((m) => m.user.toString() !== req.user.id)
            .map((m) => m.user);

        for (const memberId of otherMembers) {
            await createNotification({
                recipient: memberId,
                sender: req.user.id,
                type: "NEW_EXPENSE",
                message: `${req.user.name} added expense: ${title} (₹${amount})`,
                tripId,
            });
        }

        // Emit socket event
        try {
            getIO().to(tripId).emit("expense_added", populated);
        } catch {}

        res.status(201).json({ success: true, expense: populated });
    } catch (err) {
        next(err);
    }
};

// @GET /api/expenses/:tripId - Get trip expenses
export const getTripExpenses = async (req, res, next) => {
    try {
        const expenses = await Expense.find({ tripId: req.params.tripId })
            .populate("paidBy", "name avatar")
            .populate("splits.user", "name avatar")
            .sort({ date: -1 });

        res.json({ success: true, expenses });
    } catch (err) {
        next(err);
    }
};

// @GET /api/expenses/:tripId/balances - Get who owes whom
export const getTripBalances = async (req, res, next) => {
    try {
        const expenses = await Expense.find({ tripId: req.params.tripId })
            .populate("paidBy", "name avatar")
            .populate("splits.user", "name avatar");

        const balances = calculateBalances(expenses);

        res.json({ success: true, balances });
    } catch (err) {
        next(err);
    }
};

// @DELETE /api/expenses/:id - Delete expense
export const deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense)
            return res
                .status(404)
                .json({ success: false, message: "Expense not found" });

        if (expense.paidBy.toString() !== req.user.id) {
            return res
                .status(403)
                .json({
                    success: false,
                    message: "Only expense creator can delete",
                });
        }

        await expense.deleteOne();
        res.json({ success: true, message: "Expense deleted" });
    } catch (err) {
        next(err);
    }
};

// @POST /api/expenses/settle - Create settlement
export const createSettlement = async (req, res, next) => {
    try {
        const { tripId, to, amount, method, note } = req.body;

        const settlement = await Settlement.create({
            tripId,
            from: req.user.id,
            to,
            amount,
            method,
            note,
        });

        await createNotification({
            recipient: to,
            sender: req.user.id,
            type: "SETTLEMENT_REQUEST",
            message: `${req.user.name} sent you a settlement of ₹${amount}`,
            tripId,
        });

        const populated = await settlement.populate([
            { path: "from", select: "name avatar" },
            { path: "to", select: "name avatar" },
        ]);

        res.status(201).json({ success: true, settlement: populated });
    } catch (err) {
        next(err);
    }
};

// @GET /api/expenses/:tripId/settlements - Get settlements
export const getTripSettlements = async (req, res, next) => {
    try {
        const settlements = await Settlement.find({ tripId: req.params.tripId })
            .populate("from", "name avatar")
            .populate("to", "name avatar")
            .sort({ createdAt: -1 });

        res.json({ success: true, settlements });
    } catch (err) {
        next(err);
    }
};
