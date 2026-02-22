// ============================================
// RETAILX MANAGER DASHBOARD - ADVANCED MANAGEMENT SYSTEM
// ============================================

console.log('🚀 RetailX Manager Dashboard initializing...');

// Ensure jQuery is available
if (typeof $ === 'undefined') {
    console.error('❌ jQuery is not loaded!');
} else {
    console.log('✅ jQuery loaded successfully');
}

// Create RetailX namespace
window.RetailX = window.RetailX || {};

// ============================================
// CSRF TOKEN HELPER
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
// TOAST NOTIFICATION SYSTEM
// ============================================
RetailX.showToast = function(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
};

// ============================================
// SUCCESS MODAL
// ============================================
RetailX.showSuccessModal = function(message) {
    $('#successMessage').text(message);
    $('#successModal').fadeIn(300).css('display', 'flex');
    setTimeout(() => {
        $('#successModal').fadeOut(300);
    }, 2000);
};

// ============================================
// DATE FORMATTER
// ============================================
RetailX.formatDate = function(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// ============================================
// SIDEBAR MANAGER - FIXED, NO CONTENT SHIFT
// ============================================
RetailX.SidebarManager = {
    init: function() {
        console.log('📱 Initializing Sidebar Manager...');
        this.bindEvents();
        this.checkScreenSize();
        
        // Listen for window resize
        $(window).on('resize', () => {
            this.checkScreenSize();
        });
    },
    
    bindEvents: function() {
        // Mobile menu toggle
        $('#mobileMenuToggle').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleSidebar();
        });
        
        // Sidebar close button
        $('#sidebarClose').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideSidebar();
        });
        
        // Overlay click
        $('#sidebarOverlay').on('click', () => {
            this.hideSidebar();
        });
        
        // Close sidebar when clicking a menu item on mobile
        $('.menu-item').on('click', () => {
            if ($(window).width() <= 768) {
                this.hideSidebar();
            }
        });
        
        // ESC key to close sidebar on mobile
        $(document).on('keydown', (e) => {
            if (e.key === 'Escape' && $(window).width() <= 768) {
                this.hideSidebar();
            }
        });
    },
    
    checkScreenSize: function() {
        if ($(window).width() > 768) {
            // Desktop: always show sidebar
            $('#sidebar').removeClass('hidden');
            $('#sidebarOverlay').removeClass('active');
            $('#mainContent').removeClass('full-width');
        } else {
            // Mobile: hide sidebar by default
            $('#sidebar').addClass('hidden');
            $('#sidebarOverlay').removeClass('active');
            $('#mainContent').addClass('full-width');
        }
    },
    
    toggleSidebar: function() {
        if ($(window).width() <= 768) {
            $('#sidebar').toggleClass('hidden');
            $('#sidebarOverlay').toggleClass('active');
        }
    },
    
    hideSidebar: function() {
        if ($(window).width() <= 768) {
            $('#sidebar').addClass('hidden');
            $('#sidebarOverlay').removeClass('active');
        }
    }
};

// ============================================
// NOTIFICATION MANAGER
// ============================================
RetailX.NotificationManager = {
    notifications: [
        { id: 1, type: 'info', title: 'Welcome to RetailX Manager Dashboard', time: 'Just now', read: false },
        { id: 2, type: 'success', title: 'Cashier John Smith was added successfully', time: '5 min ago', read: false },
        { id: 3, type: 'warning', title: '3 cashiers have incomplete profiles', time: '1 hour ago', read: false },
        { id: 4, type: 'info', title: 'System update scheduled for tonight', time: '3 hours ago', read: true },
        { id: 5, type: 'success', title: 'Weekly report is ready for download', time: '5 hours ago', read: true }
    ],

    init: function() {
        console.log('🔔 Initializing Notification Manager...');
        this.updateBadge();
        this.bindEvents();
        this.renderNotifications();
    },

    bindEvents: function() {
        $('#notificationsBtn').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePopup();
        });

        $('#closeNotificationsBtn').on('click', () => {
            this.hidePopup();
        });

        $(document).on('click', (e) => {
            if (!$(e.target).closest('#notificationPopup').length && 
                !$(e.target).closest('#notificationsBtn').length) {
                this.hidePopup();
            }
        });

        $('#markAllReadBtn').on('click', () => {
            this.markAllAsRead();
        });

        $('#viewAllNotificationsBtn').on('click', () => {
            this.showAllNotifications();
        });

        $(document).on('click', '.notification-item', function() {
            const id = $(this).data('id');
            RetailX.NotificationManager.markAsRead(id);
        });

        $(document).on('keydown', (e) => {
            if (e.key === 'Escape' && $('#notificationPopup').hasClass('show')) {
                this.hidePopup();
            }
        });
    },

    togglePopup: function() {
        $('#notificationPopup').toggleClass('show');
        if ($('#notificationPopup').hasClass('show')) {
            this.renderNotifications();
        }
    },

    hidePopup: function() {
        $('#notificationPopup').removeClass('show');
    },

    renderNotifications: function() {
        const $container = $('#notificationPopupBody');
        $container.empty();

        const unread = this.notifications.filter(n => !n.read);
        const read = this.notifications.filter(n => n.read).slice(0, 3);
        const display = [...unread, ...read].slice(0, 8);

        if (display.length === 0) {
            $container.html(`
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `);
        } else {
            display.forEach(n => {
                const unreadClass = !n.read ? 'unread' : '';
                const icon = this.getIcon(n.type);
                
                $container.append(`
                    <div class="notification-item ${unreadClass}" data-id="${n.id}">
                        <div class="notification-icon ${n.type}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="notification-content">
                            <p>${n.title}</p>
                            <span class="notification-time"><i class="far fa-clock"></i> ${n.time}</span>
                        </div>
                        ${!n.read ? '<span class="notification-badge">New</span>' : ''}
                    </div>
                `);
            });
        }

        this.updateBadge();
    },

    getIcon: function(type) {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
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
        
        const html = this.notifications.map(n => {
            const icon = this.getIcon(n.type);
            const unreadClass = !n.read ? 'unread' : '';
            return `
                <div class="notification-item ${unreadClass}" data-id="${n.id}">
                    <div class="notification-icon ${n.type}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <p>${n.title}</p>
                        <span class="notification-time"><i class="far fa-clock"></i> ${n.time}</span>
                    </div>
                </div>
            `;
        }).join('');

        Swal.fire({
            title: 'All Notifications',
            html: `<div style="max-height: 400px; overflow-y: auto;">${html || '<p>No notifications</p>'}</div>`,
            showCloseButton: true,
            showConfirmButton: false,
            width: '500px'
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
        
        if (this.notifications.length > 20) {
            this.notifications = this.notifications.slice(0, 20);
        }
        
        this.renderNotifications();
        this.updateBadge();
        
        if (!$('#notificationPopup').hasClass('show')) {
            this.showPopup();
            setTimeout(() => this.hidePopup(), 3000);
        }
        
        RetailX.showToast('New notification received', 'info');
    }
};

// ============================================
// CHATBOT MODULE
// ============================================
RetailX.Chatbot = {
    init: function() {
        console.log('🤖 Initializing Chatbot...');
        this.bindEvents();
    },

    bindEvents: function() {
        $('#chatbot-input').on('keypress', (e) => {
            if (e.which === 13) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    },

    sendMessage: function() {
        const input = $('#chatbot-input');
        const messages = $('#chatbot-messages');
        const message = input.val().trim();

        if (!message) {
            RetailX.showToast('Please enter a message', 'warning');
            return;
        }

        // Add user message
        messages.append(`
            <div class="chat-user">
                <span>${this.escapeHtml(message)}</span>
            </div>
        `);
        
        input.val('');
        messages.scrollTop(messages[0].scrollHeight);

        // Add typing indicator
        const typingId = 'typing-' + Date.now();
        messages.append(`
            <div class="chat-bot" id="${typingId}">
                <span>🤖 Typing...</span>
            </div>
        `);
        messages.scrollTop(messages[0].scrollHeight);

        // Send to backend
        $.ajax({
            url: '/chatbot/',
            method: 'POST',
            headers: { 'X-CSRFToken': getCSRFToken() },
            contentType: 'application/json',
            data: JSON.stringify({ message: message }),
            success: (data) => {
                $(`#${typingId}`).remove();
                messages.append(`
                    <div class="chat-bot">
                        <span>${this.escapeHtml(data.reply)}</span>
                    </div>
                `);
                messages.scrollTop(messages[0].scrollHeight);
            },
            error: (xhr, status, error) => {
                console.error('Chatbot error:', error);
                $(`#${typingId}`).remove();
                messages.append(`
                    <div class="chat-bot">
                        <span>⚠️ Sorry, I'm having trouble connecting. Please try again.</span>
                    </div>
                `);
                messages.scrollTop(messages[0].scrollHeight);
                RetailX.NotificationManager.addNotification('Chatbot connection error', 'error');
            }
        });
    },

    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    toggleChatbot: function() {
        const box = $('#chatbot-box');
        if (box.css('display') === 'none' || box.css('display') === '') {
            box.css('display', 'flex');
            setTimeout(() => $('#chatbot-input').focus(), 300);
        } else {
            box.css('display', 'none');
        }
    }
};

// Global functions for HTML onclick
window.toggleChatbot = function() {
    RetailX.Chatbot.toggleChatbot();
};

window.sendMessage = function() {
    RetailX.Chatbot.sendMessage();
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

    init: function() {
        console.log('📋 Initializing Cashier Management...');
        this.bindEvents();
        this.loadCashierData();
        this.initFormSteps();
        this.initPasswordStrength();
    },

    bindEvents: function() {
        // Add Cashier Button
        $('#addStaffBtn').on('click', (e) => {
            e.preventDefault();
            this.openAddCashierModal();
        });

        // Search with debounce
        $('#staffSearch').on('input', () => {
            const searchTerm = $('#staffSearch').val();
            $('#clearSearch').toggle(searchTerm.length > 0);
            
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.currentPage = 1;
                this.filterAndSort();
            }, 300);
        });

        // Clear search
        $('#clearSearch').on('click', () => {
            $('#staffSearch').val('').trigger('input');
        });

        // Refresh button
        $('#refreshStaffBtn').on('click', (e) => {
            e.preventDefault();
            $(e.currentTarget).find('i').addClass('fa-spin');
            this.loadCashierData();
            setTimeout(() => {
                $(e.currentTarget).find('i').removeClass('fa-spin');
                RetailX.showToast('Cashier data refreshed', 'success');
            }, 800);
        });

        // Retry button
        $('#retryLoadBtn').on('click', (e) => {
            e.preventDefault();
            this.loadCashierData();
        });

        // Sort by dropdown
        $('#sortBy').on('change', () => {
            this.sortBy = $('#sortBy').val();
            this.currentPage = 1;
            this.filterAndSort();
        });

        // Items per page
        $('#itemsPerPage').on('change', () => {
            this.itemsPerPage = parseInt($('#itemsPerPage').val());
            this.currentPage = 1;
            this.filterAndSort();
        });

        // Column sorting
        $('#sort-id, #sort-name, #sort-username, #sort-email').on('click', (e) => {
            e.preventDefault();
            const column = e.currentTarget.id.replace('sort-', '');
            this.sortBy = column === 'id' ? 'id' : 
                         column === 'name' ? 'fullname' : column;
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            this.currentPage = 1;
            this.filterAndSort();
            
            $('.fa-sort').removeClass('fa-sort-up fa-sort-down').addClass('fa-sort');
            $(e.currentTarget).removeClass('fa-sort')
                .addClass(this.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
        });

        // Pagination
        $('#prevPage').on('click', (e) => {
            e.preventDefault();
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderCurrentPage();
            }
        });

        $('#nextPage').on('click', (e) => {
            e.preventDefault();
            const totalPages = Math.ceil(this.filteredList.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderCurrentPage();
            }
        });

        // Form submit
        $('#staffForm').on('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Modal close buttons
        $('.modal-close, .cancel-btn').on('click', (e) => {
            e.preventDefault();
            $('.modal').fadeOut(300);
            this.resetForm();
        });

        // Close success modal
        $('#closeSuccessModal').on('click', (e) => {
            e.preventDefault();
            $('#successModal').fadeOut(300);
        });

        // Click outside modal to close
        $(window).on('click', (e) => {
            if ($(e.target).hasClass('modal')) {
                $('.modal').fadeOut(300);
                this.resetForm();
            }
        });

        // Delete confirmation
        $('#confirmDeleteBtn').on('click', (e) => {
            e.preventDefault();
            this.deleteCashier();
        });

        $('#cancelDeleteBtn').on('click', (e) => {
            e.preventDefault();
            $('#deleteConfirmModal').fadeOut(300);
            this.deleteCashierId = null;
        });

        // View modal edit button
        $('#editFromViewBtn').on('click', (e) => {
            e.preventDefault();
            const cashierId = $('#viewStaffModal').data('cashierId');
            $('#viewStaffModal').fadeOut(300);
            setTimeout(() => {
                this.openEditCashierModal(cashierId);
            }, 300);
        });

        // View modal actions
        $('#messageStaff').on('click', (e) => {
            e.preventDefault();
            const email = $('#viewStaffEmail').text();
            RetailX.showToast(`Message feature coming soon for ${email}`, 'info');
        });

        $('#resetPasswordStaff').on('click', (e) => {
            e.preventDefault();
            const name = $('#viewStaffFullName').text();
            RetailX.showToast(`Password reset email sent to ${name}`, 'success');
        });

        $('#closeViewModal').on('click', (e) => {
            e.preventDefault();
            $('#viewStaffModal').fadeOut(300);
        });

        // Summary card clicks
        $('#totalCashiersCard, #activeCashiersCard, #emailCard, #usernameCard').on('click', (e) => {
            e.preventDefault();
            RetailX.showToast(`Filtering feature coming soon`, 'info');
        });

        // Export button
        $('#exportStaffBtn').on('click', (e) => {
            e.preventDefault();
            this.exportToCSV();
        });

        // Apply date range
        $('#applyDateRange').on('click', (e) => {
            e.preventDefault();
            const start = $('#startDate').val();
            const end = $('#endDate').val();
            RetailX.showToast(`Date range applied: ${start} to ${end}`, 'success');
        });

        // Chart period change
        $('#revenuePeriod, #categoryPeriod').on('change', (e) => {
            e.preventDefault();
            RetailX.showToast('Chart period updated', 'info');
        });
    },

    initFormSteps: function() {
        $('.next-step').on('click', (e) => {
            e.preventDefault();
            const next = $(e.currentTarget).data('next');
            if (this.validateStep(this.currentStep)) {
                this.goToStep(next);
            }
        });

        $('.prev-step').on('click', (e) => {
            e.preventDefault();
            const prev = $(e.currentTarget).data('prev');
            this.goToStep(prev);
        });
    },

    goToStep: function(step) {
        this.currentStep = step;
        $('.form-step').removeClass('active');
        $(`#step${step}`).addClass('active');
        
        $('.progress-step').removeClass('active');
        $(`.progress-step[data-step="${step}"]`).addClass('active');
        
        if (step == 3) {
            this.updateReviewData();
        }
    },

    validateStep: function(step) {
        let isValid = true;
        
        if (step === 1) {
            const name = $('#staffFullName').val().trim();
            const email = $('#staffEmail').val().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            $('.error-message').removeClass('show').empty();
            
            if (!name) {
                $('#fullNameError').text('Full name is required').addClass('show');
                isValid = false;
            }
            
            if (!email) {
                $('#emailError').text('Email is required').addClass('show');
                isValid = false;
            } else if (!emailRegex.test(email)) {
                $('#emailError').text('Please enter a valid email').addClass('show');
                isValid =false;
            }
        } else if (step === 2) {
            const username = $('#staffUsername').val().trim();
            const password = $('#staffPassword').val();
            const confirm = $('#staffConfirmPassword').val();
            
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
                
                if (password !== confirm) {
                    $('#confirmPasswordError').text('Passwords do not match').addClass('show');
                    isValid = false;
                }
            }
        }
        
        return isValid;
    },

    updateReviewData: function() {
        $('#reviewFullName').text($('#staffFullName').val().trim() || '-');
        $('#reviewEmail').text($('#staffEmail').val().trim() || '-');
        $('#reviewUsername').text($('#staffUsername').val().trim() || '-');
    },

    initPasswordStrength: function() {
        $('#staffPassword').on('input', function() {
            const password = $(this).val();
            const bar = $('.strength-bar');
            
            if (!password) {
                bar.removeClass('weak medium strong').css('width', '0');
                return;
            }
            
            let strength = 0;
            if (password.length >= 8) strength++;
            if (password.length >= 12) strength++;
            if (/\d/.test(password)) strength++;
            if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            
            if (strength <= 2) {
                bar.removeClass('medium strong').addClass('weak');
            } else if (strength <= 4) {
                bar.removeClass('weak strong').addClass('medium');
            } else {
                bar.removeClass('weak medium').addClass('strong');
            }
        });
    },

    loadCashierData: function() {
        $('#staffTableLoading').fadeIn(200);
        $('#staffTableBody').empty();
        $('#staffTableError').hide();

        // Try from hidden data
        const dataEl = document.getElementById('staff-data');
        if (dataEl && dataEl.dataset.cashiers) {
            try {
                const data = JSON.parse(dataEl.dataset.cashiers);
                if (data && data.length > 0) {
                    this.cashierList = data;
                    this.filteredList = [...data];
                    this.filterAndSort();
                    $('#staffTableLoading').fadeOut(200);
                    $('#staffTableEmpty').hide();
                    this.updateSummary(data);
                    this.addActivity('System', 'Cashier data loaded', 'success');
                    return;
                }
            } catch(e) {
                console.error('Error parsing cashier data:', e);
            }
        }

        // Fallback to AJAX
        $.ajax({
            url: '/api/cashiers/',
            method: 'GET',
            headers: { 'X-CSRFToken': getCSRFToken() },
            success: (response) => {
                if (response.success && response.cashiers) {
                    this.cashierList = response.cashiers;
                    this.filteredList = [...response.cashiers];
                    this.filterAndSort();
                    this.updateSummary(response.cashiers);
                    this.addActivity('System', 'Cashier data loaded', 'success');
                } else {
                    this.showEmptyState();
                }
                $('#staffTableLoading').fadeOut(200);
            },
            error: (xhr, status, error) => {
                console.error('Error loading cashiers:', error);
                $('#staffTableLoading').fadeOut(200);
                $('#staffTableError').fadeIn(200);
                RetailX.showToast('Failed to load cashiers', 'error');
            }
        });
    },

    filterAndSort: function() {
        const search = $('#staffSearch').val().toLowerCase().trim();
        
        this.filteredList = this.cashierList.filter(c => {
            if (!search) return true;
            return (c.fullname && c.fullname.toLowerCase().includes(search)) ||
                   (c.username && c.username.toLowerCase().includes(search)) ||
                   (c.email && c.email.toLowerCase().includes(search));
        });

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
            
            return this.sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });

        this.renderCurrentPage();
    },

    renderCurrentPage: function() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = Math.min(start + this.itemsPerPage, this.filteredList.length);
        const pageData = this.filteredList.slice(start, end);

        this.renderTable(pageData);
        this.updatePagination();
    },

    renderTable: function(data) {
        const tbody = $('#staffTableBody');
        tbody.empty();

        if (!data || data.length === 0) {
            $('#staffTableEmpty').fadeIn(200);
            return;
        }

        $('#staffTableEmpty').hide();

        data.forEach(c => {
            tbody.append(`
                <tr data-id="${c.id}">
                    <td><span class="staff-id">#${c.id}</span></td>
                    <td><span class="staff-name">${c.fullname || 'N/A'}</span></td>
                    <td><span class="staff-username">@${c.username || 'N/A'}</span></td>
                    <td><span class="staff-email">${c.email || 'N/A'}</span></td>
                    <td><span class="status-badge active"><i class="fas fa-check-circle"></i> Active</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="RetailX.CashierManager.viewCashier(${c.id})" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" onclick="RetailX.CashierManager.openEditCashierModal(${c.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="RetailX.CashierManager.openDeleteModal(${c.id}, '${(c.fullname || '').replace(/'/g, "\\'")}')" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        });
    },

    updatePagination: function() {
        const total = this.filteredList.length;
        const pages = Math.ceil(total / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(start + this.itemsPerPage - 1, total);

        $('#startCount').text(total > 0 ? start : 0);
        $('#endCount').text(end);
        $('#totalCount').text(total);

        let pageNumbers = '';
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                pageNumbers += `<span class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                pageNumbers += '<span class="page-number">...</span>';
            }
        }
        $('#pageNumbers').html(pageNumbers);

        $('.page-number[data-page]').off('click').on('click', (e) => {
            e.preventDefault();
            const page = parseInt($(e.currentTarget).data('page'));
            this.currentPage = page;
            this.renderCurrentPage();
        });

        $('#prevPage').prop('disabled', this.currentPage === 1);
        $('#nextPage').prop('disabled', this.currentPage === pages || total === 0);
    },

    updateSummary: function(data) {
        const total = data.length;
        const withEmail = data.filter(c => c.email && c.email.includes('@')).length;
        const unique = new Set(data.map(c => c.username)).size;

        $('#totalCashiers').text(total);
        $('#activeCashiers').text(total);
        $('#withEmail').text(withEmail);
        $('#uniqueUsernames').text(unique);

        // Animate numbers
        $('.summary-value').each(function() {
            const $this = $(this);
            const final = parseInt($this.text());
            $this.prop('Counter', 0).animate({
                Counter: final
            }, {
                duration: 1000,
                step: (now) => {
                    $this.text(Math.ceil(now));
                }
            });
        });
    },

    openAddCashierModal: function() {
        this.resetForm();
        this.currentStep = 1;
        this.goToStep(1);
        $('#staffModalTitle').html('<i class="fas fa-user-plus"></i> Add New Cashier');
        $('#formAction').val('add');
        $('#staffId').val('');
        $('#staffPassword').prop('required', true);
        $('#staffConfirmPassword').prop('required', true);
        $('#staffModal').fadeIn(300).css('display', 'flex');
    },

    openEditCashierModal: function(cashierId) {
        const cashier = this.cashierList.find(c => c.id === cashierId);
        if (!cashier) {
            RetailX.showToast('Cashier not found', 'error');
            return;
        }

        this.resetForm();
        this.currentStep = 3;
        this.goToStep(3);

        $('#staffModalTitle').html('<i class="fas fa-edit"></i> Edit Cashier');
        $('#formAction').val('edit');
        $('#staffId').val(cashier.id);
        $('#staffFullName').val(cashier.fullname || '');
        $('#staffUsername').val(cashier.username || '');
        $('#staffEmail').val(cashier.email || '');
        $('#staffPassword').prop('required', false);
        $('#staffConfirmPassword').prop('required', false);
        
        this.updateReviewData();
        $('#staffModal').fadeIn(300).css('display', 'flex');
    },

    viewCashier: function(cashierId) {
        const cashier = this.cashierList.find(c => c.id === cashierId);
        if (!cashier) {
            RetailX.showToast('Cashier not found', 'error');
            return;
        }

        $('#viewStaffModal').data('cashierId', cashierId);
        
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

    handleFormSubmit: function() {
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
        const btn = $('#submitStaffBtn');
        const originalText = btn.html();
        
        btn.html('<i class="fas fa-spinner fa-spin"></i> Saving...').prop('disabled', true);

        const url = action === 'add' ? '/api/cashiers/add/' : `/api/cashiers/${formData.id}/edit/`;
        const method = action === 'add' ? 'POST' : 'PUT';

        $.ajax({
            url: url,
            method: method,
            headers: { 'X-CSRFToken': getCSRFToken() },
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: (response) => {
                if (response.success) {
                    RetailX.showSuccessModal(action === 'add' ? 'Cashier added successfully!' : 'Cashier updated successfully!');
                    
                    if (action === 'add') {
                        this.cashierList.push(response.cashier);
                    } else {
                        const index = this.cashierList.findIndex(c => c.id == formData.id);
                        if (index !== -1) {
                            Object.assign(this.cashierList[index], response.cashier);
                        }
                    }
                    
                    this.filteredList = [...this.cashierList];
                    this.filterAndSort();
                    this.updateSummary(this.cashierList);
                    $('#staffModal').fadeOut(300);
                    this.resetForm();
                    
                    const msg = action === 'add' ? `New cashier ${formData.fullname} added` : `Cashier ${formData.fullname} updated`;
                    this.addActivity('System', msg, 'success');
                } else {
                    RetailX.showToast(response.error || 'Operation failed', 'error');
                }
            },
            error: (xhr) => {
                const response = xhr.responseJSON;
                RetailX.showToast(response?.error || 'Server error', 'error');
            },
            complete: () => {
                btn.html(originalText).prop('disabled', false);
            }
        });
    },

    openDeleteModal: function(cashierId, cashierName) {
        this.deleteCashierId = cashierId;
        $('#deleteStaffName').text(cashierName);
        $('#deleteConfirmModal').fadeIn(300).css('display', 'flex');
    },

    deleteCashier: function() {
        if (!this.deleteCashierId) return;

        const cashierId = this.deleteCashierId;
        const cashier = this.cashierList.find(c => c.id === cashierId);
        if (!cashier) return;

        const btn = $('#confirmDeleteBtn');
        const originalText = btn.html();
        
        btn.html('<i class="fas fa-spinner fa-spin"></i> Deleting...').prop('disabled', true);

        $.ajax({
            url: `/api/cashiers/${cashierId}/delete/`,
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCSRFToken() },
            success: (response) => {
                if (response.success) {
                    RetailX.showSuccessModal('Cashier deleted successfully!');
                    this.cashierList = this.cashierList.filter(c => c.id !== cashierId);
                    this.filteredList = [...this.cashierList];
                    this.filterAndSort();
                    this.updateSummary(this.cashierList);
                    $('#deleteConfirmModal').fadeOut(300);
                    this.addActivity('System', `Cashier ${cashier.fullname} removed`, 'warning');
                } else {
                    RetailX.showToast(response.error || 'Failed to delete cashier', 'error');
                }
            },
            error: (xhr) => {
                const response = xhr.responseJSON;
                RetailX.showToast(response?.error || 'Server error', 'error');
            },
            complete: () => {
                btn.html(originalText).prop('disabled', false);
                this.deleteCashierId = null;
            }
        });
    },

    resetForm: function() {
        $('#staffForm')[0].reset();
        $('.error-message').removeClass('show').empty();
        $('.strength-bar').removeClass('weak medium strong').css('width', '0');
        $('#staffId').val('');
        $('#formAction').val('add');
        this.currentStep = 1;
        this.goToStep(1);
    },

    addActivity: function(user, action, type = 'info') {
        const timeline = $('#staffActivities');
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        let icon = 'fa-info-circle';
        let color = '#3b82f6';
        
        if (type === 'success') {
            icon = 'fa-check-circle';
            color = '#10b981';
        } else if (type === 'warning') {
            icon = 'fa-exclamation-triangle';
            color = '#f59e0b';
        }

        const activity = `
            <div class="timeline-item" style="opacity:0; transform:translateY(-20px);">
                <div class="timeline-icon" style="color:${color};">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="timeline-content">
                    <p>${user}: ${action}</p>
                    <span class="timeline-time"><i class="far fa-clock"></i> ${time}</span>
                </div>
            </div>
        `;

        timeline.prepend(activity);
        
        setTimeout(() => {
            timeline.find('.timeline-item:first-child').css({
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'all 0.3s ease'
            });
        }, 10);

        if (timeline.children().length > 10) {
            timeline.children().last().remove();
        }
    },

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
    },

    showEmptyState: function() {
        $('#staffTableEmpty').fadeIn(200);
    }
};

// Expose global methods
window.viewCashier = (id) => RetailX.CashierManager.viewCashier(id);
window.editCashier = (id) => RetailX.CashierManager.openEditCashierModal(id);
window.deleteCashier = (id, name) => RetailX.CashierManager.openDeleteModal(id, name);
window.togglePassword = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        const icon = event.currentTarget.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    }
};

// ============================================
// PAGE NAVIGATION
// ============================================
RetailX.Navigation = {
    init: function() {
        $('.menu-item[data-page]').on('click', (e) => {
            e.preventDefault();
            const page = $(e.currentTarget).data('page');
            this.switchPage(page);
            
            $('.menu-item').removeClass('active');
            $(e.currentTarget).addClass('active');

            if ($(window).width() <= 768) {
                RetailX.SidebarManager.hideSidebar();
            }
        });
    },

    switchPage: function(page) {
        $('.page').hide().removeClass('active');
        $(`#${page}-page`).fadeIn(400).addClass('active');

        const titles = {
            dashboard: 'Dashboard',
            overview: 'Store Overview',
            inventory: 'Inventory Management',
            staff: 'Cashier Management',
            analysis: 'Analysis',
            transactions: 'Transactions',
            reports: 'Reports',
            settings: 'Settings'
        };

        $('#pageTitle').text(titles[page] || 'Dashboard');
        $('#breadcrumb').text(`Home / ${titles[page] || 'Dashboard'}`);
        
        if (page === 'staff') {
            RetailX.CashierManager.loadCashierData();
        }
    }
};

// ============================================
// DASHBOARD
// ============================================
RetailX.Dashboard = {
    init: function() {
        console.log('📊 Initializing Dashboard...');
        this.loadMockData();
        this.startClock();
        this.initCharts();
        this.initPrediction();
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
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { callback: (v) => '$' + v }
                        }
                    }
                }
            });
        }

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
                        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
                    }
                }
            });
        }
    },

    initPrediction: function() {
        const festival = $('#predictFestival');
        const product = $('#predictProduct');
        const date = $('#predictDate');
        const btn = $('#predictBtn');
        const result = $('#predictionResult');

        festival.on('change', (e) => {
            e.preventDefault();
            const val = festival.val();
            if (!val) {
                product.prop('disabled', true).html('<option value="">Select Product</option>');
                result.fadeOut();
                return;
            }

            $.ajax({
                url: '/api/products-for-festival/',
                data: { festival: val },
                success: (data) => {
                    product.prop('disabled', false).empty().append('<option value="">Select Product</option>');
                    if (data.products && data.products.length > 0) {
                        data.products.forEach(p => {
                            product.append(`<option value="${p}">${p}</option>`);
                        });
                    } else {
                        product.append('<option value="">No products found</option>').prop('disabled', true);
                        RetailX.showToast('No models found for this festival', 'warning');
                    }
                },
                error: () => {
                    RetailX.showToast('Failed to load products', 'error');
                }
            });
        });

        btn.on('click', (e) => {
            e.preventDefault();
            const fVal = festival.val();
            const pVal = product.val();
            const dVal = date.val();
            
            if (!fVal || !pVal || !dVal) {
                RetailX.showToast('Please select festival, product, and date', 'warning');
                return;
            }

            btn.html('<i class="fas fa-spinner fa-spin"></i> Predicting...').prop('disabled', true);

            $.ajax({
                url: '/api/predict/',
                data: { festival: fVal, product: pVal, date: dVal },
                success: (data) => {
                    if (data.error) {
                        RetailX.showToast(data.error, 'error');
                        return;
                    }
                    $('#predUnits').text(data.predicted_units);
                    $('#predRevenue').text(data.predicted_revenue.toFixed(2));
                    result.fadeIn();
                    this.updateChartWithPrediction(data);
                },
                error: (xhr) => {
                    const msg = xhr.responseJSON?.error || 'Prediction failed';
                    RetailX.showToast(msg, 'error');
                },
                complete: () => {
                    btn.html('<i class="fas fa-magic"></i> Predict').prop('disabled', false);
                }
            });
        });
    },

    updateChartWithPrediction: function(prediction) {
        if (!window.revenueChart) return;
        
        const chart = window.revenueChart;
        const label = prediction.date;
        
        if (!chart.data.labels.includes(label)) {
            chart.data.labels.push(label);
            chart.data.datasets[0].data.push(null);
        }
        
        let predSet = chart.data.datasets.find(ds => ds.label === 'Predicted');
        if (!predSet) {
            predSet = {
                label: 'Predicted',
                data: [],
                borderColor: '#f97316',
                backgroundColor: '#f97316',
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false,
                type: 'scatter'
            };
            chart.data.labels.forEach(() => predSet.data.push(null));
            chart.data.datasets.push(predSet);
        }
        
        while (predSet.data.length < chart.data.labels.length) {
            predSet.data.push(null);
        }
        
        const index = chart.data.labels.indexOf(label);
        predSet.data[index] = prediction.predicted_revenue;
        chart.update();
    }
};

// ============================================
// INITIALIZATION
// ============================================
$(document).ready(function() {
    console.log('✅ Initializing RetailX Dashboard...');

    // Hide preloader
    setTimeout(() => {
        $('#global-loader').addClass('fade-out');
        setTimeout(() => $('#global-loader').hide(), 400);
    }, 600);

    // Initialize all modules
    RetailX.SidebarManager.init();
    RetailX.Navigation.init();
    RetailX.Dashboard.init();
    RetailX.CashierManager.init();
    RetailX.NotificationManager.init();
    RetailX.Chatbot.init();

    console.log('✅ All modules initialized successfully');
});