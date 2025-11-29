const express = require('express');
const router = express.Router();
const expenseStore = require('../data/expenseStore');
const categoryStore = require('../data/categoryStore');

// Helper function to get expenses for a specific month
function getExpensesForMonth(expenses, year, month) {
  return expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getFullYear() === year && expDate.getMonth() === month;
  });
}

// Helper function to get month name
function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
}

// GET / - Dashboard
router.get('/', (req, res) => {
  const expenses = expenseStore.getAll();
  const categories = categoryStore.getAll();
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Last month
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Current month expenses
  const currentMonthExpenses = getExpensesForMonth(expenses, currentYear, currentMonth);
  const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Last month expenses
  const lastMonthExpenses = getExpensesForMonth(expenses, lastMonthYear, lastMonth);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Spending by category for current month
  const spendingByCategory = {};
  currentMonthExpenses.forEach(exp => {
    if (!spendingByCategory[exp.category]) {
      spendingByCategory[exp.category] = 0;
    }
    spendingByCategory[exp.category] += exp.amount;
  });

  // Monthly trend for last 6 months
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const trendDate = new Date(currentYear, currentMonth - i, 1);
    const trendYear = trendDate.getFullYear();
    const trendMonth = trendDate.getMonth();
    const trendExpenses = getExpensesForMonth(expenses, trendYear, trendMonth);
    const trendTotal = trendExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    monthlyTrend.push({
      month: getMonthName(trendMonth),
      year: trendYear,
      total: trendTotal
    });
  }

  // Calculate max trend for chart scaling
  const maxTrend = monthlyTrend.length > 0 
    ? Math.max(...monthlyTrend.map(t => t.total))
    : 0;

  // Budget status
  const budgetStatus = categories
    .filter(cat => cat.active)
    .map(cat => {
      const categorySpending = spendingByCategory[cat.name] || 0;
      const budget = cat.budget || 0;
      const remaining = budget - categorySpending;
      // Over budget if spent exceeds budget (and budget is set)
      const isOverBudget = budget > 0 && categorySpending > budget;

      return {
        category: cat.name,
        budget,
        spent: categorySpending,
        remaining,
        isOverBudget
      };
    });

  const change = currentMonthTotal - lastMonthTotal;

  res.render('dashboard', {
    title: 'Dashboard',
    currentMonthTotal,
    lastMonthTotal,
    change,
    currentMonthName: getMonthName(currentMonth),
    lastMonthName: getMonthName(lastMonth),
    spendingByCategory,
    monthlyTrend,
    maxTrend,
    budgetStatus
  });
});

module.exports = router;

