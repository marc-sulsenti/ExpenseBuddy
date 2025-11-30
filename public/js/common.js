// Common JavaScript functions

// Confirm delete action
function confirmDelete() {
    return confirm('Are you sure you want to delete this item? This action cannot be undone.');
}

// Confirm reset all data action
function confirmReset() {
    const firstConfirm = confirm('WARNING: This will delete ALL your data!\n\nThis includes:\n- All expenses\n- All categories\n- All recurring expenses\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?');
    if (!firstConfirm) {
        return false;
    }
    
    const secondConfirm = confirm('This is your LAST chance to cancel.\n\nClick OK to permanently delete ALL data and reset Expense Buddy.\n\nClick Cancel to keep your data.');
    return secondConfirm;
}

// Auto-hide flash messages after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(function(message) {
        setTimeout(function() {
            message.style.transition = 'opacity 0.5s';
            message.style.opacity = '0';
            setTimeout(function() {
                message.remove();
            }, 500);
        }, 5000);
    });
});

