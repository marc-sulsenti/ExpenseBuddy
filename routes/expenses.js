const express = require('express');
const router = express.Router();
const expenseStore = require('../data/expenseStore');
const categoryStore = require('../data/categoryStore');

// Helper function to format date for input fields
function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// Helper function to filter expenses
function filterExpenses(expenses, filters) {
  let filtered = [...expenses];

  // Filter by category
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(exp => exp.category === filters.category);
  }

  // Filter by date range (validate startDate <= endDate)
  if (filters.startDate && filters.endDate) {
    if (filters.startDate > filters.endDate) {
      // Swap if startDate > endDate
      [filters.startDate, filters.endDate] = [filters.endDate, filters.startDate];
    }
  }
  
  if (filters.startDate) {
    filtered = filtered.filter(exp => exp.date >= filters.startDate);
  }
  if (filters.endDate) {
    filtered = filtered.filter(exp => exp.date <= filters.endDate);
  }

  // Filter by search text
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(exp => 
      exp.description.toLowerCase().includes(searchLower) ||
      exp.category.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder || 'desc';
  
  filtered.sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'amount') {
      return sortOrder === 'asc' 
        ? a.amount - b.amount
        : b.amount - a.amount;
    }
    return 0;
  });

  return filtered;
}

// GET /expenses - List all expenses with filters
router.get('/', (req, res) => {
  const expenses = expenseStore.getAll();
  const categories = categoryStore.getActive();
  
  const filters = {
    category: req.query.category || 'all',
    startDate: req.query.startDate || '',
    endDate: req.query.endDate || '',
    search: req.query.search || '',
    sortBy: req.query.sortBy || 'date',
    sortOrder: req.query.sortOrder || 'desc'
  };

  // Set default date range to last 3 months if not specified
  if (!filters.startDate && !filters.endDate) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    filters.startDate = threeMonthsAgo.toISOString().split('T')[0];
  }

  const filteredExpenses = filterExpenses(expenses, filters).map(exp => ({
    ...exp,
    amount: exp.amount.toFixed(2) // Format for display
  }));

  res.render('expenses', {
    title: 'Expenses',
    expenses: filteredExpenses,
    categories,
    filters,
    formatDateForInput
  });
});

// POST /expenses/create - Create a new expense
router.post('/create', (req, res) => {
  const { date, amount, category, paymentMethod, description } = req.body;
  
  const errors = [];
  
  if (!date) {
    errors.push('Date is required');
  } else {
    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      errors.push('Invalid date format');
    }
  }
  
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    errors.push('Valid amount is required');
  }
  
  if (!category) {
    errors.push('Category is required');
  } else {
    // Validate category exists and is active
    const categories = categoryStore.getActive();
    const categoryExists = categories.some(cat => cat.name === category);
    if (!categoryExists) {
      errors.push('Selected category does not exist or is inactive');
    }
  }
  
  if (!paymentMethod) {
    errors.push('Payment method is required');
  }

  if (errors.length > 0) {
    const expenses = expenseStore.getAll();
    const categories = categoryStore.getActive();
    return res.render('expenses', {
      title: 'Expenses',
      expenses,
      categories,
      errors,
      formData: req.body
    });
  }

  expenseStore.add({
    date,
    amount: parseFloat(amount),
    category,
    paymentMethod,
    description: description || ''
  });

  res.redirect('/expenses?success=Expense added successfully');
});

// GET /expenses/:id/edit - Show edit form
router.get('/:id/edit', (req, res) => {
  const expense = expenseStore.getById(req.params.id);
  if (!expense) {
    return res.redirect('/expenses?error=Expense not found');
  }

  const categories = categoryStore.getActive();
  res.render('expense-edit', {
    title: 'Edit Expense',
    expense,
    categories,
    formatDateForInput
  });
});

// POST /expenses/:id/edit - Update expense
router.post('/:id/edit', (req, res) => {
  const { date, amount, category, paymentMethod, description } = req.body;
  
  const errors = [];
  
  if (!date) {
    errors.push('Date is required');
  } else {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      errors.push('Invalid date format');
    }
  }
  
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    errors.push('Valid amount is required');
  }
  
  if (!category) {
    errors.push('Category is required');
  } else {
    const categories = categoryStore.getActive();
    const categoryExists = categories.some(cat => cat.name === category);
    if (!categoryExists) {
      errors.push('Selected category does not exist or is inactive');
    }
  }
  
  if (!paymentMethod) {
    errors.push('Payment method is required');
  }

  if (errors.length > 0) {
    const expense = expenseStore.getById(req.params.id);
    const categories = categoryStore.getActive();
    return res.render('expense-edit', {
      title: 'Edit Expense',
      expense: { ...expense, ...req.body },
      categories,
      errors,
      formatDateForInput
    });
  }

  const updated = expenseStore.update(req.params.id, {
    date,
    amount: parseFloat(amount),
    category,
    paymentMethod,
    description: description || ''
  });

  if (!updated) {
    return res.redirect('/expenses?error=Expense not found');
  }

  res.redirect('/expenses?success=Expense updated successfully');
});

// POST /expenses/:id/delete - Delete expense
router.post('/:id/delete', (req, res) => {
  const deleted = expenseStore.remove(req.params.id);
  if (!deleted) {
    return res.redirect('/expenses?error=Expense not found');
  }
  res.redirect('/expenses?success=Expense deleted successfully');
});

module.exports = router;

