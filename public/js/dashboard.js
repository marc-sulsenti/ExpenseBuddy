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

    // Draw pie chart
    drawPieChart();
});

function drawPieChart() {
    const canvas = document.getElementById('pieChart');
    if (!canvas) return;

    const categoryItems = document.querySelectorAll('.category-item');
    if (categoryItems.length === 0) return;

    // Collect category data
    const data = [];
    let total = 0;
    categoryItems.forEach(function(item) {
        const category = item.getAttribute('data-category');
        const amount = parseFloat(item.getAttribute('data-amount')) || 0;
        if (amount > 0) {
            data.push({ category: category, amount: amount });
            total += amount;
        }
    });

    if (data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Color palette
    const colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
        '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#d35400',
        '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#c0392b'
    ];

    // Draw pie slices
    let currentAngle = -Math.PI / 2; // Start at top
    const legend = document.getElementById('pieChartLegend');
    legend.innerHTML = '';

    data.forEach(function(item, index) {
        const sliceAngle = (item.amount / total) * 2 * Math.PI;
        const color = colors[index % colors.length];

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add legend item
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = '<span class="legend-color" style="background-color: ' + color + '"></span>' +
                              '<span class="legend-label">' + item.category + '</span>' +
                              '<span class="legend-value">$' + item.amount.toFixed(2) + '</span>';
        legend.appendChild(legendItem);

        currentAngle += sliceAngle;
    });
}

