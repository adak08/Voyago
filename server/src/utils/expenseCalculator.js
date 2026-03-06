/**
 * Calculates who owes whom using a greedy balance-settling algorithm.
 * Returns a simplified list of transactions.
 */
export const calculateBalances = (expenses) => {
    const balanceMap = {}; // userId -> net balance (positive = owed to you, negative = you owe)

    for (const expense of expenses) {
        const payerId =
            expense.paidBy._id?.toString() || expense.paidBy.toString();

        for (const split of expense.splits) {
            const userId = split.user._id?.toString() || split.user.toString();

            if (userId === payerId) continue; // payer doesn't owe themselves

            // payer is owed this amount
            balanceMap[payerId] = (balanceMap[payerId] || 0) + split.amount;
            // split person owes this amount
            balanceMap[userId] = (balanceMap[userId] || 0) - split.amount;
        }
    }

    // Separate creditors and debtors
    const creditors = []; // people who are owed money
    const debtors = []; // people who owe money

    for (const [userId, balance] of Object.entries(balanceMap)) {
        if (balance > 0.01) creditors.push({ userId, amount: balance });
        else if (balance < -0.01)
            debtors.push({ userId, amount: Math.abs(balance) });
    }

    const transactions = [];

    let i = 0,
        j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(debtor.amount, creditor.amount);

        transactions.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: parseFloat(amount.toFixed(2)),
        });

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return transactions;
};

// Get per-user spending summary
export const getSpendingSummary = (expenses, members) => {
    const summary = {};

    for (const member of members) {
        const id = member.user._id?.toString() || member.user.toString();
        summary[id] = { paid: 0, share: 0, net: 0, user: member.user };
    }

    for (const expense of expenses) {
        const payerId =
            expense.paidBy._id?.toString() || expense.paidBy.toString();
        if (summary[payerId]) summary[payerId].paid += expense.amount;

        for (const split of expense.splits) {
            const userId = split.user._id?.toString() || split.user.toString();
            if (summary[userId]) summary[userId].share += split.amount;
        }
    }

    for (const key of Object.keys(summary)) {
        summary[key].net = parseFloat(
            (summary[key].paid - summary[key].share).toFixed(2)
        );
    }

    return Object.values(summary);
};
