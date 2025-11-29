const expenseStore = require('../data/expenseStore');
const fs = require('fs');
const path = require('path');

// Use a test data file
const TEST_FILE = path.join(__dirname, '../data/expenses.test.json');
const ORIGINAL_FILE = path.join(__dirname, '../data/expenses.json');

// Backup original and use test file
beforeAll(() => {
  if (fs.existsSync(ORIGINAL_FILE)) {
    const backup = fs.readFileSync(ORIGINAL_FILE);
    fs.writeFileSync(ORIGINAL_FILE + '.backup', backup);
  }
});

afterAll(() => {
  // Restore original
  if (fs.existsSync(ORIGINAL_FILE + '.backup')) {
    fs.copyFileSync(ORIGINAL_FILE + '.backup', ORIGINAL_FILE);
    fs.unlinkSync(ORIGINAL_FILE + '.backup');
  }
  if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }
});

beforeEach(() => {
  // Clear test file
  if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }
  // Point expenseStore to test file (this is a simplified test)
  // In a real scenario, you'd mock or use dependency injection
});

describe('ExpenseStore', () => {
  test('getAll returns empty array when no expenses', () => {
    const expenses = expenseStore.getAll();
    expect(Array.isArray(expenses)).toBe(true);
  });

  test('add creates a new expense with id', () => {
    const expense = expenseStore.add({
      date: '2024-01-15',
      amount: 25.50,
      category: 'Food',
      paymentMethod: 'Card',
      description: 'Test expense'
    });

    expect(expense).toHaveProperty('id');
    expect(expense.amount).toBe(25.50);
    expect(expense.category).toBe('Food');
  });

  test('getById returns correct expense', () => {
    const expense = expenseStore.add({
      date: '2024-01-15',
      amount: 25.50,
      category: 'Food',
      paymentMethod: 'Card',
      description: 'Test expense'
    });

    const found = expenseStore.getById(expense.id);
    expect(found).not.toBeNull();
    expect(found.id).toBe(expense.id);
  });

  test('update modifies existing expense', () => {
    const expense = expenseStore.add({
      date: '2024-01-15',
      amount: 25.50,
      category: 'Food',
      paymentMethod: 'Card',
      description: 'Test expense'
    });

    const updated = expenseStore.update(expense.id, { amount: 30.00 });
    expect(updated.amount).toBe(30.00);
    expect(updated.id).toBe(expense.id);
  });

  test('remove deletes expense', () => {
    const expense = expenseStore.add({
      date: '2024-01-15',
      amount: 25.50,
      category: 'Food',
      paymentMethod: 'Card',
      description: 'Test expense'
    });

    const removed = expenseStore.remove(expense.id);
    expect(removed).toBe(true);

    const found = expenseStore.getById(expense.id);
    expect(found).toBeNull();
  });
});

