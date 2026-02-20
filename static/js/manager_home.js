// ============================================
// RETAILX MANAGER DASHBOARD - ADVANCED CASHIER MANAGEMENT
// ============================================

console.log('🚀 manager_home.js is loading...');

// Ensure jQuery is available
if (typeof $ === 'undefined') {
    console.error('❌ jQuery is not loaded!');
} else {
    console.log('✅ jQuery version:', $.fn.jquery);
}

// Create RetailX namespace
window.RetailX = window.RetailX || {};

// ============================================
// CSRF TOKEN HELPER FUNCTION
// ============================================
function getCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken' + '=')) {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// ============================================
// CORE UTILITY FUNCTIONS
// ============================================

RetailX.showToast = function(message, type = 'info', duration = 3000) {
    console.log(`Toast: ${message} (${type})`);
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
};

RetailX.showSuccessModal = function(message) {
    $('#successMessage').text(message);
    $('#successModal').fadeIn(300).css('display', 'flex');
    setTimeout(() => {
        $('#successModal').fadeOut(300);
    }, 2000);
};

RetailX.formatDate = function(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// ============================================
// NOTIFICATION MANAGER - FIXED (POPUP INSTEAD OF SIDEBAR)
// ============================================

RetailX.NotificationManager = {
    notifications: [
        {
            id: 1,
            type: 'info',
            title: 'Welcome to RetailX Manager Dashboard',
            time: 'Just now',
            read: false
        },
        {
            id: 2,
            type: 'success',
            title: 'Cashier John Smith was added successfully',
            time: '5 min ago',
            read: false
        },
        {
            id: 3,
            type: 'warning',
            title: '3 cashiers have incomplete profiles',
            time: '1 hour ago',
            read: false
        },
        {
            id: 4,
            type: 'info',
            title: 'System update scheduled for tonight',
            time: '3 hours ago',
            read: true
        },
        {
            id: 5,
            type: 'success',
            title: 'Weekly report is ready for download',
            time: '5 hours ago',
            read: true
        }
    ],

    init: function() {
        console.log('🔔 Initializing Notification Manager...');
        this.updateBadge();
        this.bindEvents();
        this.renderNotifications();
    },

    bindEvents: function() {
        const self = this;

        // Notification button click
        $('#notificationsBtn').off('click').on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            self.togglePopup();
        });

        // Close button
        $('#closeNotificationsBtn').off('click').on('click', function() {
            self.hidePopup();
        });

        // Click outside to close
        $(document).off('click').on('click', function(e) {
            if (!$(e.target).closest('#notificationPopup').length && 
                !$(e.target).closest('#notificationsBtn').length) {
                self.hidePopup();
            }
        });

        // Mark all as read
        $('#markAllReadBtn').off('click').on('click', function() {
            self.markAllAsRead();
        });

        // View all notifications
        $('#viewAllNotificationsBtn').off('click').on('click', function() {
            self.showAllNotifications();
        });

        // Individual notification click
        $(document).on('click', '.notification-item', function() {
            const id = $(this).data('id');
            self.markAsRead(id);
        });

        // ESC key to close
        $(document).off('keydown').on('keydown', function(e) {
            if (e.key === 'Escape' && $('#notificationPopup').hasClass('show')) {
                self.hidePopup();
            }
        });
    },

    togglePopup: function() {
        const $popup = $('#notificationPopup');
        if ($popup.hasClass('show')) {
            this.hidePopup();
        } else {
            this.showPopup();
        }
    },

    showPopup: function() {
        $('#notificationPopup').addClass('show');
        this.renderNotifications(); // Refresh notifications when opening
    },

    hidePopup: function() {
        $('#notificationPopup').removeClass('show');
    },

    renderNotifications: function() {
        const $container = $('#notificationPopupBody');
        $container.empty();

        // Show only unread first, then read, limit to 5 for popup
        const unreadNotifications = this.notifications.filter(n => !n.read);
        const readNotifications = this.notifications.filter(n => n.read).slice(0, 3);
        
        const displayNotifications = [...unreadNotifications, ...readNotifications].slice(0, 8);

        if (displayNotifications.length === 0) {
            $container.html(`
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `);
        } else {
            displayNotifications.forEach(notification => {
                const unreadClass = !notification.read ? 'unread' : '';
                const icon = this.getNotificationIcon(notification.type);
                
                const item = `
                    <div class="notification-item ${unreadClass}" data-id="${notification.id}">
                        <div class="notification-icon ${notification.type}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="notification-content">
                            <p>${notification.title}</p>
                            <span class="notification-time"><i class="far fa-clock"></i> ${notification.time}</span>
                        </div>
                        ${!notification.read ? '<span class="notification-badge">New</span>' : ''}
                    </div>
                `;
                $container.append(item);
            });
        }

        this.updateBadge();
    },

    getNotificationIcon: function(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'error': return 'fa-times-circle';
            default: return 'fa-info-circle';
        }
    },

    updateBadge: function() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const $badge = $('.badge');
        
        if (unreadCount > 0) {
            $badge.text(unreadCount).show();
        } else {
            $badge.hide();
        }
    },

    markAsRead: function(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this.renderNotifications();
            this.updateBadge();
            RetailX.showToast('Notification marked as read', 'success');
        }
    },

    markAllAsRead: function() {
        this.notifications.forEach(n => n.read = true);
        this.renderNotifications();
        this.updateBadge();
        RetailX.showToast('All notifications marked as read', 'success');
    },

    showAllNotifications: function() {
        this.hidePopup();
        
        // Create a modal with all notifications
        const allNotificationsHtml = this.notifications.map(notification => {
            const icon = this.getNotificationIcon(notification.type);
            const unreadClass = !notification.read ? 'unread' : '';
            
            return `
                <div class="notification-item ${unreadClass}" data-id="${notification.id}">
                    <div class="notification-icon ${notification.type}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <p>${notification.title}</p>
                        <span class="notification-time"><i class="far fa-clock"></i> ${notification.time}</span>
                    </div>
                    ${!notification.read ? '<span class="notification-badge">New</span>' : ''}
                </div>
            `;
        }).join('');

        Swal.fire({
            title: 'All Notifications',
            html: `<div class="notifications-modal-content" style="max-height: 400px; overflow-y: auto;">${allNotificationsHtml || '<p>No notifications</p>'}</div>`,
            showCloseButton: true,
            showConfirmButton: false,
            width: '500px',
            customClass: {
                popup: 'notifications-swal-popup'
            }
        });
    },

    addNotification: function(title, type = 'info') {
        const newNotification = {
            id: this.notifications.length + 1,
            type: type,
            title: title,
            time: 'Just now',
            read: false
        };
        
        this.notifications.unshift(newNotification);
        
        // Keep only last 20 notifications
        if (this.notifications.length > 20) {
            this.notifications = this.notifications.slice(0, 20);
        }
        
        this.renderNotifications();
        this.updateBadge();
        
        // Show popup briefly to alert user
        if (!$('#notificationPopup').hasClass('show')) {
            this.showPopup();
            setTimeout(() => this.hidePopup(), 3000);
        }
        
        RetailX.showToast('New notification received', 'info');
    }
};

// ============================================
// CASHIER MANAGEMENT MODULE
// ============================================

RetailX.CashierManager = {
    cashierList: [],
    filteredList: [],
    deleteCashierId: null,
    debounceTimer: null,
    currentPage: 1,
    itemsPerPage: 10,
    sortBy: 'id',
    sortOrder: 'asc',
    currentStep: 1,

    // Initialize Cashier Management
    init: function() {
        console.log('📋 Initializing Cashier Management...');
        this.checkElements();
        this.bindEvents();
        this.loadCashierData();
        this.initFormSteps();
        this.initPasswordStrength();
    },

    // Check if all required elements exist
    checkElements: function() {
        const requiredIds = [
            'staffTableBody', 'staffTableLoading', 'staffTableEmpty', 'staffTableError',
            'staffSearch', 'refreshStaffBtn', 'addStaffBtn', 'clearSearch',
            'totalCashiers', 'activeCashiers', 'withEmail', 'uniqueUsernames',
            'prevPage', 'nextPage', 'startCount', 'endCount', 'totalCount',
            'sortBy', 'itemsPerPage', 'retryLoadBtn'
        ];
        
        let missing = [];
        requiredIds.forEach(id => {
            if (!document.getElementById(id)) {
                missing.push(id);
            }
        });
        
        if (missing.length > 0) {
            console.warn('⚠️ Missing elements:', missing);
        } else {
            console.log('✅ All required elements found');
        }
    },

    // Bind all events
    bindEvents: function() {
        const self = this;

        // Add Cashier Button
        $('#addStaffBtn').off('click').on('click', function() {
            self.openAddCashierModal();
        });

        // Search input with debounce
        $('#staffSearch').off('input').on('input', function() {
            const searchTerm = $(this).val();
            if (searchTerm.length > 0) {
                $('#clearSearch').show();
            } else {
                $('#clearSearch').hide();
            }
            clearTimeout(self.debounceTimer);
            self.debounceTimer = setTimeout(() => {
                self.currentPage = 1;
                self.filterAndSortCashiers();
            }, 300);
        });

        // Clear search
        $('#clearSearch').off('click').on('click', function() {
            $('#staffSearch').val('').trigger('input');
            $(this).hide();
        });

        // Refresh button
        $('#refreshStaffBtn').off('click').on('click', function() {
            const icon = $(this).find('i');
            icon.addClass('fa-spin');
            self.loadCashierData();
            setTimeout(() => {
                icon.removeClass('fa-spin');
                RetailX.showToast('Cashier data refreshed', 'success');
                RetailX.NotificationManager.addNotification('Cashier data refreshed successfully', 'success');
            }, 800);
        });

        // Retry button
        $('#retryLoadBtn').off('click').on('click', function() {
            self.loadCashierData();
        });

        // Sort by
        $('#sortBy').off('change').on('change', function() {
            self.sortBy = $(this).val();
            self.currentPage = 1;
            self.filterAndSortCashiers();
        });

        // Items per page
        $('#itemsPerPage').off('change').on('change', function() {
            self.itemsPerPage = parseInt($(this).val());
            self.currentPage = 1;
            self.filterAndSortCashiers();
        });

        // Column sorting
        $('#sort-id, #sort-name, #sort-username, #sort-email').off('click').on('click', function() {
            const column = this.id.replace('sort-', '');
            self.sortBy = column === 'id' ? 'id' : 
                         column === 'name' ? 'fullname' : column;
            self.sortOrder = self.sortOrder === 'asc' ? 'desc' : 'asc';
            self.currentPage = 1;
            self.filterAndSortCashiers();
            
            // Update sort icons
            $('.fa-sort').removeClass('fa-sort-up fa-sort-down').addClass('fa-sort');
            $(this).removeClass('fa-sort').addClass(self.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
        });

        // Pagination
        $('#prevPage').off('click').on('click', function() {
            if (self.currentPage > 1) {
                self.currentPage--;
                self.renderCurrentPage();
            }
        });

        $('#nextPage').off('click').on('click', function() {
            const totalPages = Math.ceil(self.filteredList.length / self.itemsPerPage);
            if (self.currentPage < totalPages) {
                self.currentPage++;
                self.renderCurrentPage();
            }
        });

        // Staff Form Submit
        $('#staffForm').off('submit').on('submit', function(e) {
            e.preventDefault();
            self.handleCashierFormSubmit();
        });

        // Modal Close Buttons
        $('.modal-close, .cancel-btn').off('click').on('click', function() {
            $('.modal').fadeOut(300);
            self.resetCashierForm();
        });

        // Close success modal
        $('#closeSuccessModal').off('click').on('click', function() {
            $('#successModal').fadeOut(300);
        });

        // Click outside modal to close
        $(window).off('click').on('click', function(e) {
            if ($(e.target).hasClass('modal')) {
                $('.modal').fadeOut(300);
                self.resetCashierForm();
            }
        });

        // Delete Confirmation
        $('#confirmDeleteBtn').off('click').on('click', function() {
            self.deleteCashier();
        });

        $('#cancelDeleteBtn').off('click').on('click', function() {
            $('#deleteConfirmModal').fadeOut(300);
            self.deleteCashierId = null;
        });

        // View Modal Edit Button
        $('#editFromViewBtn').off('click').on('click', function() {
            const cashierId = $('#viewStaffModal').data('cashierId');
            $('#viewStaffModal').fadeOut(300);
            setTimeout(() => {
                self.openEditCashierModal(cashierId);
            }, 300);
        });

        // View Modal Actions
        $('#messageStaff').off('click').on('click', function() {
            const email = $('#viewStaffEmail').text();
            RetailX.showToast(`Message feature coming soon for ${email}`, 'info');
        });

        $('#resetPasswordStaff').off('click').on('click', function() {
            const name = $('#viewStaffFullName').text();
            RetailX.showToast(`Password reset email sent to ${name}`, 'success');
            RetailX.NotificationManager.addNotification(`Password reset requested for ${name}`, 'info');
        });

        $('#closeViewModal').off('click').on('click', function() {
            $('#viewStaffModal').fadeOut(300);
        });

        // Summary card clicks
        $('#totalCashiersCard, #activeCashiersCard, #emailCard, #usernameCard').off('click').on('click', function() {
            const filter = this.id;
            RetailX.showToast(`Filtering by ${filter}`, 'info');
        });

        // Export button
        $('#exportStaffBtn').off('click').on('click', function() {
            self.exportToCSV();
        });

        // Fullscreen
        $('#fullscreenBtn').off('click').on('click', function() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });

        // Mobile menu toggle
        $('#mobileMenuToggle').off('click').on('click', function() {
            $('.sidebar').toggleClass('active');
        });

        // Logout
        $('#logoutBtn').off('click').on('click', function(e) {
            e.preventDefault();
            Swal.fire({
                title: 'Are you sure?',
                text: 'You will be logged out of the system',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, logout'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/logout';
                }
            });
        });

        // Apply date range
        $('#applyDateRange').off('click').on('click', function() {
            const startDate = $('#startDate').val();
            const endDate = $('#endDate').val();
            RetailX.showToast(`Date range applied: ${startDate} to ${endDate}`, 'success');
        });

        // Chart period change
        $('#revenuePeriod, #categoryPeriod').off('change').on('change', function() {
            RetailX.showToast('Chart period updated', 'info');
        });
    },

    // Initialize form steps
    initFormSteps: function() {
        const self = this;
        
        $('.next-step').off('click').on('click', function() {
            const nextStep = $(this).data('next');
            if (self.validateStep(self.currentStep)) {
                self.goToStep(nextStep);
            }
        });

        $('.prev-step').off('click').on('click', function() {
            const prevStep = $(this).data('prev');
            self.goToStep(prevStep);
        });
    },

    // Go to specific step
    goToStep: function(step) {
        this.currentStep = step;
        $('.form-step').removeClass('active');
        $(`#step${step}`).addClass('active');
        
        $('.progress-step').removeClass('active');
        $(`.progress-step[data-step="${step}"]`).addClass('active');
        
        // Update review data
        if (step == 3) {
            this.updateReviewData();
        }
    },

    // Validate current step
    validateStep: function(step) {
        let isValid = true;
        
        if (step === 1) {
            // Validate Step 1
            const fullname = $('#staffFullName').val().trim();
            const email = $('#staffEmail').val().trim();
            
            $('.error-message').removeClass('show').empty();
            
            if (!fullname) {
                $('#fullNameError').text('Full name is required').addClass('show');
                isValid = false;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email) {
                $('#emailError').text('Email is required').addClass('show');
                isValid = false;
            } else if (!emailRegex.test(email)) {
                $('#emailError').text('Please enter a valid email').addClass('show');
                isValid = false;
            }
        } else if (step === 2) {
            // Validate Step 2
            const username = $('#staffUsername').val().trim();
            const password = $('#staffPassword').val();
            const confirmPassword = $('#staffConfirmPassword').val();
            
            $('.error-message').removeClass('show').empty();
            
            if (!username) {
                $('#usernameError').text('Username is required').addClass('show');
                isValid = false;
            } else if (username.length < 3) {
                $('#usernameError').text('Username must be at least 3 characters').addClass('show');
                isValid = false;
            }
            
            if ($('#formAction').val() === 'add') {
                if (!password) {
                    $('#passwordError').text('Password is required').addClass('show');
                    isValid = false;
                } else if (password.length < 6) {
                    $('#passwordError').text('Password must be at least 6 characters').addClass('show');
                    isValid = false;
                }
                
                if (password !== confirmPassword) {
                    $('#confirmPasswordError').text('Passwords do not match').addClass('show');
                    isValid = false;
                }
            }
        }
        
        return isValid;
    },

    // Update review data
    updateReviewData: function() {
        $('#reviewFullName').text($('#staffFullName').val().trim() || '-');
        $('#reviewEmail').text($('#staffEmail').val().trim() || '-');
        $('#reviewUsername').text($('#staffUsername').val().trim() || '-');
    },

    // Initialize password strength meter
    initPasswordStrength: function() {
        $('#staffPassword').on('input', function() {
            const password = $(this).val();
            const strengthBar = $('.strength-bar');
            
            if (!password) {
                strengthBar.removeClass('weak medium strong').css('width', '0');
                return;
            }
            
            let strength = 0;
            
            // Check length
            if (password.length >= 8) strength += 1;
            if (password.length >= 12) strength += 1;
            
            // Check for numbers
            if (/\d/.test(password)) strength += 1;
            
            // Check for special characters
            if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
            
            // Check for uppercase
            if (/[A-Z]/.test(password)) strength += 1;
            
            if (strength <= 2) {
                strengthBar.removeClass('medium strong').addClass('weak');
            } else if (strength <= 4) {
                strengthBar.removeClass('weak strong').addClass('medium');
            } else {
                strengthBar.removeClass('weak medium').addClass('strong');
            }
        });
    },

    // Load Cashier Data from Database
    loadCashierData: function() {
        const self = this;

        // Show loading
        $('#staffTableLoading').fadeIn(200);
        $('#staffTableBody').empty();
        $('#staffTableError').hide();

        // Try to get data from Django context
        const staffDataElement = document.getElementById('staff-data');
        if (staffDataElement && staffDataElement.dataset.cashiers) {
            try {
                const cashiersData = JSON.parse(staffDataElement.dataset.cashiers);
                if (cashiersData && cashiersData.length > 0) {
                    console.log('📊 Loaded', cashiersData.length, 'cashiers from Django');
                    self.cashierList = cashiersData;
                    self.filteredList = [...cashiersData];
                    self.filterAndSortCashiers();
                    $('#staffTableLoading').fadeOut(200);
                    $('#staffTableEmpty').hide();
                    self.updateCashierSummary(cashiersData);
                    self.addActivity('System', 'Cashier data loaded', 'success');
                    return;
                }
            } catch(e) {
                console.error('Error parsing cashier data:', e);
            }
        }

        // If no data in context, make AJAX call
        $.ajax({
            url: '/api/cashiers/',
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            success: function(response) {
                if (response.success && response.cashiers) {
                    self.cashierList = response.cashiers;
                    self.filteredList = [...response.cashiers];
                    self.filterAndSortCashiers();
                    self.updateCashierSummary(response.cashiers);
                    self.addActivity('System', 'Cashier data loaded', 'success');
                    RetailX.NotificationManager.addNotification('Cashier data loaded successfully', 'success');
                } else {
                    self.showEmptyState();
                }
                $('#staffTableLoading').fadeOut(200);
            },
            error: function(xhr, status, error) {
                console.error('Error loading cashiers:', error);
                $('#staffTableLoading').fadeOut(200);
                $('#staffTableError').fadeIn(200);
                RetailX.showToast('Failed to load cashiers', 'error');
                RetailX.NotificationManager.addNotification('Failed to load cashier data', 'error');
            }
        });
    },

    // Filter and sort cashiers
    filterAndSortCashiers: function() {
        const searchTerm = $('#staffSearch').val().toLowerCase().trim();
        
        // Filter
        this.filteredList = this.cashierList.filter(cashier => {
            if (!searchTerm) return true;
            return (cashier.fullname && cashier.fullname.toLowerCase().includes(searchTerm)) ||
                   (cashier.username && cashier.username.toLowerCase().includes(searchTerm)) ||
                   (cashier.email && cashier.email.toLowerCase().includes(searchTerm));
        });

        // Sort
        this.filteredList.sort((a, b) => {
            let valA = a[this.sortBy] || '';
            let valB = b[this.sortBy] || '';
            
            if (this.sortBy === 'id') {
                valA = parseInt(valA) || 0;
                valB = parseInt(valB) || 0;
            } else {
                valA = valA.toString().toLowerCase();
                valB = valB.toString().toLowerCase();
            }
            
            if (this.sortOrder === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        this.renderCurrentPage();
    },

    // Render current page
    renderCurrentPage: function() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = Math.min(start + this.itemsPerPage, this.filteredList.length);
        const pageData = this.filteredList.slice(start, end);

        this.renderCashierTable(pageData);
        this.updatePagination();
    },

    // Render Cashier Table
    renderCashierTable: function(data) {
        const tbody = $('#staffTableBody');
        tbody.empty();

        if (!data || data.length === 0) {
            $('#staffTableEmpty').fadeIn(200);
            return;
        }

        $('#staffTableEmpty').hide();

        data.forEach(cashier => {
            const row = `
                <tr data-id="${cashier.id}">
                    <td><span class="staff-id">#${cashier.id}</span></td>
                    <td><span class="staff-name">${cashier.fullname || 'N/A'}</span></td>
                    <td><span class="staff-username">@${cashier.username || 'N/A'}</span></td>
                    <td><span class="staff-email">${cashier.email || 'N/A'}</span></td>
                    <td>
                        <span class="status-badge active">
                            <i class="fas fa-check-circle"></i> Active
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="RetailX.CashierManager.viewCashier(${cashier.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" onclick="RetailX.CashierManager.openEditCashierModal(${cashier.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="RetailX.CashierManager.openDeleteModal(${cashier.id}, '${(cashier.fullname || '').replace(/'/g, "\\'")}')" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    },

    // Update pagination
    updatePagination: function() {
        const totalItems = this.filteredList.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(start + this.itemsPerPage - 1, totalItems);

        $('#startCount').text(totalItems > 0 ? start : 0);
        $('#endCount').text(end);
        $('#totalCount').text(totalItems);

        // Generate page numbers
        let pageNumbers = '';
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                pageNumbers += `<span class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                pageNumbers += '<span class="page-number">...</span>';
            }
        }
        $('#pageNumbers').html(pageNumbers);

        // Bind page number clicks
        $('.page-number[data-page]').off('click').on('click', function() {
            const page = parseInt($(this).data('page'));
            RetailX.CashierManager.currentPage = page;
            RetailX.CashierManager.renderCurrentPage();
        });

        // Update prev/next buttons
        $('#prevPage').prop('disabled', this.currentPage === 1);
        $('#nextPage').prop('disabled', this.currentPage === totalPages || totalItems === 0);
    },

    // Update Cashier Summary Cards
    updateCashierSummary: function(data) {
        const total = data.length;
        const withEmail = data.filter(c => c.email && c.email.includes('@')).length;
        const uniqueUsernames = new Set(data.map(c => c.username)).size;

        $('#totalCashiers').text(total);
        $('#activeCashiers').text(total);
        $('#withEmail').text(withEmail);
        $('#uniqueUsernames').text(uniqueUsernames);

        // Animate numbers
        $('.summary-value').each(function() {
            const $this = $(this);
            $this.prop('Counter', 0).animate({
                Counter: $this.text()
            }, {
                duration: 1000,
                easing: 'swing',
                step: function(now) {
                    $this.text(Math.ceil(now));
                }
            });
        });
    },

    // Open Add Cashier Modal
    openAddCashierModal: function() {
        this.resetCashierForm();
        this.currentStep = 1;
        this.goToStep(1);
        $('#staffModalTitle').html('<i class="fas fa-user-plus"></i> Add New Cashier');
        $('#formAction').val('add');
        $('#staffId').val('');
        $('#staffPassword').prop('required', true);
        $('#staffConfirmPassword').prop('required', true);
        $('#staffModal').fadeIn(300).css('display', 'flex');
    },

    // Open Edit Cashier Modal
    openEditCashierModal: function(cashierId) {
        const cashier = this.cashierList.find(c => c.id === cashierId);
        if (!cashier) {
            RetailX.showToast('Cashier not found', 'error');
            return;
        }

        this.resetCashierForm();
        this.currentStep = 3;
        this.goToStep(3);

        // Fill form with cashier data
        $('#staffModalTitle').html('<i class="fas fa-edit"></i> Edit Cashier');
        $('#formAction').val('edit');
        $('#staffId').val(cashier.id);
        $('#staffFullName').val(cashier.fullname || '');
        $('#staffUsername').val(cashier.username || '');
        $('#staffEmail').val(cashier.email || '');
        
        // Password not required for edit
        $('#staffPassword').prop('required', false);
        $('#staffConfirmPassword').prop('required', false);
        
        this.updateReviewData();
        $('#staffModal').fadeIn(300).css('display', 'flex');
    },

    // View Cashier Details
    viewCashier: function(cashierId) {
        const cashier = this.cashierList.find(c => c.id === cashierId);
        if (!cashier) {
            RetailX.showToast('Cashier not found', 'error');
            return;
        }

        // Set view modal data
        $('#viewStaffModal').data('cashierId', cashierId);
        
        // Update avatar
        const name = encodeURIComponent(cashier.fullname || 'User');
        $('#viewStaffAvatar').attr('src', `https://ui-avatars.com/api/?name=${name}&background=4361ee&color=fff&size=80`);
        
        $('#viewStaffFullName').text(cashier.fullname || 'N/A');
        $('#viewStaffId').text('#' + cashier.id);
        $('#viewStaffUsername').text('@' + (cashier.username || 'N/A'));
        $('#viewStaffEmail').text(cashier.email || 'N/A');
        $('#viewStaffJoined').text(RetailX.formatDate(new Date()));
        $('#viewStaffStatus').text('Active');

        $('#viewStaffModal').fadeIn(300).css('display', 'flex');
    },

    // Handle Cashier Form Submit
    handleCashierFormSubmit: function() {
        if (!this.validateStep(3)) {
            this.goToStep(2);
            RetailX.showToast('Please complete all required fields', 'error');
            return;
        }

        const formData = {
            id: $('#staffId').val(),
            fullname: $('#staffFullName').val().trim(),
            username: $('#staffUsername').val().trim().toLowerCase(),
            email: $('#staffEmail').val().trim(),
            password: $('#staffPassword').val()
        };

        const action = $('#formAction').val();

        // Show loading on button
        const submitBtn = $('#submitStaffBtn');
        const originalText = submitBtn.html();
        submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Saving...').prop('disabled', true);

        if (action === 'add') {
            // Add new cashier via AJAX
            $.ajax({
                url: '/api/cashiers/add/',
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken()
                },
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function(response) {
                    if (response.success) {
                        RetailX.showSuccessModal('Cashier added successfully!');
                        // Add to local list
                        RetailX.CashierManager.cashierList.push(response.cashier);
                        RetailX.CashierManager.filteredList = [...RetailX.CashierManager.cashierList];
                        RetailX.CashierManager.filterAndSortCashiers();
                        RetailX.CashierManager.updateCashierSummary(RetailX.CashierManager.cashierList);
                        $('#staffModal').fadeOut(300);
                        RetailX.CashierManager.resetCashierForm();
                        RetailX.CashierManager.addActivity('System', `New cashier ${formData.fullname} added`, 'success');
                        RetailX.NotificationManager.addNotification(`New cashier ${formData.fullname} added`, 'success');
                    } else {
                        RetailX.showToast(response.error || 'Failed to add cashier', 'error');
                    }
                },
                error: function(xhr) {
                    const response = xhr.responseJSON;
                    RetailX.showToast(response?.error || 'Server error', 'error');
                },
                complete: function() {
                    submitBtn.html(originalText).prop('disabled', false);
                }
            });
        } else {
            // Edit existing cashier via AJAX
            $.ajax({
                url: `/api/cashiers/${formData.id}/edit/`,
                method: 'PUT',
                headers: {
                    'X-CSRFToken': getCSRFToken()
                },
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function(response) {
                    if (response.success) {
                        RetailX.showSuccessModal('Cashier updated successfully!');
                        // Update local list
                        const index = RetailX.CashierManager.cashierList.findIndex(c => c.id == formData.id);
                        if (index !== -1) {
                            RetailX.CashierManager.cashierList[index].fullname = formData.fullname;
                            RetailX.CashierManager.cashierList[index].username = formData.username;
                            RetailX.CashierManager.cashierList[index].email = formData.email;
                        }
                        RetailX.CashierManager.filteredList = [...RetailX.CashierManager.cashierList];
                        RetailX.CashierManager.filterAndSortCashiers();
                        RetailX.CashierManager.updateCashierSummary(RetailX.CashierManager.cashierList);
                        $('#staffModal').fadeOut(300);
                        RetailX.CashierManager.resetCashierForm();
                        RetailX.CashierManager.addActivity('System', `Cashier ${formData.fullname} updated`, 'info');
                        RetailX.NotificationManager.addNotification(`Cashier ${formData.fullname} updated`, 'info');
                    } else {
                        RetailX.showToast(response.error || 'Failed to update cashier', 'error');
                    }
                },
                error: function(xhr) {
                    const response = xhr.responseJSON;
                    RetailX.showToast(response?.error || 'Server error', 'error');
                },
                complete: function() {
                    submitBtn.html(originalText).prop('disabled', false);
                }
            });
        }
    },

    // Open Delete Confirmation Modal
    openDeleteModal: function(cashierId, cashierName) {
        this.deleteCashierId = cashierId;
        $('#deleteStaffName').text(cashierName);
        $('#deleteConfirmModal').fadeIn(300).css('display', 'flex');
    },

    // Delete Cashier
    deleteCashier: function() {
        if (!this.deleteCashierId) return;

        const cashierId = this.deleteCashierId;
        const cashier = this.cashierList.find(c => c.id === cashierId);
        if (!cashier) return;

        // Show loading
        const deleteBtn = $('#confirmDeleteBtn');
        const originalText = deleteBtn.html();
        deleteBtn.html('<i class="fas fa-spinner fa-spin"></i> Deleting...').prop('disabled', true);

        // AJAX call to delete
        $.ajax({
            url: `/api/cashiers/${cashierId}/delete/`,
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            success: function(response) {
                if (response.success) {
                    RetailX.showSuccessModal('Cashier deleted successfully!');
                    // Remove from local list
                    RetailX.CashierManager.cashierList = RetailX.CashierManager.cashierList.filter(c => c.id !== cashierId);
                    RetailX.CashierManager.filteredList = [...RetailX.CashierManager.cashierList];
                    RetailX.CashierManager.filterAndSortCashiers();
                    RetailX.CashierManager.updateCashierSummary(RetailX.CashierManager.cashierList);
                    $('#deleteConfirmModal').fadeOut(300);
                    RetailX.CashierManager.addActivity('System', `Cashier ${cashier.fullname} removed`, 'warning');
                    RetailX.NotificationManager.addNotification(`Cashier ${cashier.fullname} was removed`, 'warning');
                } else {
                    RetailX.showToast(response.error || 'Failed to delete cashier', 'error');
                }
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                RetailX.showToast(response?.error || 'Server error', 'error');
            },
            complete: function() {
                deleteBtn.html(originalText).prop('disabled', false);
                RetailX.CashierManager.deleteCashierId = null;
            }
        });
    },

    // Reset Cashier Form
    resetCashierForm: function() {
        $('#staffForm')[0].reset();
        $('.error-message').removeClass('show').empty();
        $('.strength-bar').removeClass('weak medium strong').css('width', '0');
        $('#staffId').val('');
        $('#formAction').val('add');
        this.currentStep = 1;
        this.goToStep(1);
    },

    // Add activity to timeline
    addActivity: function(user, action, type = 'info') {
        const timeline = $('#staffActivities');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        let icon = 'fa-info-circle';
        let color = '#3b82f6';
        
        if (type === 'success') {
            icon = 'fa-check-circle';
            color = '#10b981';
        } else if (type === 'warning') {
            icon = 'fa-exclamation-triangle';
            color = '#f59e0b';
        }

        const newActivity = `
            <div class="timeline-item" style="opacity: 0; transform: translateY(-20px);">
                <div class="timeline-icon" style="color: ${color};">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="timeline-content">
                    <p>${user}: ${action}</p>
                    <span class="timeline-time"><i class="far fa-clock"></i> ${timeStr}</span>
                </div>
            </div>
        `;

        timeline.prepend(newActivity);

        // Animate new activity
        setTimeout(() => {
            timeline.find('.timeline-item:first-child').css({
                'opacity': '1',
                'transform': 'translateY(0)',
                'transition': 'all 0.3s ease'
            });
        }, 10);

        // Limit activities to 10
        if (timeline.children().length > 10) {
            timeline.children().last().remove();
        }
    },

    // Export to CSV
    exportToCSV: function() {
        const headers = ['ID', 'Full Name', 'Username', 'Email', 'Status'];
        const data = this.cashierList.map(c => [
            c.id,
            c.fullname,
            c.username,
            c.email,
            'Active'
        ]);

        let csv = headers.join(',') + '\n';
        data.forEach(row => {
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cashiers_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        RetailX.showToast('Cashier list exported successfully', 'success');
        RetailX.NotificationManager.addNotification('Cashier data exported to CSV', 'success');
    },

    // Show empty state
    showEmptyState: function() {
        $('#staffTableEmpty').fadeIn(200);
    }
};

// ============================================
// PAGE NAVIGATION
// ============================================

RetailX.Navigation = {
    init: function() {
        const self = this;
        
        $('.menu-item[data-page]').on('click', function(e) {
            e.preventDefault();
            
            const page = $(this).data('page');
            self.switchPage(page);
            
            $('.menu-item').removeClass('active');
            $(this).addClass('active');

            // Close mobile menu if open
            if ($(window).width() <= 768) {
                $('.sidebar').removeClass('active');
            }
        });
    },

    switchPage: function(page) {
        $('.page').hide().removeClass('active');
        $(`#${page}-page`).fadeIn(400).addClass('active');

        const titles = {
            'dashboard': 'Dashboard',
            'overview': 'Store Overview',
            'inventory': 'Inventory Management',
            'staff': 'Cashier Management',
            'analysis': 'Analysis',
            'transactions': 'Transactions',
            'reports': 'Reports',
            'settings': 'Settings'
        };

        $('#pageTitle').text(titles[page] || 'Dashboard');
        $('#breadcrumb').text(`Home / ${titles[page] || 'Dashboard'}`);
        
        // Refresh data when switching to staff page
        if (page === 'staff') {
            RetailX.CashierManager.loadCashierData();
        }
    }
};

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

RetailX.Dashboard = {
    init: function() {
        console.log('📊 Initializing Dashboard...');
        this.loadMockData();
        this.startClock();
        this.initCharts();
        this.initPrediction();  // NEW: initialize prediction module
        console.log('📈 Prediction module initialized');
    },

    loadMockData: function() {
        $('#totalRevenue').text('$156,780');
        $('#inventoryValue').text('$82,340');
        $('#activeStaff').text(RetailX.CashierManager.cashierList.length || '8');
        $('#customerSatisfaction').text('94%');
        $('#todayRevenue').text('$4,290');
        $('#onlineOrders').text('127');
        $('#totalOrders').text('1,284');
        $('#newCustomers').text('342');
        $('#returnRate').text('2.4%');
        $('#avgOrderValue').text('$122.50');
    },

    startClock: function() {
        const update = () => {
            const now = new Date();
            $('#currentDate').text(now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }));
            $('#currentTime').text(now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            }));
        };
        update();
        setInterval(update, 1000);
    },

    initCharts: function() {
        // Revenue Chart
        const ctx = document.getElementById('revenueChart')?.getContext('2d');
        if (ctx) {
            window.revenueChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [4250, 4780, 5120, 4890, 6100, 8450, 7320],
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#4361ee',
                        pointBorderColor: 'white',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            callbacks: {
                                label: function(context) {
                                    return ' $' + context.parsed.y.toLocaleString();
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#e2e8f0' },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value;
                                }
                            }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // Category Chart
        const catCtx = document.getElementById('categoryChart')?.getContext('2d');
        if (catCtx) {
            new Chart(catCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Electronics', 'Clothing', 'Home', 'Groceries'],
                    datasets: [{
                        data: [42, 28, 18, 12],
                        backgroundColor: ['#4361ee', '#4cc9f0', '#f59e0b', '#10b981'],
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: { 
                                usePointStyle: true, 
                                boxWidth: 8,
                                padding: 20
                            }
                        }
                    }
                }
            });
        }
    },

    // ================== NEW PREDICTION MODULE =================
    initPrediction: function() {
        console.log('🔮 Initializing Prediction Module...');
        const festivalSelect = $('#predictFestival');
        const productSelect = $('#predictProduct');
        const dateInput = $('#predictDate');
        const predictBtn = $('#predictBtn');
        const resultDiv = $('#predictionResult');

        if (!festivalSelect.length) {
            console.error('❌ Prediction elements not found in DOM!');
            return;
        }

        // Load products when festival changes
        festivalSelect.on('change', function() {
            const festival = $(this).val();
            console.log('Festival selected:', festival);
            if (!festival) {
                productSelect.prop('disabled', true).html('<option value="">Select Product</option>');
                resultDiv.fadeOut();
                return;
            }
            console.log('Fetching products for festival:', festival);
            $.ajax({
                url: '/api/products-for-festival/',
                data: { festival: festival },
                success: function(data) {
                    console.log('Products response:', data);
                    productSelect.prop('disabled', false).empty().append('<option value="">Select Product</option>');
                    if (data.products && data.products.length > 0) {
                        data.products.forEach(function(product) {
                            productSelect.append(`<option value="${product}">${product}</option>`);
                        });
                    } else {
                        productSelect.append('<option value="">No products found</option>').prop('disabled', true);
                        RetailX.showToast('No models found for this festival', 'warning');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error:', error);
                    RetailX.showToast('Failed to load products', 'error');
                }
            });
        });

        // Predict button click
        predictBtn.on('click', function() {
            const festival = festivalSelect.val();
            const product = productSelect.val();
            const date = dateInput.val();
            if (!festival || !product || !date) {
                RetailX.showToast('Please select festival, product, and date', 'warning');
                return;
            }
            console.log('Predicting:', {festival, product, date});
            $(this).html('<i class="fas fa-spinner fa-spin"></i> Predicting...').prop('disabled', true);
            $.ajax({
                url: '/api/predict/',
                data: { festival: festival, product: product, date: date },
                success: function(data) {
                    console.log('Prediction response:', data);
                    if (data.error) {
                        RetailX.showToast(data.error, 'error');
                        return;
                    }
                    $('#predUnits').text(data.predicted_units);
                    $('#predRevenue').text(data.predicted_revenue.toFixed(2));
                    resultDiv.fadeIn();

                    // Update charts with the predicted point
                    RetailX.Dashboard.updateChartWithPrediction(data);
                },
                error: function(xhr) {
                    const errorMsg = xhr.responseJSON?.error || 'Prediction failed';
                    console.error('Prediction error:', errorMsg);
                    RetailX.showToast(errorMsg, 'error');
                },
                complete: function() {
                    predictBtn.html('<i class="fas fa-magic"></i> Predict').prop('disabled', false);
                }
            });
        });
    },

    updateChartWithPrediction: function(prediction) {
        console.log('Updating chart with prediction:', prediction);
        if (window.revenueChart) {
            const chart = window.revenueChart;
            const newLabel = prediction.date; // e.g., "2026-02-20"
            
            // Check if label already exists, if not add it
            if (!chart.data.labels.includes(newLabel)) {
                chart.data.labels.push(newLabel);
                // Add null to original dataset for the new label
                chart.data.datasets[0].data.push(null);
            }
            
            // Find or create a predictions dataset
            let predDataset = chart.data.datasets.find(ds => ds.label === 'Predicted');
            if (!predDataset) {
                predDataset = {
                    label: 'Predicted',
                    data: [],
                    borderColor: '#f97316',
                    backgroundColor: '#f97316',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    showLine: false,
                    type: 'scatter' // treat as scatter points
                };
                // Initialize with nulls for all existing labels
                for (let i = 0; i < chart.data.labels.length; i++) {
                    predDataset.data.push(null);
                }
                chart.data.datasets.push(predDataset);
            }
            
            // Ensure predDataset data length matches labels
            while (predDataset.data.length < chart.data.labels.length) {
                predDataset.data.push(null);
            }
            
            // Set the predicted value at the index of the new label
            const index = chart.data.labels.indexOf(newLabel);
            predDataset.data[index] = prediction.predicted_revenue;
            
            chart.update();
        }
    }
    // ================== END NEW PREDICTION MODULE =================
};

// ============================================
// INITIALIZATION
// ============================================

$(document).ready(function() {
    console.log('✅ Document ready, initializing application...');

    // Hide preloader
    setTimeout(() => {
        $('#global-loader').addClass('fade-out');
        setTimeout(() => $('#global-loader').hide(), 400);
    }, 600);

    // Initialize modules
    RetailX.Navigation.init();
    RetailX.Dashboard.init();
    RetailX.CashierManager.init();
    RetailX.NotificationManager.init();

    console.log('✅ All modules initialized successfully');
});

// ============================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================

window.viewCashier = function(cashierId) {
    RetailX.CashierManager.viewCashier(cashierId);
};

window.editCashier = function(cashierId) {
    RetailX.CashierManager.openEditCashierModal(cashierId);
};

window.deleteCashier = function(cashierId, cashierName) {
    RetailX.CashierManager.openDeleteModal(cashierId, cashierName);
};

window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        const icon = event.currentTarget.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    }
};

// No back functionality
window.noBack = function() {
    window.history.forward();
};