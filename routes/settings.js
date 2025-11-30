const express = require('express');
const router = express.Router();
const categoryStore = require('../data/categoryStore');
const recurringStore = require('../data/recurringStore');
const expenseStore = require('../data/expenseStore');

// GET /settings - Show settings page
router.get('/', (req, res) => {
  const categories = categoryStore.getAll();
  const recurring = recurringStore.getAll().map(rec => ({
    ...rec,
    amount: rec.amount // Keep as number for display formatting in template
  }));
  
  res.render('settings', {
    title: 'Settings',
    categories,
    recurring
  });
});

// POST /settings/categories/add - Add new category
router.post('/categories/add', (req, res) => {
  const { name, budget } = req.body;
  
  if (!name || name.trim() === '') {
    return res.redirect('/settings?error=Category name is required');
  }

  try {
    // Category store handles budget null/0 logic
    categoryStore.add({ name: name.trim(), budget: budget });
    res.redirect('/settings?success=Category added successfully');
  } catch (error) {
    res.redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }
});

// POST /settings/categories/:id/update - Update category
router.post('/categories/:id/update', (req, res) => {
  const { name, budget } = req.body;
  
  if (!name || name.trim() === '') {
    return res.redirect('/settings?error=Category name is required');
  }

  // Category store handles budget null/0 logic
  categoryStore.update(req.params.id, {
    name: name.trim(),
    budget: budget
  });
  
  res.redirect('/settings?success=Category updated successfully');
});

// POST /settings/categories/:id/delete - Delete category
router.post('/categories/:id/delete', (req, res) => {
  const categoryId = req.params.id;
  const category = categoryStore.getById(categoryId);
  
  if (!category) {
    return res.redirect('/settings?error=Category not found');
  }
  
  // Check if there are expenses using this category
  const expenses = expenseStore.getAll();
  const expensesUsingCategory = expenses.filter(exp => exp.category === category.name);
  
  if (expensesUsingCategory.length > 0) {
    return res.redirect(`/settings?error=Cannot delete category "${category.name}" because ${expensesUsingCategory.length} expense(s) are using it. Please reassign or delete those expenses first.`);
  }
  
  try {
    const deleted = categoryStore.remove(categoryId);
    if (!deleted) {
      return res.redirect('/settings?error=Failed to delete category');
    }
    res.redirect('/settings?success=Category deleted successfully');
  } catch (error) {
    res.redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }
});

// POST /settings/recurring/add - Add recurring expense
router.post('/recurring/add', (req, res) => {
  const { amount, category, paymentMethod, description, dayOfMonth } = req.body;
  
  const errors = [];
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    errors.push('Valid amount is required');
  }
  if (!category) errors.push('Category is required');
  if (!paymentMethod) errors.push('Payment method is required');
  if (!dayOfMonth || isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    errors.push('Valid day of month (1-31) is required');
  }

  if (errors.length > 0) {
    return res.redirect(`/settings?error=${encodeURIComponent(errors.join(', '))}`);
  }

  recurringStore.add({
    amount: parseFloat(amount),
    category,
    paymentMethod,
    description: description || '',
    dayOfMonth: parseInt(dayOfMonth)
  });

  res.redirect('/settings?success=Recurring expense added successfully');
});

// POST /settings/recurring/:id/delete - Delete recurring expense
router.post('/recurring/:id/delete', (req, res) => {
  recurringStore.remove(req.params.id);
  res.redirect('/settings?success=Recurring expense deleted successfully');
});

// POST /settings/recurring/generate - Generate recurring expenses for current month
router.post('/recurring/generate', (req, res) => {
  const recurring = recurringStore.getAll().filter(rec => rec.active);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Get existing expenses for this month
  const existingExpenses = expenseStore.getAll().filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
  });

  let generatedCount = 0;
  
  recurring.forEach(rec => {
    // Check if this recurring expense already exists this month
    const alreadyExists = existingExpenses.some(exp => 
      exp.amount === rec.amount &&
      exp.category === rec.category &&
      exp.description === rec.description
    );

    if (!alreadyExists) {
      // Create date for this month with the specified day
      const expenseDate = new Date(currentYear, currentMonth, rec.dayOfMonth);
      // If day is beyond month end, use last day of current month
      if (expenseDate.getMonth() !== currentMonth) {
        // Get last day of current month
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
      
      generatedCount++;
    }
  });

  res.redirect(`/settings?success=${generatedCount} recurring expense(s) generated for this month`);
});

// POST /settings/reset - Reset all data
router.post('/reset', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Clear all data files
    const expensesFile = path.join(__dirname, '../data/expenses.json');
    const categoriesFile = path.join(__dirname, '../data/categories.json');
    const recurringFile = path.join(__dirname, '../data/recurring.json');
    
    // Wipe everything clean
    fs.writeFileSync(expensesFile, JSON.stringify([], null, 2), 'utf8');
    fs.writeFileSync(categoriesFile, JSON.stringify([], null, 2), 'utf8');
    fs.writeFileSync(recurringFile, JSON.stringify([], null, 2), 'utf8');
    
    res.redirect('/settings?success=All data has been reset. Expense Buddy is now fresh and ready to use.');
  } catch (error) {
    console.error('Error resetting data:', error);
    res.redirect(`/settings?error=${encodeURIComponent('Failed to reset data: ' + error.message)}`);
  }
});

module.exports = router;

