// manager_home_ajax.js - FINAL (LOGOUT SAFE, DJANGO SAFE)

let isLoggingOut = false;   // 🔴 IMPORTANT FLAG

$(document).ready(function () {
    console.log('Manager dashboard loaded (AJAX version)');

    initDashboard();
    initEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    setTimeout(loadDashboardData, 500);
});

/* ===============================
   CSRF SETUP
================================ */
function getCSRFToken() {
    return $('meta[name="csrf-token"]').attr('content');
}

$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", getCSRFToken());
        }
    },
    xhrFields: {
        withCredentials: true
    }
});

/* ===============================
   SAFE AJAX REQUEST (LOGOUT SAFE)
================================ */
function makeRequest(url, method = 'GET', data = null, successCb = null) {
    $.ajax({
        url: url,
        type: method,
        data: data ? JSON.stringify(data) : null,
        contentType: 'application/json',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        success: function (response) {
            if (successCb) successCb(response);
        },
        error: function (xhr) {

            // 🔴 Logout ke time AJAX errors ignore
            if (isLoggingOut) {
                console.log('AJAX error ignored due to logout');
                return;
            }

            // 🔴 Session expired case (NO redirect)
            if (xhr.status === 401 || xhr.status === 403) {
                showToast('Session expired. Please login again.', 'warning');
                return;
            }

            console.error('AJAX Error:', xhr);
            showToast('Server error occurred', 'error');
        }
    });
}

/* ===============================
   INIT FUNCTIONS
================================ */
function initDashboard() {
    const manager = $('body').data('manager') || 'Manager';
    $('#managerName').text(manager);
    switchPage('dashboard');
}

function initEventListeners() {

    // 🔴 LOGOUT BUTTON FIX
    $('#logoutBtn').on('click', function () {
        isLoggingOut = true;
    });

    $('.menu-item').on('click', function (e) {
        e.preventDefault();
        const page = $(this).data('page');
        if (page) switchPage(page);
    });

    $('#refreshBtn').on('click', refreshCurrentPage);
    $('#notificationsBtn').on('click', showNotifications);

    $('#addProductForm').on('submit', function (e) {
        e.preventDefault();
        addNewProduct();
    });

    $('#addStaffForm').on('submit', function (e) {
        e.preventDefault();
        addNewStaff();
    });

    $('.modal-close, .cancel-btn').on('click', closeAllModals);

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') closeAllModals();
    });
}

/* ===============================
   PAGE SWITCHING
================================ */
function switchPage(page) {
    $('.menu-item').removeClass('active');
    $(`.menu-item[data-page="${page}"]`).addClass('active');

    $('.page').removeClass('active');
    $(`#${page}-page`).addClass('active');

    updatePageTitle(page);
    setTimeout(() => loadPageData(page), 300);
}

function updatePageTitle(page) {
    const titles = {
        dashboard: 'Dashboard',
        overview: 'Store Overview',
        inventory: 'Inventory Management',
        staff: 'Staff Management',
        reports: 'Reports & Analytics'
    };

    $('#pageTitle').text(titles[page] || 'Dashboard');
    $('#breadcrumb').text(`Home / ${titles[page] || 'Dashboard'}`);
}

/* ===============================
   DATE & TIME
================================ */
function updateDateTime() {
    const now = new Date();
    $('#currentDate').text(now.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));
    $('#currentTime').text(now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
    }));
}

/* ===============================
   DASHBOARD DATA (AJAX)
================================ */
function loadDashboardData() {
    makeRequest('/api/manager/dashboard/kpi/', 'GET', null, updateKPICards);
    makeRequest('/api/manager/dashboard/revenue-chart/', 'GET', null, renderRevenueChart);
    makeRequest('/api/manager/dashboard/category-chart/', 'GET', null, renderCategoryChart);
    makeRequest('/api/manager/dashboard/activities/', 'GET', null, updateActivitiesList);
    makeRequest('/api/manager/dashboard/alerts/', 'GET', null, updateAlertsList);
    makeRequest('/api/manager/dashboard/quick-stats/', 'GET', null, updateQuickStats);
}

function loadPageData(page) {
    if (page === 'inventory') loadInventoryData();
    if (page === 'staff') loadStaffData();
    if (page === 'reports') loadReportsData();
}

/* ===============================
   INVENTORY
================================ */
function loadInventoryData() {
    makeRequest('/api/manager/inventory/', 'GET', null, function (data) {
        updateInventoryTable(data.products);
    });
}

/* ===============================
   STAFF
================================ */
function loadStaffData() {
    makeRequest('/api/manager/staff/list/', 'GET', null, updateStaffTable);
}

/* ===============================
   REPORTS
================================ */
function loadReportsData() {
    makeRequest('/api/manager/reports/', 'GET', null, updateReportPreview);
}

/* ===============================
   UI UPDATE FUNCTIONS
================================ */
function updateKPICards(data) {
    $('#totalRevenue').text(`₹${data.total_revenue || 0}`);
    $('#inventoryValue').text(`₹${data.inventory_value || 0}`);
    $('#activeStaff').text(data.active_staff || 0);
    $('#customerSatisfaction').text(`${data.customer_satisfaction || 0}%`);
}

function updateQuickStats(data) {
    $('#todayRevenue').text(`₹${data.today_revenue || 0}`);
    $('#onlineOrders').text(data.online_orders || 0);
}

function updateActivitiesList(list) {
    if (!list || list.length === 0) {
        $('#activitiesList').html('<div class="empty-state">No activities</div>');
        return;
    }

    $('#activitiesList').html(list.map(a => `
        <div class="activity-item">
            <p>${a.title}</p>
            <small>${a.time}</small>
        </div>
    `).join(''));
}

function updateAlertsList(list) {
    if (!list || list.length === 0) {
        $('#alertsList').html('<div class="empty-state">No alerts</div>');
        return;
    }

    $('.alert-count').text(list.length);
}

/* ===============================
   MODALS
================================ */
function showAddProductModal() {
    $('#addProductModal').fadeIn();
}

function showAddStaffModal() {
    $('#addStaffModal').fadeIn();
}

function showNotifications() {
    $('#notificationModal').fadeIn();
}

function closeAllModals() {
    $('.modal').fadeOut();
}

/* ===============================
   ACTIONS
================================ */
function addNewProduct() {
    showToast('Product added', 'success');
    closeAllModals();
    loadInventoryData();
}

function addNewStaff() {
    showToast('Staff added', 'success');
    closeAllModals();
    loadStaffData();
}

function refreshCurrentPage() {
    const page = $('.page.active').attr('id').replace('-page', '');
    loadPageData(page);
    showToast('Page refreshed', 'success');
}

/* ===============================
   TOAST
================================ */
function showToast(msg, type = 'info') {
    const toast = $('#toast');
    toast.text(msg).attr('class', `toast ${type} show`);
    setTimeout(() => toast.removeClass('show'), 3000);
}
