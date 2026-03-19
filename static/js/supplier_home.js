// ========== SUPPLIER DASHBOARD JAVASCRIPT (WITH MOCK DATA) ==========

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

// ========== HELPER FUNCTION (ESCAPE HTML) ==========
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Load mock data
    loadDashboardStats();
    loadNotifications();
    loadManagers();
    loadProducts();
    loadProfile();

    // Set up event listeners
    setupEventListeners();

    // Theme
    initTheme();

    // Refresh mock data periodically (just for demo)
    setInterval(() => {
        if (document.getElementById('orders').classList.contains('active')) {
            // In orders tab, maybe refresh messages
            if (currentManagerId) loadMessages(currentManagerId);
        }
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

    // Quick reply chips
    document.querySelectorAll('.quick-reply-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const message = this.getAttribute('data-message');
            if (message) {
                document.getElementById('messageText').value = message;
                document.getElementById('sendMessageBtn').click();
            }
        });
    });

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

        // Refresh data when switching tabs (mock)
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

// ========== NOTIFICATIONS (MOCK) ==========
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
    // Mock notifications
    notifications = [
        { id: 1, title: 'New Order', message: 'You have a new order #1234', is_read: false, created_at: '2 min ago' },
        { id: 2, title: 'Payment Received', message: 'Payment of ₹5,000 received', is_read: false, created_at: '1 hour ago' },
        { id: 3, title: 'Product Approved', message: 'Your product "Tomatoes" is now live', is_read: true, created_at: 'yesterday' }
    ];
    updateNotificationBadge(notifications.filter(n => !n.is_read).length);
    renderNotifications(notifications);
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
            <div class="time">${n.created_at}</div>
        </div>
    `).join('');
}

async function markNotificationRead(id) {
    // Mock mark as read
    const notif = notifications.find(n => n.id === id);
    if (notif) notif.is_read = true;
    loadNotifications();
    showToast('Notification marked as read', 'success');
}

async function markAllNotificationsRead() {
    notifications.forEach(n => n.is_read = true);
    loadNotifications();
    showToast('All notifications marked as read', 'success');
}

// ========== DASHBOARD STATS (MOCK) ==========
async function loadDashboardStats() {
    document.getElementById('totalOrders').textContent = '156';
    document.getElementById('totalRevenue').textContent = '₹ 45,780';
    document.getElementById('activeProducts').textContent = '23';
}

// ========== ORDERS TAB - MANAGER LIST (MOCK) ==========
async function loadManagers() {
    // Mock managers
    managers = [
        { id: 1, fullname: 'John Manager', email: 'john@retailx.com', unread_count: 2 },
        { id: 2, fullname: 'Sarah Smith', email: 'sarah@retailx.com', unread_count: 0 },
        { id: 3, fullname: 'Mike Johnson', email: 'mike@retailx.com', unread_count: 1 }
    ];
    renderManagers(managers);
}

function renderManagers(managers) {
    const list = document.getElementById('managerList');
    if (!list) return;

    if (!managers.length) {
        list.innerHTML = '<div class="loading-managers">No managers found</div>';
        return;
    }

    list.innerHTML = managers.map(m => `
        <div class="manager-item ${currentManagerId === m.id ? 'active' : ''}" onclick="selectManager(${m.id}, '${escapeHtml(m.fullname)}')">
            <div class="manager-avatar">${m.fullname.charAt(0)}</div>
            <div class="manager-info">
                <h4>${escapeHtml(m.fullname)}</h4>
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
    
    // Update status dot and text for WhatsApp style
    const statusDot = document.getElementById('managerStatusDot');
    const statusText = document.getElementById('chatManagerStatus');
    if (statusDot) {
        statusDot.className = 'status-dot online';
    }
    if (statusText) {
        statusText.className = 'status-text online';
        statusText.textContent = 'Online';
    }

    // Show message input area and minimize button
    document.getElementById('messageInputArea').style.display = 'block';
    document.getElementById('minimizeChatBtn').style.display = 'flex';

    // Clear no selection message with loading indicator
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '<div class="typing-indicator" id="loadingMessages"><span></span><span></span><span></span></div>';

    // Load messages
    loadMessages(managerId);
};

// ========== ORDERS TAB - MESSAGES (MOCK) ==========
async function loadMessages(managerId) {
    // Mock messages for the selected manager
    messages = [
        { id: 1, text: 'Hello, how can I help you today?', is_sent_by_supplier: false, created_at: new Date(Date.now() - 3600000) },
        { id: 2, text: 'I need to check my order status', is_sent_by_supplier: true, created_at: new Date(Date.now() - 1800000) },
        { id: 3, text: 'Sure, what is your order number?', is_sent_by_supplier: false, created_at: new Date(Date.now() - 900000) }
    ];
    renderMessages(messages);
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    if (!messages.length) {
        container.innerHTML = '<div class="no-chat-selected"><i class="fas fa-comments"></i><p>No messages yet. Start a conversation!</p></div>';
        return;
    }

    container.innerHTML = messages.map(m => {
        const messageClass = m.is_sent_by_supplier ? 'sent' : 'received';
        const time = formatTime(m.created_at);
        return `
            <div class="message ${messageClass}">
                <div class="message-content">${escapeHtml(m.text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Send message with optimistic UI and simulated reply
async function sendMessage(e) {
    e.preventDefault();

    if (!currentManagerId) {
        showToast('Please select a manager first', 'warning');
        return;
    }

    const messageInput = document.getElementById('messageText');
    const text = messageInput.value.trim();

    if (!text) return;

    // Add message to UI immediately (optimistic)
    const container = document.getElementById('messagesContainer');
    const tempId = 'temp-' + Date.now();
    container.innerHTML += `
        <div class="message sent" id="${tempId}">
            <div class="message-content">${escapeHtml(text)}</div>
            <div class="message-time">Just now</div>
        </div>
    `;
    container.scrollTop = container.scrollHeight;
    messageInput.value = '';

    // Simulate reply after 2 seconds
    setTimeout(() => {
        // Remove temp ID (just a demo, we don't actually remove)
        // Add a received message
        container.innerHTML += `
            <div class="message received">
                <div class="message-content">Thanks for your message. I'll get back to you soon.</div>
                <div class="message-time">Just now</div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
    }, 2000);

    // In a real app, you'd send to server here
}

// Typing indicator functions (for future use)
function showTypingIndicator(managerId) {
    if (currentManagerId !== managerId) return;
    const container = document.getElementById('messagesContainer');
    if (document.getElementById('typingIndicator')) return;
    container.innerHTML += `
        <div class="typing-indicator" id="typingIndicator">
            <span></span><span></span><span></span>
        </div>
    `;
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
}

// ========== PRODUCTS TAB (MOCK) ==========
async function loadProducts() {
    // Mock products
    products = [
        { id: 1, sku: 'P001', name: 'Whole Wheat Bread', category: 'Bakery', price: 45, stock_quantity: 50, unit: 'loaf', is_active: true, min_stock_level: 10 },
        { id: 2, sku: 'P002', name: 'Fresh Milk', category: 'Dairy', price: 28, stock_quantity: 30, unit: 'litre', is_active: true, min_stock_level: 15 },
        { id: 3, sku: 'P003', name: 'Tomatoes', category: 'Vegetables', price: 40, stock_quantity: 8, unit: 'kg', is_active: true, min_stock_level: 20 },
        { id: 4, sku: 'P004', name: 'Rice', category: 'Grains', price: 220, stock_quantity: 15, unit: 'kg', is_active: false, min_stock_level: 10 }
    ];
    renderProducts(products);
    updateCategoryFilter();
    checkLowStock();
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
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.category)}</td>
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
    const product = products.find(p => p.id === id);
    if (!product) return;

    currentProductId = id;
    document.getElementById('productModalTitle').textContent = 'Edit Product';

    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productSKU').value = product.sku || '';
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock_quantity;
    document.getElementById('productMinStock').value = product.min_stock_level || 10;
    document.getElementById('productUnit').value = product.unit || 'pcs';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productActive').value = product.is_active ? 'true' : 'false';
    document.getElementById('productModal').classList.add('show');
};

async function saveProduct(e) {
    e.preventDefault();
    // Mock save
    showToast('Product saved (mock)', 'success');
    closeAllModals();
    loadProducts();
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
        // Mock delete
        showToast('Product deleted (mock)', 'success');
        loadProducts();
    }
};

// ========== PROFILE TAB (MOCK) ==========
async function loadProfile() {
    // Mock profile
    const profile = {
        fullname: 'Supplier Name',
        email: 'supplier@example.com',
        username: 'supplier1',
        location: 'Mumbai',
        contact: '+91 9876543210',
        category: 'Grocery'
    };

    const infoGrid = document.getElementById('profileInfo');
    if (infoGrid) {
        infoGrid.innerHTML = `
            <div class="info-item"><label>Full Name</label><p>${escapeHtml(profile.fullname)}</p></div>
            <div class="info-item"><label>Email</label><p>${escapeHtml(profile.email)}</p></div>
            <div class="info-item"><label>Username</label><p>${escapeHtml(profile.username)}</p></div>
            <div class="info-item"><label>Location</label><p>${escapeHtml(profile.location) || 'Not provided'}</p></div>
            <div class="info-item"><label>Contact</label><p>${escapeHtml(profile.contact) || 'Not provided'}</p></div>
            <div class="info-item"><label>Category</label><p>${escapeHtml(profile.category)}</p></div>
        `;
    }

    document.getElementById('profileFullName').textContent = profile.fullname;
    document.getElementById('profileCategory').textContent = `${profile.category} Supplier`;
    document.getElementById('profileAvatar').textContent = profile.fullname.charAt(0);

    const emailPref = localStorage.getItem('emailNotifications') === 'true';
    document.getElementById('emailNotifications').checked = emailPref;
}

function openEditProfileModal() {
    // Pre-fill with current mock data
    document.getElementById('editFullName').value = 'Supplier Name';
    document.getElementById('editEmail').value = 'supplier@example.com';
    document.getElementById('editLocation').value = 'Mumbai';
    document.getElementById('editContact').value = '+91 9876543210';
    document.getElementById('editCategory').value = 'Grocery';
    document.getElementById('editProfileModal').classList.add('show');
}

async function updateProfile(e) {
    e.preventDefault();
    showToast('Profile updated (mock)', 'success');
    closeAllModals();
    loadProfile();
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
    showToast('Password changed (mock)', 'success');
    closeAllModals();
    document.getElementById('passwordForm').reset();
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