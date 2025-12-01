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

// Helper function to parse CSV line, handling quoted fields with commas
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote (double quote)
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator (comma outside quotes)
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  values.push(current.trim());
  
  return values;
}

// POST /api/import/csv - Import expenses from CSV
router.post('/import/csv', (req, res) => {
  try {
    if (!req.body.csvContent) {
      return res.redirect('/settings?error=CSV content is required');
    }
    
    const lines = req.body.csvContent.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      return res.redirect('/settings?error=CSV content is empty');
    }
    
    let imported = 0;
    let errors = [];
    
    // Skip header row if present
    const startIndex = lines[0].toLowerCase().includes('date') && lines[0].toLowerCase().includes('amount') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Parse CSV line handling quoted fields
        const values = parseCSVLine(line);
        
        if (values.length < 4) {
          errors.push(`Row ${i + 1}: Insufficient columns (expected at least 4: Date, Amount, Category, Payment Method)`);
          continue;
        }
        
        const date = values[0].replace(/^"|"$/g, '').trim();
        const amount = parseFloat(values[1].replace(/^"|"$/g, '').trim());
        const category = values[2].replace(/^"|"$/g, '').trim();
        const paymentMethod = values[3].replace(/^"|"$/g, '').trim();
        const description = (values[4] || '').replace(/^"|"$/g, '').trim();
        
        // Validate required fields
        if (!date || isNaN(new Date(date).getTime())) {
          errors.push(`Row ${i + 1}: Invalid date "${date}"`);
          continue;
        }
        
        if (isNaN(amount) || amount <= 0) {
          errors.push(`Row ${i + 1}: Invalid amount "${values[1]}"`);
          continue;
        }
        
        if (!category || category === '') {
          errors.push(`Row ${i + 1}: Category is required`);
          continue;
        }
        
        if (!paymentMethod || paymentMethod === '') {
          errors.push(`Row ${i + 1}: Payment method is required`);
          continue;
        }
        
        // Map "Other" to "Misc" for backward compatibility
        const finalCategory = category === 'Other' ? 'Misc' : category;
        
        // Validate category exists
        const allCategories = categoryStore.getAll();
        if (!allCategories.some(cat => cat.name === finalCategory)) {
          errors.push(`Row ${i + 1}: Category "${finalCategory}" does not exist. Available categories: ${allCategories.map(c => c.name).join(', ')}`);
          continue;
        }
        
        expenseStore.add({
          date,
          amount,
          category: finalCategory,
          paymentMethod,
          description
        });
        imported++;
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

