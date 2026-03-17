/**
 * RetailX Advanced Admin Dashboard
 * Version: 3.0 - UX Enhanced
 * Theme: Midnight Slate & Electric Cobalt
 */

console.log("✅ ADMIN JS LOADED - Version 3.0 UX Enhanced");

// Global namespace
window.RetailX = window.RetailX || {};

// Dummy function for noBack()
function noBack() {}

// Global variables
let salesChart, analyticsChart, categoryChart;
let topSellingChart = null;
let leastSellingChart = null;
let notificationCount = 3;

/* =========================
   INITIALIZATION
========================= */
document.addEventListener('DOMContentLoaded', function() {
    console.log("📦 Initializing Admin Dashboard...");
    
    initDateTime();
    initNavigation();
    initFullscreen();
    initDashboard();
    loadNotifications();
    setupFormHandlers();
    setupMobileMenu();
    initChatbot();
    
    // Check for festival data
    setTimeout(() => {
        const festivalEl = document.getElementById('detected-festival');
        if (festivalEl && festivalEl.dataset.festival && typeof initFestivalCharts === 'function') {
            initFestivalCharts();
        }
    }, 500);
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (document.querySelector('#dashboard.active')) {
            refreshDashboardData();
        }
    }, 30000);
    
    // Set greeting message
    setGreeting();
});

/* =========================
   DATE & TIME
========================= */
function initDateTime() {
    updateCurrentDate();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const el = document.getElementById('currentDate');
    if (el) el.textContent = now.toLocaleDateString('en-US', options);
}

function updateCurrentTime() {
    const now = new Date();
    const el = document.getElementById('currentTime');
    if (el) el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function setGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const el = document.getElementById('greeting');
    if (el) el.textContent = greeting;
}

/* =========================
   FULLSCREEN
========================= */
function initFullscreen() {
    const btn = document.getElementById('fullscreenBtn');
    if (!btn) return;
    btn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function updateFullscreenIcon() {
    const btn = document.getElementById('fullscreenBtn');
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (document.fullscreenElement) {
        icon.className = 'fas fa-compress';
        btn.setAttribute('title', 'Exit Fullscreen');
    } else {
        icon.className = 'fas fa-expand';
        btn.setAttribute('title', 'Enter Fullscreen');
    }
}

/* =========================
   MOBILE MENU
========================= */
function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('active'));
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
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            
            const sectionId = this.dataset.section;
            const section = document.getElementById(sectionId);
            if (section) section.classList.add('active');
            
            const sectionName = this.querySelector('span').textContent;
            if (pageTitle) pageTitle.textContent = sectionName;
            if (breadcrumb) breadcrumb.textContent = `Admin / ${sectionName}`;
            
            if (sectionId === 'analytics' && typeof initFestivalCharts === 'function') {
                setTimeout(initFestivalCharts, 300);
            }
        });
    });
}

function navigateTo(section) {
    document.querySelector(`.nav-item[data-section="${section}"]`)?.click();
}

/* =========================
   DASHBOARD
========================= */
function initDashboard() {
    loadSettings();
    initSalesChart();
}

function refreshDashboard() {
    showLoading();
    setTimeout(() => {
        updateSalesChart();
        hideLoading();
        RetailX.showToast('Dashboard refreshed', 'success');
    }, 800);
}

function refreshDashboardData() {
    updateSalesChart();
}

/* =========================
   CHARTS
========================= */
function initSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    if (salesChart) salesChart.destroy();
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue ($)',
                data: [1200, 1900, 3000, 5000, 2845, 3200, 1800],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67,97,238,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4361ee',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#1e293b',
                    bodyColor: '#64748b',
                    borderColor: '#e2e8f0',
                    borderWidth: 1
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { callback: v => '$' + v }
                }
            }
        }
    });
}

function updateSalesChart() {
    const period = document.getElementById('salesPeriod')?.value || 'month';
    showLoading();
    
    setTimeout(() => {
        if (period === 'week') {
            salesChart.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            salesChart.data.datasets[0].data = [1200, 1900, 3000, 5000, 2845, 3200, 1800];
        } else if (period === 'month') {
            salesChart.data.labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            salesChart.data.datasets[0].data = [8500, 10200, 9800, 11500];
        } else {
            salesChart.data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            salesChart.data.datasets[0].data = [32000, 38000, 42000, 45000, 48000, 52000];
        }
        salesChart.update();
        hideLoading();
    }, 500);
}

function exportChartData() {
    const data = salesChart.data.datasets[0].data;
    const labels = salesChart.data.labels;
    let csv = 'Period,Revenue\n';
    labels.forEach((label, i) => csv += `${label},${data[i]}\n`);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    RetailX.showToast('Data exported', 'success');
}

/* =========================
   FESTIVAL CHARTS
========================= */
function initFestivalCharts() {
    const topEl = document.getElementById('top-products-data');
    const leastEl = document.getElementById('least-products-data');
    if (!topEl || !leastEl) return;
    
    try {
        let topProducts = [], leastProducts = [];
        
        if (topEl.dataset.products && topEl.dataset.products !== 'None') {
            topProducts = JSON.parse(topEl.dataset.products.replace(/&quot;/g, '"')) || [];
        }
        if (leastEl.dataset.products && leastEl.dataset.products !== 'None') {
            leastProducts = JSON.parse(leastEl.dataset.products.replace(/&quot;/g, '"')) || [];
        }
        
        if (topProducts.length > 0 || leastProducts.length > 0) {
            createFestivalCharts(topProducts, leastProducts);
        } else {
            showEmptyCharts();
        }
    } catch (e) {
        console.error('Error parsing festival data:', e);
    }
}

function createFestivalCharts(topProducts, leastProducts) {
    const formattedTop = (topProducts || []).map(p => ({
        product: p.product || 'Unknown',
        units: parseFloat(p.predicted_sales) || 0
    }));
    
    const formattedLeast = (leastProducts || []).map(p => ({
        product: p.product || 'Unknown',
        units: parseFloat(p.predicted_sales) || 0
    }));
    
    if (formattedTop.length > 0) {
        createHorizontalBarChart('topSellingChart', formattedTop, '#e67e22');
    } else {
        clearChart('topSellingChart', 'No top products data');
    }
    
    if (formattedLeast.length > 0) {
        createHorizontalBarChart('leastSellingChart', formattedLeast, '#3498db');
    } else {
        clearChart('leastSellingChart', 'No least products data');
    }
}

function createHorizontalBarChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    if (canvasId === 'topSellingChart' && topSellingChart) topSellingChart.destroy();
    if (canvasId === 'leastSellingChart' && leastSellingChart) leastSellingChart.destroy();
    
    const sorted = [...data].sort((a,b) => b.units - a.units);
    const labels = sorted.map(item => 
        item.product.length > 20 ? item.product.substring(0,17)+'...' : item.product
    );
    const values = sorted.map(item => Math.max(0, item.units));
    
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expected Units',
                data: values,
                backgroundColor: color + '20',
                borderColor: color,
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${sorted[ctx.dataIndex].product}: ${ctx.raw.toLocaleString()} units`
                    }
                }
            }
        }
    });
    
    if (canvasId === 'topSellingChart') topSellingChart = chart;
    else leastSellingChart = chart;
}

function clearChart(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px Inter';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width/2, canvas.height/2);
}

function showEmptyCharts() {
    clearChart('topSellingChart', 'No prediction data');
    clearChart('leastSellingChart', 'No prediction data');
}

/* =========================
   USER MANAGEMENT
========================= */
function filterUsers(role) {
    const filter = document.getElementById('userFilter');
    if (role && filter) filter.value = role;
    
    const filterValue = filter?.value || 'all';
    const searchValue = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('#usersTableBody tr');
    let visible = 0;
    
    rows.forEach(row => {
        if (row.querySelector('.empty-state')) return;
        
        const roleCell = row.querySelector('.role-badge')?.textContent.toLowerCase() || '';
        const text = row.textContent.toLowerCase();
        let show = true;
        
        if (filterValue !== 'all' && !roleCell.includes(filterValue)) show = false;
        if (searchValue && !text.includes(searchValue)) show = false;
        
        row.style.display = show ? '' : 'none';
        if (show) visible++;
    });
}

function searchUsers() { filterUsers(); }

function toggleAllUsers() {
    const checked = document.getElementById('selectAllUsers')?.checked || false;
    document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = checked);
}

function openUserModal() {
    document.getElementById('userModal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('userForm')?.reset();
}

function openEditUserModal(userId, userType) {
    fetch(`/get-user/${userType}/${userId}/`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            document.getElementById('edit_user_id').value = d.user.id;
            document.getElementById('edit_user_type').value = userType;
            document.getElementById('edit_fullname').value = d.user.fullname;
            document.getElementById('edit_email').value = d.user.email;
            document.getElementById('edit_username').value = d.user.username;
            document.getElementById('editUserModal').style.display = 'flex';
        } else {
            RetailX.showToast('Error loading user', 'error');
        }
    })
    .catch(() => RetailX.showToast('Failed to load user', 'error'));
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
}

function deleteUser(userId, userType) {
    Swal.fire({
        title: 'Delete User?',
        text: "This action cannot be undone",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Delete'
    }).then(result => {
        if (result.isConfirmed) {
            showLoading();
            fetch(`/delete-user/${userType.toLowerCase()}/${userId}/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCSRFToken(), 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    Swal.fire('Deleted!', d.message, 'success');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    Swal.fire('Error!', d.error, 'error');
                }
                hideLoading();
            })
            .catch(() => { hideLoading(); Swal.fire('Error!', 'Server error', 'error'); });
        }
    });
}

function exportUsers() {
    window.location.href = '/export-users/';
}

/* =========================
   NOTIFICATIONS
========================= */
function toggleNotifications() {
    document.getElementById('notificationPanel')?.classList.toggle('show');
}

function loadNotifications() {
    const notifications = [
        { id:1, type:'info', icon:'info-circle', title:'Welcome back!', message:'System is running smoothly', time:'Just now', unread:true },
        { id:2, type:'success', icon:'check-circle', title:'Backup Complete', message:'Database backup successful', time:'2 hours ago', unread:true },
        { id:3, type:'warning', icon:'exclamation-triangle', title:'Update Available', message:'New system update ready', time:'5 hours ago', unread:false }
    ];
    
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    list.innerHTML = '';
    notifications.forEach(n => {
        const item = document.createElement('div');
        item.className = `notification-item ${n.unread ? 'unread' : ''}`;
        item.innerHTML = `
            <div style="display:flex; gap:12px;">
                <i class="fas fa-${n.icon}" style="color:var(--${n.type});"></i>
                <div>
                    <h5>${n.title}</h5>
                    <p>${n.message}</p>
                    <small>${n.time}</small>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
    
    const badge = document.querySelector('.notification-count');
    if (badge) {
        badge.textContent = notificationCount;
        badge.style.display = notificationCount ? 'flex' : 'none';
    }
}

function markAllAsRead() {
    notificationCount = 0;
    document.querySelector('.notification-count').style.display = 'none';
    document.getElementById('notificationPanel')?.classList.remove('show');
    RetailX.showToast('All notifications marked as read', 'success');
}

function viewAllNotifications() {
    document.getElementById('notificationPanel')?.classList.remove('show');
    RetailX.showToast('View all notifications - Coming soon!', 'info');
}

/* =========================
   FORM HANDLERS
========================= */
function setupFormHandlers() {
    const festivalForm = document.getElementById('festivalSearchForm');
    if (festivalForm) {
        festivalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const select = document.getElementById('festival_select').value;
            const date = document.getElementById('festival_date').value;
            
            if (!select && !date) {
                RetailX.showToast('Please select a festival or enter a date', 'warning');
                return;
            }
            
            showLoading();
            
            const params = new URLSearchParams();
            params.append('festival', select || date);
            
            fetch(window.location.pathname + '?' + params, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(r => r.json())
            .then(data => {
                document.getElementById('top-products-data').dataset.products = JSON.stringify(data.top_products || []);
                document.getElementById('least-products-data').dataset.products = JSON.stringify(data.least_products || []);
                document.getElementById('detected-festival').dataset.festival = data.detected_festival || '';
                
                const hasFestival = data.detected_festival;
                const banner = document.getElementById('festival-banner');
                const charts = document.getElementById('festival-charts');
                const empty = document.getElementById('festival-empty');
                
                if (banner) {
                    banner.style.display = hasFestival ? 'flex' : 'none';
                    if (hasFestival) document.getElementById('festival-name').textContent = data.detected_festival;
                }
                if (charts) charts.style.display = hasFestival ? 'grid' : 'none';
                if (empty) empty.style.display = hasFestival ? 'none' : 'flex';
                
                initFestivalCharts();
                hideLoading();
                RetailX.showToast('Prediction updated', 'success');
            })
            .catch(() => {
                hideLoading();
                RetailX.showToast('Failed to load prediction', 'error');
            });
        });
    }
    
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(editUserForm);
            const userId = formData.get('user_id');
            const userType = formData.get('user_type');
            
            showLoading();
            
            fetch(`/edit-user/${userType}/${userId}/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCSRFToken(), 'X-Requested-With': 'XMLHttpRequest' },
                body: formData
            })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    RetailX.showToast('User updated successfully', 'success');
                    closeEditUserModal();
                    setTimeout(() => location.reload(), 1000);
                } else {
                    RetailX.showToast(d.error || 'Update failed', 'error');
                }
                hideLoading();
            })
            .catch(() => { hideLoading(); RetailX.showToast('Server error', 'error'); });
        });
    }
}

/* =========================
   QUICK ACTIONS
========================= */
function quickGenerateReport() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        RetailX.showToast('Report generation started', 'success');
    }, 1500);
}

/* =========================
   SETTINGS
========================= */
function loadSettings() {
    const theme = localStorage.getItem('retailx-theme') || 'default';
    changeTheme(theme);
}

function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('retailx-theme', theme);
}

function saveSettings() {
    RetailX.showToast('Settings saved', 'success');
}

/* =========================
   UTILITY FUNCTIONS
========================= */
function getCSRFToken() {
    let token = null;
    const name = 'csrftoken';
    
    if (document.cookie) {
        document.cookie.split(';').forEach(c => {
            const cookie = c.trim();
            if (cookie.startsWith(name + '=')) {
                token = decodeURIComponent(cookie.substring(name.length + 1));
            }
        });
    }
    
    if (!token) {
        const input = document.querySelector('[name=csrfmiddlewaretoken]');
        if (input) token = input.value;
    }
    
    return token;
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Toast notifications
RetailX.showToast = function(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => toast.classList.remove('show'), 3000);
};

/* =========================
   CHATBOT
========================= */
function initChatbot() {
    const messages = document.getElementById('chatbot-messages');
    if (messages && !messages.children.length) {
        messages.innerHTML = '<div class="chat-bot"><span>👋 Hello! I\'m your RetailX Assistant. How can I help?</span></div>';
    }
}

function toggleChatbot() {
    const box = document.getElementById('chatbot-box');
    if (box) box.style.display = box.style.display === 'none' ? 'flex' : 'none';
}

function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const messages = document.getElementById('chatbot-messages');
    if (!input || !messages || !input.value.trim()) return;
    
    const message = input.value.trim();
    
    messages.innerHTML += `<div class="chat-user"><span>${escapeHtml(message)}</span></div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    const typingId = 'typing-' + Date.now();
    messages.innerHTML += `<div class="chat-bot" id="${typingId}"><span>🤖 Typing...</span></div>`;
    messages.scrollTop = messages.scrollHeight;
    
    fetch('/chatbot/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
        body: JSON.stringify({ message })
    })
    .then(r => r.json())
    .then(data => {
        document.getElementById(typingId)?.remove();
        messages.innerHTML += `<div class="chat-bot"><span>${escapeHtml(data.reply)}</span></div>`;
        messages.scrollTop = messages.scrollHeight;
    })
    .catch(() => {
        document.getElementById(typingId)?.remove();
        messages.innerHTML += `<div class="chat-bot"><span>⚠️ Sorry, something went wrong. Please try again.</span></div>`;
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}