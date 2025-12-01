const express = require('express');
const router = express.Router();
const expenseStore = require('../data/expenseStore');
const categoryStore = require('../data/categoryStore');
const recurringStore = require('../data/recurringStore');

// Helper: get (year, month) offset months prior to given year/month
function getRelativeMonth(year, month, offset) {
  const date = new Date(year, month + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

// Automatically create expenses from recurring templates for this month
function generateRecurringExpenses() {
  const recurring = recurringStore.getAll().filter(rec => rec.active);
  if (recurring.length === 0) return;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  recurring.forEach(rec => {
    // Figure out the intended recurring date for this month
    let expenseDate = new Date(currentYear, currentMonth, rec.dayOfMonth);
    if (expenseDate.getMonth() !== currentMonth) {
      // If that day doesn't exist (e.g., Feb 30), use the last day of the month
      expenseDate = new Date(currentYear, currentMonth + 1, 0);
    }
    const dateString = expenseDate.toISOString().split('T')[0];

    // See if we already have a matching expense (date, amount, cat, desc)
    const exists = expenseStore.getAll().some(exp =>
      exp.amount === rec.amount &&
      exp.category === rec.category &&
      exp.description === rec.description &&
      exp.date.startsWith(dateString)
    );
    if (!exists) {
      expenseStore.add({
        date: dateString,
        amount: rec.amount,
        category: rec.category,
        paymentMethod: rec.paymentMethod,
        description: rec.description
      });
    }
  });
}

// Get all expenses for a specific month
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
  // Auto-generate recurring expenses when dashboard loads
  generateRecurringExpenses();

  const expenses = expenseStore.getAll();
  const categories = categoryStore.getAll();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Calculate last month (wrap year)
  const { year: lastMonthYear, month: lastMonth } = getRelativeMonth(currentYear, currentMonth, -1);

  // Current month expenses
  const currentMonthExpenses = getExpensesForMonth(expenses, currentYear, currentMonth);
  const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  // Last month expenses
  const lastMonthExpenses = getExpensesForMonth(expenses, lastMonthYear, lastMonth);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Spending by category this month
  const spendingByCategory = {};
  currentMonthExpenses.forEach(exp => {
    if (!spendingByCategory[exp.category]) spendingByCategory[exp.category] = 0;
    spendingByCategory[exp.category] += exp.amount;
  });

  // Monthly trend for last 6 months (including current)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const { year: trendYear, month: trendMonth } = getRelativeMonth(currentYear, currentMonth, -i);
    const trendExpenses = getExpensesForMonth(expenses, trendYear, trendMonth);
    const trendTotal = trendExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    monthlyTrend.push({
      month: getMonthName(trendMonth),
      year: trendYear,
      total: trendTotal
    });
  }
  const maxTrend = monthlyTrend.length > 0 ? Math.max(...monthlyTrend.map(t => t.total)) : 0;

  // Budget status (filter out inactive categories if any exist)
  const budgetStatus = categories
    .filter(cat => cat.active !== false)
    .map(cat => {
      const categorySpending = spendingByCategory[cat.name] || 0;
      const budget = cat.budget !== null && cat.budget !== undefined ? cat.budget : null;
      // Calculate remaining only if budget is set (not null/undefined)
      const remaining = budget !== null ? budget - categorySpending : null;
      // Over budget if spent exceeds budget (and budget is set and > 0)
      const isOverBudget = budget !== null && budget > 0 && categorySpending > budget;
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
