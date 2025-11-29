const fs = require('fs');
const path = require('path');

const RECURRING_FILE = path.join(__dirname, 'recurring.json');

/**
 * Load recurring expense templates from JSON file
 * @returns {Array} Array of recurring expense objects
 */
function loadRecurring() {
  try {
    if (!fs.existsSync(RECURRING_FILE)) {
      return [];
    }
    const data = fs.readFileSync(RECURRING_FILE, 'utf8');
    if (!data || data.trim() === '') {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading recurring expenses:', error);
    return [];
  }
}

/**
 * Save recurring expenses to JSON file
 * @param {Array} recurring - Array of recurring expense objects
 */
function saveRecurring(recurring) {
  try {
    fs.writeFileSync(RECURRING_FILE, JSON.stringify(recurring, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving recurring expenses:', error);
    throw error;
  }
}

/**
 * Get all recurring expense templates
 * @returns {Array} Array of all recurring expenses
 */
function getAll() {
  return loadRecurring();
}

/**
 * Add a new recurring expense template
 * @param {Object} recurring - Recurring expense object
 * @returns {Object} The created recurring expense with id
 */
function add(recurring) {
  const recurringList = loadRecurring();
  const newRecurring = {
    id: Date.now().toString(),
    amount: parseFloat(recurring.amount),
    category: recurring.category,
    paymentMethod: recurring.paymentMethod,
    description: recurring.description || '',
    dayOfMonth: parseInt(recurring.dayOfMonth) || 1,
    active: true,
    createdAt: new Date().toISOString()
  };
  recurringList.push(newRecurring);
  saveRecurring(recurringList);
  return newRecurring;
}

/**
 * Update a recurring expense by id
 * @param {string} id - Recurring expense id
 * @param {Object} updatedFields - Fields to update
 * @returns {Object|null} Updated recurring expense or null if not found
 */
function update(id, updatedFields) {
  const recurringList = loadRecurring();
  const index = recurringList.findIndex(rec => rec.id === id);
  if (index === -1) {
    return null;
  }
  
  if (updatedFields.amount !== undefined) {
    updatedFields.amount = parseFloat(updatedFields.amount);
  }
  if (updatedFields.dayOfMonth !== undefined) {
    updatedFields.dayOfMonth = parseInt(updatedFields.dayOfMonth);
  }
  
  recurringList[index] = { ...recurringList[index], ...updatedFields };
  saveRecurring(recurringList);
  return recurringList[index];
}

/**
 * Remove a recurring expense by id
 * @param {string} id - Recurring expense id
 * @returns {boolean} True if removed, false if not found
 */
function remove(id) {
  const recurringList = loadRecurring();
  const initialLength = recurringList.length;
  const filtered = recurringList.filter(rec => rec.id !== id);
  if (filtered.length === initialLength) {
    return false;
  }
  saveRecurring(filtered);
  return true;
}

/**
 * Get recurring expense by id
 * @param {string} id - Recurring expense id
 * @returns {Object|null} Recurring expense or null if not found
 */
function getById(id) {
  const recurringList = loadRecurring();
  return recurringList.find(rec => rec.id === id) || null;
}

module.exports = {
  getAll,
  add,
  update,
  remove,
  getById
};

