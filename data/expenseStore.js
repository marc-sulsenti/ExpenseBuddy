const fs = require('fs');
const path = require('path');

const EXPENSES_FILE = path.join(__dirname, 'expenses.json');

/**
 * Load expenses from JSON file
 * @returns {Array} Array of expense objects
 */
function loadExpenses() {
  try {
    if (!fs.existsSync(EXPENSES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(EXPENSES_FILE, 'utf8');
    if (!data || data.trim() === '') {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading expenses:', error);
    return [];
  }
}

/**
 * Save expenses to JSON file
 * @param {Array} expenses - Array of expense objects
 */
function saveExpenses(expenses) {
  try {
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify(expenses, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving expenses:', error);
    throw error;
  }
}

/**
 * Get all expenses
 * @returns {Array} Array of all expenses
 */
function getAll() {
  return loadExpenses();
}

/**
 * Add a new expense
 * @param {Object} expense - Expense object with date, amount, category, paymentMethod, description
 * @returns {Object} The created expense with id
 */
function add(expense) {
  const expenses = loadExpenses();
  const newExpense = {
    id: Date.now().toString(),
    date: new Date(expense.date + 'T12:00:00').toISOString(),
    amount: parseFloat(expense.amount),
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    description: expense.description || '',
    createdAt: new Date().toISOString()
  };
  expenses.push(newExpense);
  saveExpenses(expenses);
  return newExpense;
}

/**
 * Update an expense by id
 * @param {string} id - Expense id
 * @param {Object} updatedFields - Fields to update
 * @returns {Object|null} Updated expense or null if not found
 */
function update(id, updatedFields) {
  const expenses = loadExpenses();
  const index = expenses.findIndex(exp => exp.id === id);
  if (index === -1) {
    return null;
  }
  
  if (updatedFields.amount !== undefined) {
    updatedFields.amount = parseFloat(updatedFields.amount);
  }
  
  expenses[index] = { ...expenses[index], ...updatedFields };
  saveExpenses(expenses);
  return expenses[index];
}

/**
 * Remove an expense by id
 * @param {string} id - Expense id
 * @returns {boolean} True if removed, false if not found
 */
function remove(id) {
  const expenses = loadExpenses();
  const initialLength = expenses.length;
  const filtered = expenses.filter(exp => exp.id !== id);
  if (filtered.length === initialLength) {
    return false;
  }
  saveExpenses(filtered);
  return true;
}

/**
 * Get expense by id
 * @param {string} id - Expense id
 * @returns {Object|null} Expense or null if not found
 */
function getById(id) {
  const expenses = loadExpenses();
  return expenses.find(exp => exp.id === id) || null;
}

module.exports = {
  getAll,
  add,
  update,
  remove,
  getById
};
