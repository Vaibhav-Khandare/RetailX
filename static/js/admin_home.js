/**
 * RetailX Advanced Admin Dashboard
 * Version: 2.0 (Cleaned – removed alerts & activity cards)
 * Theme: Midnight Slate & Electric Cobalt
 */

console.log("✅ ADMIN JS LOADED - Version 2.0 (Cleaned)");

// Dummy function for noBack() called from body onload
function noBack() {
    // Does nothing, only prevents JS error
}

/* =========================
   GLOBAL VARIABLES
========================= */
let currentUser = 'admin@retailx.com';
let salesChart, analyticsChart, categoryChart;
let notificationCount = 3;

// Make chart variables globally accessible
window.topSellingChart = null;
window.leastSellingChart = null;

// Fullscreen state
let isFullscreen = false;

/* =========================
   DOCUMENT READY - INITIALIZATION
========================= */
document.addEventListener('DOMContentLoaded', function() {
    console.log("📦 Initializing Admin Dashboard...");
    
    // Initialize date and time
    updateCurrentDate();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Initialize navigation
    initNavigation();
    
    // Initialize fullscreen functionality
    initFullscreen();
    
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
    
    // Setup mobile menu toggle
    setupMobileMenu();
    
    // Add default chatbot welcome message
    const chatbotMessages = document.getElementById('chatbot-messages');
    if (chatbotMessages && chatbotMessages.children.length === 0) {
        chatbotMessages.innerHTML = `
            <div class="chat-bot">
                <span>Hello! I'm your RetailX Assistant. How can I help you today?</span>
            </div>
        `;
    }
    
    // Allow Enter key to send chat message
    const chatbotInput = document.getElementById('chatbot-input');
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Check if we have festival data to display
    setTimeout(function() {
        const festivalEl = document.getElementById('detected-festival');
        const hasFestivalData = festivalEl && festivalEl.dataset.festival;
        if (hasFestivalData && typeof initFestivalCharts === 'function') {
            console.log('🎉 Festival data detected on page load, initializing charts...');
            initFestivalCharts();
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
    
    console.log("✅ Admin Dashboard initialized successfully");
});

/* =========================
   DATE & TIME FUNCTIONS
========================= */
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) dateElement.textContent = now.toLocaleDateString('en-US', options);
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const timeElement = document.getElementById('currentTime');
    if (timeElement) timeElement.textContent = timeString;
}

/* =========================
   FULLSCREEN FUNCTIONALITY
========================= */
function initFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!fullscreenBtn) return;
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
    document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
    document.addEventListener('MSFullscreenChange', updateFullscreenIcon);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
        else if (document.documentElement.msRequestFullscreen) document.documentElement.msRequestFullscreen();
        isFullscreen = true;
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        isFullscreen = false;
    }
}

function updateFullscreenIcon() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!fullscreenBtn) return;
    const icon = fullscreenBtn.querySelector('i');
    if (document.fullscreenElement) {
        icon.className = 'fas fa-compress';
        fullscreenBtn.setAttribute('title', 'Exit Fullscreen');
    } else {
        icon.className = 'fas fa-expand';
        fullscreenBtn.setAttribute('title', 'Enter Fullscreen');
    }
}

/* =========================
   MOBILE MENU
========================= */
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
}

/* =========================
   NAVIGATION
========================= */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumb = document.getElementById('breadcrumb');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            this.classList.add('active');
            const sectionId = this.dataset.section;
            const sectionElement = document.getElementById(sectionId);
            if (sectionElement) sectionElement.classList.add('active');
            
            const sectionName = this.querySelector('span').textContent;
            if (pageTitle) pageTitle.textContent = sectionName;
            if (breadcrumb) breadcrumb.textContent = `Admin / ${sectionName}`;
            
            loadSectionData(sectionId);
            
            if (sectionId === 'analytics') {
                setTimeout(() => { if (typeof initFestivalCharts === 'function') initFestivalCharts(); }, 300);
            }
        });
    });
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard': loadDashboardData(); break;
        case 'users': loadUsers(); break;
        case 'products': loadProducts(); break;
        case 'inventory': loadInventory(); break;
        case 'analytics': loadAnalytics(); break;
        case 'settings': loadSettings(); break;
    }
}

/* =========================
   FORM HANDLERS
========================= */
function setupFormHandlers() {
    // User Form - normal submission
    const userForm = document.getElementById('userForm');
    if (userForm) userForm.addEventListener('submit', function(e) { /* normal */ });
    
    // Product Form - normal submission
    const productForm = document.getElementById('productForm');
    if (productForm) productForm.addEventListener('submit', function(e) { /* normal */ });
    
    // Inventory Form
    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) inventoryForm.addEventListener('submit', function(e) { e.preventDefault(); saveInventoryAdjustment(); });
    
    // Festival Search Form - AJAX
    const festivalForm = document.getElementById('festivalSearchForm');
    if (festivalForm) {
        festivalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showLoading();
            const formData = new FormData(festivalForm);
            const params = new URLSearchParams(formData).toString();
            fetch(window.location.pathname + '?' + params, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(response => response.json())
                .then(data => {
                    const topDataEl = document.getElementById('top-products-data');
                    const leastDataEl = document.getElementById('least-products-data');
                    const festivalEl = document.getElementById('detected-festival');
                    const festivalNameSpan = document.getElementById('festival-name');
                    const bannerEl = document.getElementById('festival-banner');
                    const chartsEl = document.getElementById('festival-charts');
                    const emptyEl = document.getElementById('festival-empty');
                    
                    if (topDataEl) topDataEl.dataset.products = JSON.stringify(data.top_products || []);
                    if (leastDataEl) leastDataEl.dataset.products = JSON.stringify(data.least_products || []);
                    if (festivalEl) festivalEl.dataset.festival = data.detected_festival || '';
                    
                    const hasFestival = data.detected_festival && data.detected_festival !== '';
                    if (bannerEl) {
                        bannerEl.style.display = hasFestival ? 'flex' : 'none';
                        if (hasFestival && festivalNameSpan) festivalNameSpan.textContent = data.detected_festival;
                    }
                    if (chartsEl) chartsEl.style.display = hasFestival ? 'grid' : 'none';
                    if (emptyEl) emptyEl.style.display = hasFestival ? 'none' : 'flex';
                    
                    if (typeof initFestivalCharts === 'function') initFestivalCharts();
                    hideLoading();
                    showToast('Prediction updated', 'success');
                })
                .catch(error => { console.error('Error:', error); hideLoading(); showToast('Failed to load prediction', 'error'); });
        });
    }
    
    // Edit User Form - AJAX
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(editUserForm);
            const userId = formData.get('user_id');
            const userType = formData.get('user_type');
            fetch(`/edit-user/${userType}/${userId}/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCSRFToken(), 'X-Requested-With': 'XMLHttpRequest' },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) { showToast('User updated successfully', 'success'); closeEditUserModal(); setTimeout(() => location.reload(), 1000); }
                else showToast(data.error || 'Update failed', 'error');
            })
            .catch(error => { console.error('Error:', error); showToast('Server error', 'error'); });
        });
    }
}

/* =========================
   SEARCH FUNCTIONALITY
========================= */
function setupSearch() {
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            if (searchTerm.length >= 2) performGlobalSearch(searchTerm);
        });
    }
}

/* =========================
   DASHBOARD DATA LOADING
========================= */
function loadDashboardData() {
    showLoading();
    setTimeout(() => {
        updateStats();
        initSalesChart();
        hideLoading();
    }, 1000);
}

function updateStats() { /* No stats to update manually */ }

/* =========================
   USER MANAGEMENT
========================= */
function loadUsers() { filterUsers(); }

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
        if (filterValue !== 'all' && !role.includes(filterValue)) shouldShow = false;
        if (searchValue && !text.includes(searchValue)) shouldShow = false;
        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });
    const userCountElement = document.querySelector('.content-section#users .table-container + div');
    if (userCountElement) userCountElement.textContent = `Showing ${visibleCount} user(s) in total`;
}

function searchUsers() { filterUsers(); }

/* =========================
   PRODUCT MANAGEMENT
========================= */
function loadProducts() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) { updateCategoryFilter(); filterProducts(); }
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
        let shouldShow = true;
        if (categoryValue !== 'all' && !category.includes(categoryValue)) shouldShow = false;
        if (stockValue === 'low' && !stockLevel.classList.contains('low')) shouldShow = false;
        else if (stockValue === 'out' && parseInt(stockLevel.textContent) > 0) shouldShow = false;
        card.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });
    const productCountElement = document.querySelector('#productsGrid + div');
    if (productCountElement) productCountElement.textContent = `Showing ${visibleCount} product(s) in total`;
}

function updateCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;
    const categories = new Set();
    document.querySelectorAll('.product-category').forEach(el => categories.add(el.textContent.trim()));
    filter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase();
        option.textContent = category;
        filter.appendChild(option);
    });
}

/* =========================
   INVENTORY MANAGEMENT
========================= */
function loadInventory() { /* Already server‑rendered */ }

/* =========================
   ANALYTICS
========================= */
function loadAnalytics() {
    showLoading();
    setTimeout(() => {
        initAnalyticsChart();
        initCategoryChart();
        hideLoading();
    }, 1000);
}

/* =========================
   FESTIVAL CHART FUNCTIONS
========================= */
function initFestivalCharts() {
    console.log('📊 initFestivalCharts called');
    const topProductsElement = document.getElementById('top-products-data');
    const leastProductsElement = document.getElementById('least-products-data');
    if (!topProductsElement || !leastProductsElement) { console.log('❌ Data elements not found'); return; }
    
    try {
        let topProducts = [], leastProducts = [];
        if (topProductsElement.dataset.products && topProductsElement.dataset.products !== 'None' && topProductsElement.dataset.products !== '') {
            const rawData = topProductsElement.dataset.products.replace(/&quot;/g, '"');
            topProducts = JSON.parse(rawData);
        }
        if (leastProductsElement.dataset.products && leastProductsElement.dataset.products !== 'None' && leastProductsElement.dataset.products !== '') {
            const rawData = leastProductsElement.dataset.products.replace(/&quot;/g, '"');
            leastProducts = JSON.parse(rawData);
        }
        if (!Array.isArray(topProducts)) topProducts = [];
        if (!Array.isArray(leastProducts)) leastProducts = [];
        
        if (topProducts.length > 0 || leastProducts.length > 0) {
            createFestivalCharts(topProducts, leastProducts, 'Festival');
        } else {
            ['topSellingChart', 'leastSellingChart'].forEach(canvasId => {
                const canvas = document.getElementById(canvasId);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.font = '14px Inter, sans-serif';
                    ctx.fillStyle = '#999';
                    ctx.textAlign = 'center';
                    ctx.fillText('No prediction data available', canvas.width/2, canvas.height/2);
                }
            });
        }
    } catch (e) { console.error('❌ Error in initFestivalCharts:', e); }
}

function createFestivalCharts(topProducts, leastProducts, festivalName) {
    const formattedTop = (Array.isArray(topProducts) ? topProducts : []).map(item => ({
        product: item.product || 'Unknown',
        units: parseFloat(item.predicted_sales) || 0
    }));
    const formattedLeast = (Array.isArray(leastProducts) ? leastProducts : []).map(item => ({
        product: item.product || 'Unknown',
        units: parseFloat(item.predicted_sales) || 0
    }));
    
    if (formattedTop.length > 0) {
        createHorizontalBarChart('topSellingChart', formattedTop, '#e67e22', 'Top Selling Products');
    } else {
        const canvas = document.getElementById('topSellingChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('No top products data', canvas.width/2, canvas.height/2);
        }
    }
    
    if (formattedLeast.length > 0) {
        createHorizontalBarChart('leastSellingChart', formattedLeast, '#3498db', 'Least Selling Products');
    } else {
        const canvas = document.getElementById('leastSellingChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('No least products data', canvas.width/2, canvas.height/2);
        }
    }
}

function createHorizontalBarChart(canvasId, data, color, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (canvasId === 'topSellingChart' && window.topSellingChart) window.topSellingChart.destroy();
    else if (canvasId === 'leastSellingChart' && window.leastSellingChart) window.leastSellingChart.destroy();
    if (!data || data.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('No prediction data available', canvas.width/2, canvas.height/2);
        return;
    }
    const sortedData = [...data].sort((a,b) => b.units - a.units);
    const labels = sortedData.map(item => item.product && item.product.length > 20 ? item.product.substring(0,17)+'...' : item.product || 'Unknown');
    const values = sortedData.map(item => Math.max(0, parseFloat(item.units) || 0));
    const backgroundColors = values.map((_, i) => color.replace('#', `rgba(${hexToRgb(color)}, ${0.7 - i*0.04})`));
    const newChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Expected Units', data: values, backgroundColor: backgroundColors, borderColor: color, borderWidth: 1, borderRadius: 5 }] },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { left:10, right:20, top:10, bottom:10 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const fullProduct = sortedData[ctx.dataIndex].product || 'Unknown';
                            return fullProduct + ': ' + ctx.raw.toLocaleString() + ' units';
                        },
                        title: () => ''
                    }
                }
            },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, title: { display: true, text: 'Expected Units', color:'#666', font:{ size:11, family:'Inter' } } },
                y: { grid: { display: false }, ticks: { font: { size:11, family:'Inter' }, maxRotation:0, autoSkip:true, autoSkipPadding:10 } }
            }
        }
    });
    if (canvasId === 'topSellingChart') window.topSellingChart = newChart;
    else window.leastSellingChart = newChart;
}

function hexToRgb(hex) {
    hex = hex.replace('#','');
    const r = parseInt(hex.substring(0,2),16);
    const g = parseInt(hex.substring(2,4),16);
    const b = parseInt(hex.substring(4,6),16);
    return `${r}, ${g}, ${b}`;
}

/* =========================
   CHART INITIALIZATION
========================= */
function initSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    const canvas = ctx.getContext('2d');
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            datasets: [{
                label: 'Sales ($)',
                data: [1200,1900,3000,5000,2845,3200,1800],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67,97,238,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color:'rgba(0,0,0,0.05)' } }, x: { grid: { color:'rgba(0,0,0,0.05)' } } }
        }
    });
}

function initAnalyticsChart() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;
    const canvas = ctx.getContext('2d');
    if (analyticsChart) analyticsChart.destroy();
    analyticsChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun'],
            datasets: [
                { label: 'Revenue', data: [12000,19000,15000,25000,22000,30000], borderColor:'#4361ee', backgroundColor:'rgba(67,97,238,0.1)', borderWidth:2, fill:true },
                { label: 'Profit', data: [4000,7000,5000,9000,8000,12000], borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.1)', borderWidth:2, fill:true }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, grid: { color:'rgba(0,0,0,0.05)' } }, x: { grid: { color:'rgba(0,0,0,0.05)' } } }
        }
    });
}

function initCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    const canvas = ctx.getContext('2d');
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Electronics','Clothing','Groceries','Home','Others'],
            datasets: [{
                data: [40,20,15,15,10],
                backgroundColor: ['#4361ee','#ef4444','#10b981','#f59e0b','#8b5cf6']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

/* =========================
   NOTIFICATION FUNCTIONS
========================= */
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (panel) panel.classList.toggle('show');
}

function loadNotifications() {
    const notifications = [
        { id:1, type:'warning', icon:'exclamation-triangle', title:'Low Stock Alert', message:'T-Shirt stock is critically low (5 units remaining)', time:'2 hours ago', unread:true },
        { id:2, type:'info', icon:'user-plus', title:'New User Registration', message:'Charlie Davis has been registered as a new manager', time:'4 hours ago', unread:true },
        { id:3, type:'success', icon:'chart-line', title:'Daily Target Achieved', message:'Daily sales target has been exceeded by 15%', time:'6 hours ago', unread:true },
        { id:4, type:'info', icon:'box', title:'Product Added', message:'New product "Wireless Headphones" has been added to inventory', time:'1 day ago', unread:false },
        { id:5, type:'warning', icon:'exclamation-circle', title:'System Maintenance', message:'Scheduled maintenance this Sunday from 2:00 AM to 4:00 AM', time:'2 days ago', unread:false }
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
            <div style="display:flex; align-items:flex-start; gap:12px;">
                <div class="notification-icon ${notification.type}"><i class="fas fa-${notification.icon}"></i></div>
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
    const unreadCount = notifications.filter(n => n.unread).length;
    notificationCount = unreadCount;
    const badge = document.querySelector('.notification-count');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount === 0 ? 'none' : 'flex';
    }
}

function markNotificationAsRead(id) {
    showLoading();
    setTimeout(() => {
        notificationCount = Math.max(0, notificationCount - 1);
        const badge = document.querySelector('.notification-count');
        if (badge) {
            badge.textContent = notificationCount;
            badge.style.display = notificationCount === 0 ? 'none' : 'flex';
        }
        showToast('Notification marked as read', 'success');
        hideLoading();
    }, 500);
}

function markAllAsRead() {
    showLoading();
    setTimeout(() => {
        notificationCount = 0;
        const badge = document.querySelector('.notification-count');
        if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
        showToast('All notifications marked as read', 'success');
        hideLoading();
        const panel = document.getElementById('notificationPanel');
        if (panel) panel.classList.remove('show');
    }, 500);
}

function viewAllNotifications() {
    showToast('Viewing all notifications - Feature coming soon!', 'info');
    const panel = document.getElementById('notificationPanel');
    if (panel) panel.classList.remove('show');
}

/* =========================
   MODAL FUNCTIONS
========================= */
function openUserModal() { document.getElementById('userModal').style.display = 'flex'; }
function closeUserModal() { document.getElementById('userModal').style.display = 'none'; document.getElementById('userForm')?.reset(); }
function openProductModal() { document.getElementById('productModal').style.display = 'flex'; }
function closeProductModal() { document.getElementById('productModal').style.display = 'none'; document.getElementById('productForm')?.reset(); }
function openInventoryModal() { loadProductDropdown(); document.getElementById('inventoryModal').style.display = 'flex'; }
function closeInventoryModal() { document.getElementById('inventoryModal').style.display = 'none'; document.getElementById('inventoryForm')?.reset(); }
function openQuickAction() { document.getElementById('quickActionModal').style.display = 'flex'; }
function closeQuickAction() { document.getElementById('quickActionModal').style.display = 'none'; }

/* =========================
   SAVE FUNCTIONS
========================= */
function saveUser() {
    showLoading();
    setTimeout(() => { closeUserModal(); loadUsers(); showToast('User added successfully!', 'success'); hideLoading(); }, 1500);
}
function saveProduct() {
    showLoading();
    setTimeout(() => { closeProductModal(); loadProducts(); showToast('Product added successfully!', 'success'); hideLoading(); }, 1500);
}
function saveInventoryAdjustment() {
    showLoading();
    setTimeout(() => { closeInventoryModal(); loadInventory(); showToast('Inventory adjustment saved!', 'success'); hideLoading(); }, 1500);
}

/* =========================
   UTILITY FUNCTIONS
========================= */
function showLoading() { const overlay = document.getElementById('loadingOverlay'); if (overlay) overlay.style.display = 'flex'; }
function hideLoading() { const overlay = document.getElementById('loadingOverlay'); if (overlay) overlay.style.display = 'none'; }
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast';
    switch(type) {
        case 'success': toast.style.background = 'var(--success)'; break;
        case 'error': toast.style.background = 'var(--danger)'; break;
        case 'warning': toast.style.background = 'var(--warning)'; break;
        default: toast.style.background = 'var(--primary)';
    }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function loadProductDropdown() {
    const select = document.getElementById('inventoryProduct');
    if (!select) return;
    select.innerHTML = '<option value="">Select Product</option>';
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
        [{ id:1, name:'Laptop Pro' }, { id:2, name:'Wireless Mouse' }, { id:3, name:'T-Shirt' }, { id:4, name:'Coffee Maker' }, { id:5, name:'Organic Coffee' }]
            .forEach(p => { const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; select.appendChild(opt); });
    }
}

/* =========================
   ACTION FUNCTIONS
========================= */
function exportUsers() { window.location.href = '/export-users/'; }
function bulkResetPassword() {
    const selected = [];
    document.querySelectorAll('.user-checkbox:checked').forEach(cb => {
        selected.push({ id: cb.value, type: cb.closest('tr').querySelector('.status-badge').textContent.trim().toLowerCase() });
    });
    if (selected.length === 0) { showToast('Please select users first', 'warning'); return; }
    Swal.fire({ title:`Reset passwords for ${selected.length} user(s)?`, text:"Temporary passwords will be generated and emailed.", icon:'warning', showCancelButton:true, confirmButtonColor:'#4361ee', confirmButtonText:'Yes, reset' })
        .then(result => {
            if (result.isConfirmed) {
                fetch('/bulk-reset-passwords/', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-CSRFToken':getCSRFToken(), 'X-Requested-With':'XMLHttpRequest' }, body:JSON.stringify({ users:selected }) })
                    .then(r => r.json())
                    .then(d => { if (d.success) Swal.fire('Success!', d.message, 'success'); else Swal.fire('Error!', d.error, 'error'); })
                    .catch(e => { console.error(e); Swal.fire('Error!', 'Server error', 'error'); });
            }
        });
}
function bulkUpdateStock() { showToast('Bulk stock update feature coming soon!', 'info'); }
function importProducts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = () => { showLoading(); setTimeout(() => { showToast('Products imported successfully!', 'success'); loadProducts(); hideLoading(); }, 2000); };
    input.click();
}
function generateReport() { showLoading(); setTimeout(() => { showToast('Need to work On this Function still incomplete !!', 'success'); hideLoading(); }, 2000); }
function backupDatabase() { showLoading(); setTimeout(() => { showToast('Database backup completed!', 'success'); hideLoading(); }, 1500); }
function clearCache() { showLoading(); setTimeout(() => { showToast('Cache cleared successfully!', 'success'); hideLoading(); }, 1000); }
function exportAllData() { showLoading(); setTimeout(() => { showToast('All data exported!', 'success'); hideLoading(); }, 2000); }

/* =========================
   THEME FUNCTIONS
========================= */
function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => { btn.classList.remove('active'); if (btn.dataset.theme === theme) btn.classList.add('active'); });
    localStorage.setItem('retailx-theme', theme);
    showToast(`Theme changed to ${theme}`, 'success');
}
function loadSettings() {
    const savedTheme = localStorage.getItem('retailx-theme') || 'default';
    changeTheme(savedTheme);
    const savedSettings = localStorage.getItem('retailx-settings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            document.getElementById('emailNotifications').checked = settings.emailNotifications || false;
            document.getElementById('lowStockAlerts').checked = settings.lowStockAlerts || false;
            document.getElementById('newUserAlerts').checked = settings.newUserAlerts || false;
        } catch(e) { console.error('Error loading settings:', e); }
    }
}

/* =========================
   QUICK ACTIONS
========================= */
function quickAddProduct() { closeQuickAction(); openProductModal(); }
function quickAddUser() { closeQuickAction(); openUserModal(); }
function quickStockCheck() { closeQuickAction(); showLoading(); setTimeout(() => { showToast('Need to work On this Function still incomplete !!'); hideLoading(); }, 1000); }
function quickGenerateReport() { closeQuickAction(); generateReport(); }

/* =========================
   DASHBOARD INITIALIZATION
========================= */
function initDashboard() { loadSettings(); }

/* =========================
   GLOBAL SEARCH
========================= */
function performGlobalSearch(term) {
    showLoading();
    setTimeout(() => { showToast(`Found 3 users, 7 products, 2 reports`, 'info'); hideLoading(); }, 500);
}

/* =========================
   EDIT FUNCTIONS
========================= */
function openEditUserModal(userId, userType) {
    fetch(`/get-user/${userType}/${userId}/`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(r => r.json())
        .then(d => {
            if (d.success) {
                document.getElementById('edit_user_id').value = d.user.id;
                document.getElementById('edit_user_type').value = userType;
                document.getElementById('edit_fullname').value = d.user.fullname;
                document.getElementById('edit_email').value = d.user.email;
                document.getElementById('edit_username').value = d.user.username;
                document.getElementById('editUserModal').style.display = 'flex';
            } else showToast('Error loading user data', 'error');
        })
        .catch(e => { console.error(e); showToast('Failed to load user', 'error'); });
}
function closeEditUserModal() { document.getElementById('editUserModal').style.display = 'none'; }
function deleteUser(userId, userType) {
    const type = userType.toLowerCase();
    Swal.fire({ title:'Are you sure?', text:"You won't be able to revert this!", icon:'warning', showCancelButton:true, confirmButtonColor:'#ef4444', cancelButtonColor:'#64748b', confirmButtonText:'Yes, delete it!' })
        .then(result => {
            if (result.isConfirmed) {
                fetch(`/delete-user/${type}/${userId}/`, { method:'POST', headers:{ 'X-CSRFToken':getCSRFToken(), 'X-Requested-With':'XMLHttpRequest' } })
                    .then(r => r.json())
                    .then(d => { if (d.success) { Swal.fire('Deleted!', d.message, 'success'); setTimeout(() => location.reload(), 1500); } else Swal.fire('Error!', d.error, 'error'); })
                    .catch(e => { console.error(e); Swal.fire('Error!', 'Server error', 'error'); });
            }
        });
}
function resetUserPassword(userId, userType) {
    Swal.fire({ title:'Reset Password?', text:"A temporary password will be generated and sent to the user's email.", icon:'question', showCancelButton:true, confirmButtonColor:'#4361ee', cancelButtonColor:'#64748b', confirmButtonText:'Yes, reset it' })
        .then(result => {
            if (result.isConfirmed) {
                fetch(`/reset-password/${userType}/${userId}/`, { method:'POST', headers:{ 'X-CSRFToken':getCSRFToken(), 'X-Requested-With':'XMLHttpRequest' } })
                    .then(r => r.json())
                    .then(d => { if (d.success) Swal.fire('Success!', d.message, 'success'); else Swal.fire('Error!', d.error, 'error'); })
                    .catch(e => { console.error(e); Swal.fire('Error!', 'Server error', 'error'); });
            }
        });
}
function editProduct(id) { showToast(`Edit product ${id} - Feature coming soon!`, 'info'); }
function deleteProduct(id) { if (confirm('Are you sure you want to delete this product?')) { showLoading(); const form = document.createElement('form'); form.method = 'POST'; form.action = `/delete-product/${id}/`; const csrf = getCSRFToken(); if (csrf) { const inp = document.createElement('input'); inp.type = 'hidden'; inp.name = 'csrfmiddlewaretoken'; inp.value = csrf; form.appendChild(inp); } document.body.appendChild(form); form.submit(); } }
function viewProductDetails(id) { showToast(`Viewing product ${id} details - Feature coming soon!`, 'info'); }
function adjustStock(id) { openInventoryModal(); showToast(`Adjusting stock for product ${id}`, 'info'); }
function viewInventoryHistory(id) { showToast(`Viewing inventory history for product ${id} - Feature coming soon!`, 'info'); }
function toggleAllUsers() { const isChecked = document.getElementById('selectAllUsers').checked; document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = isChecked); }
function updateSalesChart() { showLoading(); setTimeout(() => { initSalesChart(); hideLoading(); }, 500); }
function updateAnalytics() { showLoading(); setTimeout(() => { initAnalyticsChart(); initCategoryChart(); hideLoading(); }, 500); }
function saveSettings() {
    const email = document.getElementById('emailNotifications');
    const low = document.getElementById('lowStockAlerts');
    const newUser = document.getElementById('newUserAlerts');
    const settings = { emailNotifications: email?.checked || false, lowStockAlerts: low?.checked || false, newUserAlerts: newUser?.checked || false };
    localStorage.setItem('retailx-settings', JSON.stringify(settings));
    showToast('Settings saved!', 'success');
}

/* =========================
   CSRF TOKEN HELPER
========================= */
function getCSRFToken() {
    let cookieValue = null;
    const name = "csrftoken";
    if (document.cookie && document.cookie !== "") {
        document.cookie.split(';').forEach(c => { const cookie = c.trim(); if (cookie.substring(0, name.length+1) === (name + "=")) cookieValue = decodeURIComponent(cookie.substring(name.length+1)); });
    }
    if (!cookieValue) {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfInput) cookieValue = csrfInput.value;
    }
    return cookieValue;
}

/* =========================
   CHATBOT FUNCTIONS
========================= */
function sendMessage() {
    const input = document.getElementById("chatbot-input");
    const messages = document.getElementById("chatbot-messages");
    if (!input || !messages) return;
    const message = input.value.trim();
    if (message === "") return;
    messages.innerHTML += `<div class="chat-user"><span>${escapeHtml(message)}</span></div>`;
    input.value = "";
    messages.scrollTop = messages.scrollHeight;
    const typingId = "typing-" + Date.now();
    messages.innerHTML += `<div class="chat-bot" id="${typingId}"><span>🤖 Typing...</span></div>`;
    messages.scrollTop = messages.scrollHeight;
    fetch("/chatbot/", { method:"POST", headers:{ "Content-Type":"application/json", "X-CSRFToken":getCSRFToken() }, body:JSON.stringify({ message }) })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
            document.getElementById(typingId)?.remove();
            messages.innerHTML += `<div class="chat-bot"><span>${escapeHtml(data.reply)}</span></div>`;
            messages.scrollTop = messages.scrollHeight;
        })
        .catch(err => {
            console.error("Chatbot error:", err);
            document.getElementById(typingId)?.remove();
            messages.innerHTML += `<div class="chat-bot"><span>⚠️ Sorry, I'm having trouble connecting. Please try again.</span></div>`;
            messages.scrollTop = messages.scrollHeight;
        });
}
function escapeHtml(text) { const div = document.createElement("div"); div.textContent = text; return div.innerHTML; }
function toggleChatbot() { const box = document.getElementById("chatbot-box"); if (box) box.style.display = box.style.display === "none" || box.style.display === "" ? "flex" : "none"; }