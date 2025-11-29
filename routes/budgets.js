const express = require('express');
const router = express.Router();
const expenseStore = require('../data/expenseStore');
const categoryStore = require('../data/categoryStore');

// Helper function to get expenses for current month
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

  // Calculate spending per category
  const spendingByCategory = {};
  expenses.forEach(exp => {
    if (!spendingByCategory[exp.category]) {
      spendingByCategory[exp.category] = 0;
    }
    spendingByCategory[exp.category] += exp.amount;
  });

  // Build budget status for each category
  const budgetStatus = categories.map(cat => {
    const spent = spendingByCategory[cat.name] || 0;
    const budget = cat.budget || 0;
    const remaining = budget - spent;
    // Over budget if spent exceeds budget (and budget is set)
    const isOverBudget = budget > 0 && spent > budget;

    return {
      ...cat,
      spent,
      remaining,
      isOverBudget
    };
  });

  // Format currency values for display (keep raw numbers for calculations)
  const formattedBudgetStatus = budgetStatus.map(item => ({
    ...item,
    budget: item.budget, // Keep as number for input
    spent: item.spent, // Keep as number for calculations
    remaining: item.remaining // Keep as number for calculations
  }));

  res.render('budgets', {
    title: 'Budgets',
    budgetStatus: formattedBudgetStatus
  });
});

// POST /budgets/save - Save budget updates
router.post('/save', (req, res) => {
  const budgets = req.body.budgets || {};
  
  // Update each category's budget
  Object.keys(budgets).forEach(categoryId => {
    const budgetAmount = parseFloat(budgets[categoryId]) || 0;
    categoryStore.update(categoryId, { budget: budgetAmount });
  });

  res.redirect('/budgets?success=Budgets updated successfully');
});

module.exports = router;

