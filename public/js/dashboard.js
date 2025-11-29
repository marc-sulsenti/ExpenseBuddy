// Dashboard page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set budget bar widths
    const budgetBars = document.querySelectorAll('.budget-bar-fill');
    budgetBars.forEach(function(bar) {
        const width = parseFloat(bar.getAttribute('data-width')) || 0;
        // Allow over 100% to show over-budget visually, but cap at 200% for display
        const percentage = Math.min(Math.max(width * 100, 0), 200);
        bar.style.width = percentage + '%';
    });

    // Set trend bar heights
    const trendBars = document.querySelectorAll('.trend-bar');
    const maxHeight = 200; // Maximum height in pixels
    
    // Set heights based on data-height attribute (ratio already calculated in template)
    trendBars.forEach(function(bar) {
        const heightRatio = parseFloat(bar.getAttribute('data-height')) || 0;
        const height = heightRatio * maxHeight;
        bar.style.height = Math.max(height, 10) + 'px'; // Minimum 10px height
    });
});

