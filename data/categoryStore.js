const fs = require('fs');
const path = require('path');

const CATEGORIES_FILE = path.join(__dirname, 'categories.json');

// Read categories from the JSON file
function loadCategories() {
  try {
    if (!fs.existsSync(CATEGORIES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
    if (!data || data.trim() === '' || data.trim() === '[]') {
      return [];
    }
    const categories = JSON.parse(data);
    if (!Array.isArray(categories)) {
      return [];
    }
    // Skip any categories marked as inactive (from old soft-delete system)
    return categories.filter(cat => cat.active !== false);
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

// Write categories to the JSON file
function saveCategories(categories) {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving categories:', error);
    throw error;
  }
}

// Get all active categories
function getAll() {
  const categories = loadCategories();
  // Remove any inactive ones and save the cleaned list
  const activeCategories = categories.filter(cat => cat.active !== false);
  if (activeCategories.length !== categories.length) {
    saveCategories(activeCategories);
  }
  return activeCategories;
}

// Get only the active categories
function getActive() {
  return loadCategories().filter(cat => cat.active);
}

// Find a category by its ID
function getById(id) {
  const categories = loadCategories();
  return categories.find(cat => cat.id === id) || null;
}

// Add a new category
function add(category) {
  const categories = loadCategories();
  
  // Make sure the name isn't already taken
  const nameExists = categories.some(cat => 
    cat.name.toLowerCase() === category.name.toLowerCase().trim()
  );
  if (nameExists) {
    throw new Error('Category with this name already exists');
  }
  
  // Create a URL-friendly ID from the name
  let baseId = category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  let id = baseId;
  let counter = 1;
  // If the ID already exists, add a number to make it unique
  while (categories.some(cat => cat.id === id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }
  
  // Empty budget means unlimited, otherwise use the number they provided
  const budgetValue = (!category.budget || category.budget === '0' || category.budget === 0) 
    ? null 
    : parseFloat(category.budget);
  
  const newCategory = {
    id: id,
    name: category.name.trim(),
    budget: budgetValue,
    active: true
  };
  categories.push(newCategory);
  saveCategories(categories);
  return newCategory;
}

// Update a category
function update(id, updatedFields) {
  const categories = loadCategories();
  const index = categories.findIndex(cat => cat.id === id);
  if (index === -1) {
    return null;
  }
  
  // Handle budget updates - empty means unlimited, 0 means zero budget
  if (updatedFields.budget !== undefined) {
    if (updatedFields.budget === null || updatedFields.budget === undefined || 
        updatedFields.budget === '' || updatedFields.budget === 'null') {
      updatedFields.budget = null;
    } else if (updatedFields.budget === 0 || updatedFields.budget === '0') {
      updatedFields.budget = 0; // They explicitly set it to zero
    } else {
      const parsed = parseFloat(updatedFields.budget);
      updatedFields.budget = isNaN(parsed) ? null : parsed;
    }
  }
  
  categories[index] = { ...categories[index], ...updatedFields };
  saveCategories(categories);
  return categories[index];
}

// Delete a category permanently
function remove(id) {
  // Load directly from file to catch inactive ones too
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
  
  // Remove it from the list and save
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
  remove
};

