const expenseStore = require('../data/expenseStore');
const categoryStore = require('../data/categoryStore');
const recurringStore = require('../data/recurringStore');

// Clear existing data
console.log('Seeding Expense Buddy with sample data...');

// Set up categories with budgets
const categories = [
  { id: 'food', name: 'Food', budget: 300, active: true },
  { id: 'transport', name: 'Transport', budget: 150, active: true },
  { id: 'rent', name: 'Rent', budget: 1200, active: true },
  { id: 'utilities', name: 'Utilities', budget: 100, active: true },
  { id: 'entertainment', name: 'Entertainment', budget: 200, active: true },
  { id: 'other', name: 'Other', budget: 100, active: true }
];

// Save categories
const fs = require('fs');
const path = require('path');
const categoriesFile = path.join(__dirname, '../data/categories.json');
fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2));
console.log('✓ Categories seeded');

// Generate sample expenses for the last 3 months
const now = new Date();
const expenses = [];

for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
  const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Food expenses
  for (let i = 0; i < 8; i++) {
    const day = Math.floor(Math.random() * 28) + 1;
    expenses.push({
      date: new Date(year, month, day).toISOString().split('T')[0],
      amount: parseFloat((Math.random() * 50 + 10).toFixed(2)),
      category: 'Food',
      paymentMethod: ['Cash', 'Card'][Math.floor(Math.random() * 2)],
      description: ['Groceries', 'Restaurant', 'Coffee', 'Lunch', 'Dinner'][Math.floor(Math.random() * 5)]
    });
  }
  
  // Transport expenses
  for (let i = 0; i < 10; i++) {
    const day = Math.floor(Math.random() * 28) + 1;
    expenses.push({
      date: new Date(year, month, day).toISOString().split('T')[0],
      amount: parseFloat((Math.random() * 30 + 5).toFixed(2)),
      category: 'Transport',
      paymentMethod: 'Card',
      description: 'Public transport'
    });
  }
  
  // Rent (once per month)
  expenses.push({
    date: new Date(year, month, 1).toISOString().split('T')[0],
    amount: 1200,
    category: 'Rent',
    paymentMethod: 'Card',
    description: 'Monthly rent'
  });
  
  // Utilities
  expenses.push({
    date: new Date(year, month, 5).toISOString().split('T')[0],
    amount: parseFloat((Math.random() * 40 + 60).toFixed(2)),
    category: 'Utilities',
    paymentMethod: 'Card',
    description: 'Electricity and water'
  });
  
  // Entertainment
  for (let i = 0; i < 3; i++) {
    const day = Math.floor(Math.random() * 28) + 1;
    expenses.push({
      date: new Date(year, month, day).toISOString().split('T')[0],
      amount: parseFloat((Math.random() * 50 + 20).toFixed(2)),
      category: 'Entertainment',
      paymentMethod: 'Card',
      description: ['Movie', 'Concert', 'Game', 'Event'][Math.floor(Math.random() * 4)]
    });
  }
}

// Add expenses
expenses.forEach(exp => {
  expenseStore.add(exp);
});
console.log(`✓ ${expenses.length} expenses seeded`);

// Add a recurring expense
recurringStore.add({
  amount: 1200,
  category: 'Rent',
  paymentMethod: 'Card',
  description: 'Monthly rent',
  dayOfMonth: 1
});

recurringStore.add({
  amount: 80,
  category: 'Utilities',
  paymentMethod: 'Card',
  description: 'Monthly utilities',
  dayOfMonth: 5
});

console.log('✓ Recurring expenses seeded');
console.log('\n✅ Seeding complete!');
console.log('You can now start the app with: npm start');

