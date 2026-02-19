/**
 * RETAILX MANAGER DASHBOARD - CORE ENGINE
 * Features: SPA Navigation, Dynamic Charts, AJAX Data Sync, & Session Guard
 */

// Global State Management to keep code organized and scalable
const RetailX = {
    isLoggingOut: false,
    refreshInterval: null,
    charts: {},
    
    // Core Configuration
    config: {
        autoRefreshTime: 300000, // 5 Minutes
        chartColors: {
            primary: '#3498db',
            secondary: '#2ecc71',
            danger: '#e74c3c',
            grid: '#f1f3f5'
        }
    }
};

// Make chart variables globally accessible for festival charts
window.topSellingChart = null;
window.leastSellingChart = null;

$(document).ready(function () {
    console.log('RetailX Engine: Initializing Manager Dashboard...');
    RetailX.init();
    
    // Check for festival data after page load
    setTimeout(function() {
        RetailX.parseFestivalData();
    }, 500);
});

/* ===============================
   INITIALIZATION
================================ */
RetailX.init = function() {
    this.setupCSRF();
    this.bindEvents();
    this.startClock();
    this.loadDashboardData();
    
    // Set default page
    this.switchPage('dashboard');
    
    // Start auto-sync
    this.refreshInterval = setInterval(() => {
        if (!this.isLoggingOut) this.loadDashboardData();
    }, this.config.autoRefreshTime);
};

/* ===============================
   SECURITY & AJAX SETUP
================================ */
RetailX.setupCSRF = function() {
    const getCookie = (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = $.trim(cookies[i]);
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    $.ajaxSetup({
        beforeSend: (xhr, settings) => {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        }
    });
};

/* ===============================
   CORE AJAX WRAPPER
================================ */
RetailX.apiCall = function(url, method = 'GET', data = null, callback) {
    if (this.isLoggingOut) return;

    $.ajax({
        url: url,
        type: method,
        data: data ? JSON.stringify(data) : null,
        contentType: 'application/json',
        dataType: 'json',
        success: (res) => {
            if (callback) callback(res);
        },
        error: (xhr) => {
            if (this.isLoggingOut) return;
            this.handleError(xhr);
        }
    });
};

/* ===============================
   EVENT BINDING (Micro-interactions)
================================ */
RetailX.bindEvents = function() {
    const self = this;

    // Navigation System
    $('.menu-item').on('click', function(e) {
        if ($(this).hasClass('logout')) {
            self.isLoggingOut = true;
            return true;
        }
        e.preventDefault();
        const page = $(this).data('page');
        if (page) self.switchPage(page);
    });

    // Refresh Action
    $('#refreshBtn').on('click', function() {
        const icon = $(this).find('i');
        icon.addClass('fa-spin');
        self.loadDashboardData();
        setTimeout(() => {
            icon.removeClass('fa-spin');
            self.showToast('Data Synced Successfully', 'success');
        }, 800);
    });

    // Modal Handling
    $('#addProductBtn').on('click', () => $('#addProductModal').css('display', 'flex').fadeIn());
    $('#addStaffBtn').on('click', () => $('#addStaffModal').css('display', 'flex').fadeIn());
    $('#notificationsBtn').on('click', () => $('#notificationModal').css('display', 'flex').fadeIn());
    
    $('.modal-close, .cancel-btn').on('click', function() {
        $(this).closest('.modal').fadeOut();
    });

    // Form Submissions
    $('#addProductForm').on('submit', function(e) {
        e.preventDefault();
        self.handleFormSubmit('Product');
    });

    $('#addStaffForm').on('submit', function(e) {
        e.preventDefault();
        self.handleFormSubmit('Staff Member');
    });

    // Close modal on outside click
    $(window).on('click', (e) => {
        if ($(e.target).hasClass('modal')) $('.modal').fadeOut();
    });
};

/* ===============================
   PAGE NAVIGATION LOGIC
================================ */
RetailX.switchPage = function(pageId) {
    // UI Updates
    $('.menu-item').removeClass('active');
    $(`.menu-item[data-page="${pageId}"]`).addClass('active');

    $('.page').hide().removeClass('active');
    $(`#${pageId}-page`).fadeIn(400).addClass('active');

    // Breadcrumb & Title Update
    const titles = {
        dashboard: 'Dashboard',
        overview: 'Store Overview',
        inventory: 'Inventory',
        staff: 'Staff Management',
        analysis: 'Analysis',
        transactions: 'Transactions',
        settings: 'Store Settings'
    };
    
    $('#pageTitle').text(titles[pageId]);
    $('#breadcrumb').text(`Home / ${titles[pageId]}`);

    // Contextual Data Loading
    this.loadPageData(pageId);
    
    // If analysis page, re-initialize festival charts
    if (pageId === 'analysis') {
        setTimeout(function() {
            RetailX.parseFestivalData();
        }, 300);
    }
};

/* ===============================
   DATA FETCHING & RENDERING
================================ */
RetailX.loadDashboardData = function() {
    this.apiCall('/api/manager/dashboard/kpi/', 'GET', null, this.renderKPIs);
    this.apiCall('/api/manager/dashboard/activities/', 'GET', null, this.renderActivities);
    this.apiCall('/api/manager/dashboard/revenue-chart/', 'GET', null, this.renderCharts);
};

RetailX.loadPageData = function(page) {
    if (page === 'inventory') this.apiCall('/api/manager/inventory/', 'GET', null, this.renderInventory);
    if (page === 'staff') this.apiCall('/api/manager/staff/', 'GET', null, this.renderStaff);
};

/* ===============================
   RENDERING FUNCTIONS (ADDED MISSING FUNCTIONS)
================================ */
RetailX.renderKPIs = function(data) {
    $('#totalRevenue').text(`$${data.total_revenue ? data.total_revenue.toLocaleString() : '0'}`);
    $('#inventoryValue').text(`$${data.inventory_value ? data.inventory_value.toLocaleString() : '0'}`);
    $('#activeStaff').text(data.active_staff || '0');
    $('#customerSatisfaction').text(`${data.satisfaction || '0'}%`);
    
    // Also update topbar quick stats
    $('#todayRevenue').text(`$${data.today_revenue ? data.today_revenue.toLocaleString() : '0.00'}`);
    $('#onlineOrders').text(data.online_orders || '0');
};

RetailX.renderActivities = function(data) {
    const activitiesList = $('#activitiesList');
    if (!activitiesList.length) return;
    
    activitiesList.empty();
    
    if (data && data.activities && data.activities.length > 0) {
        data.activities.forEach(activity => {
            activitiesList.append(`
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="fas fa-${activity.icon || 'bell'}"></i>
                    </div>
                    <div class="activity-details">
                        <p class="activity-message">${activity.message}</p>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            `);
        });
    } else {
        // Sample/dummy data for demonstration
        const sampleActivities = [
            { type: 'sale', icon: 'shopping-cart', message: 'New sale: $245.50', time: '2 minutes ago' },
            { type: 'inventory', icon: 'box', message: 'Low stock alert: T-Shirt (5 left)', time: '15 minutes ago' },
            { type: 'staff', icon: 'user-clock', message: 'Staff shift started: John Doe', time: '1 hour ago' },
            { type: 'sale', icon: 'chart-line', message: 'Daily target achieved!', time: '3 hours ago' }
        ];
        
        sampleActivities.forEach(activity => {
            activitiesList.append(`
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="fas fa-${activity.icon}"></i>
                    </div>
                    <div class="activity-details">
                        <p class="activity-message">${activity.message}</p>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            `);
        });
    }
};

RetailX.renderInventory = function(data) {
    const inventoryBody = $('#inventoryTableBody');
    if (!inventoryBody.length) return;
    
    inventoryBody.empty();
    
    if (data && data.products && data.products.length > 0) {
        data.products.forEach(product => {
            const stockClass = product.stock < 10 ? 'low-stock' : (product.stock > 50 ? 'high-stock' : 'normal-stock');
            const status = product.stock < 10 ? 'Low Stock' : (product.stock === 0 ? 'Out of Stock' : 'In Stock');
            
            inventoryBody.append(`
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td class="${stockClass}">${product.stock}</td>
                    <td>$${parseFloat(product.price).toFixed(2)}</td>
                    <td>$${(product.stock * product.price).toFixed(2)}</td>
                    <td><span class="status-badge ${product.stock < 10 ? 'warning' : 'success'}">${status}</span></td>
                    <td>
                        <button class="action-btn small" onclick="RetailX.editProduct(${product.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn small" onclick="RetailX.viewProduct(${product.id})"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `);
        });
    } else {
        // Sample data
        const sampleProducts = [
            { id: 'P001', name: 'Laptop Pro', category: 'Electronics', stock: 45, price: 1299.99 },
            { id: 'P002', name: 'Wireless Mouse', category: 'Electronics', stock: 128, price: 29.99 },
            { id: 'P003', name: 'T-Shirt', category: 'Clothing', stock: 5, price: 19.99 },
            { id: 'P004', name: 'Coffee Maker', category: 'Home', stock: 12, price: 89.99 },
            { id: 'P005', name: 'Organic Coffee', category: 'Groceries', stock: 8, price: 14.99 }
        ];
        
        sampleProducts.forEach(product => {
            const stockClass = product.stock < 10 ? 'low-stock' : (product.stock > 50 ? 'high-stock' : 'normal-stock');
            const status = product.stock < 10 ? 'Low Stock' : (product.stock === 0 ? 'Out of Stock' : 'In Stock');
            
            inventoryBody.append(`
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td class="${stockClass}">${product.stock}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>$${(product.stock * product.price).toFixed(2)}</td>
                    <td><span class="status-badge ${product.stock < 10 ? 'warning' : 'success'}">${status}</span></td>
                    <td>
                        <button class="action-btn small" onclick="RetailX.editProduct('${product.id}')"><i class="fas fa-edit"></i></button>
                        <button class="action-btn small" onclick="RetailX.viewProduct('${product.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `);
        });
    }
};

RetailX.renderStaff = function(data) {
    const staffBody = $('#staffTableBody');
    if (!staffBody.length) return;
    
    staffBody.empty();
    
    if (data && data.staff && data.staff.length > 0) {
        data.staff.forEach(member => {
            staffBody.append(`
                <tr>
                    <td>${member.id}</td>
                    <td>${member.name}</td>
                    <td>${member.role}</td>
                    <td>${member.contact || member.email}</td>
                    <td>${member.shift || '9AM-5PM'}</td>
                    <td><span class="status-badge ${member.status === 'Active' ? 'success' : 'inactive'}">${member.status || 'Active'}</span></td>
                    <td>
                        <div class="performance-bar">
                            <div class="performance-fill" style="width: ${member.performance || 85}%"></div>
                            <span>${member.performance || 85}%</span>
                        </div>
                    </td>
                    <td>
                        <button class="action-btn small" onclick="RetailX.editStaff(${member.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn small" onclick="RetailX.viewStaff(${member.id})"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `);
        });
    } else {
        // Sample data
        const sampleStaff = [
            { id: 'S001', name: 'John Doe', role: 'Cashier', email: 'john@example.com', shift: '9AM-5PM', status: 'Active', performance: 98 },
            { id: 'S002', name: 'Jane Smith', role: 'Supervisor', email: 'jane@example.com', shift: '10AM-6PM', status: 'Active', performance: 95 },
            { id: 'S003', name: 'Mike Johnson', role: 'Cashier', email: 'mike@example.com', shift: '2PM-10PM', status: 'Active', performance: 88 },
            { id: 'S004', name: 'Sarah Williams', role: 'Stock Clerk', email: 'sarah@example.com', shift: '8AM-4PM', status: 'Active', performance: 92 }
        ];
        
        sampleStaff.forEach(member => {
            staffBody.append(`
                <tr>
                    <td>${member.id}</td>
                    <td>${member.name}</td>
                    <td>${member.role}</td>
                    <td>${member.email}</td>
                    <td>${member.shift}</td>
                    <td><span class="status-badge success">${member.status}</span></td>
                    <td>
                        <div class="performance-bar">
                            <div class="performance-fill" style="width: ${member.performance}%"></div>
                            <span>${member.performance}%</span>
                        </div>
                    </td>
                    <td>
                        <button class="action-btn small" onclick="RetailX.editStaff('${member.id}')"><i class="fas fa-edit"></i></button>
                        <button class="action-btn small" onclick="RetailX.viewStaff('${member.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `);
        });
    }
    
    // Update staff summary
    $('#totalActiveStaff').text(sampleStaff.length);
    $('#onDutyToday').text('4');
    $('#avgHoursWeek').text('38');
    $('#payrollDue').text('$12,450');
};

RetailX.renderCharts = function(apiData) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Destroy existing chart to prevent memory leaks
    if (RetailX.charts.revenue) RetailX.charts.revenue.destroy();

    // Use provided data or fallback to sample data
    const chartData = apiData || {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [1200, 1900, 3000, 5000, 2800, 3200, 1800]
    };

    RetailX.charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Revenue',
                data: chartData.values,
                borderColor: '#3498db',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(52, 152, 219, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                x: { grid: { display: false } }, 
                y: { 
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                } 
            }
        }
    });
    
    // Initialize category chart if it exists
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        if (RetailX.charts.category) RetailX.charts.category.destroy();
        
        RetailX.charts.category = new Chart(categoryCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Electronics', 'Clothing', 'Groceries', 'Home', 'Others'],
                datasets: [{
                    data: [40, 25, 15, 12, 8],
                    backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#95a5a6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }
};

/* ===============================
   FESTIVAL CHART FUNCTIONS (From admin_home.js)
================================ */
RetailX.parseFestivalData = function() {
    console.log('Parsing festival data...');
    
    const topProductsElement = document.getElementById('top-products-data');
    const leastProductsElement = document.getElementById('least-products-data');
    const festivalNameElement = document.getElementById('detected-festival');
    
    if (!topProductsElement || !leastProductsElement) {
        console.log('Data elements not found');
        return;
    }
    
    const hasFestivalData = festivalNameElement && festivalNameElement.dataset.festival;
    
    if (hasFestivalData) {
        console.log('Festival data detected, parsing...');
        
        try {
            let topProducts = [];
            let leastProducts = [];
            
            // Parse top products
            if (topProductsElement.dataset.products && topProductsElement.dataset.products !== 'None' && topProductsElement.dataset.products !== '[]') {
                try {
                    const rawData = topProductsElement.dataset.products;
                    const cleanedData = rawData.replace(/&quot;/g, '"');
                    topProducts = JSON.parse(cleanedData);
                    console.log('Parsed top products:', topProducts);
                } catch (e) {
                    console.error('Failed to parse top products JSON:', e);
                }
            }
            
            // Parse least products
            if (leastProductsElement.dataset.products && leastProductsElement.dataset.products !== 'None' && leastProductsElement.dataset.products !== '[]') {
                try {
                    const rawData = leastProductsElement.dataset.products;
                    const cleanedData = rawData.replace(/&quot;/g, '"');
                    leastProducts = JSON.parse(cleanedData);
                    console.log('Parsed least products:', leastProducts);
                } catch (e) {
                    console.error('Failed to parse least products JSON:', e);
                }
            }
            
            // Create charts with the data
            RetailX.createFestivalCharts(topProducts, leastProducts);
            
        } catch (e) {
            console.error('Error parsing festival data:', e);
            RetailX.showEmptyCharts();
        }
    }
};

RetailX.createFestivalCharts = function(topProducts, leastProducts) {
    console.log('Creating festival charts with:', { topProducts, leastProducts });
    
    // Format data properly
    const formattedTop = Array.isArray(topProducts) ? topProducts.map(item => ({
        product: item.product || 'Unknown',
        units: parseFloat(item.predicted_sales) || 0
    })) : [];
    
    const formattedLeast = Array.isArray(leastProducts) ? leastProducts.map(item => ({
        product: item.product || 'Unknown',
        units: parseFloat(item.predicted_sales) || 0
    })) : [];
    
    // Create top selling chart
    if (formattedTop.length > 0) {
        RetailX.createHorizontalBarChart(
            'topSellingChart',
            formattedTop,
            '#e67e22',
            'Top Selling Products'
        );
    } else {
        RetailX.showEmptyMessage('topSellingChart', 'No top products data');
    }
    
    // Create least selling chart
    if (formattedLeast.length > 0) {
        RetailX.createHorizontalBarChart(
            'leastSellingChart',
            formattedLeast,
            '#3498db',
            'Least Selling Products'
        );
    } else {
        RetailX.showEmptyMessage('leastSellingChart', 'No least products data');
    }
};

RetailX.createHorizontalBarChart = function(canvasId, data, color, label) {
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
        RetailX.showEmptyMessage(canvasId, 'No prediction data available');
        return;
    }
    
    // Sort data by units descending
    const sortedData = [...data].sort((a, b) => b.units - a.units);
    
    // Prepare chart data
    const labels = sortedData.map(item => {
        return item.product && item.product.length > 20 
            ? item.product.substring(0, 17) + '...' 
            : item.product || 'Unknown';
    });
    
    const values = sortedData.map(item => {
        const val = parseFloat(item.units) || 0;
        return Math.max(0, val);
    });
    
    // Create new chart
    const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expected Units',
                data: values,
                backgroundColor: color + '80', // Add transparency
                borderColor: color,
                borderWidth: 1,
                borderRadius: 5,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const fullProduct = sortedData[context.dataIndex].product || 'Unknown';
                            return fullProduct + ': ' + context.raw.toLocaleString() + ' units';
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
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
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
};

RetailX.showEmptyMessage = function(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Poppins, sans-serif';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText(message || 'No prediction data available', canvas.width/2, canvas.height/2);
    }
};

RetailX.showEmptyCharts = function() {
    RetailX.showEmptyMessage('topSellingChart', 'No prediction data available');
    RetailX.showEmptyMessage('leastSellingChart', 'No prediction data available');
};

/* ===============================
   ACTION FUNCTIONS
================================ */
RetailX.editProduct = function(productId) {
    RetailX.showToast(`Editing product ${productId}`, 'info');
    // Implement edit functionality
};

RetailX.viewProduct = function(productId) {
    RetailX.showToast(`Viewing product ${productId}`, 'info');
    // Implement view functionality
};

RetailX.editStaff = function(staffId) {
    RetailX.showToast(`Editing staff ${staffId}`, 'info');
    // Implement edit functionality
};

RetailX.viewStaff = function(staffId) {
    RetailX.showToast(`Viewing staff ${staffId}`, 'info');
    // Implement view functionality
};

/* ===============================
   UTILITIES
================================ */
RetailX.startClock = function() {
    const update = () => {
        const now = new Date();
        $('#currentDate').text(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        $('#currentTime').text(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    setInterval(update, 1000);
    update();
};

RetailX.showToast = function(message, type = 'info') {
    const toast = $('#toast');
    const colors = { success: '#2ecc71', error: '#e74c3c', info: '#3498db' };
    
    toast.text(message)
         .css('background-color', colors[type] || colors.info)
         .addClass('show');

    setTimeout(() => toast.removeClass('show'), 3000);
};

RetailX.handleFormSubmit = function(objectName) {
    this.showToast(`Saving ${objectName}...`, 'info');
    // Simulate API Delay
    setTimeout(() => {
        $('.modal').fadeOut();
        this.showToast(`${objectName} added successfully!`, 'success');
        this.loadDashboardData();
    }, 1200);
};

RetailX.handleError = function(xhr) {
    if (xhr.status === 401 || xhr.status === 403) {
        this.showToast('Session Expired. Please login.', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    } else {
        this.showToast('Server Communication Error', 'error');
    }
};

// Global "No Back" functionality
function noBack() {
    window.history.forward();
}