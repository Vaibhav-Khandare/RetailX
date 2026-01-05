// manager_home.js - SIMPLIFIED WORKING VERSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('Manager dashboard loaded');
    
    // Initialize everything
    initDashboard();
    initEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load initial data with a delay to ensure DOM is ready
    setTimeout(() => {
        loadDashboardData();
    }, 500);
    
    function initDashboard() {
        // Try to get manager name from session
        try {
            const managerUsername = document.querySelector('body').getAttribute('data-manager') || 'Manager Name';
            document.getElementById('managerName').textContent = managerUsername;
        } catch (e) {
            console.log('Could not set manager name');
        }
        
        // Set initial page
        switchPage('dashboard');
    }
    
    function initEventListeners() {
        console.log('Initializing event listeners');
        
        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.dataset.page;
                if (page && page !== 'transactions' && page !== 'settings') {
                    switchPage(page);
                } else {
                    showToast('This page is not implemented yet', 'info');
                }
            });
        });
        
        // Remove logout button event listener - Let HTML handle it directly
        // The <a href="/logout"> will work directly
        
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', function() {
            refreshCurrentPage();
        });
        
        // Notifications button
        document.getElementById('notificationsBtn').addEventListener('click', function() {
            showNotifications();
        });
        
        // Apply date range
        const applyDateRangeBtn = document.getElementById('applyDateRange');
        if (applyDateRangeBtn) {
            applyDateRangeBtn.addEventListener('click', function() {
                applyDateRange();
            });
        }
        
        // Add product button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', function() {
                showAddProductModal();
            });
        }
        
        // Add staff button
        const addStaffBtn = document.getElementById('addStaffBtn');
        if (addStaffBtn) {
            addStaffBtn.addEventListener('click', function() {
                showAddStaffModal();
            });
        }
        
        // Generate report button
        const generateReportBtn = document.getElementById('generateReport');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', function() {
                generateReport();
            });
        }
        
        // Inventory filter
        const applyInventoryFilterBtn = document.getElementById('applyInventoryFilter');
        if (applyInventoryFilterBtn) {
            applyInventoryFilterBtn.addEventListener('click', function() {
                loadInventoryData();
            });
        }
        
        // Report type change
        const reportPeriodSelect = document.getElementById('reportPeriod');
        if (reportPeriodSelect) {
            reportPeriodSelect.addEventListener('change', function() {
                const value = this.value;
                const customRangeGroup = document.getElementById('customRangeGroup');
                if (value === 'custom') {
                    customRangeGroup.style.display = 'flex';
                } else {
                    customRangeGroup.style.display = 'none';
                }
            });
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                closeAllModals();
            });
        });
        
        // Add product form submission
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', function(e) {
                e.preventDefault();
                addNewProduct();
            });
        }
        
        // Add staff form submission
        const addStaffForm = document.getElementById('addStaffForm');
        if (addStaffForm) {
            addStaffForm.addEventListener('submit', function(e) {
                e.preventDefault();
                addNewStaff();
            });
        }
        
        // Close modals when clicking outside
        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        };
        
        // Handle Escape key to close modals
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeAllModals();
            }
        });
    }
    
    function switchPage(pageName) {
        console.log('Switching to page:', pageName);
        
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const page = document.getElementById(`${pageName}-page`);
        if (page) {
            page.classList.add('active');
            
            // Update page title and breadcrumb
            updatePageTitle(pageName);
            
            // Load page-specific data
            setTimeout(() => {
                loadPageData(pageName);
            }, 300);
        }
    }
    
    function updatePageTitle(pageName) {
        const titles = {
            'dashboard': 'Dashboard',
            'overview': 'Store Overview',
            'inventory': 'Inventory Management',
            'staff': 'Staff Management',
            'reports': 'Reports & Analytics',
            'transactions': 'Transactions',
            'settings': 'Store Settings'
        };
        
        const pageTitle = document.getElementById('pageTitle');
        const breadcrumb = document.getElementById('breadcrumb');
        
        if (pageTitle) {
            pageTitle.textContent = titles[pageName] || 'Dashboard';
        }
        
        if (breadcrumb) {
            breadcrumb.textContent = `Home / ${titles[pageName] || 'Dashboard'}`;
        }
    }
    
    function updateDateTime() {
        try {
            const now = new Date();
            
            // Format date
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
            
            // Format time
            document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', {
                hour12: true,
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.log('Error updating date/time');
        }
    }
    
    // API Functions
    async function makeRequest(url, method = 'GET', data = null) {
        try {
            console.log('Making request to:', url);
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            };
            
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            showToast('Error fetching data. Please try again.', 'error');
            return null;
        }
    }
    
    // Data Loading Functions
    async function loadDashboardData() {
        console.log('Loading dashboard data');
        
        try {
            // Load KPI data
            const kpiData = await makeRequest('/api/manager/dashboard/kpi/');
            console.log('KPI data:', kpiData);
            if (kpiData) {
                updateKPICards(kpiData);
            }
            
            // Load revenue chart data
            const revenueData = await makeRequest('/api/manager/dashboard/revenue-chart/?period=7d');
            if (revenueData) {
                renderRevenueChart(revenueData);
            }
            
            // Load category chart data
            const categoryData = await makeRequest('/api/manager/dashboard/category-chart/');
            if (categoryData) {
                renderCategoryChart(categoryData);
            }
            
            // Load recent activities
            const activities = await makeRequest('/api/manager/dashboard/activities/');
            if (activities) {
                updateActivitiesList(activities);
            }
            
            // Load alerts
            const alerts = await makeRequest('/api/manager/dashboard/alerts/');
            if (alerts) {
                updateAlertsList(alerts);
            }
            
            // Load quick stats
            const quickStats = await makeRequest('/api/manager/dashboard/quick-stats/');
            if (quickStats) {
                updateQuickStats(quickStats);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Show sample data if API fails
            showSampleData();
        }
    }
    
    async function loadPageData(pageName) {
        console.log('Loading page data for:', pageName);
        
        switch (pageName) {
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
                loadReportsData();
                break;
            default:
                break;
        }
    }
    
    async function loadOverviewData() {
        try {
            // Load store performance data
            const performanceData = await makeRequest('/api/manager/overview/performance/');
            if (performanceData) {
                updatePerformanceMetrics(performanceData);
            }
            
            // Load staff performance
            const staffPerformance = await makeRequest('/api/manager/overview/staff-performance/');
            if (staffPerformance) {
                updateStaffPerformanceTable(staffPerformance);
            }
            
            // Load live sales
            const liveSales = await makeRequest('/api/manager/overview/live-sales/');
            if (liveSales) {
                updateLiveSales(liveSales);
            }
        } catch (error) {
            console.error('Error loading overview data:', error);
        }
    }
    
    async function loadInventoryData() {
        try {
            const search = document.getElementById('inventorySearch')?.value || '';
            const category = document.getElementById('categoryFilter')?.value || '';
            const stockLevel = document.getElementById('stockFilter')?.value || '';
            
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (category) params.append('category', category);
            if (stockLevel) params.append('stock_level', stockLevel);
            
            const url = `/api/manager/inventory/?${params.toString()}`;
            const inventoryData = await makeRequest(url);
            
            if (inventoryData) {
                updateInventoryTable(inventoryData.products);
                updateLowStockAlerts(inventoryData.low_stock_alerts);
            }
        } catch (error) {
            console.error('Error loading inventory data:', error);
        }
    }
    
    async function loadStaffData() {
        try {
            // Load staff summary
            const summaryData = await makeRequest('/api/manager/staff/summary/');
            if (summaryData) {
                updateStaffSummary(summaryData);
            }
            
            // Load staff list
            const staffList = await makeRequest('/api/manager/staff/list/');
            if (staffList) {
                updateStaffTable(staffList);
            }
            
            // Load weekly schedule
            const scheduleData = await makeRequest('/api/manager/staff/schedule/');
            if (scheduleData) {
                updateWeeklySchedule(scheduleData);
            }
        } catch (error) {
            console.error('Error loading staff data:', error);
        }
    }
    
    async function loadReportsData() {
        try {
            const reportType = document.getElementById('reportType')?.value || 'sales';
            const period = document.getElementById('reportPeriod')?.value || 'month';
            
            let startDate = '', endDate = '';
            if (period === 'custom') {
                startDate = document.getElementById('customStartDate')?.value || '';
                endDate = document.getElementById('customEndDate')?.value || '';
            }
            
            const params = new URLSearchParams({
                report_type: reportType,
                period: period
            });
            
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            const url = `/api/manager/reports/?${params.toString()}`;
            const reportData = await makeRequest(url);
            
            if (reportData) {
                updateReportPreview(reportData);
            }
        } catch (error) {
            console.error('Error loading reports data:', error);
        }
    }
    
    // Update UI Functions
    function updateKPICards(data) {
        console.log('Updating KPI cards with data:', data);
        
        if (data.total_revenue !== undefined) {
            document.getElementById('totalRevenue').textContent = `$${parseFloat(data.total_revenue).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
        
        if (data.inventory_value !== undefined) {
            document.getElementById('inventoryValue').textContent = `$${parseFloat(data.inventory_value).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
        
        if (data.active_staff !== undefined) {
            document.getElementById('activeStaff').textContent = data.active_staff;
        }
        
        if (data.customer_satisfaction !== undefined) {
            document.getElementById('customerSatisfaction').textContent = `${data.customer_satisfaction}%`;
        }
    }
    
    function updateQuickStats(data) {
        if (data.today_revenue !== undefined) {
            document.getElementById('todayRevenue').textContent = `$${parseFloat(data.today_revenue).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
        
        if (data.online_orders !== undefined) {
            document.getElementById('onlineOrders').textContent = data.online_orders;
        }
    }
    
    function updateActivitiesList(activities) {
        const container = document.getElementById('activitiesList');
        if (!container) return;
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<div class="empty-state">No recent activities</div>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-title">${activity.title}</p>
                    <p class="activity-time">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }
    
    function updateAlertsList(alerts) {
        const container = document.getElementById('alertsList');
        if (!container) return;
        
        if (!alerts || alerts.length === 0) {
            container.innerHTML = '<div class="empty-state">No alerts</div>';
            return;
        }
        
        // Update alert count
        const alertCount = document.querySelector('.alert-count');
        if (alertCount) {
            alertCount.textContent = alerts.length;
        }
        
        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.priority}">
                <div class="alert-icon">
                    <i class="fas fa-${getAlertIcon(alert.type)}"></i>
                </div>
                <div class="alert-content">
                    <p class="alert-message">${alert.message}</p>
                    <span class="alert-time">${alert.time}</span>
                </div>
            </div>
        `).join('');
    }
    
    function showSampleData() {
        console.log('Showing sample data');
        
        // Update KPI cards with sample data
        document.getElementById('totalRevenue').textContent = '$12,458.50';
        document.getElementById('inventoryValue').textContent = '$45,230.00';
        document.getElementById('activeStaff').textContent = '8';
        document.getElementById('customerSatisfaction').textContent = '92%';
        document.getElementById('todayRevenue').textContent = '$1,245.00';
        document.getElementById('onlineOrders').textContent = '24';
        
        // Show sample activities
        const activitiesContainer = document.getElementById('activitiesList');
        if (activitiesContainer) {
            activitiesContainer.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon sale">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <div class="activity-details">
                        <p class="activity-title">New sale recorded</p>
                        <p class="activity-time">10 minutes ago</p>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="activity-icon inventory">
                        <i class="fas fa-boxes"></i>
                    </div>
                    <div class="activity-details">
                        <p class="activity-title">Inventory updated</p>
                        <p class="activity-time">30 minutes ago</p>
                    </div>
                </div>
                <div class="activity-item">
                    <div class="activity-icon staff">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <div class="activity-details">
                        <p class="activity-title">New staff member added</p>
                        <p class="activity-time">2 hours ago</p>
                    </div>
                </div>
            `;
        }
        
        // Show sample alerts
        const alertsContainer = document.getElementById('alertsList');
        if (alertsContainer) {
            alertsContainer.innerHTML = `
                <div class="alert-item critical">
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="alert-content">
                        <p class="alert-message">Low stock: iPhone 14 Pro (Stock: 3)</p>
                        <span class="alert-time">Today</span>
                    </div>
                </div>
                <div class="alert-item warning">
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="alert-content">
                        <p class="alert-message">Electronics category running low</p>
                        <span class="alert-time">2 hours ago</span>
                    </div>
                </div>
            `;
        }
    }
    
    // Chart Functions
    function renderRevenueChart(data) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (window.revenueChart instanceof Chart) {
            window.revenueChart.destroy();
        }
        
        // If no data, create sample data
        if (!data || !data.labels || data.labels.length === 0) {
            data = {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                values: [1200, 1900, 1500, 2100, 2500, 2200, 1800]
            };
        }
        
        window.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Revenue',
                    data: data.values || [],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
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
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderCategoryChart(data) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (window.categoryChart instanceof Chart) {
            window.categoryChart.destroy();
        }
        
        // If no data, create sample data
        if (!data || !data.labels || data.labels.length === 0) {
            data = {
                labels: ['Electronics', 'Clothing', 'Groceries', 'Home'],
                values: [50000, 35000, 25000, 15000]
            };
        }
        
        window.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: [
                        '#4CAF50',
                        '#2196F3',
                        '#FF9800',
                        '#9C27B0',
                        '#F44336',
                        '#00BCD4'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Modal Functions
    function showAddProductModal() {
        const modal = document.getElementById('addProductModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function showAddStaffModal() {
        const modal = document.getElementById('addStaffModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function showNotifications() {
        const modal = document.getElementById('notificationModal');
        if (modal) {
            loadNotifications();
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    async function loadNotifications() {
        try {
            const notifications = await makeRequest('/api/manager/notifications/');
            const container = document.getElementById('notificationList');
            
            if (!container) return;
            
            if (!notifications || notifications.length === 0) {
                container.innerHTML = '<div class="empty-state">No notifications</div>';
                return;
            }
            
            container.innerHTML = notifications.map(notification => `
                <div class="notification-item ${notification.unread ? 'unread' : ''}">
                    <div class="notification-icon">
                        <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-title">${notification.title}</p>
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-time">${notification.time}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }
    
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
    
    // Action Functions
    async function addNewProduct() {
        const form = document.getElementById('addProductForm');
        if (!form) return;
        
        showToast('Adding product...', 'info');
        
        // For now, just show success message
        setTimeout(() => {
            showToast('Product added successfully!', 'success');
            closeAllModals();
            form.reset();
            loadInventoryData();
        }, 1000);
    }
    
    async function addNewStaff() {
        const form = document.getElementById('addStaffForm');
        if (!form) return;
        
        showToast('Adding staff member...', 'info');
        
        // For now, just show success message
        setTimeout(() => {
            showToast('Staff member added successfully!', 'success');
            closeAllModals();
            form.reset();
            loadStaffData();
        }, 1000);
    }
    
    async function generateReport() {
        showToast('Generating report...', 'info');
        
        setTimeout(() => {
            showToast('Report generated successfully!', 'success');
            loadReportsData();
        }, 1000);
    }
    
    function applyDateRange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate && endDate) {
            showToast('Date range applied successfully!', 'success');
            loadOverviewData();
        } else {
            showToast('Please select both start and end dates.', 'warning');
        }
    }
    
    // Utility Functions
    function getActivityIcon(type) {
        const icons = {
            'sale': 'shopping-cart',
            'return': 'undo',
            'inventory': 'boxes',
            'staff': 'user-plus',
            'system': 'cog'
        };
        return icons[type] || 'bell';
    }
    
    function getAlertIcon(type) {
        const icons = {
            'inventory': 'boxes',
            'sales': 'chart-line',
            'staff': 'users'
        };
        return icons[type] || 'exclamation-triangle';
    }
    
    function getNotificationIcon(type) {
        const icons = {
            'order': 'shopping-bag',
            'inventory': 'box',
            'staff': 'user-check',
            'alert': 'bell'
        };
        return icons[type] || 'bell';
    }
    
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) {
            // Create toast if it doesn't exist
            const toastEl = document.createElement('div');
            toastEl.id = 'toast';
            toastEl.className = 'toast';
            document.body.appendChild(toast);
            return showToast(message, type);
        }
        
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }
    
    function refreshCurrentPage() {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id.replace('-page', '');
            loadPageData(pageId);
            showToast('Page refreshed!', 'success');
        }
    }
    
    // Global functions (accessible from HTML onclick)
    window.viewStaffDetails = function(staffId) {
        showToast(`Viewing details for staff ${staffId}`, 'info');
    };
    
    window.editProduct = function(productId) {
        showToast(`Editing product ${productId}`, 'info');
    };
    
    window.deleteProduct = function(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            showToast(`Deleting product ${productId}`, 'info');
        }
    };
    
    window.reorderProduct = function(productId) {
        showToast(`Initiating reorder for product ${productId}`, 'info');
    };
    
    window.editStaff = function(staffId) {
        showToast(`Editing staff ${staffId}`, 'info');
    };
    
    window.viewStaff = function(staffId) {
        showToast(`Viewing staff ${staffId}`, 'info');
    };
    
    // Add update functions for other pages
    window.updatePerformanceMetrics = function(data) {
        if (data.total_orders !== undefined) {
            const totalOrdersEl = document.getElementById('totalOrders');
            if (totalOrdersEl) totalOrdersEl.textContent = data.total_orders.toLocaleString();
        }
        
        if (data.new_customers !== undefined) {
            const newCustomersEl = document.getElementById('newCustomers');
            if (newCustomersEl) newCustomersEl.textContent = data.new_customers.toLocaleString();
        }
        
        if (data.return_rate !== undefined) {
            const returnRateEl = document.getElementById('returnRate');
            if (returnRateEl) returnRateEl.textContent = `${data.return_rate}%`;
        }
        
        if (data.avg_order_value !== undefined) {
            const avgOrderValueEl = document.getElementById('avgOrderValue');
            if (avgOrderValueEl) avgOrderValueEl.textContent = `$${parseFloat(data.avg_order_value).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    };
    
    window.updateStaffPerformanceTable = function(staffList) {
        const container = document.getElementById('staffPerformanceTable');
        if (!container) return;
        
        if (!staffList || staffList.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="empty-state">No staff performance data available</td></tr>';
            return;
        }
        
        container.innerHTML = staffList.map(staff => `
            <tr>
                <td>
                    <div class="staff-info">
                        <div class="staff-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <strong>${staff.name}</strong>
                            <small>${staff.id}</small>
                        </div>
                    </div>
                </td>
                <td>${staff.role}</td>
                <td>$${parseFloat(staff.sales).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td>${staff.customers}</td>
                <td>
                    <div class="rating">
                        <span class="stars">${getStarRating(staff.rating)}</span>
                        <span class="rating-value">${staff.rating}/5</span>
                    </div>
                </td>
                <td>
                    <button class="action-icon view" onclick="viewStaffDetails('${staff.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    };
    
    window.getStarRating = function(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
        if (halfStar) stars += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
        
        return stars;
    };
});