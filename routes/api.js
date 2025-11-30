const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const expenseStore = require('../data/expenseStore');
const categoryStore = require('../data/categoryStore');

// GET /api/analytics/summary - Get analytics summary as JSON
router.get('/analytics/summary', (req, res) => {
  try {
    const expenses = expenseStore.getAll();
    const categories = categoryStore.getAll();
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Current month expenses
    const currentMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
    });
    const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Spending by category
    const spendingByCategory = {};
    currentMonthExpenses.forEach(exp => {
      if (!spendingByCategory[exp.category]) {
        spendingByCategory[exp.category] = 0;
      }
      spendingByCategory[exp.category] += exp.amount;
    });

    // Budget status
    const budgetStatus = categories
      .filter(cat => cat.active !== false)
      .map(cat => {
        const spent = spendingByCategory[cat.name] || 0;
        const budget = cat.budget !== null && cat.budget !== undefined ? cat.budget : null;
        const remaining = budget !== null ? budget - spent : null;
        return {
          category: cat.name,
          budget,
          spent,
          remaining,
          isOverBudget: budget !== null && budget > 0 && spent > budget
        };
      });

    res.json({
      success: true,
      data: {
        currentMonthTotal,
        spendingByCategory,
        budgetStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/export/csv - Export expenses to CSV
router.get('/export/csv', (req, res) => {
  try {
    const expenses = expenseStore.getAll();
    
    // CSV header
    const headers = ['Date', 'Amount', 'Category', 'Payment Method', 'Description'];
    let csv = headers.join(',') + '\n';
    
    // CSV rows
    expenses.forEach(exp => {
      const row = [
        exp.date,
        parseFloat(exp.amount).toFixed(2), // Format amount to 2 decimals
        exp.category,
        exp.paymentMethod,
        `"${(exp.description || '').replace(/"/g, '""')}"` // Escape quotes in description
      ];
      csv += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/import/csv - Import expenses from CSV
router.post('/import/csv', (req, res) => {
  // Note: For file upload, we'd typically use multer, but for simplicity,
  // we'll expect the CSV content in the request body or use a simple approach
  // For now, we'll provide a basic implementation that expects CSV text
  try {
    if (!req.body.csvContent) {
      return res.redirect('/settings?error=CSV content is required');
    }
    
    const lines = req.body.csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    let imported = 0;
    let errors = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Simple CSV parsing (doesn't handle quoted fields with commas perfectly, but works for basic cases)
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        if (values.length >= 4) {
          const date = values[0];
          const amount = parseFloat(values[1]);
          const category = values[2] || 'No Category';
          const paymentMethod = values[3];
          const description = values[4] || '';
          
          // Validate required fields
          if (!date || isNaN(new Date(date).getTime())) {
            errors.push(`Row ${i + 1}: Invalid date`);
            continue;
          }
          if (isNaN(amount) || amount <= 0) {
            errors.push(`Row ${i + 1}: Invalid amount`);
            continue;
          }
          if (!paymentMethod) {
            errors.push(`Row ${i + 1}: Payment method is required`);
            continue;
          }
          
          // Validate category if it's not "No Category"
          if (category !== 'No Category') {
            const allCategories = categoryStore.getAll();
            if (!allCategories.some(cat => cat.name === category)) {
              errors.push(`Row ${i + 1}: Category "${category}" does not exist`);
              continue;
            }
          }
          
          expenseStore.add({
            date,
            amount,
            category,
            paymentMethod,
            description
          });
          imported++;
        }
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }
    
    const message = `Imported ${imported} expense(s).${errors.length > 0 ? ' Errors: ' + errors.join('; ') : ''}`;
    res.redirect(`/settings?success=${encodeURIComponent(message)}`);
  } catch (error) {
    res.redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;

