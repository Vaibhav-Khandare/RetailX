// Global Variables
let currentUser = 'admin@retailx.com';
let salesChart, analyticsChart, categoryChart;
let notificationCount = 3;

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
        if (document.querySelector('#dashboard') && document.querySelector('#dashboard').classList.contains('active')) {
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
    // User Form
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            // e.preventDefault();                    // bro note that this function is blocking the POST method so keep it commented !! 
            saveUser();
        });
    }
    
    // Product Form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            // e.preventDefault();                 // bro POST method ko yhi block kr rha hai
            saveProduct();
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
    hideLoading();
    // Simulate API data
    // const stats = {
    //     totalUsers: djangouser,
    //     totalProducts: djangouser,
    //     todayRevenue: djangouser,
    //     lowStockCount:,
    //     stockValue: 45280,
    //     monthlyTurnover: 2.8
    // };
    const stats={}
    // Update DOM
    // const totalUsersElement = document.getElementById('totalUsers');
    // const totalProductsElement = document.getElementById('totalProducts');
    const todayRevenueElement = document.getElementById('todayRevenue');
    const lowStockCountElement = document.getElementById('lowStockCount');
    const totalStockValueElement = document.getElementById('totalStockValue');
    const lowStockItemsElement = document.getElementById('lowStockItems');
    const monthlyTurnoverElement = document.getElementById('monthlyTurnover');
    
    if (totalUsersElement) totalUsersElement.textContent = stats.totalUsers;
    if (totalProductsElement) totalProductsElement.textContent = stats.totalProducts;
    if (todayRevenueElement) todayRevenueElement.textContent = `$${stats.todayRevenue.toLocaleString()}`;
    if (lowStockCountElement) lowStockCountElement.textContent = stats.lowStockCount;
    if (totalStockValueElement) totalStockValueElement.textContent = `$${stats.stockValue.toLocaleString()}`;
    if (lowStockItemsElement) lowStockItemsElement.textContent = `${stats.lowStockCount} items`;
    if (monthlyTurnoverElement) monthlyTurnoverElement.textContent = `${stats.monthlyTurnover}x`;
}

// AJAX Load Users
function loadUsers() {
    showLoading();
    
    // Simulate API call
    setTimeout(() => {
        const users = [
                { id: 1, name: 'John Doe', email: 'john@retailx.com', role: 'admin', status: 'active', lastLogin: '2024-01-15 14:30' },
                { id: 2, name: 'Jane Smith', email: 'jane@retailx.com', role: 'manager', status: 'active', lastLogin: '2024-01-15 10:15' },
                { id: 3, name: 'Bob Wilson', email: 'bob@retailx.com', role: 'cashier', status: 'active', lastLogin: '2024-01-14 16:45' },
                { id: 4, name: 'Alice Brown', email: 'alice@retailx.com', role: 'cashier', status: 'inactive', lastLogin: '2024-01-10 09:20' },
                { id: 5, name: 'Charlie Davis', email: 'charlie@retailx.com', role: 'manager', status: 'pending', lastLogin: '2024-01-13 11:30' }
        ];
        
        renderUsersTable(users);
        hideLoading();
    }, 1000);
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="user-checkbox" value="${user.id}"></td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="status-badge">${user.role}</span></td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>${user.lastLogin}</td>
            <td>
                <button class="action-btn small" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn small" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="action-btn small" onclick="resetUserPassword(${user.id})">
                    <i class="fas fa-key"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// AJAX Load Products
function loadProducts() {
    showLoading();
    
    setTimeout(() => {
        const products = [
            { id: 1, name: 'Laptop Pro', category: 'electronics', price: 1299.99, stock: 45, minStock: 10, sku: 'LP-2024' },
            { id: 2, name: 'Wireless Mouse', category: 'electronics', price: 29.99, stock: 120, minStock: 50, sku: 'WM-101' },
            { id: 3, name: 'T-Shirt', category: 'clothing', price: 19.99, stock: 5, minStock: 20, sku: 'TS-001' },
            { id: 4, name: 'Coffee Maker', category: 'home', price: 89.99, stock: 25, minStock: 15, sku: 'CM-500' },
            { id: 5, name: 'Organic Coffee', category: 'groceries', price: 12.99, stock: 80, minStock: 30, sku: 'OC-200' }
        ];
        
        renderProductsGrid(products);
        
        // Update category filter
        updateCategoryFilter(products);
        
        hideLoading();
    }, 1000);
}

function renderProductsGrid(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    products.forEach(product => {
        let stockClass = 'high';
        if (product.stock <= product.minStock) {
            stockClass = 'low';
        }
        if (product.stock === 0) {
            stockClass = 'out';
        }
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <i class="fas fa-box fa-3x"></i>
            </div>
            <div class="product-info">
                <h4 class="product-title">${product.name}</h4>
                <p class="product-category">${product.category}</p>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <div class="product-stock">
                    <span>SKU: ${product.sku}</span>
                    <span class="stock-level ${stockClass}">${product.stock} units</span>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="action-btn small" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn small" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn small" onclick="viewProductDetails(${product.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// AJAX Load Inventory
function loadInventory() {
    showLoading();
    
    setTimeout(() => {
        const inventory = [
            { id: 1, name: 'Laptop Pro', sku: 'LP-2024', current: 45, min: 10, status: 'In Stock', lastUpdated: '2024-01-15' },
            { id: 2, name: 'Wireless Mouse', sku: 'WM-101', current: 120, min: 50, status: 'In Stock', lastUpdated: '2024-01-15' },
            { id: 3, name: 'T-Shirt', sku: 'TS-001', current: 5, min: 20, status: 'Low Stock', lastUpdated: '2024-01-14' },
            { id: 4, name: 'Coffee Maker', sku: 'CM-500', current: 25, min: 15, status: 'In Stock', lastUpdated: '2024-01-15' },
            { id: 5, name: 'Organic Coffee', sku: 'OC-200', current: 80, min: 30, status: 'In Stock', lastUpdated: '2024-01-13' }
        ];
        
        renderInventoryTable(inventory);
        hideLoading();
    }, 1000);
}

function renderInventoryTable(inventory) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    inventory.forEach(item => {
        let statusClass = 'status-active';
        if (item.status === 'Low Stock') {
            statusClass = 'status-pending';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.sku}</td>
            <td>${item.current}</td>
            <td>${item.min}</td>
            <td><span class="status-badge ${statusClass}">${item.status}</span></td>
            <td>${item.lastUpdated}</td>
            <td>
                <button class="action-btn small" onclick="adjustStock(${item.id})">
                    <i class="fas fa-edit"></i> Adjust
                </button>
                <button class="action-btn small" onclick="viewInventoryHistory(${item.id})">
                    <i class="fas fa-history"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// AJAX Load Analytics
function loadAnalytics() {
    showLoading();
    
    setTimeout(() => {
        initAnalyticsChart();
        initCategoryChart();
        loadPredictionData();
        loadReportsTable();
        hideLoading();
    }, 1000);
}

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
        name: document.getElementById('userName')?.value || '',
        email: document.getElementById('userEmail')?.value || '',
        role: document.getElementById('userRole')?.value || '',
        password: document.getElementById('userPassword')?.value || '',
        status: document.getElementById('userStatus')?.value || 'active'
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
        name: document.getElementById('productName')?.value || '',
        category: document.getElementById('productCategory')?.value || '',
        sku: document.getElementById('productSKU')?.value || '',
        price: parseFloat(document.getElementById('productPrice')?.value || 0),
        stock: parseInt(document.getElementById('productStock')?.value || 0),
        minStock: parseInt(document.getElementById('productMinStock')?.value || 0),
        description: document.getElementById('productDescription')?.value || ''
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
        type: document.getElementById('adjustmentType')?.value || '',
        productId: document.getElementById('inventoryProduct')?.value || '',
        quantity: parseInt(document.getElementById('adjustmentQuantity')?.value || 0),
        reason: document.getElementById('adjustmentReason')?.value || '',
        date: document.getElementById('adjustmentDate')?.value || ''
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

function filterUsers() {
    const filterValue = document.getElementById('userFilter')?.value;
    showLoading();
    
    setTimeout(() => {
        // In real app, this would be an API call with filter parameter
        loadUsers();
        hideLoading();
    }, 500);
}

function searchUsers() {
    const searchValue = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? '' : 'none';
    });
}

function filterProducts() {
    showLoading();
    
    setTimeout(() => {
        loadProducts();
        hideLoading();
    }, 500);
}

function updateCategoryFilter(products) {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;
    
    const categories = [...new Set(products.map(p => p.category))];
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        filter.appendChild(option);
    });
}

function loadProductDropdown() {
    const select = document.getElementById('inventoryProduct');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Product</option>';
    
    // Simulate loading products
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
        setTimeout(() => {
            showToast('Passwords reset successfully!', 'success');
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
function editUser(id) {
    showToast(`Edit user ${id} - Feature coming soon!`, 'info');
}

function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        showLoading();
        setTimeout(() => {
            showToast('User deleted successfully!', 'success');
            loadUsers();
            hideLoading();
        }, 1000);
    }
}

function resetUserPassword(id) {
    if (confirm('Reset password for this user?')) {
        showLoading();
        setTimeout(() => {
            showToast('Password reset email sent!', 'success');
            hideLoading();
        }, 1000);
    }
}

function editProduct(id) {
    showToast(`Edit product ${id} - Feature coming soon!`, 'info');
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        showLoading();
        setTimeout(() => {
            showToast('Product deleted successfully!', 'success');
            loadProducts();
            hideLoading();
        }, 1000);
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
    const period = document.getElementById('salesPeriod')?.value;
    showLoading();
    
    setTimeout(() => {
        initSalesChart();
        hideLoading();
    }, 500);
}

function updateAnalytics() {
    const period = document.getElementById('reportPeriod')?.value;
    showLoading();
    
    setTimeout(() => {
        initAnalyticsChart();
        initCategoryChart();
        hideLoading();
    }, 500);
}

function saveSettings() {
    const settings = {
        emailNotifications: document.getElementById('emailNotifications')?.checked || false,
        lowStockAlerts: document.getElementById('lowStockAlerts')?.checked || false,
        newUserAlerts: document.getElementById('newUserAlerts')?.checked || false
    };
    
    localStorage.setItem('retailx-settings', JSON.stringify(settings));
    showToast('Settings saved!', 'success');
}