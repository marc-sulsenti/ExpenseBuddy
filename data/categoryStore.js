const fs = require('fs');
const path = require('path');

const CATEGORIES_FILE = path.join(__dirname, 'categories.json');

// Default categories - exported for use in reset functionality
const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food', budget: 0, active: true },
  { id: 'transport', name: 'Transport', budget: 0, active: true },
  { id: 'rent', name: 'Rent', budget: 0, active: true },
  { id: 'utilities', name: 'Utilities', budget: 0, active: true },
  { id: 'entertainment', name: 'Entertainment', budget: 0, active: true },
  { id: 'other', name: 'Other', budget: 0, active: true }
];

/**
 * Load categories from JSON file
 * @returns {Array} Array of category objects
 */
function loadCategories() {
  try {
    if (!fs.existsSync(CATEGORIES_FILE)) {
      // Initialize with default categories only if file doesn't exist (first run)
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
    if (!data || data.trim() === '') {
      // File exists but is empty - return empty array (user may have intentionally cleared it)
      return [];
    }
    const categories = JSON.parse(data);
    // Return whatever is in the file, even if empty (user may have deleted all categories)
    if (!Array.isArray(categories)) {
      // Invalid format - return empty array instead of defaults
      return [];
    }
    // Filter out inactive categories (legacy support for old soft-delete)
    return categories.filter(cat => cat.active !== false);
  } catch (error) {
    console.error('Error loading categories:', error);
    // On error, return empty array instead of defaults
    return [];
  }
}

/**
 * Save categories to JSON file
 * @param {Array} categories - Array of category objects
 */
function saveCategories(categories) {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving categories:', error);
    throw error;
  }
}

/**
 * Get all categories
 * @returns {Array} Array of all categories
 */
function getAll() {
  const categories = loadCategories();
  // Clean up: remove any inactive categories from the file
  const activeCategories = categories.filter(cat => cat.active !== false);
  if (activeCategories.length !== categories.length) {
    // Some categories were filtered out, save the cleaned list
    saveCategories(activeCategories);
  }
  return activeCategories;
}

/**
 * Get active categories only
 * @returns {Array} Array of active categories
 */
function getActive() {
  return loadCategories().filter(cat => cat.active);
}

/**
 * Get category by id
 * @param {string} id - Category id
 * @returns {Object|null} Category or null if not found
 */
function getById(id) {
  const categories = loadCategories();
  return categories.find(cat => cat.id === id) || null;
}

/**
 * Add a new category
 * @param {Object} category - Category object with name, budget
 * @returns {Object} The created category with id
 */
function add(category) {
  const categories = loadCategories();
  
  // Check if category name already exists
  const nameExists = categories.some(cat => 
    cat.name.toLowerCase() === category.name.toLowerCase().trim()
  );
  if (nameExists) {
    throw new Error('Category with this name already exists');
  }
  
  // Generate unique ID
  let baseId = category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  let id = baseId;
  let counter = 1;
  while (categories.some(cat => cat.id === id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }
  
  const newCategory = {
    id: id,
    name: category.name.trim(),
    budget: parseFloat(category.budget || 0),
    active: true
  };
  categories.push(newCategory);
  saveCategories(categories);
  return newCategory;
}

/**
 * Update a category by id
 * @param {string} id - Category id
 * @param {Object} updatedFields - Fields to update
 * @returns {Object|null} Updated category or null if not found
 */
function update(id, updatedFields) {
  const categories = loadCategories();
  const index = categories.findIndex(cat => cat.id === id);
  if (index === -1) {
    return null;
  }
  
  if (updatedFields.budget !== undefined) {
    updatedFields.budget = parseFloat(updatedFields.budget);
  }
  
  categories[index] = { ...categories[index], ...updatedFields };
  saveCategories(categories);
  return categories[index];
}

/**
 * Reinitialize default categories (used after reset)
 * @returns {Array} Array of default categories
 */
function reinitializeDefaults() {
  saveCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

/**
 * Remove a category by id (permanent delete)
 * @param {string} id - Category id
 * @returns {boolean} True if removed, false if not found
 */
function remove(id) {
  // Load all categories including inactive ones for deletion
  let categories;
  try {
    if (!fs.existsSync(CATEGORIES_FILE)) {
      return false;
    }
    const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
    if (!data || data.trim() === '' || data.trim() === '[]') {
      return false;
    }
    categories = JSON.parse(data);
  } catch (error) {
    console.error('Error loading categories for deletion:', error);
    return false;
  }
  
  const categoryToDelete = categories.find(cat => cat.id === id);
  if (!categoryToDelete) {
    return false;
  }
  
  // Don't allow deletion of default categories
  const defaultIds = DEFAULT_CATEGORIES.map(cat => cat.id);
  if (defaultIds.includes(id)) {
    throw new Error('Cannot delete default categories');
  }
  
  // Permanently remove the category
  const filtered = categories.filter(cat => cat.id !== id);
  saveCategories(filtered);
  return true;
}

module.exports = {
  getAll,
  getActive,
  getById,
  add,
  update,
  remove,
  reinitializeDefaults,
  DEFAULT_CATEGORIES
};

