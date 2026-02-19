console.log("ADMIN JS LOADED");

// Global Variables
let currentUser = 'admin@retailx.com';
let salesChart, analyticsChart, categoryChart;
let notificationCount = 3;

// Make chart variables globally accessible
window.topSellingChart = null;
window.leastSellingChart = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    updateCurrentDate();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize dashboard
    initDashboard();
    
    // Load initial data
    loadDashboardData();
    loadUsers();
    loadProducts();
    loadInventory();
    loadAnalytics();
    loadNotifications();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup search functionality
    setupSearch();
    
    // Check if we have festival data to display
    setTimeout(function() {
        const festivalEl = document.getElementById('detected-festival');
        const hasFestivalData = festivalEl && festivalEl.dataset.festival;
        if (hasFestivalData) {
            console.log('Festival data detected on page load, initializing charts...');
            if (typeof initFestivalCharts === 'function') {
                initFestivalCharts();
            }
        }
    }, 500);
    
    // Close notification panel when clicking outside
    document.addEventListener('click', function(e) {
        const notificationPanel = document.getElementById('notificationPanel');
        const notificationBtn = document.querySelector('.notification-btn');
        
        if (notificationPanel && notificationBtn) {
            if (!notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationPanel.classList.remove('show');
            }
        }
    });
    
    // Auto-refresh data every 30 seconds
    setInterval(() => {
        const dash = document.querySelector('#dashboard');
        if (dash && dash.classList.contains('active')) {
            loadDashboardData();
        }
    }, 30000);
});

// Update Current Date
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.dataset.section;
            const sectionElement = document.getElementById(sectionId);
            if (sectionElement) {
                sectionElement.classList.add('active');
            }
            
            // Load section-specific data
            loadSectionData(sectionId);
            
            // If analytics section, re-initialize festival charts
            if (sectionId === 'analytics') {
                setTimeout(function() {
                    if (typeof initFestivalCharts === 'function') {
                        console.log('Analytics section activated, re-initializing charts...');
                        initFestivalCharts();
                    }
                }, 300);
            }
        });
    });
}

// Load Section Data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Setup Form Handlers
function setupFormHandlers() {
    // User Form - No need to prevent default as we want form submission
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            // Form will submit normally to Django
        });
    }
    
    // Product Form - No need to prevent default
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            // Form will submit normally to Django
        });
    }
    
    // Inventory Form
    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveInventoryAdjustment();
        });
    }
    
    // Festival Search Form
    const festivalForm = document.getElementById('festivalSearchForm');
    if (festivalForm) {
        festivalForm.addEventListener('submit', function(e) {
            showLoading();
            // Form will submit normally, but we show loading
        });
    }
}

// Setup Search
function setupSearch() {
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            if (searchTerm.length >= 2) {
                performGlobalSearch(searchTerm);
            }
        });
    }
}

// AJAX Load Dashboard Data
function loadDashboardData() {
    showLoading();
    
    // Simulate API call with setTimeout
    setTimeout(() => {
        // Update stats
        updateStats();
        
        // Load alerts
        loadRecentAlerts();
        
        // Load activity
        loadRecentActivity();
        
        // Initialize charts
        initSalesChart();
        
        hideLoading();
    }, 1000);
}

function updateStats() {
    // Stats are already updated by Django context
    // Additional stats can be updated here if needed
    hideLoading();
}

// AJAX Load Users (for client-side filtering)
function loadUsers() {
    // Users are already loaded by Django
    // This function handles client-side filtering and search
    
    const userFilter = document.getElementById('userFilter');
    if (userFilter) {
        filterUsers();
    }
}

function filterUsers() {
    const filterEl = document.getElementById('userFilter');
    const filterValue = filterEl ? filterEl.value : 'all';
    const searchEl = document.getElementById('userSearch');
    const searchValue = searchEl ? searchEl.value.toLowerCase() : '';
    
    const rows = document.querySelectorAll('#usersTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const role = row.querySelector('.status-badge').textContent.toLowerCase();
        const text = row.textContent.toLowerCase();
        
        let shouldShow = true;
        
        // Apply role filter
        if (filterValue !== 'all' && !role.includes(filterValue)) {
            shouldShow = false;
        }
        
        // Apply search filter
        if (searchValue && !text.includes(searchValue)) {
            shouldShow = false;
        }
        
        row.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) {
            visibleCount++;
        }
    });
    
    // Update user count display
    const userCountElement = document.querySelector('.content-section#users .table-container + div');
    if (userCountElement) {
        userCountElement.textContent = `Showing ${visibleCount} user(s) in total`;
    }
}

function searchUsers() {
    filterUsers();
}

// AJAX Load Products (for client-side filtering)
function loadProducts() {
    // Products are already loaded by Django
    // This function handles client-side filtering
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        updateCategoryFilter();
        filterProducts();
    }
}

function filterProducts() {
    const catEl = document.getElementById('categoryFilter');
    const categoryValue = catEl ? catEl.value : 'all';
    const stockEl = document.getElementById('stockFilter');
    const stockValue = stockEl ? stockEl.value : 'all';
    
    const productCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    
    productCards.forEach(card => {
        const category = card.querySelector('.product-category').textContent.toLowerCase();
        const stockLevel = card.querySelector('.stock-level');
        const stockText = stockLevel.textContent;
        const stockNumber = parseInt(stockText);
        
        let shouldShow = true;
        
        // Apply category filter
        if (categoryValue !== 'all' && !category.includes(categoryValue)) {
            shouldShow = false;
        }
        
        // Apply stock filter
        if (stockValue === 'low' && !stockLevel.classList.contains('low')) {
            shouldShow = false;
        } else if (stockValue === 'out' && stockNumber > 0) {
            shouldShow = false;
        }
        
        card.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) {
            visibleCount++;
        }
    });
    
    // Update product count display
    const productCountElement = document.querySelector('#productsGrid + div');
    if (productCountElement) {
        productCountElement.textContent = `Showing ${visibleCount} product(s) in total`;
    }
}

function updateCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;
    
    // Get unique categories from products
    const categories = new Set();
    document.querySelectorAll('.product-category').forEach(element => {
        categories.add(element.textContent.trim());
    });
    
    // Clear existing options except "All Categories"
    filter.innerHTML = '<option value="all">All Categories</option>';
    
    // Add categories
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase();
        option.textContent = category;
        filter.appendChild(option);
    });
}

// AJAX Load Inventory
function loadInventory() {
    // Inventory data is already loaded by Django
    // Additional processing can be done here
}

// AJAX Load Analytics
function loadAnalytics() {
    showLoading();
    
    setTimeout(() => {
        initAnalyticsChart();
        initCategoryChart();
        hideLoading();
    }, 1000);
}

// ============= IMPROVED FESTIVAL CHART FUNCTIONS =============

// Initialize Festival Charts from Django template data
function initFestivalCharts() {
    console.log('initFestivalCharts called');
    
    // Check if we have festival data
    const topProductsElement = document.getElementById('top-products-data');
    const leastProductsElement = document.getElementById('least-products-data');
    const festivalNameElement = document.getElementById('detected-festival');
    
    if (!topProductsElement || !leastProductsElement) {
        console.log('Data elements not found');
        return;
    }
    
    console.log('Top products raw data:', topProductsElement.dataset.products);
    console.log('Least products raw data:', leastProductsElement.dataset.products);
    
    // Parse the data from data attributes
    try {
        let topProducts = [];
        let leastProducts = [];
        
        // Parse top products
        if (topProductsElement.dataset.products && topProductsElement.dataset.products !== 'None' && topProductsElement.dataset.products !== '') {
            try {
                // Try to parse as JSON
                const rawData = topProductsElement.dataset.products;
                // Handle escaped quotes
                const cleanedData = rawData.replace(/&quot;/g, '"');
                topProducts = JSON.parse(cleanedData);
                console.log('Parsed top products:', topProducts);
            } catch (e) {
                console.error('Failed to parse top products JSON:', e);
                console.log('Raw data:', topProductsElement.dataset.products);
            }
        }
        
        // Parse least products
        if (leastProductsElement.dataset.products && leastProductsElement.dataset.products !== 'None' && leastProductsElement.dataset.products !== '') {
            try {
                const rawData = leastProductsElement.dataset.products;
                const cleanedData = rawData.replace(/&quot;/g, '"');
                leastProducts = JSON.parse(cleanedData);
                console.log('Parsed least products:', leastProducts);
            } catch (e) {
                console.error('Failed to parse least products JSON:', e);
            }
        }
        
        // Ensure we have arrays
        if (!Array.isArray(topProducts)) topProducts = [];
        if (!Array.isArray(leastProducts)) leastProducts = [];
        
        const festivalName = festivalNameElement ? festivalNameElement.dataset.festival : 'Festival';
        
        console.log('Final top products:', topProducts);
        console.log('Final least products:', leastProducts);
        
        if (topProducts.length > 0 || leastProducts.length > 0) {
            createFestivalCharts(topProducts, leastProducts, festivalName);
        } else {
            console.log('No product data found for charts');
            // Clear canvases and show empty state
            ['topSellingChart', 'leastSellingChart'].forEach(canvasId => {
                const canvas = document.getElementById(canvasId);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.font = '14px Poppins, sans-serif';
                    ctx.fillStyle = '#999';
                    ctx.textAlign = 'center';
                    ctx.fillText('No prediction data available', canvas.width/2, canvas.height/2);
                }
            });
        }
    } catch (e) {
        console.error('Error in initFestivalCharts:', e);
    }
}

// Create separate horizontal bar charts for top and least products
function createFestivalCharts(topProducts, leastProducts, festivalName) {
    console.log('Creating charts with:', { topProducts, leastProducts });
    
    // Format data properly
    const formattedTop = Array.isArray(topProducts) ? topProducts.map(item => ({
        product: item.product || 'Unknown',
        units: parseFloat(item.predicted_sales) || 0
    })) : [];
    
    const formattedLeast = Array.isArray(leastProducts) ? leastProducts.map(item => ({
        product: item.product || 'Unknown',
        units: parseFloat(item.predicted_sales) || 0
    })) : [];
    
    console.log('Formatted top:', formattedTop);
    console.log('Formatted least:', formattedLeast);
    
    // Create top selling chart
    if (formattedTop.length > 0) {
        createHorizontalBarChart(
            'topSellingChart',
            formattedTop,
            '#e67e22',
            'Top Selling Products'
        );
    } else {
        console.log('No top products to display');
        // Clear canvas if no data
        const canvas = document.getElementById('topSellingChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Poppins, sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('No top products data', canvas.width/2, canvas.height/2);
        }
    }
    
    // Create least selling chart
    if (formattedLeast.length > 0) {
        createHorizontalBarChart(
            'leastSellingChart',
            formattedLeast,
            '#3498db',
            'Least Selling Products'
        );
    } else {
        console.log('No least products to display');
        // Clear canvas if no data
        const canvas = document.getElementById('leastSellingChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Poppins, sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('No least products data', canvas.width/2, canvas.height/2);
        }
    }
}

// Create a horizontal bar chart - IMPROVED VERSION
function createHorizontalBarChart(canvasId, data, color, label) {
    console.log(`Creating ${canvasId} with data:`, data);
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.log(`Canvas ${canvasId} not found`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvasId === 'topSellingChart' && window.topSellingChart) {
        window.topSellingChart.destroy();
    } else if (canvasId === 'leastSellingChart' && window.leastSellingChart) {
        window.leastSellingChart.destroy();
    }
    
    // Make sure we have valid data
    if (!data || data.length === 0) {
        console.log(`No data for ${canvasId}, showing empty message`);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Poppins, sans-serif';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('No prediction data available', canvas.width/2, canvas.height/2);
        return;
    }
    
    // Sort data by units descending for better visualization
    const sortedData = [...data].sort((a, b) => b.units - a.units);
    
    // Prepare chart data
    const labels = sortedData.map(item => {
        // Truncate long product names
        return item.product && item.product.length > 20 
            ? item.product.substring(0, 17) + '...' 
            : item.product || 'Unknown';
    });
    
    const values = sortedData.map(item => {
        // Ensure we have a valid number
        const val = parseFloat(item.units) || 0;
        return Math.max(0, val); // No negative values
    });
    
    console.log('Chart labels:', labels);
    console.log('Chart values:', values);
    
    // Create gradient colors based on value
    const backgroundColors = values.map((value, index) => {
        const opacity = 0.7 - (index * 0.04);
        return color.replace('#', `rgba(${hexToRgb(color)}, ${Math.max(opacity, 0.3)})`);
    });
    
    // Create new chart
    const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expected Units',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: color,
                borderWidth: 1,
                borderRadius: 5,
            }]
        },
        options: {
            indexAxis: 'y', // This makes it horizontal
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            // Show full product name in tooltip
                            const fullProduct = sortedData[context.dataIndex].product || 'Unknown';
                            return fullProduct + ': ' + context.raw.toLocaleString() + ' units';
                        },
                        title: function() {
                            return ''; // Remove default title
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Expected Units',
                        color: '#666',
                        font: {
                            size: 11,
                            family: 'Poppins, sans-serif'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        },
                        font: {
                            size: 10,
                            family: 'Poppins, sans-serif'
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Poppins, sans-serif'
                        },
                        maxRotation: 0,
                        autoSkip: true,
                        autoSkipPadding: 10
                    }
                }
            }
        }
    });
    
    // Store chart reference globally
    if (canvasId === 'topSellingChart') {
        window.topSellingChart = newChart;
    } else {
        window.leastSellingChart = newChart;
    }
    
    console.log(`Chart ${canvasId} created successfully with ${sortedData.length} items`);
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// ============= END OF FESTIVAL CHART FUNCTIONS =============

// Load prediction data
function loadPredictionData() {
    const predictions = {
        nextWeek: 3250,
        nextMonth: 14500,
        trend: 'up',
        confidence: 85
    };
    
    const container = document.getElementById('predictionData');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: var(--primary); margin-bottom: 10px;">Next Week: $${predictions.nextWeek.toLocaleString()}</h3>
            <p style="color: var(--gray); margin-bottom: 5px;">Monthly Forecast: $${predictions.nextMonth.toLocaleString()}</p>
            <p style="color: ${predictions.trend === 'up' ? 'var(--success)' : 'var(--danger)'}; margin-bottom: 5px;">
                <i class="fas fa-arrow-${predictions.trend === 'up' ? 'up' : 'down'}"></i>
                Trend: ${predictions.trend === 'up' ? 'Upward' : 'Downward'}
            </p>
            <p style="color: var(--gray);">Confidence: ${predictions.confidence}%</p>
        </div>
    `;
}

function loadReportsTable() {
    const reports = [
        { date: '2024-01-15', product: 'Laptop Pro', units: 12, revenue: 15599.88, margin: '35%', trend: 'up' },
        { date: '2024-01-15', product: 'Wireless Mouse', units: 45, revenue: 1349.55, margin: '45%', trend: 'up' },
        { date: '2024-01-14', product: 'Coffee Maker', units: 8, revenue: 719.92, margin: '30%', trend: 'stable' },
        { date: '2024-01-14', product: 'Organic Coffee', units: 25, revenue: 324.75, margin: '40%', trend: 'up' },
        { date: '2024-01-13', product: 'T-Shirt', units: 15, revenue: 299.85, margin: '50%', trend: 'down' }
    ];
    
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    reports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.date}</td>
            <td>${report.product}</td>
            <td>${report.units}</td>
            <td>$${report.revenue.toFixed(2)}</td>
            <td>${report.margin}</td>
            <td>
                <span style="color: ${report.trend === 'up' ? 'var(--success)' : report.trend === 'down' ? 'var(--danger)' : 'var(--warning)'};">
                    <i class="fas fa-arrow-${report.trend === 'up' ? 'up' : report.trend === 'down' ? 'down' : 'right'}"></i>
                    ${report.trend}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Chart Initialization
function initSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    const canvas = ctx.getContext('2d');
    
    if (salesChart) {
        salesChart.destroy();
    }
    
    const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Sales ($)',
            data: [1200, 1900, 3000, 5000, 2845, 3200, 1800],
            borderColor: '#6C63FF',
            backgroundColor: 'rgba(108, 99, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    };
    
    salesChart = new Chart(canvas, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });
}

function initAnalyticsChart() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;
    
    const canvas = ctx.getContext('2d');
    
    if (analyticsChart) {
        analyticsChart.destroy();
    }
    
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Revenue',
            data: [12000, 19000, 15000, 25000, 22000, 30000],
            borderColor: '#6C63FF',
            backgroundColor: 'rgba(108, 99, 255, 0.1)',
            borderWidth: 2,
            fill: true
        }, {
            label: 'Profit',
            data: [4000, 7000, 5000, 9000, 8000, 12000],
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            fill: true
        }]
    };
    
    analyticsChart = new Chart(canvas, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });
}

function initCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const canvas = ctx.getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const data = {
        labels: ['Electronics', 'Clothing', 'Groceries', 'Home', 'Others'],
        datasets: [{
            data: [40, 20, 15, 15, 10],
            backgroundColor: [
                '#6C63FF',
                '#FF6B6B',
                '#4CAF50',
                '#FF9800',
                '#9C27B0'
            ]
        }]
    };
    
    categoryChart = new Chart(canvas, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Notification Functions
function toggleNotifications() {
    const notificationPanel = document.getElementById('notificationPanel');
    if (notificationPanel) {
        notificationPanel.classList.toggle('show');
    }
}

function loadNotifications() {
    const notifications = [
        {
            id: 1,
            type: 'warning',
            icon: 'exclamation-triangle',
            title: 'Low Stock Alert',
            message: 'T-Shirt stock is critically low (5 units remaining)',
            time: '2 hours ago',
            unread: true
        },
        {
            id: 2,
            type: 'info',
            icon: 'user-plus',
            title: 'New User Registration',
            message: 'Charlie Davis has been registered as a new manager',
            time: '4 hours ago',
            unread: true
        },
        {
            id: 3,
            type: 'success',
            icon: 'chart-line',
            title: 'Daily Target Achieved',
            message: 'Daily sales target has been exceeded by 15%',
            time: '6 hours ago',
            unread: true
        },
        {
            id: 4,
            type: 'info',
            icon: 'box',
            title: 'Product Added',
            message: 'New product "Wireless Headphones" has been added to inventory',
            time: '1 day ago',
            unread: false
        },
        {
            id: 5,
            type: 'warning',
            icon: 'exclamation-circle',
            title: 'System Maintenance',
            message: 'Scheduled maintenance this Sunday from 2:00 AM to 4:00 AM',
            time: '2 days ago',
            unread: false
        }
    ];
    
    renderNotifications(notifications);
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    
    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.unread ? 'unread' : ''}`;
        item.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div class="notification-icon ${notification.type}">
                    <i class="fas fa-${notification.icon}"></i>
                </div>
                <div class="notification-content">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                    <span class="notification-time">${notification.time}</span>
                </div>
                ${notification.unread ? '<span class="unread-dot"></span>' : ''}
            </div>
        `;
        
        item.addEventListener('click', () => markNotificationAsRead(notification.id));
        notificationList.appendChild(item);
    });
    
    // Update notification count
    const unreadCount = notifications.filter(n => n.unread).length;
    notificationCount = unreadCount;
    const notificationCountElement = document.querySelector('.notification-count');
    if (notificationCountElement) {
        notificationCountElement.textContent = unreadCount;
        
        if (unreadCount === 0) {
            notificationCountElement.style.display = 'none';
        } else {
            notificationCountElement.style.display = 'flex';
        }
    }
}

function markNotificationAsRead(id) {
    showLoading();
    
    setTimeout(() => {
        // Simulate API call
        notificationCount = Math.max(0, notificationCount - 1);
        const notificationCountElement = document.querySelector('.notification-count');
        if (notificationCountElement) {
            notificationCountElement.textContent = notificationCount;
            
            if (notificationCount === 0) {
                notificationCountElement.style.display = 'none';
            }
        }
        
        showToast('Notification marked as read', 'success');
        hideLoading();
    }, 500);
}

function markAllAsRead() {
    showLoading();
    
    setTimeout(() => {
        notificationCount = 0;
        const notificationCountElement = document.querySelector('.notification-count');
        if (notificationCountElement) {
            notificationCountElement.textContent = '0';
            notificationCountElement.style.display = 'none';
        }
        
        showToast('All notifications marked as read', 'success');
        hideLoading();
        
        // Close notification panel
        const notificationPanel = document.getElementById('notificationPanel');
        if (notificationPanel) {
            notificationPanel.classList.remove('show');
        }
    }, 500);
}

function viewAllNotifications() {
    showToast('Viewing all notifications - Feature coming soon!', 'info');
    const notificationPanel = document.getElementById('notificationPanel');
    if (notificationPanel) {
        notificationPanel.classList.remove('show');
    }
}

// Modal Functions
function openUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.reset();
    }
}

function openProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.reset();
    }
}

function openInventoryModal() {
    // Load products for dropdown
    loadProductDropdown();
    const modal = document.getElementById('inventoryModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.reset();
    }
}

function openQuickAction() {                                          
    const modal = document.getElementById('quickActionModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeQuickAction() {
    const modal = document.getElementById('quickActionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save Functions (AJAX)
function saveUser() {
    showLoading();
    
    const userData = {
        name: document.getElementById('userName') ? document.getElementById('userName').value : '',
        email: document.getElementById('userEmail') ? document.getElementById('userEmail').value : '',
        role: document.getElementById('userRole') ? document.getElementById('userRole').value : '',
        password: document.getElementById('userPassword') ? document.getElementById('userPassword').value : '',
        status: document.getElementById('userStatus') ? document.getElementById('userStatus').value : 'active'
    };
    
    // Simulate API call
    setTimeout(() => {
        closeUserModal();
        loadUsers();
        showToast('User added successfully!', 'success');
        hideLoading();
    }, 1500);
}

function saveProduct() {
    showLoading();
    
    const productData = {
        name: document.getElementById('productName') ? document.getElementById('productName').value : '',
        category: document.getElementById('productCategory') ? document.getElementById('productCategory').value : '',
        sku: document.getElementById('productSKU') ? document.getElementById('productSKU').value : '',
        price: parseFloat(document.getElementById('productPrice') ? document.getElementById('productPrice').value : 0),
        stock: parseInt(document.getElementById('productStock') ? document.getElementById('productStock').value : 0),
        minStock: parseInt(document.getElementById('productMinStock') ? document.getElementById('productMinStock').value : 0),
        description: document.getElementById('productDescription') ? document.getElementById('productDescription').value : ''
    };
    
    // Simulate API call
    setTimeout(() => {
        closeProductModal();
        loadProducts();
        showToast('Product added successfully!', 'success');
        hideLoading();
    }, 1500);
}

function saveInventoryAdjustment() {
    showLoading();
    
    const adjustmentData = {
        type: document.getElementById('adjustmentType') ? document.getElementById('adjustmentType').value : '',
        productId: document.getElementById('inventoryProduct') ? document.getElementById('inventoryProduct').value : '',
        quantity: parseInt(document.getElementById('adjustmentQuantity') ? document.getElementById('adjustmentQuantity').value : 0),
        reason: document.getElementById('adjustmentReason') ? document.getElementById('adjustmentReason').value : '',
        date: document.getElementById('adjustmentDate') ? document.getElementById('adjustmentDate').value : ''
    };
    
    // Simulate API call
    setTimeout(() => {
        closeInventoryModal();
        loadInventory();
        showToast('Inventory adjustment saved!', 'success');
        hideLoading();
    }, 1500);
}

// Utility Functions
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast';
    
    switch(type) {
        case 'success':
            toast.style.background = 'var(--success)';
            break;
        case 'error':
            toast.style.background = 'var(--danger)';
            break;
        case 'warning':
            toast.style.background = 'var(--warning)';
            break;
        default:
            toast.style.background = 'var(--primary)';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function loadProductDropdown() {
    const select = document.getElementById('inventoryProduct');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Product</option>';
    
    // Get products from the page
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length > 0) {
        productCards.forEach((card, index) => {
            const title = card.querySelector('.product-title');
            if (title) {
                const option = document.createElement('option');
                option.value = index + 1;
                option.textContent = title.textContent;
                select.appendChild(option);
            }
        });
    } else {
        // Fallback products
        const products = [
            { id: 1, name: 'Laptop Pro' },
            { id: 2, name: 'Wireless Mouse' },
            { id: 3, name: 'T-Shirt' },
            { id: 4, name: 'Coffee Maker' },
            { id: 5, name: 'Organic Coffee' }
        ];
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            select.appendChild(option);
        });
    }
}

function loadRecentAlerts() {
    const alerts = [
        { type: 'warning', message: 'T-Shirt stock is low (5 units)', time: '2 hours ago' },
        { type: 'info', message: 'New user registration: Charlie Davis', time: '4 hours ago' },
        { type: 'success', message: 'Daily sales target achieved!', time: '6 hours ago' }
    ];
    
    const container = document.getElementById('recentAlerts');
    if (!container) return;
    
    container.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-item';
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid var(--gray-light);">
                <i class="fas fa-${alert.type === 'warning' ? 'exclamation-triangle' : alert.type === 'info' ? 'info-circle' : 'check-circle'}" 
                   style="color: ${alert.type === 'warning' ? 'var(--warning)' : alert.type === 'info' ? 'var(--primary)' : 'var(--success)'}"></i>
                <div>
                    <p style="margin: 0; font-size: 14px;">${alert.message}</p>
                    <small style="color: var(--gray);">${alert.time}</small>
                </div>
            </div>
        `;
        container.appendChild(alertDiv);
    });
}

function loadRecentActivity() {
    const activities = [
        { user: 'John Doe', action: 'added new product', time: '10:30 AM' },
        { user: 'Jane Smith', action: 'updated inventory', time: '9:15 AM' },
        { user: 'System', action: 'generated daily report', time: '8:00 AM' }
    ];
    
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    container.innerHTML = '';
    
    activities.forEach(activity => {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'activity-item';
        activityDiv.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid var(--gray-light);">
                <p style="margin: 0; font-size: 14px;">
                    <strong>${activity.user}</strong> ${activity.action}
                </p>
                <small style="color: var(--gray);">${activity.time}</small>
            </div>
        `;
        container.appendChild(activityDiv);
    });
}

// Action Functions
function exportUsers() {
    showLoading();
    setTimeout(() => {
        showToast('Users exported successfully!', 'success');
        hideLoading();
    }, 1000);
}

function bulkResetPassword() {
    const selected = document.querySelectorAll('.user-checkbox:checked');
    if (selected.length === 0) {
        showToast('Please select users first', 'warning');
        return;
    }
    
    if (confirm(`Reset passwords for ${selected.length} selected users?`)) {
        showLoading();
        
        // Get selected user IDs and types
        const usersToReset = [];
        selected.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const roleBadge = row.querySelector('.status-badge');
            const role = roleBadge ? roleBadge.textContent.toLowerCase() : 'user';
            usersToReset.push({
                id: checkbox.value,
                type: role
            });
        });
        
        setTimeout(() => {
            showToast('Passwords reset emails sent!', 'success');
            hideLoading();
        }, 1500);
    }
}

function bulkUpdateStock() {
    showToast('Bulk stock update feature coming soon!', 'info');
}

function importProducts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = function(e) {
        showLoading();
        setTimeout(() => {
            showToast('Products imported successfully!', 'success');
            loadProducts();
            hideLoading();
        }, 2000);
    };
    input.click();
}

function generateReport() {
    showLoading();
    setTimeout(() => {
        showToast('Need to work On this Function still incomplete !!', 'success');
        hideLoading();
    }, 2000);
}

function backupDatabase() {
    showLoading();
    setTimeout(() => {
        showToast('Database backup completed!', 'success');
        hideLoading();
    }, 1500);
}

function clearCache() {
    showLoading();
    setTimeout(() => {
        showToast('Cache cleared successfully!', 'success');
        hideLoading();
    }, 1000);
}

function exportAllData() {
    showLoading();
    setTimeout(() => {
        showToast('All data exported!', 'success');
        hideLoading();
    }, 2000);
}

// Theme Functions
function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
    localStorage.setItem('retailx-theme', theme);
}

function loadSettings() {
    const savedTheme = localStorage.getItem('retailx-theme') || 'default';
    changeTheme(savedTheme);
}

// Quick Actions
function quickAddProduct() {
    closeQuickAction();
    openProductModal();
}

function quickAddUser() {
    closeQuickAction();
    openUserModal();
}

function quickStockCheck() {
    closeQuickAction();
    showLoading();
    setTimeout(() => {
        showToast('Need to work On this Function still incomplete !!');
        hideLoading();
    }, 1000);
}

function quickGenerateReport() {
    closeQuickAction();
    generateReport();
}

// Initialize Dashboard
function initDashboard() {
    loadSettings();
}

// Global Search
function performGlobalSearch(term) {
    showLoading();
    
    setTimeout(() => {
        // In a real app, this would search across all modules
        const results = {
            users: 3,
            products: 7,
            reports: 2
        };
        
        showToast(`Found ${results.users} users, ${results.products} products, ${results.reports} reports`, 'info');
        hideLoading();
    }, 500);
}

// Edit Functions (stubs for demo)
function editUser(id, type) {
    showToast(`Edit user ${id} (${type}) - Feature coming soon!`, 'info');
}

function deleteUser(id, type) {
    if (confirm('Are you sure you want to delete this user?')) {
        showLoading();
        
        // Create a form to submit the delete request
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/delete-user/${type}/${id}/`;
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]') ? document.querySelector('[name=csrfmiddlewaretoken]').value : null;
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfmiddlewaretoken';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }
        
        document.body.appendChild(form);
        form.submit();
    }
}

function resetUserPassword(id, type) {
    if (confirm('Reset password for this user? A temporary password will be generated.')) {
        showLoading();
        
        // Create a form to submit the password reset request
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/reset-password/${type}/${id}/`;
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]') ? document.querySelector('[name=csrfmiddlewaretoken]').value : null;
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfmiddlewaretoken';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }
        
        document.body.appendChild(form);
        form.submit();
    }
}

function editProduct(id) {
    showToast(`Edit product ${id} - Feature coming soon!`, 'info');
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        showLoading();
        
        // Create a form to submit the delete request
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/delete-product/${id}/`;
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]') ? document.querySelector('[name=csrfmiddlewaretoken]').value : null;
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfmiddlewaretoken';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }
        
        document.body.appendChild(form);
        form.submit();
    }
}

function viewProductDetails(id) {
    showToast(`Viewing product ${id} details - Feature coming soon!`, 'info');
}

function adjustStock(id) {
    openInventoryModal();
    showToast(`Adjusting stock for product ${id}`, 'info');
}

function viewInventoryHistory(id) {
    showToast(`Viewing inventory history for product ${id} - Feature coming soon!`, 'info');
}

function toggleAllUsers() {
    const selectAll = document.getElementById('selectAllUsers');
    if (!selectAll) return;
    
    const isChecked = selectAll.checked;
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

function updateSalesChart() {
    const periodEl = document.getElementById('salesPeriod');
    const period = periodEl ? periodEl.value : null;
    showLoading();
    
    setTimeout(() => {
        initSalesChart();
        hideLoading();
    }, 500);
}

function updateAnalytics() {
    const periodEl = document.getElementById('reportPeriod');
    const period = periodEl ? periodEl.value : null;
    showLoading();
    
    setTimeout(() => {
        initAnalyticsChart();
        initCategoryChart();
        hideLoading();
    }, 500);
}

function saveSettings() {
    const emailCheck = document.getElementById('emailNotifications');
    const lowStockCheck = document.getElementById('lowStockAlerts');
    const newUserCheck = document.getElementById('newUserAlerts');
    const settings = {
        emailNotifications: emailCheck ? emailCheck.checked : false,
        lowStockAlerts: lowStockCheck ? lowStockCheck.checked : false,
        newUserAlerts: newUserCheck ? newUserCheck.checked : false
    };
    
    localStorage.setItem('retailx-settings', JSON.stringify(settings));
    showToast('Settings saved!', 'success');
}

/* =========================
   GET CSRF TOKEN FUNCTION
========================= */
function getCSRFToken() {
    let cookieValue = null;
    const name = "csrftoken";
    
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/* =========================
   SEND MESSAGE FUNCTION
========================= */
function sendMessage() {
    const input = document.getElementById("chatbot-input");
    const messages = document.getElementById("chatbot-messages");

    if (!input || !messages) return;

    const message = input.value.trim();
    if (message === "") return;

    // Show user message
    messages.innerHTML += `
        <div class="chat-user">
            <span>${escapeHtml(message)}</span>
        </div>
    `;

    input.value = "";
    messages.scrollTop = messages.scrollHeight;

    // Show typing indicator
    const typingId = "typing-" + Date.now();
    messages.innerHTML += `
        <div class="chat-bot" id="${typingId}">
            <span>🤖 Typing...</span>
        </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    // Send message to Django backend
    fetch("/chatbot/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify({ message: message })
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Network response was not ok");
        }
        return res.json();
    })
    .then(data => {
        // Remove typing indicator
        const typingElement = document.getElementById(typingId);
        if (typingElement) typingElement.remove();

        // Add bot response
        messages.innerHTML += `
            <div class="chat-bot">
                <span>${escapeHtml(data.reply)}</span>
            </div>
        `;
        messages.scrollTop = messages.scrollHeight;
    })
    .catch(error => {
        console.error("Chatbot error:", error);
        
        // Remove typing indicator
        const typingElement = document.getElementById(typingId);
        if (typingElement) typingElement.remove();

        // Show error message
        messages.innerHTML += `
            <div class="chat-bot">
                <span>⚠️ Sorry, I'm having trouble connecting. Please try again.</span>
            </div>
        `;
        messages.scrollTop = messages.scrollHeight;
    });
}

/* =========================
   HELPER: Escape HTML
========================= */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/* =========================
   CHATBOT TOGGLE (FIXED)
========================= */
function toggleChatbot() {
    const box = document.getElementById("chatbot-box");

    if (!box) {
        console.log("Chatbot box not found");
        return;
    }

    if (box.style.display === "none" || box.style.display === "") {
        box.style.display = "flex";
        console.log("Opening chatbot");
    } else {
        box.style.display = "none";
        console.log("Closing chatbot");
    }
}