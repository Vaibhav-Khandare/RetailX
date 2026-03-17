// supplier_home.js - All JavaScript for supplier dashboard

// ========== GLOBAL VARIABLES ==========
let revenueChart, ordersChart, salesTrendChart, topProductsChart;
let currentProductId = null;
let currentOrderId = null;



// ========== LOGOUT FUNCTIONALITY ==========
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    const logoutUrl = this.getAttribute('data-url');
    Swal.fire({
        title: 'Ready to leave?',
        text: 'You are about to logout from your supplier dashboard',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Stay',
        background: 'rgba(15, 23, 42, 0.95)',
        backdrop: 'rgba(0,0,0,0.5)',
        color: '#fff',
        showClass: { popup: 'animate__animated animate__fadeInDown' },
        hideClass: { popup: 'animate__animated animate__fadeOutUp' },
        customClass: { popup: 'glass-modal' }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Logging out...',
                html: 'Please wait while we securely log you out',
                timer: 1500,
                timerProgressBar: true,
                didOpen: () => Swal.showLoading(),
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#fff',
            }).then(() => {
                window.location.href = logoutUrl;
            });
        }
    });
});

// ========== SETTINGS BUTTON ==========
window.openSettings = function() {
    switchTab('profile');
    const settingsItems = document.querySelectorAll('.settings-item');
    if (settingsItems.length) {
        settingsItems[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        settingsItems[0].style.animation = 'pulse 1s';
        setTimeout(() => settingsItems[0].style.animation = '', 1000);
    }
};

// ========== TAB SWITCHING ==========
const tabs = document.querySelectorAll('.tab-btn');
const panes = document.querySelectorAll('.tab-pane');

window.switchTab = function(tabId) {
    tabs.forEach(t => t.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));

    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    const activePane = document.getElementById(tabId);

    if (activeTab && activePane) {
        activeTab.classList.add('active');
        activePane.classList.add('active');
        
        // Refresh data when switching to certain tabs
        if (tabId === 'products') loadProducts();
        else if (tabId === 'orders') loadOrders();
        else if (tabId === 'payments') loadPayments();
        else if (tabId === 'analytics') loadAnalytics();
        else if (tabId === 'profile') loadProfile();
        else if (tabId === 'overview') loadOverviewStats();
    }
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        switchTab(tabId);
    });
});

// ========== THEME TOGGLE ==========
const themeToggle = document.getElementById('themeToggle');
const icon = themeToggle?.querySelector('i');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    if (icon) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

themeToggle?.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    if (body.classList.contains('dark-theme')) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'dark');
        Swal.fire({
            icon: 'success', title: 'Dark mode activated', toast: true,
            position: 'top-end', showConfirmButton: false, timer: 2000,
            timerProgressBar: true, background: '#1f2937', color: '#fff'
        });
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'light');
        Swal.fire({
            icon: 'success', title: 'Light mode activated', toast: true,
            position: 'top-end', showConfirmButton: false, timer: 2000,
            timerProgressBar: true, background: '#fff', color: '#333'
        });
    }
});

// ========== CUSTOM CURSOR ==========
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');

if (cursor && follower) {
    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0, followerX = 0, followerY = 0;
    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    function animate() {
        cursorX += (mouseX - cursorX) * 0.3;
        cursorY += (mouseY - cursorY) * 0.3;
        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        follower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animate);
    }
    animate();

    const hoverElements = document.querySelectorAll('a, button, .tab-btn, .view-all-btn, .action-btn, .logout-btn, .theme-toggle, .stat-card, .settings-btn, .info-item');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%) scale(1.5)`;
            cursor.style.backgroundColor = 'rgba(67, 97, 238, 0.2)';
            follower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%) scale(1.2)`;
            follower.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%) scale(1)`;
            cursor.style.backgroundColor = 'transparent';
            follower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%) scale(1)`;
            follower.style.backgroundColor = 'rgba(67, 97, 238, 0.2)';
        });
    });
}

// ========== NOTIFICATION SYSTEM ==========
const notificationBtn = document.getElementById('notificationBtn');
const notificationDropdown = document.getElementById('notificationDropdown');
const notificationBadge = document.getElementById('notificationBadge');
const notificationList = document.getElementById('notificationList');
const markAllReadBtn = document.getElementById('markAllRead');

notificationBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle('show');
    if (notificationDropdown.classList.contains('show')) {
        loadNotifications();
    }
});

document.addEventListener('click', (e) => {
    if (!notificationDropdown?.contains(e.target) && !notificationBtn?.contains(e.target)) {
        notificationDropdown?.classList.remove('show');
    }
});

async function loadNotifications() {
    try {
        const response = await fetch('/api/supplier/notifications/');
        const data = await response.json();
        updateNotificationBadge(data.unread_count);
        renderNotifications(data.notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBadge(count) {
    if (notificationBadge) {
        notificationBadge.textContent = count;
        notificationBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function renderNotifications(notifications) {
    if (!notificationList) return;
    if (!notifications.length) {
        notificationList.innerHTML = '<div class="notification-empty">No notifications</div>';
        return;
    }
    notificationList.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" onclick="markNotificationRead(${n.id})">
            <div class="title">${n.title}</div>
            <div class="message">${n.message}</div>
            <div class="time">${n.created_at}</div>
        </div>
    `).join('');
}

async function markNotificationRead(id) {
    try {
        await fetch(`/api/supplier/notifications/${id}/read/`, { method: 'POST' });
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
}

markAllReadBtn?.addEventListener('click', async () => {
    try {
        await fetch('/api/supplier/notifications/mark-all-read/', { method: 'POST' });
        loadNotifications();
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
});

// ========== DASHBOARD STATS ==========
async function loadOverviewStats() {
    try {
        const response = await fetch('/api/supplier/dashboard/stats/');
        const data = await response.json();
        
        // Update banner stats
        document.getElementById('totalOrders').textContent = data.total_orders;
        document.getElementById('totalRevenue').textContent = `₹ ${data.total_revenue.toLocaleString()}`;
        document.getElementById('activeProducts').textContent = data.active_products;
        
        // Update stats grid
        const statsGrid = document.getElementById('overviewStats');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon"><i class="fas fa-boxes"></i></div>
                        <span class="stat-badge-trend">${data.total_products}</span>
                    </div>
                    <div class="stat-value">${data.total_products}</div>
                    <div class="stat-label">Total Products</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
                        <span class="stat-badge-trend">${data.pending_orders}</span>
                    </div>
                    <div class="stat-value">${data.total_orders}</div>
                    <div class="stat-label">Total Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <span class="stat-badge-trend">${data.completed_orders}</span>
                    </div>
                    <div class="stat-value">${data.completed_orders}</div>
                    <div class="stat-label">Completed Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <span class="stat-badge-trend negative">${data.low_stock_count}</span>
                    </div>
                    <div class="stat-value">${data.low_stock_count}</div>
                    <div class="stat-label">Low Stock Items</div>
                </div>
            `;
        }
        
        // Update recent orders table
        const recentOrdersTbody = document.querySelector('#recentOrdersTable tbody');
        if (recentOrdersTbody && data.recent_orders) {
            recentOrdersTbody.innerHTML = data.recent_orders.map(order => `
                <tr>
                    <td>${order.order_number}</td>
                    <td>${order.product__name}</td>
                    <td>${order.quantity}</td>
                    <td>₹ ${order.total_amount}</td>
                    <td><span class="status-badge ${order.status}">${order.status}</span></td>
                    <td>${new Date(order.order_date).toLocaleDateString()}</td>
                    <td><button class="action-btn view" onclick="viewOrder('${order.order_number}')"><i class="fas fa-eye"></i></button></td>
                </tr>
            `).join('');
        }
        
        // Update charts
        updateRevenueChart();
        updateOrdersChart(data);
    } catch (error) {
        console.error('Error loading overview stats:', error);
    }
}

// ========== CHARTS ==========
function updateRevenueChart() {
    const ctx = document.getElementById('revenueChart')?.getContext('2d');
    if (!ctx) return;
    
    // Sample data - replace with actual API call
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [12000, 19000, 15000, 25000, 22000, 30000, 28000];
    
    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: data,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#8b5cf6',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } }
            }
        }
    });
}

function updateOrdersChart(stats) {
    const ctx = document.getElementById('ordersChart')?.getContext('2d');
    if (!ctx) return;
    
    // Use status counts from API if available
    const statusCounts = stats.status_counts || [
        { status: 'pending', count: 5 },
        { status: 'processing', count: 8 },
        { status: 'delivered', count: 12 }
    ];
    
    const labels = statusCounts.map(s => s.status);
    const data = statusCounts.map(s => s.count);
    const colors = {
        pending: '#f59e0b',
        processing: '#3b82f6',
        delivered: '#10b981',
        cancelled: '#ef4444'
    };
    
    if (ordersChart) ordersChart.destroy();
    ordersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: labels.map(l => colors[l] || '#8b5cf6'),
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 12 } }
                }
            },
            cutout: '70%'
        }
    });
}

// ========== PRODUCT MANAGEMENT ==========
let productsData = [];

async function loadProducts() {
    try {
        const response = await fetch('/api/supplier/products/');
        const data = await response.json();
        productsData = data.products;
        renderProducts(productsData);
        updateCategoryFilter();
        checkLowStock();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProducts(products) {
    const tbody = document.querySelector('#productsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.sku}</td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>₹ ${p.price}</td>
            <td>${p.stock_quantity} ${p.unit}</td>
            <td><span class="status-badge ${p.is_active ? 'active' : 'inactive'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="action-btn edit" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function updateCategoryFilter() {
    const filter = document.getElementById('productCategoryFilter');
    if (!filter) return;
    const categories = [...new Set(productsData.map(p => p.category))];
    filter.innerHTML = '<option value="">All Categories</option>' + 
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function checkLowStock() {
    const lowStock = productsData.filter(p => p.stock_quantity < p.min_stock_level && p.is_active);
    const alertDiv = document.getElementById('lowStockAlert');
    if (alertDiv) {
        if (lowStock.length) {
            alertDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${lowStock.length} product(s) below minimum stock level.`;
        } else {
            alertDiv.innerHTML = '';
        }
    }
}

// Filtering and search
document.getElementById('productSearch')?.addEventListener('input', filterProducts);
document.getElementById('productCategoryFilter')?.addEventListener('change', filterProducts);
document.getElementById('productStatusFilter')?.addEventListener('change', filterProducts);

function filterProducts() {
    const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const category = document.getElementById('productCategoryFilter')?.value || '';
    const status = document.getElementById('productStatusFilter')?.value || '';
    
    const filtered = productsData.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
        const matchesCategory = !category || p.category === category;
        const matchesStatus = !status || p.is_active.toString() === status;
        return matchesSearch && matchesCategory && matchesStatus;
    });
    renderProducts(filtered);
}

// Product Modal
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const productModalTitle = document.getElementById('productModalTitle');
const closeModalButtons = document.querySelectorAll('.close-modal, .cancel-modal');

document.getElementById('addProductBtn')?.addEventListener('click', () => {
    currentProductId = null;
    productModalTitle.textContent = 'Add Product';
    productForm.reset();
    document.getElementById('imagePreview').innerHTML = '';
    productModal.classList.add('show');
});

window.editProduct = async function(id) {
    currentProductId = id;
    productModalTitle.textContent = 'Edit Product';
    try {
        const response = await fetch(`/api/supplier/products/${id}/`);
        const data = await response.json();
        if (data.success) {
            const p = data.product;
            document.getElementById('productId').value = p.id;
            document.getElementById('productName').value = p.name;
            document.getElementById('productSKU').value = p.sku;
            document.getElementById('productCategory').value = p.category;
            document.getElementById('productSubcategory').value = p.subcategory || '';
            document.getElementById('productBrand').value = p.brand || '';
            document.getElementById('productDescription').value = p.description || '';
            document.getElementById('productPrice').value = p.price;
            document.getElementById('productCostPrice').value = p.cost_price || '';
            document.getElementById('productStock').value = p.stock_quantity;
            document.getElementById('productMinStock').value = p.min_stock_level;
            document.getElementById('productMaxStock').value = p.max_stock_level;
            document.getElementById('productUnit').value = p.unit;
            document.getElementById('productActive').value = p.is_active.toString();
            if (p.image) {
                document.getElementById('imagePreview').innerHTML = `<img src="${p.image}" alt="Preview">`;
            }
            productModal.classList.add('show');
        }
    } catch (error) {
        console.error('Error loading product details:', error);
    }
};

closeModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        productModal.classList.remove('show');
        document.getElementById('orderStatusModal')?.classList.remove('show');
        document.getElementById('passwordModal')?.classList.remove('show');
    });
});

productForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(productForm);
    const url = currentProductId ? `/api/supplier/products/${currentProductId}/update/` : '/api/supplier/products/add/';
    const method = currentProductId ? 'POST' : 'POST'; // Using POST for multipart
    
    try {
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: data.message,
                timer: 2000,
                showConfirmButton: false
            });
            productModal.classList.remove('show');
            loadProducts();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Something went wrong'
            });
        }
    } catch (error) {
        console.error('Error saving product:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save product' });
    }
});

window.deleteProduct = async function(id) {
    const result = await Swal.fire({
        title: 'Delete Product?',
        text: 'This action cannot be undone',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/supplier/products/${id}/delete/`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Deleted', text: data.message, timer: 2000 });
                loadProducts();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.error });
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }
};

// ========== ORDER MANAGEMENT ==========
let ordersData = [];

async function loadOrders() {
    try {
        const response = await fetch('/api/supplier/orders/');
        const data = await response.json();
        ordersData = data.orders;
        renderOrders(ordersData);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function renderOrders(orders) {
    const tbody = document.querySelector('#ordersTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td>${o.order_number}</td>
            <td>${o.product_name}</td>
            <td>${o.quantity}</td>
            <td>₹ ${o.total_amount}</td>
            <td>${new Date(o.order_date).toLocaleDateString()}</td>
            <td><span class="status-badge ${o.status}">${o.status}</span></td>
            <td><span class="status-badge ${o.payment_status}">${o.payment_status}</span></td>
            <td>
                <button class="action-btn status" onclick="openOrderStatusModal(${o.id})"><i class="fas fa-truck"></i></button>
                <button class="action-btn view" onclick="viewOrder('${o.order_number}')"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
}

// Order status modal
const orderStatusModal = document.getElementById('orderStatusModal');
const orderStatusForm = document.getElementById('orderStatusForm');

window.openOrderStatusModal = function(orderId) {
    currentOrderId = orderId;
    const order = ordersData.find(o => o.id === orderId);
    if (order) {
        document.getElementById('orderId').value = orderId;
        document.getElementById('orderStatus').value = order.status;
        document.getElementById('deliveryDate').value = order.actual_delivery_date || '';
        orderStatusModal.classList.add('show');
    }
};

orderStatusForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        status: document.getElementById('orderStatus').value,
        delivery_date: document.getElementById('deliveryDate').value || null
    };
    
    try {
        const response = await fetch(`/api/supplier/orders/${currentOrderId}/update-status/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: 'Updated', text: result.message, timer: 2000 });
            orderStatusModal.classList.remove('show');
            loadOrders();
            loadOverviewStats(); // Refresh overview stats
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: result.error });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
    }
});

// ========== PAYMENTS ==========
async function loadPayments() {
    try {
        const response = await fetch('/api/supplier/payments/');
        const data = await response.json();
        renderPayments(data.payments);
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function renderPayments(payments) {
    const tbody = document.querySelector('#paymentsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = payments.map(p => `
        <tr>
            <td>${p.payment_number}</td>
            <td>${p.order_number || '-'}</td>
            <td>₹ ${p.amount}</td>
            <td>${p.payment_date}</td>
            <td>${p.payment_method}</td>
            <td><span class="status-badge ${p.status}">${p.status}</span></td>
        </tr>
    `).join('');
}

// ========== ANALYTICS ==========
async function loadAnalytics() {
    try {
        const response = await fetch('/api/supplier/orders/stats/');
        const data = await response.json();
        
        // Update stats cards
        const statsGrid = document.getElementById('analyticsStats');
        if (statsGrid) {
            const totalRevenue = data.daily_revenue.reduce((sum, d) => sum + d.total, 0);
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">₹ ${totalRevenue.toLocaleString()}</div>
                    <div class="stat-label">Total Revenue (30d)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.top_products.length}</div>
                    <div class="stat-label">Top Products</div>
                </div>
            `;
        }
        
        // Update sales trend chart
        updateSalesTrendChart(data.daily_revenue);
        
        // Update top products chart
        updateTopProductsChart(data.top_products);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function updateSalesTrendChart(dailyRevenue) {
    const ctx = document.getElementById('salesTrendChart')?.getContext('2d');
    if (!ctx) return;
    
    const labels = dailyRevenue.map(d => d.date);
    const data = dailyRevenue.map(d => d.total);
    
    if (salesTrendChart) salesTrendChart.destroy();
    salesTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } }
            }
        }
    });
}

function updateTopProductsChart(topProducts) {
    const ctx = document.getElementById('topProductsChart')?.getContext('2d');
    if (!ctx) return;
    
    const labels = topProducts.map(p => p.product__name);
    const data = topProducts.map(p => p.total_qty);
    
    if (topProductsChart) topProductsChart.destroy();
    topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantity Sold',
                data: data,
                backgroundColor: '#8b5cf6',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } }
            }
        }
    });
}

// ========== PROFILE ==========
async function loadProfile() {
    try {
        const response = await fetch('/api/supplier/profile/');
        const data = await response.json();
        const profile = data.profile;
        
        const infoGrid = document.getElementById('profileInfo');
        if (infoGrid) {
            infoGrid.innerHTML = `
                <div class="info-item"><label>Full Name</label><p>${profile.fullname}</p></div>
                <div class="info-item"><label>Email</label><p>${profile.email}</p></div>
                <div class="info-item"><label>Username</label><p>${profile.username}</p></div>
                <div class="info-item"><label>Location</label><p>${profile.location || 'Not provided'}</p></div>
                <div class="info-item"><label>Contact</label><p>${profile.contact || 'Not provided'}</p></div>
                <div class="info-item"><label>Category</label><p>${profile.category}</p></div>
            `;
        }
        
        // Load email notification preference (from local storage or API)
        const emailPref = localStorage.getItem('emailNotifications') === 'true';
        document.getElementById('emailNotifications').checked = emailPref;
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Email notifications toggle
document.getElementById('emailNotifications')?.addEventListener('change', (e) => {
    localStorage.setItem('emailNotifications', e.target.checked);
    Swal.fire({
        icon: 'success',
        title: e.target.checked ? 'Email notifications enabled' : 'Email notifications disabled',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
    });
});

// Change password modal
const passwordModal = document.getElementById('passwordModal');
const passwordForm = document.getElementById('passwordForm');
const changePasswordBtn = document.getElementById('changePasswordBtn');

changePasswordBtn?.addEventListener('click', () => {
    passwordModal.classList.add('show');
});

passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        current_password: document.getElementById('currentPassword').value,
        new_password: document.getElementById('newPassword').value,
        confirm_password: document.getElementById('confirmPassword').value
    };
    
    if (data.new_password !== data.confirm_password) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'New passwords do not match' });
        return;
    }
    
    try {
        const response = await fetch('/api/supplier/change-password/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: 'Success', text: result.message, timer: 2000 });
            passwordModal.classList.remove('show');
            passwordForm.reset();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: result.error });
        }
    } catch (error) {
        console.error('Error changing password:', error);
    }
});

// ========== INITIAL LOAD ==========
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data for active tab
    const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab') || 'overview';
    if (activeTab === 'overview') loadOverviewStats();
    else if (activeTab === 'products') loadProducts();
    else if (activeTab === 'orders') loadOrders();
    else if (activeTab === 'payments') loadPayments();
    else if (activeTab === 'analytics') loadAnalytics();
    else if (activeTab === 'profile') loadProfile();
    
    // Load notifications
    loadNotifications();
    
    // Refresh notifications every 60 seconds
    setInterval(loadNotifications, 60000);
    
    // Add event listener for revenue period change
    document.getElementById('revenuePeriod')?.addEventListener('change', updateRevenueChart);
});

// Utility functions
window.viewOrder = function(orderNumber) {
    // Implement order detail view if needed
    console.log('View order:', orderNumber);
};

// Add glass modal styles
const style = document.createElement('style');
style.textContent = `
    .glass-modal {
        background: rgba(15, 23, 42, 0.95) !important;
        backdrop-filter: blur(10px) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 30px !important;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3) !important;
    }
    .swal2-popup { font-family: 'Poppins', sans-serif !important; }
    .swal2-title { color: #fff !important; }
    .swal2-html-container { color: rgba(255, 255, 255, 0.7) !important; }
    .swal2-confirm, .swal2-cancel { border-radius: 50px !important; padding: 12px 30px !important; font-weight: 600 !important; }
    .swal2-timer-progress-bar { background: linear-gradient(90deg, #4361ee, #8b5cf6) !important; }
`;
document.head.appendChild(style);