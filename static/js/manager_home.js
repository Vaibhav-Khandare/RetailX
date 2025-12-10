// DOM Elements
const elements = {
    // Navigation
    menuItems: document.querySelectorAll('.menu-item'),
    pages: document.querySelectorAll('.page'),
    pageTitle: document.getElementById('pageTitle'),
    breadcrumb: document.getElementById('breadcrumb'),
    
    // Dashboard
    totalRevenue: document.getElementById('totalRevenue'),
    inventoryValue: document.getElementById('inventoryValue'),
    activeStaff: document.getElementById('activeStaff'),
    customerSatisfaction: document.getElementById('customerSatisfaction'),
    activitiesList: document.getElementById('activitiesList'),
    alertsList: document.getElementById('alertsList'),
    
    // Charts
    revenueChart: document.getElementById('revenueChart'),
    categoryChart: document.getElementById('categoryChart'),
    reportChart: document.getElementById('reportChart'),
    
    // Quick Stats
    todayRevenue: document.getElementById('todayRevenue'),
    onlineOrders: document.getElementById('onlineOrders'),
    
    // Time
    currentDate: document.getElementById('currentDate'),
    currentTime: document.getElementById('currentTime'),
    
    // Refresh
    refreshBtn: document.getElementById('refreshBtn'),
    
    // Notifications
    notificationsBtn: document.getElementById('notificationsBtn'),
    
    // Toast
    toast: document.getElementById('toast'),
    
    // Modals
    addProductModal: document.getElementById('addProductModal'),
    addStaffModal: document.getElementById('addStaffModal'),
    notificationModal: document.getElementById('notificationModal'),
    
    // Forms
    addProductForm: document.getElementById('addProductForm'),
    addStaffForm: document.getElementById('addStaffForm')
};

// State Management
let state = {
    currentPage: 'dashboard',
    managerData: {
        name: 'Alex Johnson',
        id: 'MGR001',
        store: 'Main Store',
        location: 'New York, NY',
        contact: '+1 (555) 123-4567'
    },
    charts: {
        revenue: null,
        category: null,
        report: null
    },
    notifications: [],
    staffData: [],
    inventoryData: [],
    activities: []
};

// Sample Data
const sampleData = {
    staff: [
        { id: 'EMP001', name: 'John Doe', role: 'Cashier', phone: '555-0101', shift: 'Morning', status: 'active', performance: 85 },
        { id: 'EMP002', name: 'Jane Smith', role: 'Supervisor', phone: '555-0102', shift: 'Afternoon', status: 'active', performance: 92 },
        { id: 'EMP003', name: 'Bob Wilson', role: 'Stock Clerk', phone: '555-0103', shift: 'Night', status: 'off', performance: 78 },
        { id: 'EMP004', name: 'Alice Brown', role: 'Cashier', phone: '555-0104', shift: 'Morning', status: 'active', performance: 88 }
    ],
    
    inventory: [
        { id: 'PROD001', name: 'Wireless Headphones', category: 'Electronics', stock: 45, price: 199.99, value: 8999.55, status: 'ok' },
        { id: 'PROD002', name: 'Organic Coffee 500g', category: 'Groceries', stock: 120, price: 24.99, value: 2998.80, status: 'ok' },
        { id: 'PROD003', name: 'Premium T-Shirt', category: 'Clothing', stock: 8, price: 49.99, value: 399.92, status: 'low' },
        { id: 'PROD004', name: 'Smart Watch', category: 'Electronics', stock: 0, price: 299.99, value: 0, status: 'out' },
        { id: 'PROD005', name: 'Office Chair', category: 'Home', stock: 25, price: 149.99, value: 3749.75, status: 'ok' }
    ],
    
    activities: [
        { type: 'sales', message: 'Record sale: $2,499.99', time: '10 minutes ago' },
        { type: 'inventory', message: 'Low stock alert: Premium T-Shirt', time: '30 minutes ago' },
        { type: 'staff', message: 'John Doe started shift', time: '1 hour ago' },
        { type: 'sales', message: 'New customer registered', time: '2 hours ago' }
    ],
    
    alerts: [
        { type: 'warning', message: 'Inventory value decreased by 3.2%', time: '1 day ago' },
        { type: 'danger', message: 'Smart Watch out of stock', time: '2 days ago' },
        { type: 'warning', message: 'Server maintenance scheduled', time: '3 days ago' }
    ],
    
    liveSales: [
        { id: 'SALE001', amount: '$249.99', time: '2 min ago', customer: 'John Smith' },
        { id: 'SALE002', amount: '$499.99', time: '5 min ago', customer: 'Jane Doe' },
        { id: 'SALE003', amount: '$99.99', time: '8 min ago', customer: 'Bob Johnson' },
        { id: 'SALE004', amount: '$149.99', time: '12 min ago', customer: 'Alice Brown' }
    ]
};

// Initialize Application
function init() {
    setupEventListeners();
    updateDateTime();
    loadManagerData();
    loadDashboardData();
    setupCharts();
    loadNotifications();
    
    // Set intervals
    setInterval(updateDateTime, 1000);
    setInterval(updateLiveData, 5000);
    
    // Initial data load
    loadStaffData();
    loadInventoryData();
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    elements.menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });
    
    // Refresh button
    elements.refreshBtn.addEventListener('click', refreshData);
    
    // Notifications
    elements.notificationsBtn.addEventListener('click', openNotifications);
    
    // Date range filter
    document.getElementById('applyDateRange')?.addEventListener('click', applyDateRange);
    
    // Inventory actions
    document.getElementById('addProductBtn')?.addEventListener('click', openAddProductModal);
    document.getElementById('importInventoryBtn')?.addEventListener('click', importInventory);
    document.getElementById('exportInventoryBtn')?.addEventListener('click', exportInventory);
    document.getElementById('applyInventoryFilter')?.addEventListener('click', filterInventory);
    
    // Staff actions
    document.getElementById('addStaffBtn')?.addEventListener('click', openAddStaffModal);
    
    // Report actions
    document.getElementById('generateReport')?.addEventListener('click', generateReport);
    document.getElementById('reportPeriod')?.addEventListener('change', toggleCustomRange);
    
    // Schedule controls
    document.getElementById('prevWeekBtn')?.addEventListener('click', prevWeek);
    document.getElementById('nextWeekBtn')?.addEventListener('click', nextWeek);
    document.getElementById('publishScheduleBtn')?.addEventListener('click', publishSchedule);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Cancel buttons
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Form submissions
    if (elements.addProductForm) {
        elements.addProductForm.addEventListener('submit', addProduct);
    }
    
    if (elements.addStaffForm) {
        elements.addStaffForm.addEventListener('submit', addStaff);
    }
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

// Navigation
function navigateToPage(page) {
    // Update active menu item
    elements.menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Update active page
    elements.pages.forEach(p => {
        p.classList.remove('active');
        if (p.id === `${page}-page`) {
            p.classList.add('active');
        }
    });
    
    // Update page title and breadcrumb
    const pageTitles = {
        dashboard: 'Dashboard',
        overview: 'Store Overview',
        inventory: 'Inventory',
        staff: 'Staff Management',
        reports: 'Reports & Analytics',
        transactions: 'Transactions',
        settings: 'Store Settings'
    };
    
    const breadcrumbs = {
        dashboard: 'Home / Dashboard',
        overview: 'Home / Store Overview',
        inventory: 'Home / Inventory Management',
        staff: 'Home / Staff Management',
        reports: 'Home / Reports & Analytics',
        transactions: 'Home / Transactions',
        settings: 'Home / Store Settings'
    };
    
    elements.pageTitle.textContent = pageTitles[page];
    elements.breadcrumb.textContent = breadcrumbs[page];
    state.currentPage = page;
    
    // Load page-specific data
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'overview':
            loadOverviewData();
            break;
        case 'inventory':
            loadInventoryData();
            break;
        case 'staff':
            loadStaffData();
            break;
        case 'reports':
            loadReportData();
            break;
    }
}

// Load Manager Data
function loadManagerData() {
    document.getElementById('managerName').textContent = state.managerData.name;
    document.getElementById('managerId').textContent = `ID: ${state.managerData.id}`;
    document.getElementById('storeName').textContent = state.managerData.store;
    document.getElementById('storeLocation').textContent = state.managerData.location;
    document.getElementById('storeContact').textContent = state.managerData.contact;
}

// Dashboard Functions
function loadDashboardData() {
    // Update KPI cards
    elements.totalRevenue.textContent = '$' + (Math.random() * 100000 + 50000).toFixed(2);
    elements.inventoryValue.textContent = '$' + (Math.random() * 50000 + 20000).toFixed(2);
    elements.activeStaff.textContent = sampleData.staff.filter(s => s.status === 'active').length;
    elements.customerSatisfaction.textContent = (Math.random() * 30 + 70).toFixed(0) + '%';
    
    // Update quick stats
    elements.todayRevenue.textContent = '$' + (Math.random() * 5000 + 2000).toFixed(2);
    elements.onlineOrders.textContent = Math.floor(Math.random() * 20 + 5);
    
    // Load activities
    loadActivities();
    
    // Load alerts
    loadAlerts();
}

function loadActivities() {
    if (!elements.activitiesList) return;
    
    elements.activitiesList.innerHTML = '';
    sampleData.activities.forEach(activity => {
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        activityElement.innerHTML = `
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.message}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;
        elements.activitiesList.appendChild(activityElement);
    });
}

function loadAlerts() {
    if (!elements.alertsList) return;
    
    elements.alertsList.innerHTML = '';
    sampleData.alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert-item';
        alertElement.innerHTML = `
            <div class="alert-icon ${alert.type}">
                <i class="fas fa-${getAlertIcon(alert.type)}"></i>
            </div>
            <div class="alert-content">
                <p>${alert.message}</p>
                <span class="alert-time">${alert.time}</span>
            </div>
        `;
        elements.alertsList.appendChild(alertElement);
    });
}

// Charts Setup
function setupCharts() {
    setupRevenueChart();
    setupCategoryChart();
}

function setupRevenueChart() {
    const ctx = elements.revenueChart?.getContext('2d');
    if (!ctx) return;
    
    if (state.charts.revenue) {
        state.charts.revenue.destroy();
    }
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const revenueData = days.map(() => Math.random() * 10000 + 5000);
    
    state.charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Revenue ($)',
                data: revenueData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
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
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

function setupCategoryChart() {
    const ctx = elements.categoryChart?.getContext('2d');
    if (!ctx) return;
    
    if (state.charts.category) {
        state.charts.category.destroy();
    }
    
    const categories = ['Electronics', 'Clothing', 'Groceries', 'Home', 'Other'];
    const salesData = categories.map(() => Math.random() * 10000 + 2000);
    
    state.charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: salesData,
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#e74c3c',
                    '#f39c12',
                    '#9b59b6'
                ],
                borderWidth: 0
            }]
        },
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

// Overview Page Functions
function loadOverviewData() {
    // Update metrics
    document.getElementById('totalOrders').textContent = Math.floor(Math.random() * 200 + 100);
    document.getElementById('newCustomers').textContent = Math.floor(Math.random() * 50 + 20);
    document.getElementById('returnRate').textContent = (Math.random() * 5 + 1).toFixed(1) + '%';
    document.getElementById('avgOrderValue').textContent = '$' + (Math.random() * 50 + 30).toFixed(2);
    
    // Load staff performance
    loadStaffPerformance();
    
    // Load live sales
    loadLiveSales();
}

function loadStaffPerformance() {
    const tableBody = document.getElementById('staffPerformanceTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    sampleData.staff.forEach(staff => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${staff.name}</td>
            <td>${staff.role}</td>
            <td>$${(Math.random() * 10000 + 5000).toFixed(2)}</td>
            <td>${Math.floor(Math.random() * 50 + 10)}</td>
            <td>
                <div class="performance-bar">
                    <div class="performance-fill" style="width: ${staff.performance}%"></div>
                </div>
                <span style="font-size: 12px; color: #7f8c8d;">${staff.performance}%</span>
            </td>
            <td>
                <button class="table-btn edit-btn" onclick="viewStaffDetails('${staff.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function loadLiveSales() {
    const salesGrid = document.getElementById('liveSalesGrid');
    if (!salesGrid) return;
    
    salesGrid.innerHTML = '';
    sampleData.liveSales.forEach(sale => {
        const saleElement = document.createElement('div');
        saleElement.className = 'live-sale-item';
        saleElement.innerHTML = `
            <h4>${sale.customer}</h4>
            <div class="amount">${sale.amount}</div>
            <div class="time">${sale.time}</div>
            <small>${sale.id}</small>
        `;
        salesGrid.appendChild(saleElement);
    });
}

// Inventory Page Functions
function loadInventoryData() {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    sampleData.inventory.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>$${product.value.toFixed(2)}</td>
            <td>
                <span class="stock-indicator stock-${product.status}">
                    ${product.status === 'ok' ? 'In Stock' : product.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit-btn" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete-btn" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update low stock alerts
    updateLowStockAlerts();
}

function updateLowStockAlerts() {
    const alertsGrid = document.getElementById('lowStockAlerts');
    if (!alertsGrid) return;
    
    const lowStockProducts = sampleData.inventory.filter(p => p.status === 'low' || p.status === 'out');
    
    alertsGrid.innerHTML = '';
    lowStockProducts.forEach(product => {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert-item';
        alertElement.innerHTML = `
            <div class="alert-icon ${product.status === 'out' ? 'danger' : 'warning'}">
                <i class="fas fa-${product.status === 'out' ? 'times' : 'exclamation'}"></i>
            </div>
            <div class="alert-content">
                <p><strong>${product.name}</strong> - ${product.status === 'out' ? 'Out of stock' : 'Low stock'}</p>
                <span class="alert-time">Stock: ${product.stock} units</span>
            </div>
            <button class="reorder-btn" onclick="reorderProduct('${product.id}')">
                <i class="fas fa-shopping-cart"></i>
            </button>
        `;
        alertsGrid.appendChild(alertElement);
    });
}

function filterInventory() {
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;
    
    const filtered = sampleData.inventory.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                             product.id.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesStock = !stockFilter || 
            (stockFilter === 'low' && product.stock < 10) ||
            (stockFilter === 'out' && product.stock === 0) ||
            (stockFilter === 'high' && product.stock > 50);
        
        return matchesSearch && matchesCategory && matchesStock;
    });
    
    // Update table with filtered results
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    filtered.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>$${product.value.toFixed(2)}</td>
            <td>
                <span class="stock-indicator stock-${product.status}">
                    ${product.status === 'ok' ? 'In Stock' : product.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit-btn" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete-btn" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Staff Page Functions
function loadStaffData() {
    // Update summary cards
    document.getElementById('totalActiveStaff').textContent = 
        sampleData.staff.filter(s => s.status === 'active').length;
    document.getElementById('onDutyToday').textContent = 
        Math.floor(Math.random() * sampleData.staff.length);
    document.getElementById('avgHoursWeek').textContent = 
        (Math.random() * 10 + 30).toFixed(1);
    document.getElementById('payrollDue').textContent = 
        '$' + (Math.random() * 5000 + 3000).toFixed(2);
    
    // Load staff table
    const tableBody = document.getElementById('staffTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    sampleData.staff.forEach(staff => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${staff.id}</td>
            <td>${staff.name}</td>
            <td>${staff.role}</td>
            <td>${staff.phone}</td>
            <td>${staff.shift}</td>
            <td>
                <span class="staff-status status-${staff.status}">
                    ${staff.status === 'active' ? 'Active' : 'Off Duty'}
                </span>
            </td>
            <td>
                <div class="performance-bar">
                    <div class="performance-fill" style="width: ${staff.performance}%"></div>
                </div>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit-btn" onclick="editStaff('${staff.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete-btn" onclick="deleteStaff('${staff.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Load schedule
    loadSchedule();
}

function loadSchedule() {
    const scheduleContainer = document.getElementById('weeklySchedule');
    if (!scheduleContainer) return;
    
    // Generate schedule HTML
    scheduleContainer.innerHTML = `
        <table class="schedule-table">
            <thead>
                <tr>
                    <th>Staff</th>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                    <th>Sun</th>
                </tr>
            </thead>
            <tbody>
                ${sampleData.staff.map(staff => `
                    <tr>
                        <td>${staff.name}</td>
                        <td>${generateShift()}</td>
                        <td>${generateShift()}</td>
                        <td>${generateShift()}</td>
                        <td>${generateShift()}</td>
                        <td>${generateShift()}</td>
                        <td>${generateShift()}</td>
                        <td>Off</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generateShift() {
    const shifts = ['9-5', '12-8', 'Off'];
    return shifts[Math.floor(Math.random() * shifts.length)];
}

// Reports Page Functions
function loadReportData() {
    // Set default report period
    const today = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('reportPeriodLabel').textContent = 
        `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    
    // Update report metrics
    document.getElementById('reportTotalSales').textContent = 
        '$' + (Math.random() * 50000 + 20000).toFixed(2);
    document.getElementById('reportAvgOrder').textContent = 
        '$' + (Math.random() * 50 + 30).toFixed(2);
    document.getElementById('reportConversionRate').textContent = 
        (Math.random() * 10 + 15).toFixed(1) + '%';
    
    // Setup report chart
    setupReportChart();
}

function setupReportChart() {
    const ctx = elements.reportChart?.getContext('2d');
    if (!ctx) return;
    
    if (state.charts.report) {
        state.charts.report.destroy();
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesData = months.map(() => Math.random() * 20000 + 10000);
    
    state.charts.report = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Monthly Sales ($)',
                data: salesData,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
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
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'k';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function toggleCustomRange() {
    const periodSelect = document.getElementById('reportPeriod');
    const customRangeGroup = document.getElementById('customRangeGroup');
    
    if (periodSelect.value === 'custom') {
        customRangeGroup.style.display = 'flex';
    } else {
        customRangeGroup.style.display = 'none';
    }
}

// Modal Functions
function openAddProductModal() {
    elements.addProductModal.style.display = 'flex';
}

function openAddStaffModal() {
    elements.addStaffModal.style.display = 'flex';
}

function openNotifications() {
    elements.notificationModal.style.display = 'flex';
    loadNotificationList();
}

function loadNotificationList() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    
    const notifications = [
        { type: 'info', message: 'Inventory audit scheduled for tomorrow', time: '2 hours ago' },
        { type: 'warning', message: '3 products running low on stock', time: '1 day ago' },
        { type: 'success', message: 'Monthly sales target achieved', time: '2 days ago' },
        { type: 'info', message: 'New staff member joined the team', time: '3 days ago' },
        { type: 'warning', message: 'System maintenance scheduled for Sunday', time: '4 days ago' }
    ];
    
    notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification-item';
        notificationElement.innerHTML = `
            <div class="notification-icon ${notification.type}">
                <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <p>${notification.message}</p>
                <span class="notification-time">${notification.time}</span>
            </div>
        `;
        notificationList.appendChild(notificationElement);
    });
}

// Form Handlers
function addProduct(e) {
    e.preventDefault();
    
    const product = {
        id: document.getElementById('productSku').value,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        stock: parseInt(document.getElementById('stockQuantity').value),
        price: parseFloat(document.getElementById('sellingPrice').value),
        value: parseFloat(document.getElementById('sellingPrice').value) * parseInt(document.getElementById('stockQuantity').value),
        status: parseInt(document.getElementById('stockQuantity').value) < 10 ? 'low' : 'ok'
    };
    
    // Add to sample data
    sampleData.inventory.push(product);
    
    // Close modal
    elements.addProductModal.style.display = 'none';
    
    // Reset form
    elements.addProductForm.reset();
    
    // Reload inventory data
    if (state.currentPage === 'inventory') {
        loadInventoryData();
    }
    
    // Show success message
    showToast(`Product "${product.name}" added successfully!`, 'success');
    
    // Add activity
    sampleData.activities.unshift({
        type: 'inventory',
        message: `Added new product: ${product.name}`,
        time: 'Just now'
    });
    
    if (state.currentPage === 'dashboard') {
        loadActivities();
    }
}

function addStaff(e) {
    e.preventDefault();
    
    const staff = {
        id: 'EMP' + String(Math.floor(Math.random() * 900) + 100).padStart(3, '0'),
        name: `${document.getElementById('staffFirstName').value} ${document.getElementById('staffLastName').value}`,
        role: document.getElementById('staffRole').value,
        phone: document.getElementById('staffPhone').value,
        shift: ['Morning', 'Afternoon', 'Night'][Math.floor(Math.random() * 3)],
        status: 'active',
        performance: Math.floor(Math.random() * 30) + 70
    };
    
    // Add to sample data
    sampleData.staff.push(staff);
    
    // Close modal
    elements.addStaffModal.style.display = 'none';
    
    // Reset form
    elements.addStaffForm.reset();
    
    // Reload staff data
    if (state.currentPage === 'staff') {
        loadStaffData();
    }
    
    // Show success message
    showToast(`Staff member "${staff.name}" added successfully!`, 'success');
    
    // Add activity
    sampleData.activities.unshift({
        type: 'staff',
        message: `Added new staff member: ${staff.name}`,
        time: 'Just now'
    });
    
    if (state.currentPage === 'dashboard') {
        loadActivities();
    }
}

// Action Functions
function refreshData() {
    showToast('Refreshing data...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        switch(state.currentPage) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'overview':
                loadOverviewData();
                break;
            case 'inventory':
                loadInventoryData();
                break;
            case 'staff':
                loadStaffData();
                break;
            case 'reports':
                loadReportData();
                break;
        }
        
        showToast('Data refreshed successfully!', 'success');
    }, 1000);
}

function applyDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showToast('Please select both start and end dates', 'error');
        return;
    }
    
    showToast(`Loading data from ${startDate} to ${endDate}...`, 'info');
    
    // In a real app, this would fetch data from the API
    setTimeout(() => {
        loadOverviewData();
        showToast('Data loaded successfully!', 'success');
    }, 1500);
}

function importInventory() {
    // Simulate file import
    showToast('Importing inventory data...', 'info');
    
    setTimeout(() => {
        // Add some sample imported products
        const importedProducts = [
            { id: 'PROD006', name: 'Bluetooth Speaker', category: 'Electronics', stock: 30, price: 89.99, value: 2699.70, status: 'ok' },
            { id: 'PROD007', name: 'Yoga Mat', category: 'Home', stock: 25, price: 29.99, value: 749.75, status: 'ok' }
        ];
        
        sampleData.inventory.push(...importedProducts);
        
        if (state.currentPage === 'inventory') {
            loadInventoryData();
        }
        
        showToast('2 products imported successfully!', 'success');
    }, 2000);
}

function exportInventory() {
    // Simulate export
    showToast('Exporting inventory data...', 'info');
    
    setTimeout(() => {
        // In a real app, this would generate and download a CSV file
        const csvContent = sampleData.inventory.map(p => 
            `${p.id},${p.name},${p.category},${p.stock},${p.price},${p.value}`
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_export.csv';
        a.click();
        
        showToast('Inventory exported successfully!', 'success');
    }, 1000);
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportPeriod = document.getElementById('reportPeriod').value;
    
    showToast(`Generating ${reportType} report for ${reportPeriod}...`, 'info');
    
    setTimeout(() => {
        // Update report title
        const reportTitle = document.getElementById('reportTitle');
        const titles = {
            sales: 'Sales Report',
            inventory: 'Inventory Report',
            staff: 'Staff Performance Report',
            customer: 'Customer Analytics Report'
        };
        reportTitle.textContent = titles[reportType];
        
        // Update period label
        const periodLabel = document.getElementById('reportPeriodLabel');
        const periods = {
            today: 'Today',
            yesterday: 'Yesterday',
            week: 'This Week',
            month: 'This Month',
            quarter: 'This Quarter',
            year: 'This Year',
            custom: 'Custom Range'
        };
        periodLabel.textContent = periods[reportPeriod];
        
        // Update metrics based on report type
        if (reportType === 'sales') {
            document.getElementById('reportTotalSales').textContent = 
                '$' + (Math.random() * 50000 + 20000).toFixed(2);
            document.getElementById('reportAvgOrder').textContent = 
                '$' + (Math.random() * 50 + 30).toFixed(2);
            document.getElementById('reportTopCategory').textContent = 
                ['Electronics', 'Clothing', 'Groceries'][Math.floor(Math.random() * 3)];
            document.getElementById('reportConversionRate').textContent = 
                (Math.random() * 10 + 15).toFixed(1) + '%';
        }
        
        showToast('Report generated successfully!', 'success');
    }, 2000);
}

function prevWeek() {
    // Navigate to previous week
    showToast('Loading previous week...', 'info');
    setTimeout(() => loadSchedule(), 500);
}

function nextWeek() {
    // Navigate to next week
    showToast('Loading next week...', 'info');
    setTimeout(() => loadSchedule(), 500);
}

function publishSchedule() {
    showToast('Publishing schedule to staff...', 'info');
    
    setTimeout(() => {
        showToast('Schedule published successfully! Staff notified.', 'success');
        
        // Add activity
        sampleData.activities.unshift({
            type: 'staff',
            message: 'Weekly schedule published',
            time: 'Just now'
        });
        
        if (state.currentPage === 'dashboard') {
            loadActivities();
        }
    }, 1500);
}

// CRUD Operations
function editProduct(productId) {
    const product = sampleData.inventory.find(p => p.id === productId);
    if (product) {
        openAddProductModal();
        // In a real app, populate form with product data
        showToast(`Editing ${product.name}`, 'info');
    }
}

function deleteProduct(productId) {
    const product = sampleData.inventory.find(p => p.id === productId);
    if (!product) return;
    
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
        const index = sampleData.inventory.findIndex(p => p.id === productId);
        sampleData.inventory.splice(index, 1);
        
        if (state.currentPage === 'inventory') {
            loadInventoryData();
        }
        
        showToast(`Product "${product.name}" deleted successfully!`, 'success');
        
        // Add activity
        sampleData.activities.unshift({
            type: 'inventory',
            message: `Deleted product: ${product.name}`,
            time: 'Just now'
        });
        
        if (state.currentPage === 'dashboard') {
            loadActivities();
        }
    }
}

function reorderProduct(productId) {
    const product = sampleData.inventory.find(p => p.id === productId);
    if (product) {
        showToast(`Reorder request sent for ${product.name}`, 'info');
        
        // Simulate reorder
        setTimeout(() => {
            product.stock += 50;
            product.status = 'ok';
            product.value = product.stock * product.price;
            
            if (state.currentPage === 'inventory') {
                loadInventoryData();
            }
            
            showToast(`${product.name} restocked to 50 units`, 'success');
        }, 2000);
    }
}

function viewStaffDetails(staffId) {
    const staff = sampleData.staff.find(s => s.id === staffId);
    if (staff) {
        showToast(`Viewing details for ${staff.name}`, 'info');
        // In a real app, this would open a detailed view modal
    }
}

function editStaff(staffId) {
    const staff = sampleData.staff.find(s => s.id === staffId);
    if (staff) {
        openAddStaffModal();
        // In a real app, populate form with staff data
        showToast(`Editing ${staff.name}`, 'info');
    }
}

function deleteStaff(staffId) {
    const staff = sampleData.staff.find(s => s.id === staffId);
    if (!staff) return;
    
    if (confirm(`Are you sure you want to delete ${staff.name} from staff?`)) {
        const index = sampleData.staff.findIndex(s => s.id === staffId);
        sampleData.staff.splice(index, 1);
        
        if (state.currentPage === 'staff') {
            loadStaffData();
        }
        
        showToast(`Staff member "${staff.name}" deleted successfully!`, 'success');
        
        // Add activity
        sampleData.activities.unshift({
            type: 'staff',
            message: `Removed staff member: ${staff.name}`,
            time: 'Just now'
        });
        
        if (state.currentPage === 'dashboard') {
            loadActivities();
        }
    }
}

// Helper Functions
function updateDateTime() {
    const now = new Date();
    
    // Update date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDate.textContent = now.toLocaleDateString('en-US', options);
    
    // Update time
    elements.currentTime.textContent = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

function updateLiveData() {
    if (state.currentPage === 'overview') {
        // Update live sales with random data
        const salesGrid = document.getElementById('liveSalesGrid');
        if (salesGrid && Math.random() > 0.7) { // 30% chance of new sale
            const newSale = {
                id: 'SALE' + String(Math.floor(Math.random() * 900) + 100).padStart(3, '0'),
                amount: '$' + (Math.random() * 500 + 50).toFixed(2),
                time: 'Just now',
                customer: ['Customer', 'Guest', 'Member'][Math.floor(Math.random() * 3)] + ' #' + Math.floor(Math.random() * 1000)
            };
            
            sampleData.liveSales.unshift(newSale);
            if (sampleData.liveSales.length > 4) {
                sampleData.liveSales.pop();
            }
            
            loadLiveSales();
        }
    }
}

function getActivityIcon(type) {
    const icons = {
        sales: 'dollar-sign',
        inventory: 'boxes',
        staff: 'users'
    };
    return icons[type] || 'bell';
}

function getAlertIcon(type) {
    const icons = {
        warning: 'exclamation-triangle',
        danger: 'times-circle',
        info: 'info-circle',
        success: 'check-circle'
    };
    return icons[type] || 'bell';
}

function getNotificationIcon(type) {
    const icons = {
        info: 'info-circle',
        warning: 'exclamation-triangle',
        success: 'check-circle',
        error: 'times-circle'
    };
    return icons[type] || 'bell';
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = 'toast';
    
    // Set color based on type
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    elements.toast.style.backgroundColor = colors[type] || colors.info;
    elements.toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showToast('Logging out...', 'info');
        setTimeout(() => {
            // In a real app, this would redirect to login page
            alert('Logged out successfully. Redirecting to login...');
            // window.location.href = '/manager_login';
        }, 1500);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally for inline onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.reorderProduct = reorderProduct;
window.viewStaffDetails = viewStaffDetails;
window.editStaff = editStaff;
window.deleteStaff = deleteStaff;