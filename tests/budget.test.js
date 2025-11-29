// Budget calculation tests

describe('Budget Calculations', () => {
  test('calculate remaining budget correctly', () => {
    const budget = 100;
    const spent = 75;
    const remaining = budget - spent;
    expect(remaining).toBe(25);
  });

  test('detect over budget correctly', () => {
    const budget = 100;
    const spent = 150;
    const isOverBudget = spent > budget && budget > 0;
    expect(isOverBudget).toBe(true);
  });

  test('calculate percentage spent correctly', () => {
    const budget = 100;
    const spent = 50;
    const percentage = (spent / budget) * 100;
    expect(percentage).toBe(50);
  });

  test('handle zero budget correctly', () => {
    const budget = 0;
    const spent = 50;
    const isOverBudget = spent > budget && budget > 0;
    expect(isOverBudget).toBe(false);
  });

  test('calculate monthly total correctly', () => {
    const expenses = [
      { amount: 25.50, date: '2024-01-15' },
      { amount: 30.00, date: '2024-01-20' },
      { amount: 15.75, date: '2024-01-25' }
    ];

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    expect(total).toBe(71.25);
  });

  test('filter expenses by month correctly', () => {
    const expenses = [
      { amount: 25.50, date: '2024-01-15' },
      { amount: 30.00, date: '2024-01-20' },
      { amount: 15.75, date: '2024-02-10' }
    ];

    const januaryExpenses = expenses.filter(exp => {
      const date = new Date(exp.date);
      return date.getFullYear() === 2024 && date.getMonth() === 0; // January is 0
    });

    expect(januaryExpenses.length).toBe(2);
    const janTotal = januaryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    expect(janTotal).toBe(55.50);
  });
});

