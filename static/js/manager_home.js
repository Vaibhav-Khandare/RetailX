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

$(document).ready(function () {
    console.log('RetailX Engine: Initializing Manager Dashboard...');
    RetailX.init();
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
        reports: 'Reports & Analytics',
        transactions: 'Transactions',
        settings: 'Store Settings'
    };
    
    $('#pageTitle').text(titles[pageId]);
    $('#breadcrumb').text(`Home / ${titles[pageId]}`);

    // Contextual Data Loading
    this.loadPageData(pageId);
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

RetailX.renderKPIs = function(data) {
    $('#totalRevenue').text(`$${data.total_revenue.toLocaleString()}`);
    $('#inventoryValue').text(`$${data.inventory_value.toLocaleString()}`);
    $('#activeStaff').text(data.active_staff);
    $('#customerSatisfaction').text(`${data.satisfaction}%`);
};

RetailX.renderCharts = function(apiData) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Destroy existing chart to prevent memory leaks
    if (RetailX.charts.revenue) RetailX.charts.revenue.destroy();

    RetailX.charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: apiData.labels,
            datasets: [{
                label: 'Revenue',
                data: apiData.values,
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
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
        }
    });
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
        window.location.href = '/login';
    } else {
        this.showToast('Server Communication Error', 'error');
    }
};

// Global "No Back" functionality
function noBack() {
    window.history.forward();
}