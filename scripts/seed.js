const expenseStore = require('../data/expenseStore');
const categoryStore = require('../data/categoryStore');
const recurringStore = require('../data/recurringStore');

// Realistic categories with appropriate budgets
const sampleCategories = [
  { name: 'Groceries', budget: 400 },
  { name: 'Dining Out', budget: 150 },
  { name: 'Transportation', budget: 200 },
  { name: 'Entertainment', budget: 100 },
  { name: 'Shopping', budget: 300 },
  { name: 'Bills', budget: 800 },
  { name: 'Gas', budget: 120 },
  { name: 'Coffee', budget: 60 }
];

// Payment methods - some categories use certain methods more often
const paymentMethods = {
  'default': ['Card', 'Cash', 'Other'],
  'Bills': ['Card', 'Other'], // Bills usually paid by card/online
  'Gas': ['Card', 'Cash'],
  'Coffee': ['Card', 'Cash'],
  'Dining Out': ['Card', 'Cash']
};

// Realistic descriptions and amounts for each category
const categoryData = {
  'Groceries': {
    descriptions: ['Weekly groceries', 'Supermarket', 'Food shopping', 'Whole Foods', 'Trader Joe\'s', 'Costco'],
    amounts: { min: 40, max: 150 }, // Grocery trips are usually $40-150
    frequency: 8 // 8 grocery trips per 3 months
  },
  'Dining Out': {
    descriptions: ['Restaurant dinner', 'Fast food', 'Lunch', 'Dinner out', 'Takeout', 'Pizza'],
    amounts: { min: 12, max: 75 }, // Meals out are $12-75
    frequency: 15 // 15 meals out per 3 months
  },
  'Transportation': {
    descriptions: ['Uber ride', 'Bus fare', 'Train ticket', 'Parking', 'Taxi', 'Metro card'],
    amounts: { min: 5, max: 45 }, // Transportation is $5-45
    frequency: 20 // 20 trips per 3 months
  },
  'Entertainment': {
    descriptions: ['Movie tickets', 'Concert', 'Netflix', 'Spotify', 'Video games', 'Theater'],
    amounts: { min: 10, max: 120 }, // Entertainment varies
    frequency: 10 // 10 entertainment expenses per 3 months
  },
  'Shopping': {
    descriptions: ['Clothing', 'Electronics', 'Amazon', 'Target', 'Online purchase', 'Department store'],
    amounts: { min: 25, max: 200 }, // Shopping varies widely
    frequency: 12 // 12 shopping trips per 3 months
  },
  'Bills': {
    descriptions: ['Electric bill', 'Internet', 'Phone bill', 'Water bill', 'Rent', 'Insurance'],
    amounts: { min: 50, max: 200 }, // Bills are usually $50-200
    frequency: 9 // 9 bills per 3 months (3 per month)
  },
  'Gas': {
    descriptions: ['Gas station', 'Fuel', 'Gas fill-up', 'Shell', 'Exxon'],
    amounts: { min: 30, max: 60 }, // Gas fill-ups are $30-60
    frequency: 12 // 12 fill-ups per 3 months
  },
  'Coffee': {
    descriptions: ['Coffee shop', 'Starbucks', 'Morning coffee', 'Cafe', 'Dunkin'],
    amounts: { min: 4, max: 8 }, // Coffee is $4-8
    frequency: 20 // 20 coffee purchases per 3 months
  }
};

// Generate random date within a range
function randomDate(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

// Get random item from array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate random amount within a range
function randomAmount(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Get payment method for a category (some categories prefer certain methods)
function getPaymentMethod(category) {
  const methods = paymentMethods[category] || paymentMethods['default'];
  return randomItem(methods);
}

function isValidMonthDay(year, month, day) {
  // 1-indexed day (1=first)
  const date = new Date(year, month, day);
  return date.getMonth() === month;
}

function addExpenseOnDate(options) {
  try {
    expenseStore.add({
      date: options.date,
      amount: options.amount,
      category: options.category,
      paymentMethod: options.paymentMethod,
      description: options.description
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Main seed function
function seed() {
  console.log('Starting to seed data...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  const fs = require('fs');
  const path = require('path');
  
  const expensesFile = path.join(__dirname, '../data/expenses.json');
  const categoriesFile = path.join(__dirname, '../data/categories.json');
  const recurringFile = path.join(__dirname, '../data/recurring.json');
  
  fs.writeFileSync(expensesFile, JSON.stringify([], null, 2), 'utf8');
  fs.writeFileSync(categoriesFile, JSON.stringify([], null, 2), 'utf8');
  fs.writeFileSync(recurringFile, JSON.stringify([], null, 2), 'utf8');
  console.log('Existing data cleared.\n');

  console.log('Creating categories...');
  const createdCategories = [];
  sampleCategories.forEach(cat => {
    try {
      const created = categoryStore.add(cat);
      createdCategories.push(created);
      console.log(`  ✓ Created category: ${created.name}`);
    } catch (error) {
      console.log(`  ✗ Failed to create category ${cat.name}: ${error.message}`);
    }
  });
  console.log(`Created ${createdCategories.length} categories.\n`);

  console.log('Generating expenses...');
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  let expenseCount = 0;
  const categoryNames = createdCategories.map(c => c.name);

  categoryNames.forEach(categoryName => {
    const categoryInfo = categoryData[categoryName];
    if (!categoryInfo) return;
    const numExpenses = categoryInfo.frequency;
    const today = new Date();
    const dayOfMonth = today.getDate();
    const months = [];
    for(let back = 0; back < 3; back++) {
      const d = new Date(today.getFullYear(), today.getMonth() - back, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), back });
    }

    months.forEach(({ year, month, back }) => {
      if(isValidMonthDay(year, month, dayOfMonth)) {
        const expenseDateString = new Date(year, month, dayOfMonth).toISOString().split('T')[0];
        const expense = {
          date: expenseDateString,
          amount: randomAmount(categoryInfo.amounts.min, categoryInfo.amounts.max),
          category: categoryName,
          paymentMethod: getPaymentMethod(categoryName),
          description: randomItem(categoryInfo.descriptions)
        };
        if (addExpenseOnDate(expense)) {
          expenseCount++;
        }
      }
    });

    const numSpecial = 3; // up to 1 per month
    const spreadCount = Math.max(numExpenses - numSpecial, 0);
    const dates = [];
    for (let i = 0; i < spreadCount; i++) {
      const monthOffset = Math.floor(i / (spreadCount / 3));
      const monthBase = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
      const nextMonth = new Date(monthBase); nextMonth.setMonth(nextMonth.getMonth() + 1);
      const date = randomDate(monthBase, nextMonth);
      // Don't use 'today'-style dates again (avoid duplicates)
      if (date.getDate() === dayOfMonth) continue;
      dates.push(date);
    }
    dates.sort((a, b) => a - b);
    dates.forEach(date => {
      const expense = {
        date: date.toISOString().split('T')[0],
        amount: randomAmount(categoryInfo.amounts.min, categoryInfo.amounts.max),
        category: categoryName,
        paymentMethod: getPaymentMethod(categoryName),
        description: randomItem(categoryInfo.descriptions)
      };
      if (addExpenseOnDate(expense)) {
        expenseCount++;
      }
    });
  });
  console.log(`Created ${expenseCount} expenses.\n`);

  // Create realistic recurring expenses
  console.log('Creating recurring expenses...');
  const recurringTemplates = [
    { amount: 1200, category: 'Bills', paymentMethod: 'Card', description: 'Rent', dayOfMonth: 1 },
    { amount: 85, category: 'Bills', paymentMethod: 'Card', description: 'Internet bill', dayOfMonth: 5 },
    { amount: 65, category: 'Bills', paymentMethod: 'Card', description: 'Phone bill', dayOfMonth: 10 },
    { amount: 120, category: 'Bills', paymentMethod: 'Card', description: 'Electric bill', dayOfMonth: 15 },
    { amount: 15.99, category: 'Entertainment', paymentMethod: 'Card', description: 'Netflix subscription', dayOfMonth: 8 },
    { amount: 9.99, category: 'Entertainment', paymentMethod: 'Card', description: 'Spotify Premium', dayOfMonth: 12 }
  ];

  let recurringCount = 0;
  recurringTemplates.forEach(template => {
    // Only create if the category exists
    if (categoryNames.includes(template.category)) {
      try {
        recurringStore.add(template);
        console.log(`  ✓ Created recurring: ${template.description} (${template.category})`);
        recurringCount++;
      } catch (error) {
        console.log(`  ✗ Failed to create recurring expense: ${error.message}`);
      }
    }
  });
  console.log(`Created ${recurringCount} recurring expenses.\n`);

  console.log('Seeding complete!');
  console.log(`\nSummary:`);
  console.log(`  - Categories: ${createdCategories.length}`);
  console.log(`  - Expenses: ${expenseCount}`);
  console.log(`  - Recurring expenses: ${recurringCount}`);
}

// Run seed if called directly
if (require.main === module) {
  try {
    seed();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

module.exports = { seed };