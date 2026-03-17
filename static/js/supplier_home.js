// ========== SUPPLIER DASHBOARD JAVASCRIPT ==========

// ========== GLOBAL VARIABLES ==========
let currentProductId = null;
let currentManagerId = null;
let managers = [];
let messages = [];
let products = [];
let notifications = [];

// ========== PREVENT BACK AFTER LOGOUT ==========
history.pushState(null, null, location.href);
window.onpopstate = function() {
    history.pushState(null, null, location.href);
};

// ========== DOM ELEMENTS ==========
const tabs = document.querySelectorAll('.tab-btn');
const panes = document.querySelectorAll('.tab-pane');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const logoutBtn = document.getElementById('logoutBtn');

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Load initial data
    loadDashboardStats();
    loadNotifications();
    loadManagers();
    loadProducts();
    loadProfile();

    // Set up event listeners
    setupEventListeners();

    // Theme
    initTheme();

    // Refresh notifications every 30 seconds
    setInterval(loadNotifications, 30000);
    // Refresh messages every 10 seconds if a manager is selected
    setInterval(() => {
        if (currentManagerId) loadMessages(currentManagerId);
    }, 10000);
});

// ========== SETUP EVENT LISTENERS ==========
function setupEventListeners() {
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Logout
    logoutBtn?.addEventListener('click', handleLogout);

    // Theme toggle
    themeToggle?.addEventListener('click', toggleTheme);

    // Notification dropdown
    document.getElementById('notificationBtn')?.addEventListener('click', toggleNotifications);
    document.addEventListener('click', closeNotificationsOnClickOutside);

    // Mark all notifications as read
    document.getElementById('markAllRead')?.addEventListener('click', markAllNotificationsRead);

    // Product search and filters
    document.getElementById('productSearch')?.addEventListener('input', filterProducts);
    document.getElementById('productCategoryFilter')?.addEventListener('change', filterProducts);
    document.getElementById('productStatusFilter')?.addEventListener('change', filterProducts);

    // Add product button
    document.getElementById('addProductBtn')?.addEventListener('click', openAddProductModal);

    // Manager search
    document.getElementById('managerSearch')?.addEventListener('input', filterManagers);

    // Message form
    document.getElementById('messageForm')?.addEventListener('submit', sendMessage);

    // Password change form
    document.getElementById('passwordForm')?.addEventListener('submit', changePassword);

    // Edit profile form
    document.getElementById('editProfileForm')?.addEventListener('submit', updateProfile);

    // Edit profile button
    document.getElementById('editProfileBtn')?.addEventListener('click', openEditProfileModal);

    // Change password button
    document.getElementById('changePasswordBtn')?.addEventListener('click', openPasswordModal);

    // Email notifications toggle
    document.getElementById('emailNotifications')?.addEventListener('change', toggleEmailNotifications);

    // Close modal buttons
    document.querySelectorAll('.close-modal, .cancel-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Product form submit
    document.getElementById('productForm')?.addEventListener('submit', saveProduct);
}

// ========== TAB SWITCHING ==========
function switchTab(tabId) {
    tabs.forEach(t => t.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));

    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    const activePane = document.getElementById(tabId);

    if (activeTab && activePane) {
        activeTab.classList.add('active');
        activePane.classList.add('active');

        // Refresh data when switching tabs
        if (tabId === 'orders') {
            loadManagers();
        } else if (tabId === 'products') {
            loadProducts();
        } else if (tabId === 'profile') {
            loadProfile();
        }
    }
}

// ========== THEME ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = themeToggle?.querySelector('i');

    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        if (icon) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

function toggleTheme() {
    const icon = themeToggle.querySelector('i');
    body.classList.toggle('dark-theme');

    if (body.classList.contains('dark-theme')) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'dark');
        showToast('Dark mode activated', 'success');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'light');
        showToast('Light mode activated', 'success');
    }
}

// ========== NOTIFICATIONS ==========
function toggleNotifications(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('show');
    if (dropdown.classList.contains('show')) {
        loadNotifications();
    }
}

function closeNotificationsOnClickOutside(e) {
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.getElementById('notificationBtn');
    if (!dropdown?.contains(e.target) && !btn?.contains(e.target)) {
        dropdown?.classList.remove('show');
    }
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/supplier/notifications/');
        const data = await response.json();
        notifications = data.notifications || [];
        updateNotificationBadge(data.unread_count || 0);
        renderNotifications(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function renderNotifications(notifications) {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (!notifications.length) {
        list.innerHTML = '<div class="notification-empty">No notifications</div>';
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.is_read ? '' : 'unread'}" onclick="markNotificationRead(${n.id})">
            <div class="title">${n.title}</div>
            <div class="message">${n.message}</div>
            <div class="time">${n.created_at || 'Just now'}</div>
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

async function markAllNotificationsRead() {
    try {
        await fetch('/api/supplier/notifications/mark-all-read/', { method: 'POST' });
        loadNotifications();
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// ========== DASHBOARD STATS ==========
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/supplier/dashboard/stats/');
        const data = await response.json();

        document.getElementById('totalOrders').textContent = data.total_orders || 0;
        document.getElementById('totalRevenue').textContent = `₹ ${(data.total_revenue || 0).toLocaleString()}`;
        document.getElementById('activeProducts').textContent = data.active_products || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ========== ORDERS TAB - MANAGER LIST ==========
async function loadManagers() {
    try {
        const response = await fetch('/api/supplier/managers/');
        const data = await response.json();
        managers = data.managers || [];
        renderManagers(managers);
    } catch (error) {
        console.error('Error loading managers:', error);
    }
}

function renderManagers(managers) {
    const list = document.getElementById('managerList');
    if (!list) return;

    if (!managers.length) {
        list.innerHTML = '<div class="loading-managers">No managers found</div>';
        return;
    }

    list.innerHTML = managers.map(m => `
        <div class="manager-item ${currentManagerId === m.id ? 'active' : ''}" onclick="selectManager(${m.id}, '${m.fullname}')">
            <div class="manager-avatar">${m.fullname.charAt(0)}</div>
            <div class="manager-info">
                <h4>${m.fullname}</h4>
                <p>${m.email || 'Manager'}</p>
            </div>
            ${m.unread_count ? `<span class="manager-badge">${m.unread_count}</span>` : ''}
        </div>
    `).join('');
}

function filterManagers() {
    const search = document.getElementById('managerSearch')?.value.toLowerCase() || '';
    const filtered = managers.filter(m => 
        m.fullname.toLowerCase().includes(search) || 
        (m.email && m.email.toLowerCase().includes(search))
    );
    renderManagers(filtered);
}

window.selectManager = function(managerId, managerName) {
    currentManagerId = managerId;
    
    // Update active state in sidebar
    document.querySelectorAll('.manager-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Update chat header
    document.getElementById('chatManagerName').textContent = managerName;
    document.getElementById('chatManagerStatus').textContent = 'Online';
    document.getElementById('chatManagerAvatar').textContent = managerName.charAt(0);

    // Show message input area
    document.getElementById('messageInputArea').style.display = 'block';

    // Clear no selection message
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '<div class="loading-managers">Loading messages...</div>';

    // Load messages
    loadMessages(managerId);
};

// ========== ORDERS TAB - MESSAGES ==========
async function loadMessages(managerId) {
    try {
        const response = await fetch(`/api/supplier/messages/${managerId}/`);
        const data = await response.json();
        messages = data.messages || [];
        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    if (!messages.length) {
        container.innerHTML = '<div class="no-chat-selected"><i class="fas fa-comments"></i><p>No messages yet. Start a conversation!</p></div>';
        return;
    }

    container.innerHTML = messages.map(m => `
        <div class="message ${m.is_sent_by_supplier ? 'sent' : 'received'}">
            <div class="message-content">${m.text}</div>
            <div class="message-time">${formatTime(m.created_at)}</div>
        </div>
    `).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function sendMessage(e) {
    e.preventDefault();

    if (!currentManagerId) {
        showToast('Please select a manager first', 'warning');
        return;
    }

    const messageInput = document.getElementById('messageText');
    const text = messageInput.value.trim();

    if (!text) return;

    try {
        const response = await fetch('/api/supplier/send-message/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                manager_id: currentManagerId,
                message: text
            })
        });

        const data = await response.json();

        if (data.success) {
            messageInput.value = '';
            loadMessages(currentManagerId);
        } else {
            showToast(data.error || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    }
}

// ========== PRODUCTS TAB ==========
async function loadProducts() {
    try {
        const response = await fetch('/api/supplier/products/');
        const data = await response.json();
        products = data.products || [];
        renderProducts(products);
        updateCategoryFilter();
        checkLowStock();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProducts(products) {
    const tbody = document.querySelector('#productsTable tbody');
    if (!tbody) return;

    if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.sku || 'N/A'}</td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>₹ ${p.price}</td>
            <td>${p.stock_quantity || 0} ${p.unit || 'pcs'}</td>
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
    
    const categories = [...new Set(products.map(p => p.category))];
    filter.innerHTML = '<option value="">All Categories</option>' + 
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function checkLowStock() {
    const lowStock = products.filter(p => p.stock_quantity < p.min_stock_level && p.is_active);
    const alertDiv = document.getElementById('lowStockAlert');
    
    if (alertDiv) {
        if (lowStock.length) {
            alertDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${lowStock.length} product(s) below minimum stock level.`;
        } else {
            alertDiv.innerHTML = '';
        }
    }
}

function filterProducts() {
    const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const category = document.getElementById('productCategoryFilter')?.value || '';
    const status = document.getElementById('productStatusFilter')?.value || '';

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search) || (p.sku && p.sku.toLowerCase().includes(search));
        const matchesCategory = !category || p.category === category;
        const matchesStatus = !status || p.is_active.toString() === status;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderProducts(filtered);
}

function openAddProductModal() {
    currentProductId = null;
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.add('show');
}

window.editProduct = async function(id) {
    currentProductId = id;
    document.getElementById('productModalTitle').textContent = 'Edit Product';

    try {
        const response = await fetch(`/api/supplier/products/${id}/`);
        const data = await response.json();

        if (data.success) {
            const p = data.product;
            document.getElementById('productId').value = p.id;
            document.getElementById('productName').value = p.name;
            document.getElementById('productSKU').value = p.sku || '';
            document.getElementById('productCategory').value = p.category;
            document.getElementById('productPrice').value = p.price;
            document.getElementById('productStock').value = p.stock_quantity;
            document.getElementById('productMinStock').value = p.min_stock_level || 10;
            document.getElementById('productUnit').value = p.unit || 'pcs';
            document.getElementById('productDescription').value = p.description || '';
            document.getElementById('productActive').value = p.is_active ? 'true' : 'false';
            document.getElementById('productModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading product details:', error);
        showToast('Failed to load product details', 'error');
    }
};

async function saveProduct(e) {
    e.preventDefault();

    const formData = new FormData(document.getElementById('productForm'));
    const url = currentProductId ? `/api/supplier/products/${currentProductId}/update/` : '/api/supplier/products/add/';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            closeAllModals();
            loadProducts();
        } else {
            showToast(data.error || 'Failed to save product', 'error');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Failed to save product', 'error');
    }
}

window.deleteProduct = async function(id) {
    const result = await Swal.fire({
        title: 'Delete Product?',
        text: 'This action cannot be undone',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/supplier/products/${id}/delete/`, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                showToast(data.message, 'success');
                loadProducts();
            } else {
                showToast(data.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('Failed to delete product', 'error');
        }
    }
};

// ========== PROFILE TAB ==========
async function loadProfile() {
    try {
        const response = await fetch('/api/supplier/profile/');
        const data = await response.json();
        const profile = data.profile;

        // Update profile info grid
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

        // Update profile name and category
        document.getElementById('profileFullName').textContent = profile.fullname;
        document.getElementById('profileCategory').textContent = `${profile.category} Supplier`;
        document.getElementById('profileAvatar').textContent = profile.fullname.charAt(0);

        // Load email notification preference
        const emailPref = localStorage.getItem('emailNotifications') === 'true';
        document.getElementById('emailNotifications').checked = emailPref;

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function openEditProfileModal() {
    // Pre-fill form with current profile data
    fetch('/api/supplier/profile/')
        .then(res => res.json())
        .then(data => {
            const p = data.profile;
            document.getElementById('editFullName').value = p.fullname;
            document.getElementById('editEmail').value = p.email;
            document.getElementById('editLocation').value = p.location || '';
            document.getElementById('editContact').value = p.contact || '';
            document.getElementById('editCategory').value = p.category;
            document.getElementById('editProfileModal').classList.add('show');
        })
        .catch(error => console.error('Error loading profile for edit:', error));
}

async function updateProfile(e) {
    e.preventDefault();

    const data = {
        fullname: document.getElementById('editFullName').value,
        email: document.getElementById('editEmail').value,
        location: document.getElementById('editLocation').value,
        contact: document.getElementById('editContact').value,
        category: document.getElementById('editCategory').value
    };

    try {
        const response = await fetch('/api/supplier/profile/update/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Profile updated successfully', 'success');
            closeAllModals();
            loadProfile();
            
            // Update header name
            document.getElementById('supplierName').textContent = data.fullname;
            document.getElementById('welcomeName').textContent = data.fullname;
        } else {
            showToast(result.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile', 'error');
    }
}

function openPasswordModal() {
    document.getElementById('passwordModal').classList.add('show');
}

async function changePassword(e) {
    e.preventDefault();

    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass) {
        showToast('New passwords do not match', 'error');
        return;
    }

    const data = {
        current_password: document.getElementById('currentPassword').value,
        new_password: newPass,
        confirm_password: confirmPass
    };

    try {
        const response = await fetch('/api/supplier/change-password/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Password changed successfully', 'success');
            closeAllModals();
            document.getElementById('passwordForm').reset();
        } else {
            showToast(result.error || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showToast('Failed to change password', 'error');
    }
}

function toggleEmailNotifications(e) {
    localStorage.setItem('emailNotifications', e.target.checked);
    showToast(e.target.checked ? 'Email notifications enabled' : 'Email notifications disabled', 'success');
}

// ========== LOGOUT ==========
function handleLogout(e) {
    e.preventDefault();
    const logoutUrl = e.currentTarget.getAttribute('data-url');

    Swal.fire({
        title: 'Ready to leave?',
        text: 'You are about to logout from your supplier dashboard',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Stay',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Logging out...',
                timer: 1500,
                timerProgressBar: true,
                didOpen: () => Swal.showLoading(),
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#fff',
                showConfirmButton: false
            }).then(() => {
                window.location.href = logoutUrl;
            });
        }
    });
}

// ========== UTILITY FUNCTIONS ==========
function showToast(message, type = 'success') {
    Swal.fire({
        icon: type,
        title: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: type === 'success' ? '#1f2937' : '#2d1a1a',
        color: '#fff'
    });
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

function formatTime(dateString) {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Make functions globally available for onclick handlers
window.selectManager = selectManager;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.markNotificationRead = markNotificationRead;
window.openSettings = function() {
    switchTab('profile');
};