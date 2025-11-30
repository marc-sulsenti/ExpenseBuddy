const express = require('express');
const router = express.Router();
const expenseStore = require('../data/expenseStore');
const categoryStore = require('../data/categoryStore');

// Get expenses from the current month
function getCurrentMonthExpenses(expenses) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  return expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
  });
}

// GET /budgets - Show budgets page
router.get('/', (req, res) => {
  const categories = categoryStore.getAll();
  const expenses = getCurrentMonthExpenses(expenseStore.getAll());

  // Add up how much was spent in each category
  const spendingByCategory = {};
  expenses.forEach(exp => {
    if (!spendingByCategory[exp.category]) {
      spendingByCategory[exp.category] = 0;
    }
    spendingByCategory[exp.category] += exp.amount;
  });

  // Figure out budget status for each category
  const budgetStatus = categories.map(cat => {
    const spent = spendingByCategory[cat.name] || 0;
    const budget = cat.budget !== null && cat.budget !== undefined ? cat.budget : null;
    // Only calculate remaining if they actually set a budget
    const remaining = budget !== null ? budget - spent : null;
    // They're over budget if they spent more than the budget (and budget isn't zero)
    const isOverBudget = budget !== null && budget > 0 && spent > budget;

    return {
      ...cat,
      spent,
      budget,
      remaining,
      isOverBudget
    };
  });

  // Keep numbers as numbers for the form inputs
  const formattedBudgetStatus = budgetStatus.map(item => ({
    ...item,
    budget: item.budget,
    spent: item.spent,
    remaining: item.remaining
  }));

  res.render('budgets', {
    title: 'Budgets',
    budgetStatus: formattedBudgetStatus
  });
});

// POST /budgets/save - Save budget updates
router.post('/save', (req, res) => {
  const budgets = req.body.budgets || {};
  
  // Save the budget for each category
  Object.keys(budgets).forEach(categoryId => {
    const budgetValue = budgets[categoryId];
    // Empty field = unlimited, 0 = zero budget, anything else = that amount
    let budgetAmount;
    if (budgetValue === '' || budgetValue === undefined || budgetValue === null) {
      budgetAmount = null; // Unlimited
    } else {
      const parsed = parseFloat(budgetValue);
      // If they entered 0, keep it as 0 (explicit zero budget)
      // If it's not a number, default to unlimited
      budgetAmount = isNaN(parsed) ? null : parsed;
    }
    categoryStore.update(categoryId, { budget: budgetAmount });
  });

  res.redirect('/budgets?success=Budgets updated successfully');
});

module.exports = router;

