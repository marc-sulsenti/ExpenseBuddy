const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Handlebars with helpers
const hbs = exphbs.create({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    subtract: (a, b) => (a - b).toFixed(2),
    multiply: (a, b) => a * b,
    divide: (a, b) => b !== 0 ? a / b : 0,
    now: () => new Date().toISOString().split('T')[0],
    formatCurrency: (amount) => {
      if (typeof amount !== 'number') return '$0.00';
      return '$' + amount.toFixed(2);
    }
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Flash message middleware (simple query string based)
app.use((req, res, next) => {
  res.locals.messages = [];
  if (req.query.success) {
    res.locals.messages.push({ type: 'success', message: req.query.success });
  }
  if (req.query.error) {
    res.locals.messages.push({ type: 'error', message: req.query.error });
  }
  next();
});

// Routes
app.use('/', require('./routes/dashboard'));
app.use('/expenses', require('./routes/expenses'));
app.use('/budgets', require('./routes/budgets'));
app.use('/settings', require('./routes/settings'));
app.use('/about', require('./routes/about'));
app.use('/api', require('./routes/api'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    layout: 'main',
    message: err.message || 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    layout: 'main',
    message: 'Page not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Expense Buddy is running on http://localhost:${PORT}`);
});

module.exports = app;

