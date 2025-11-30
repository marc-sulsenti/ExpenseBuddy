const express = require('express');
const router = express.Router();
const expenseStore = require('../data/expenseStore');
const categoryStore = require('../data/categoryStore');
const recurringStore = require('../data/recurringStore');

// Automatically create expenses from recurring templates for this month
function generateRecurringExpenses() {
  const recurring = recurringStore.getAll().filter(rec => rec.active);
  if (recurring.length === 0) return;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // See what expenses we already have this month
  const existingExpenses = expenseStore.getAll().filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
  });
  
  recurring.forEach(rec => {
    // Don't create duplicates if it already exists
    const alreadyExists = existingExpenses.some(exp => 
      exp.amount === rec.amount &&
      exp.category === rec.category &&
      exp.description === rec.description
    );

    if (!alreadyExists) {
      // Create the expense on the specified day of the month
      const expenseDate = new Date(currentYear, currentMonth, rec.dayOfMonth);
      // If the day doesn't exist (like Feb 30), use the last day of the month
      if (expenseDate.getMonth() !== currentMonth) {
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        expenseDate.setDate(lastDay.getDate());
      }

      expenseStore.add({
        date: expenseDate.toISOString().split('T')[0],
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

