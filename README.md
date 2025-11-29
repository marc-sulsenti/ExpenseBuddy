# Expense Buddy

A personal expense tracking and budgeting web application built for SSW-555 Agile Methods course project.

## Overview

Expense Buddy helps users track their daily expenses, set monthly budgets by category, and visualize spending patterns. It's designed as a simple, focused tool for personal finance management on localhost.

## Tech Stack

- **Backend**: Node.js with Express
- **View Engine**: Handlebars (express-handlebars)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Plain CSS
- **Storage**: JSON files using Node.js `fs` module
- **Modules**: CommonJS (require/module.exports)

## Project Structure

```
ExpenseBuddy/
├── app.js                 # Main Express application
├── package.json           # Dependencies and scripts
├── data/                  # Data storage
│   ├── expenses.json     # Expense records
│   ├── categories.json   # Category definitions and budgets
│   ├── recurring.json    # Recurring expense templates
│   ├── expenseStore.js   # Expense data access layer
│   ├── categoryStore.js  # Category data access layer
│   └── recurringStore.js # Recurring expense data access layer
├── routes/                # Express route handlers
│   ├── dashboard.js      # Dashboard route
│   ├── expenses.js       # Expense CRUD routes
│   ├── budgets.js        # Budget management routes
│   ├── settings.js       # Settings and configuration routes
│   └── api.js            # JSON API endpoints
├── views/                 # Handlebars templates
│   ├── layouts/
│   │   └── main.handlebars
│   ├── partials/
│   │   ├── navigation.handlebars
│   │   └── flash-messages.handlebars
│   ├── dashboard.handlebars
│   ├── expenses.handlebars
│   ├── expense-edit.handlebars
│   ├── budgets.handlebars
│   └── settings.handlebars
├── public/                # Static assets
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── common.js
│       ├── dashboard.js
│       └── expenses.js
├── scripts/
│   └── seed.js           # Sample data generator
└── tests/                 # Unit tests
    ├── expenseStore.test.js
    └── budget.test.js
```

## Installation

1. **Clone or download the project**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize data files** (optional - they will be created automatically):
   ```bash
   # Data files are created automatically on first run
   # Or seed with sample data:
   npm run seed
   ```

## Running the Application

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open your browser**:
   Navigate to `http://localhost:3000`

The application will run on port 3000 by default. You can change this by setting the `PORT` environment variable:
```bash
PORT=8080 npm start
```

## Data Storage

Expense Buddy uses JSON files for persistence, stored in the `data/` directory:

- **expenses.json**: All expense records
- **categories.json**: Category definitions and monthly budgets
- **recurring.json**: Recurring expense templates

These files are automatically created on first run. The data access modules (`expenseStore.js`, `categoryStore.js`, `recurringStore.js`) handle all file I/O operations using Node.js `fs` module.

## Features

### 1. Capture Expenses
- Add expenses with date, amount, category, payment method, and optional description
- Form validation ensures required fields are filled
- Expenses are saved immediately

### 2. View and Search Expenses
- View all expenses in a sortable table
- Filter by category, date range, and search text
- Sort by date or amount (ascending/descending)
- Default view shows last 3 months

### 3. Categories and Monthly Budgets
- Manage categories (add, rename, archive)
- Set monthly budget amounts for each category
- View current month spending vs. budget
- Visual indicators for over-budget categories

### 4. Dashboard and Analytics
- Total spent this month and last month
- Spending breakdown by category
- Monthly trend chart for last 6 months
- Budget status with visual progress bars

### 5. Edit and Delete Expenses
- Edit existing expenses
- Delete expenses with confirmation
- All totals and views update automatically

### 6. Recurring Expenses
- Mark expenses as recurring monthly
- Set day of month for automatic generation
- Generate recurring expenses for current month
- Prevents duplicate generation within the same month

### 7. Export and Import
- Export all expenses to CSV file
- Import expenses from CSV (paste CSV content)
- Basic validation and error handling

## Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- Data store operations (CRUD)
- Budget calculations
- Monthly totals and filtering

## Sample Data

To populate the application with sample data for demonstration:
```bash
npm run seed
```

This will create:
- 6 default categories with sample budgets
- Sample expenses for the last 3 months
- 2 recurring expense templates

## Demo Script for Grading

1. **Start the application**: `npm start`
2. **Open Dashboard** (`http://localhost:3000`)
   - View summary cards (this month, last month, change)
   - Review spending by category
   - Check budget status
   - Examine monthly trend chart

3. **Add Expenses** (`/expenses`)
   - Click "Add New Expense"
   - Fill in form: date, amount ($25.50), category (Food), payment method (Card), description (Lunch)
   - Submit and verify it appears in the list

4. **Filter and Search** (`/expenses`)
   - Use filters: select "Food" category, set date range
   - Search by description text
   - Sort by amount descending

5. **Manage Budgets** (`/budgets`)
   - View current month spending vs. budgets
   - Update budget amounts
   - See over-budget indicators (red highlighting)

6. **Settings** (`/settings`)
   - Add a new category
   - Create a recurring expense
   - Generate recurring expenses for current month
   - Export expenses to CSV

7. **Edit/Delete** (`/expenses`)
   - Edit an existing expense
   - Delete an expense (with confirmation)

## Environment Variables

- `PORT`: Server port (default: 3000)

## Development Notes

- All data is stored locally in JSON files
- No database required - perfect for localhost development
- Handlebars helpers are registered in `app.js` for template logic
- Flash messages use query string parameters
- Client-side JavaScript handles form validation and chart rendering

## Troubleshooting

**Port already in use**:
- Change the PORT environment variable or stop the process using port 3000

**Data files not found**:
- Data files are created automatically on first run
- Ensure the `data/` directory exists and is writable

**Categories not showing**:
- Run `npm run seed` to initialize default categories
- Or manually add categories via Settings page

## License

ISC

## Course Information

**Course**: SSW-555 - Agile Methods  
**Project**: Expense Buddy  
**Team**: ExpenseBuddy

### Team Members
- Marc Sulsenti
- Sahil Virani
- Justin Synnott
- Zachary Rosario
