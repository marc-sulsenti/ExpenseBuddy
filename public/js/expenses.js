// Expenses page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today if not already set
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // Form validation
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            const amount = document.getElementById('amount').value;
            if (isNaN(amount) || parseFloat(amount) <= 0) {
                e.preventDefault();
                alert('Please enter a valid amount greater than 0');
                return false;
            }
        });
    }
});

