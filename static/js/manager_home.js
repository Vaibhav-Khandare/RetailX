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
// SIDEBAR MANAGER
// ============================================
RetailX.SidebarManager = {
    init: function() {
        console.log('📱 Initializing Sidebar Manager...');
        this.bindEvents();
        this.checkScreenSize();
        
        $(window).on('resize', () => {
            this.checkScreenSize();
        });
    },
    
    bindEvents: function() {
        $('#mobileMenuToggle').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleSidebar();
        });
        
        $('#sidebarClose').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideSidebar();
        });
        
        $('#sidebarOverlay').on('click', () => {
            this.hideSidebar();
        });
        
        $('.menu-item').on('click', () => {
            if ($(window).width() <= 768) {
                this.hideSidebar();
            }
        });
        
        $(document).on('keydown', (e) => {
            if (e.key === 'Escape' && $(window).width() <= 768) {
                this.hideSidebar();
            }
        });
    },
    
    checkScreenSize: function() {
        if ($(window).width() > 768) {
            $('#sidebar').removeClass('hidden');
            $('#sidebarOverlay').removeClass('active');
            $('#mainContent').removeClass('full-width');
        } else {
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
// NOTIFICATION MANAGER (with low stock alerts)
// ============================================
RetailX.NotificationManager = {
    notifications: [],  // ab empty – sirf low stock aayenge

    lowStockProducts: [],  // raw data from backend

    init: function() {
        console.log('🔔 Initializing Notification Manager...');
        this.bindEvents();
        // Load low stock alerts
        this.loadLowStockAlerts();
        // Refresh every 5 minutes
        setInterval(() => this.loadLowStockAlerts(), 300000);
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

    loadLowStockAlerts: function() {
        $.ajax({
            url: '/api/low-stock/',
            method: 'GET',
            success: (response) => {
                if (response.success && response.low_stock) {
                    this.lowStockProducts = response.low_stock;
                    this.updateLowStockNotifications();
                }
            },
            error: (xhr) => {
                console.error('Failed to load low stock alerts:', xhr);
            }
        });
    },

    updateLowStockNotifications: function() {
        // Purani notifications hatao aur low stock se nayi banao
        this.notifications = [];
        this.lowStockProducts.forEach(p => {
            this.notifications.push({
                id: 'lowstock_' + p.sku,
                type: 'warning',
                title: `⚠️ Low stock: ${p.name} (${p.stock} left, threshold ${p.threshold})`,
                time: 'Just now',
                read: false,
                isLowStock: true
            });
        });

        // Sirf 20 tak rakho
        if (this.notifications.length > 20) {
            this.notifications = this.notifications.slice(0, 20);
        }

        this.renderNotifications();
        this.updateBadge();
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
        const notification = this.notifications.find(n => n.id == id);
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
            id: 'dyn_' + Date.now(),
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
            this.togglePopup();
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

        messages.append(`
            <div class="chat-user">
                <span>${this.escapeHtml(message)}</span>
            </div>
        `);
        
        input.val('');
        messages.scrollTop(messages[0].scrollHeight);

        const typingId = 'typing-' + Date.now();
        messages.append(`
            <div class="chat-bot" id="${typingId}">
                <span>🤖 Typing...</span>
            </div>
        `);
        messages.scrollTop(messages[0].scrollHeight);

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
        $('#addStaffBtn').on('click', (e) => {
            e.preventDefault();
            this.openAddCashierModal();
        });

        $('#staffSearch').on('input', () => {
            const searchTerm = $('#staffSearch').val();
            $('#clearSearch').toggle(searchTerm.length > 0);
            
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.currentPage = 1;
                this.filterAndSort();
            }, 300);
        });

        $('#clearSearch').on('click', () => {
            $('#staffSearch').val('').trigger('input');
        });

        $('#refreshStaffBtn').on('click', (e) => {
            e.preventDefault();
            $(e.currentTarget).find('i').addClass('fa-spin');
            this.loadCashierData();
            setTimeout(() => {
                $(e.currentTarget).find('i').removeClass('fa-spin');
                RetailX.showToast('Cashier data refreshed', 'success');
            }, 800);
        });

        $('#retryLoadBtn').on('click', (e) => {
            e.preventDefault();
            this.loadCashierData();
        });

        $('#sortBy').on('change', () => {
            this.sortBy = $('#sortBy').val();
            this.currentPage = 1;
            this.filterAndSort();
        });

        $('#itemsPerPage').on('change', () => {
            this.itemsPerPage = parseInt($('#itemsPerPage').val());
            this.currentPage = 1;
            this.filterAndSort();
        });

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

        $('#staffForm').on('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        $('.modal-close, .cancel-btn').on('click', (e) => {
            e.preventDefault();
            $('.modal').fadeOut(300);
            this.resetForm();
        });

        $('#closeSuccessModal').on('click', (e) => {
            e.preventDefault();
            $('#successModal').fadeOut(300);
        });

        $(window).on('click', (e) => {
            if ($(e.target).hasClass('modal')) {
                $('.modal').fadeOut(300);
                this.resetForm();
            }
        });

        $('#confirmDeleteBtn').on('click', (e) => {
            e.preventDefault();
            this.deleteCashier();
        });

        $('#cancelDeleteBtn').on('click', (e) => {
            e.preventDefault();
            $('#deleteConfirmModal').fadeOut(300);
            this.deleteCashierId = null;
        });

        $('#editFromViewBtn').on('click', (e) => {
            e.preventDefault();
            const cashierId = $('#viewStaffModal').data('cashierId');
            $('#viewStaffModal').fadeOut(300);
            setTimeout(() => {
                this.openEditCashierModal(cashierId);
            }, 300);
        });

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

        $('#totalCashiersCard, #activeCashiersCard, #emailCard, #usernameCard').on('click', (e) => {
            e.preventDefault();
            RetailX.showToast(`Filtering feature coming soon`, 'info');
        });

        $('#exportStaffBtn').on('click', (e) => {
            e.preventDefault();
            this.exportToCSV();
        });

        $('#applyDateRange').on('click', (e) => {
            e.preventDefault();
            const start = $('#startDate').val();
            const end = $('#endDate').val();
            RetailX.showToast(`Date range applied: ${start} to ${end}`, 'success');
        });

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
            reports: 'Reports',
            settings: 'Settings'
        };

        $('#pageTitle').text(titles[page] || 'Dashboard');
        $('#breadcrumb').text(`Home / ${titles[page] || 'Dashboard'}`);

        // Load data when page becomes active
        if (page === 'staff') {
            RetailX.CashierManager.loadCashierData();
        }
        if (page === 'inventory') {
            RetailX.Inventory.loadInventory();
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
        $('#totalRevenue').text('₹156,780');
        $('#inventoryValue').text('₹82,340');
        $('#activeStaff').text(RetailX.CashierManager.cashierList.length || '8');
        $('#customerSatisfaction').text('94%');
        $('#todayRevenue').text('₹4,290');
        $('#onlineOrders').text('127');
        $('#totalOrders').text('1,284');
        $('#newCustomers').text('342');
        $('#returnRate').text('2.4%');
        $('#avgOrderValue').text('₹122.50');
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
                            ticks: { callback: (v) => '₹' + v }
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
// INVENTORY MANAGEMENT MODULE
// ============================================
RetailX.Inventory = {
    allProducts: [],
    filteredProducts: [],
    currentPage: 1,
    itemsPerPage: 20,
    sortBy: 'name-asc',
    categoryFilter: 'all',
    searchTerm: '',
    debounceTimer: null,

    init: function() {
        console.log('📦 Initializing Inventory Management...');
        this.bindEvents();
    },

    bindEvents: function() {
        $('#randomizeInventoryBtn').on('click', (e) => {
            e.preventDefault();
            this.loadInventory(true);
        });

        $('#refreshInventoryBtn').on('click', (e) => {
            e.preventDefault();
            this.loadInventory(true);
        });

        $('#inventorySearch').on('input', () => {
            const term = $('#inventorySearch').val();
            $('#clearInventorySearch').toggle(term.length > 0);
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.searchTerm = term.toLowerCase();
                this.currentPage = 1;
                this.applyFilters();
            }, 300);
        });

        $('#clearInventorySearch').on('click', () => {
            $('#inventorySearch').val('').trigger('input');
        });

        $('#inventoryCategoryFilter').on('change', (e) => {
            this.categoryFilter = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        $('#inventorySortFilter').on('change', (e) => {
            this.sortBy = e.target.value;
            this.currentPage = 1;
            this.applyFilters();
        });

        $('#inventoryItemsPerPage').on('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderCurrentPage();
        });

        $('#resetInventoryFilters').on('click', (e) => {
            e.preventDefault();
            this.resetFilters();
        });

        $('#resetFiltersEmptyBtn').on('click', (e) => {
            e.preventDefault();
            this.resetFilters();
        });

        $('#retryInventoryLoadBtn').on('click', (e) => {
            e.preventDefault();
            this.loadInventory(true);
        });

        $('#prevInventoryPage').on('click', (e) => {
            e.preventDefault();
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderCurrentPage();
            }
        });

        $('#nextInventoryPage').on('click', (e) => {
            e.preventDefault();
            const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderCurrentPage();
            }
        });

        $('#exportAllInventoryBtn').on('click', (e) => {
            e.preventDefault();
            this.exportToCSV(this.filteredProducts, 'all_products');
        });

        $('#exportLowStockBtn').on('click', (e) => {
            e.preventDefault();
            const lowStock = this.filteredProducts.filter(p => p.quantity < 20);
            this.exportToCSV(lowStock, 'low_stock_products');
            RetailX.showToast(`Exported ${lowStock.length} low stock items`, 'success');
        });
    },

    loadInventory: function(showLoader = true) {
        if (showLoader) {
            $('#inventoryTableBody').html(`
                <tr>
                    <td colspan="8" class="loading-cell">
                        <div class="loading-spinner"></div>
                        <span>Loading inventory data...</span>
                    </td>
                </tr>
            `);
        }

        $('#inventoryEmptyState').hide();
        $('#inventoryErrorState').hide();

        $.ajax({
            url: '/api/inventory/random/',
            method: 'GET',
            success: (response) => {
                if (response.products && response.products.length > 0) {
                    this.allProducts = response.products;
                    this.filteredProducts = [...this.allProducts];
                    this.updateCategoryDropdown();
                    this.applyFilters();
                } else {
                    this.showEmptyState();
                }
            },
            error: (xhr, status, error) => {
                console.error('Error loading inventory:', error);
                $('#inventoryErrorState').fadeIn(200);
                $('#inventoryTableBody').empty();
                RetailX.showToast('Failed to load inventory', 'error');
            }
        });
    },

    updateCategoryDropdown: function() {
        const categories = [...new Set(this.allProducts.map(p => p.category))];
        const $select = $('#inventoryCategoryFilter');
        $select.find('option:not(:first)').remove();
        categories.sort().forEach(cat => {
            $select.append(`<option value="${cat}">${cat}</option>`);
        });
    },

    applyFilters: function() {
        let filtered = [...this.allProducts];

        if (this.categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === this.categoryFilter);
        }

        if (this.searchTerm) {
            filtered = filtered.filter(p => 
                (p.product_name && p.product_name.toLowerCase().includes(this.searchTerm)) ||
                (p.category && p.category.toLowerCase().includes(this.searchTerm))
            );
        }

        filtered = this.sortProducts(filtered, this.sortBy);

        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.renderCurrentPage();
        this.updateStats();
        this.updateActiveFiltersDisplay();
    },

    sortProducts: function(products, sortKey) {
        const [field, order] = sortKey.split('-');
        return products.sort((a, b) => {
            let valA, valB;
            if (field === 'name') {
                valA = a.product_name.toLowerCase();
                valB = b.product_name.toLowerCase();
            } else if (field === 'price') {
                valA = a.price;
                valB = b.price;
            } else if (field === 'quantity') {
                valA = a.quantity;
                valB = b.quantity;
            } else {
                return 0;
            }
            if (order === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });
    },

    renderCurrentPage: function() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = Math.min(start + this.itemsPerPage, this.filteredProducts.length);
        const pageData = this.filteredProducts.slice(start, end);

        this.renderTable(pageData);
        this.updatePagination();
    },

    renderTable: function(data) {
        const tbody = $('#inventoryTableBody');
        tbody.empty();

        if (data.length === 0) {
            $('#inventoryEmptyState').fadeIn(200);
            return;
        }

        $('#inventoryEmptyState').hide();

        data.forEach((p, index) => {
            const lowStock = p.quantity < 20;
            const statusClass = lowStock ? 'status-badge low-stock' : 'status-badge in-stock';
            const statusText = lowStock ? 'Low Stock' : 'In Stock';
            const quantityClass = lowStock ? 'low-stock' : '';

            tbody.append(`
                <tr data-id="${p.id}">
                    <td>${p.serial_no || '-'}</td>
                    <td><strong>${p.product_name}</strong></td>
                    <td>${p.category}</td>
                    <td>₹${p.price.toFixed(2)}</td>
                    <td class="${quantityClass}">${p.quantity}</td>
                    <td>${p.subcategory || '-'}</td>
                    <td><span class="${statusClass}"><i class="fas ${lowStock ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="RetailX.Inventory.viewProduct(${p.id})" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" onclick="RetailX.Inventory.editProduct(${p.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="RetailX.Inventory.deleteProduct(${p.id})" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
        });
    },

    viewProduct: function(id) {
        const product = this.allProducts.find(p => p.id === id);
        if (product) {
            RetailX.showToast(`Viewing ${product.product_name}`, 'info');
        }
    },

    editProduct: function(id) {
        const product = this.allProducts.find(p => p.id === id);
        if (product) {
            RetailX.showToast(`Edit feature coming for ${product.product_name}`, 'info');
        }
    },

    deleteProduct: function(id) {
        const product = this.allProducts.find(p => p.id === id);
        if (product) {
            RetailX.showToast(`Delete feature coming for ${product.product_name}`, 'info');
        }
    },

    updatePagination: function() {
        const total = this.filteredProducts.length;
        const pages = Math.ceil(total / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(start + this.itemsPerPage - 1, total);

        $('#inventoryStartCount').text(total > 0 ? start : 0);
        $('#inventoryEndCount').text(end);
        $('#inventoryTotalCount').text(total);

        let pageNumbers = '';
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                pageNumbers += `<span class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                pageNumbers += '<span class="page-number">...</span>';
            }
        }
        $('#inventoryPagination').html(pageNumbers);

        $('.page-number[data-page]').off('click').on('click', (e) => {
            e.preventDefault();
            const page = parseInt($(e.currentTarget).data('page'));
            this.currentPage = page;
            this.renderCurrentPage();
        });

        $('#prevInventoryPage').prop('disabled', this.currentPage === 1);
        $('#nextInventoryPage').prop('disabled', this.currentPage === pages || total === 0);
    },

    updateStats: function() {
        const totalItems = this.allProducts.length;
        const totalValue = this.allProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const uniqueCategories = new Set(this.allProducts.map(p => p.category)).size;
        const lowStockCount = this.allProducts.filter(p => p.quantity < 20).length;

        $('#totalInventoryItems').text(totalItems);
        $('#totalInventoryValue').text('₹' + totalValue.toFixed(2));
        $('#uniqueCategories').text(uniqueCategories);
        $('#lowStockCountInventory').text(lowStockCount);
    },

    updateActiveFiltersDisplay: function() {
        const filters = [];
        if (this.categoryFilter !== 'all') {
            filters.push(`Category: ${this.categoryFilter}`);
        }
        if (this.searchTerm) {
            filters.push(`Search: "${this.searchTerm}"`);
        }
        if (filters.length > 0) {
            const tags = filters.map(f => `<span class="filter-tag">${f} <i class="fas fa-times" onclick="RetailX.Inventory.removeFilter('${f}')"></i></span>`).join('');
            $('#filterTags').html(tags);
            $('#activeFilters').show();
        } else {
            $('#activeFilters').hide();
        }
    },

    removeFilter: function(filter) {
        if (filter.startsWith('Category:')) {
            this.categoryFilter = 'all';
            $('#inventoryCategoryFilter').val('all');
        } else if (filter.startsWith('Search:')) {
            this.searchTerm = '';
            $('#inventorySearch').val('').trigger('input');
        }
        this.applyFilters();
    },

    resetFilters: function() {
        this.searchTerm = '';
        this.categoryFilter = 'all';
        this.sortBy = 'name-asc';
        $('#inventorySearch').val('');
        $('#inventoryCategoryFilter').val('all');
        $('#inventorySortFilter').val('name-asc');
        $('#clearInventorySearch').hide();
        this.applyFilters();
    },

    exportToCSV: function(products, filename) {
        if (!products || products.length === 0) {
            RetailX.showToast('No data to export', 'warning');
            return;
        }

        const headers = ['Serial No', 'Product Name', 'Category', 'Price', 'Quantity', 'Subcategory'];
        const csvRows = [];
        csvRows.push(headers.join(','));

        products.forEach(p => {
            const row = [
                p.serial_no || '',
                `"${p.product_name.replace(/"/g, '""')}"`,
                `"${p.category.replace(/"/g, '""')}"`,
                p.price,
                p.quantity,
                `"${(p.subcategory || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
};

// ============================================
// REPORTS MODULE (Print Price Labels & Stock Report)
// ============================================
RetailX.Reports = {
    /**
     * Generate a price label CSV (Serial No, Product Name, Price)
     */
    printPriceLabels: function() {
        this._generateReport(
            'price_labels',
            ['Serial No', 'Product Name', 'Price'],
            (product) => [product.serial_no || '', product.product_name, product.price]
        );
    },

    /**
     * Generate a stock report CSV (Product Name, Quantity)
     */
    stockReport: function() {
        this._generateReport(
            'stock_report',
            ['Product Name', 'Quantity'],
            (product) => [product.product_name, product.quantity]
        );
    },

    /**
     * Internal method: fetch products from /api/products/ and create CSV
     */
    _generateReport: function(filenamePrefix, headers, rowMapper) {
        RetailX.showToast('Generating report...', 'info');

        $.ajax({
            url: '/api/products/',
            method: 'GET',
            headers: { 'X-CSRFToken': getCSRFToken() },
            success: (response) => {
                if (response.products && response.products.length > 0) {
                    const products = response.products;
                    const csvRows = [];

                    csvRows.push(headers.join(','));

                    products.forEach(p => {
                        const row = rowMapper(p).map(cell => {
                            if (typeof cell === 'string') {
                                return `"${cell.replace(/"/g, '""')}"`;
                            }
                            return cell;
                        }).join(',');
                        csvRows.push(row);
                    });

                    const csvString = csvRows.join('\n');
                    const blob = new Blob([csvString], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);


                    RetailX.showToast('Report generated successfully', 'success');
                } else {
                    RetailX.showToast('No products found', 'warning');
                }
            },
            error: (xhr) => {
                console.error('Failed to fetch products:', xhr);
                RetailX.showToast('Failed to fetch products. Check console.', 'error');
            }
        });
    }
};

// ============================================
// SETTINGS MODULE (simple placeholder)
// ============================================
RetailX.Settings = {
    showComingSoon: function() {
        RetailX.showToast('Settings feature coming soon!', 'info');
    }
};

// ============================================
// LOGOUT HANDLER
// ============================================
RetailX.Logout = {
    init: function() {
        $('#logoutBtn').on('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'Are you sure?',
                text: 'You will be logged out of the system.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, logout'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.performLogout();
                }
            });
        });
    },

    performLogout: function() {
        $.ajax({
            url: '/logout/',
            method: 'POST',
            headers: { 'X-CSRFToken': getCSRFToken() },
            success: function() {
                window.location.href = '/manager_login/';
            },
            error: function() {
                window.location.href = '/manager_login/';
            }
        });
    }
};

// ============================================
// INITIALIZATION
// ============================================
$(document).ready(function() {
    console.log('✅ Initializing RetailX Dashboard...');

    setTimeout(() => {
        $('#global-loader').addClass('fade-out');
        setTimeout(() => $('#global-loader').hide(), 400);
    }, 600);

    RetailX.SidebarManager.init();
    RetailX.Navigation.init();
    RetailX.Dashboard.init();
    RetailX.CashierManager.init();
    RetailX.NotificationManager.init();
    RetailX.Chatbot.init();
    RetailX.Inventory.init();
    RetailX.Logout.init();

    console.log('✅ All modules initialized successfully');
});

// ============================================
// AGE PREDICTION MODULE
// ============================================
// This module handles the age group prediction feature in the Analysis page.
// It provides:
// 1. Dynamic loading of product categories from the API
// 2. Dynamic loading of brands based on selected category
// 3. AJAX prediction request to the backend
// 4. Animated display of the predicted age group
//
// Dependencies: jQuery, RetailX.showToast(), getCSRFToken()
// API Endpoints:
//   - GET  /api/valid-categories-brands/    - Returns all categories and brands
//   - GET  /api/brands-for-category/        - Returns brands for a specific category
//   - POST /api/predict-age/                 - Returns predicted age group
// ============================================

RetailX.AgePrediction = {
    
    /**
     * Initialize the Age Prediction module
     * Called when Analysis page is opened
     * @returns {void}
     */
    init: function() {
        console.log('👥 Initializing Age Prediction Module...');
        this.loadCategories();  // Load categories from API
        this.bindEvents();      // Bind event listeners
    },

    /**
     * Bind all event listeners for the prediction form
     * Uses .off() to prevent duplicate event binding
     * @returns {void}
     */
    bindEvents: function() {
        console.log('🔗 Binding Age Prediction events...');
        
        // Remove any existing event handlers to prevent duplicates
        $('#productCategory').off('change');
        $('#agePredictionForm').off('submit');
        $('#resetPredictionForm').off('click');

        /**
         * Category change event handler
         * When user selects a category, load its brands
         */
        $('#productCategory').on('change', function() {
            const category = $(this).val();
            console.log('📌 Category selected:', category);
            
            if (category) {
                // If category selected, load its brands
                RetailX.AgePrediction.loadBrands(category);
            } else {
                // If category deselected, reset brand dropdown
                $('#brand').empty()
                    .append('<option value="" selected>-- First select a category --</option>')
                    .prop('disabled', true);
            }
        });

        /**
         * Form submit event handler
         * Prevents default form submission and triggers prediction
         */
        $('#agePredictionForm').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📝 Form submitted - starting prediction');
            RetailX.AgePrediction.predictAge();
            return false;
        });

        /**
         * Reset button click handler
         * Clears form and hides result
         */
        $('#resetPredictionForm').on('click', function(e) {
            e.preventDefault();
            console.log('🔄 Reset button clicked');
            RetailX.AgePrediction.resetForm();
        });

        console.log('✅ Age Prediction events bound successfully');
    },

    /**
     * Load all available categories from the API
     * Populates the category dropdown with options
     * Shows loading state while fetching
     * @returns {void}
     */
    loadCategories: function() {
        console.log('📡 Loading categories from API...');
        
        const $categorySelect = $('#productCategory');
        
        // Show loading state
        $categorySelect.html('<option value="" selected disabled>Loading categories...</option>');

        $.ajax({
            url: '/api/valid-categories-brands/',
            method: 'GET',
            timeout: 10000, // 10 second timeout
            success: function(response) {
                console.log('✅ Categories loaded successfully:', response);
                
                // Clear and populate category dropdown
                $categorySelect.empty();
                $categorySelect.append('<option value="" selected disabled>-- Select a Category --</option>');
                
                // Add each category as an option
                if (response.categories && response.categories.length > 0) {
                    response.categories.forEach(function(category) {
                        $categorySelect.append(`<option value="${category}">${category}</option>`);
                    });
                    console.log(`📋 Populated ${response.categories.length} categories`);
                } else {
                    console.warn('⚠️ No categories found in response');
                    $categorySelect.append('<option value="" disabled>No categories available</option>');
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ Failed to load categories:', error);
                console.error('Status:', status);
                console.error('Response:', xhr.responseText);
                
                // Show error state
                $categorySelect.html('<option value="" selected disabled>Error loading categories</option>');
                
                // Show user-friendly error message
                RetailX.showToast('Failed to load categories. Please refresh the page.', 'error');
            }
        });
    },

    /**
     * Load brands for a specific category from the API
     * @param {string} category - The selected category (e.g., 'Electronics')
     * @returns {void}
     */
    loadBrands: function(category) {
        console.log(`📡 Loading brands for category: "${category}"...`);
        
        const $brandSelect = $('#brand');
        
        // Show loading state
        $brandSelect.prop('disabled', true)
            .html('<option value="" selected>Loading brands...</option>');

        $.ajax({
            url: '/api/brands-for-category/',
            data: { category: category },
            method: 'GET',
            timeout: 10000, // 10 second timeout
            success: function(response) {
                console.log(`✅ Brands loaded for ${category}:`, response);
                
                // Clear and populate brand dropdown
                $brandSelect.empty();
                $brandSelect.append('<option value="" selected disabled>-- Select a Brand --</option>');
                
                // Add each brand as an option
                if (response.brands && response.brands.length > 0) {
                    response.brands.forEach(function(brand) {
                        $brandSelect.append(`<option value="${brand}">${brand}</option>`);
                    });
                    
                    // Enable the dropdown
                    $brandSelect.prop('disabled', false);
                    console.log(`📋 Populated ${response.brands.length} brands for ${category}`);
                    
                } else {
                    console.warn(`⚠️ No brands found for category: ${category}`);
                    $brandSelect.html('<option value="" selected disabled>No brands available</option>')
                        .prop('disabled', true);
                }
            },
            error: function(xhr, status, error) {
                console.error(`❌ Failed to load brands for ${category}:`, error);
                console.error('Status:', status);
                console.error('Response:', xhr.responseText);
                
                // Show error state
                $brandSelect.html('<option value="" selected disabled>Error loading brands</option>')
                    .prop('disabled', false);
                
                // Show user-friendly error message
                RetailX.showToast('Failed to load brands. Please try again.', 'error');
            }
        });
    },

    /**
     * Send prediction request to the API
     * Uses only category and brand (backend has defaults for other features)
     * Shows loading state on button while waiting
     * @returns {void}
     */
    predictAge: function() {
        // Get selected values
        const category = $('#productCategory').val();
        const brand = $('#brand').val();
        
        console.log('🔮 Predicting age group with:', { category, brand });
        
        // Validate selections
        if (!category) {
            RetailX.showToast('Please select a product category', 'warning');
            $('#productCategory').focus();
            return;
        }
        
        if (!brand) {
            RetailX.showToast('Please select a brand', 'warning');
            $('#brand').focus();
            return;
        }

        // Update button state - show loading spinner
        const $btn = $('#predictAgeBtn');
        const originalText = $btn.html();
        $btn.prop('disabled', true)
            .html('<i class="fas fa-spinner fa-spin"></i> Predicting...');

        // Prepare request data
        const requestData = {
            product_category: category,
            brand: brand
            // Note: income, frequency, amount use backend defaults
        };

        console.log('📤 Sending prediction request:', requestData);

        // Send AJAX request
        $.ajax({
            url: '/api/predict-age/',
            method: 'POST',
            headers: { 
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(requestData),
            timeout: 15000, // 15 second timeout
            success: function(response) {
                console.log('✅ Prediction successful:', response);
                
                // Update and show result
                if (response && response.age_group) {
                    $('#ageGroupResult').text(response.age_group);
                    // IMPORTANT: Using 'agePredictionResult' ID to avoid conflict with dashboard
                    $('#agePredictionResult').fadeIn(500);
                    
                    // Smooth scroll to result
                    $('html, body').animate({
                        scrollTop: $('#agePredictionResult').offset().top - 50
                    }, 500);
                    
                    // Show success toast
                    RetailX.showToast(`Predicted age group: ${response.age_group}`, 'success');
                } else {
                    console.error('❌ Invalid response format:', response);
                    RetailX.showToast('Invalid response from server', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ Prediction failed:', error);
                console.error('Status:', status);
                console.error('Response:', xhr.responseText);
                
                // Extract error message
                let errorMsg = 'Prediction failed';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                } else if (xhr.responseText) {
                    try {
                        const jsonResponse = JSON.parse(xhr.responseText);
                        errorMsg = jsonResponse.error || errorMsg;
                    } catch(e) {
                        errorMsg = xhr.responseText || errorMsg;
                    }
                }
                
                // Show error message
                RetailX.showToast(errorMsg, 'error');
                
                // Hide result if visible
                $('#agePredictionResult').fadeOut(300);
            },
            complete: function() {
                // Restore button state
                $btn.prop('disabled', false).html(originalText);
                console.log('🏁 Prediction request completed');
            }
        });
    },

    /**
     * Reset the form to its initial state
     * Clears selections, resets dropdowns, and hides the result
     * @returns {void}
     */
    resetForm: function() {
        console.log('🔄 Resetting prediction form...');
        
        // Reset category dropdown to default
        $('#productCategory').val('');
        
        // Reset brand dropdown to disabled state with placeholder
        $('#brand').empty()
            .append('<option value="" selected>-- First select a category --</option>')
            .prop('disabled', true);
        
        // Hide result with fade out animation
        $('#agePredictionResult').fadeOut(300, function() {
            // Reset result text after fade out completes
            $('#ageGroupResult').text('-');
        });
        
        // Show success message
        RetailX.showToast('Form reset successfully', 'info');
        
        console.log('✅ Form reset complete');
    }
};

// ============================================
// PAGE NAVIGATION INTEGRATION
// ============================================

/**
 * Initialize Age Prediction when Analysis page is opened
 * This ensures the module loads fresh data each time the user navigates to the page
 */
$(document).on('click', '.menu-item[data-page="analysis"]', function() {
    console.log('📱 Analysis page opened - initializing Age Prediction');
    
    // Small delay to ensure DOM is ready
    setTimeout(function() { 
        if (typeof RetailX.AgePrediction !== 'undefined') {
            RetailX.AgePrediction.init();
        } else {
            console.error('❌ AgePrediction module not found');
        }
    }, 200);
});

/**
 * Also initialize if Analysis page is active on initial load
 * Handles case when page loads directly on Analysis tab
 */
$(document).ready(function() {
    if ($('#analysis-page').hasClass('active')) {
        console.log('📱 Analysis page active on load');
        setTimeout(function() {
            if (typeof RetailX.AgePrediction !== 'undefined') {
                RetailX.AgePrediction.init();
            }
        }, 500);
    }
});

// ============================================
// HELPER FUNCTION FOR DEBUGGING
// ============================================

/**
 * Manual test function to verify API is working
 * Can be run from browser console: testPredictionAPI()
 * @returns {void}
 */
window.testPredictionAPI = function() {
    console.log('🧪 Testing Prediction API...');
    
    $.ajax({
        url: '/api/predict-age/',
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken() },
        contentType: 'application/json',
        data: JSON.stringify({
            product_category: 'Electronics',
            brand: 'Sony'
        }),
        success: function(response) {
            console.log('✅ API Test Success:', response);
            alert(`API Working! Predicted: ${response.age_group}`);
        },
        error: function(xhr) {
            console.error('❌ API Test Failed:', xhr);
            alert('API Test Failed. Check console for details.');
        }

        
    });
};
// ============================================
// TAB MANAGEMENT FOR ANALYSIS PAGE (3 TABS)
// ============================================
function initAnalysisTabs() {
    $('#tab1Btn').on('click', function() {
        $(this).addClass('active');
        $('#tab2Btn, #tab3Btn').removeClass('active');
        $('#tab1Content').show();
        $('#tab2Content, #tab3Content').hide();
        
        setTimeout(() => {
            if (typeof RetailX.AgePrediction !== 'undefined') {
                RetailX.AgePrediction.init();
            }
        }, 100);
    });

    $('#tab2Btn').on('click', function() {
        $(this).addClass('active');
        $('#tab1Btn, #tab3Btn').removeClass('active');
        $('#tab2Content').show();
        $('#tab1Content, #tab3Content').hide();
        
        setTimeout(() => {
            if (typeof RetailX.AgeSegmentation !== 'undefined') {
                RetailX.AgeSegmentation.init();
            }
        }, 100);
    });

    $('#tab3Btn').on('click', function() {
        $(this).addClass('active');
        $('#tab1Btn, #tab2Btn').removeClass('active');
        $('#tab3Content').show();
        $('#tab1Content, #tab2Content').hide();
        
        setTimeout(() => {
            if (typeof RetailX.FestivalPrediction !== 'undefined') {
                RetailX.FestivalPrediction.init();
            }
        }, 100);
    });
}

// ============================================
// MODULE 2: Age Segmentation (Decision Tree)
// ============================================
RetailX.AgeSegmentation = {
    init: function() {
        console.log('📊 Initializing Age Segmentation Module (Decision Tree)...');
        this.bindEvents();
    },

    bindEvents: function() {
        $('#ageSegmentationForm').off('submit').on('submit', (e) => {
            e.preventDefault();
            this.analyzeAge();
        });

        $('#resetAnalysisBtn').off('click').on('click', () => {
            this.resetForm();
        });

        $('#customerAge').off('keypress').on('keypress', (e) => {
            if (e.which === 13) {
                e.preventDefault();
                $('#analyzeBtn').click();
            }
        });
    },

    analyzeAge: function() {
        const age = $('#customerAge').val().trim();
        
        if (!age) {
            RetailX.showToast('Please enter customer age', 'warning');
            $('#customerAge').focus();
            return;
        }

        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
            RetailX.showToast('Age must be between 18 and 100', 'warning');
            $('#customerAge').focus();
            return;
        }

        const btn = $('#analyzeBtn');
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Analyzing...');
        $('#analysisResults').hide();

        $.ajax({
            url: '/api/predict-age-segmentation/',
            method: 'POST',
            headers: { 'X-CSRFToken': getCSRFToken() },
            contentType: 'application/json',
            data: JSON.stringify({ age: ageNum }),
            success: (response) => {
                $('#segmentationAgeGroupResult').text(response.age_group);
                this.displayPreferences('products', response.products);
                this.displayPreferences('brands', response.brands);
                $('#analysisResults').fadeIn(500);
                RetailX.showToast(`Age group: ${response.age_group}`, 'success');
            },
            error: (xhr) => {
                const msg = xhr.responseJSON?.error || 'Analysis failed';
                RetailX.showToast(msg, 'error');
            },
            complete: () => {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Analyze Customer');
            }
        });
    },

    displayPreferences: function(type, data) {
        const container = type === 'products' ? $('#productsContainer') : $('#brandsContainer');
        const icon = type === 'products' ? 'fa-shopping-bag' : 'fa-tag';
        
        container.empty();
        
        if (!data || Object.keys(data).length === 0) {
            container.append('<div style="text-align: center; padding: 15px; color: #94a3b8;">No data available</div>');
            return;
        }

        Object.keys(data).sort().forEach(category => {
            container.append(`
                <div class="category-item">
                    <span class="category-name"><i class="fas ${icon}" style="margin-right: 6px; color: #4361ee;"></i>${category}</span>
                    <span class="category-value">${data[category]}</span>
                </div>
            `);
        });
    },

    resetForm: function() {
        $('#customerAge').val('');
        $('#analysisResults').fadeOut(300);
        $('#segmentationAgeGroupResult').text('-');
        $('#productsContainer, #brandsContainer').empty();
    }
};

// Initialize tabs when document is ready
$(document).ready(function() {
    initAnalysisTabs();
});

// Initialize modules when analysis page is opened via navigation
$(document).on('click', '.menu-item[data-page="analysis"]', function() {
    setTimeout(() => {
        if (typeof RetailX.AgePrediction !== 'undefined') {
            RetailX.AgePrediction.init();
        }
        if (typeof RetailX.AgeSegmentation !== 'undefined') {
            RetailX.AgeSegmentation.init();
        }
    }, 200);
});


// ============================================
// MODULE 3: Festival Sales Prediction (Prophet Model)
// ============================================
RetailX.FestivalPrediction = {
    // Chart instances
    topChart: null,
    leastChart: null,

    init: function() {
        console.log('📅 Initializing Festival Prediction Module...');
        this.bindEvents();
        this.checkExistingData();
    },

    bindEvents: function() {
        $('#festivalSearchForm').off('submit').on('submit', (e) => {
            e.preventDefault();
            this.predictFestival();
        });

        $('#festival_select').off('change').on('change', () => {
            $('#festival_date').val(''); // Clear date when festival selected
        });

        $('#festival_date').off('input').on('input', () => {
            $('#festival_select').val(''); // Clear festival when date entered
        });
    },

    checkExistingData: function() {
        // Check if we already have festival data from page load
        const festivalEl = document.getElementById('festival-detected-festival');
        if (festivalEl && festivalEl.dataset.festival) {
            console.log('🎉 Existing festival data found');
            this.showResults();
        }
    },

    predictFestival: function() {
        const festival = $('#festival_select').val();
        const date = $('#festival_date').val().trim();
        
        if (!festival && !date) {
            RetailX.showToast('Please select a festival or enter a date', 'warning');
            return;
        }

        // Set the hidden input value
        $('#festival_hidden').val(festival || date);

        const btn = $('#predictFestivalBtn');
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Predicting...');

        // Hide previous results
        $('#festivalResults, #festival-banner, #festival-charts').hide();
        $('#festivalEmptyState').show();

        // Get CSRF token
        const csrftoken = getCSRFToken();

        // Create form data
        const formData = new FormData();
        formData.append('festival', festival || '');
        formData.append('festival_date', date || '');
        formData.append('csrfmiddlewaretoken', csrftoken);

        // Send AJAX request
        $.ajax({
            url: window.location.pathname,
            method: 'GET',
            data: { festival: festival || date },
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: (response) => {
                console.log('✅ Festival prediction received:', response);
                
                // Update hidden data elements
                $('#festival-top-products-data').data('products', response.top_products || []);
                $('#festival-least-products-data').data('products', response.least_products || []);
                $('#festival-detected-festival').data('festival', response.detected_festival || '');
                
                // Update display
                if (response.detected_festival) {
                    $('#festival-name-display').text(response.detected_festival);
                    $('#festival-banner').show();
                    
                    // Initialize charts with the data
                    this.createFestivalCharts(
                        response.top_products || [],
                        response.least_products || [],
                        response.detected_festival
                    );
                    
                    $('#festival-charts').show();
                    $('#festivalResults').show();
                    $('#festivalEmptyState').hide();
                    
                    RetailX.showToast(`Prediction for ${response.detected_festival}`, 'success');
                } else {
                    $('#festivalEmptyState').show();
                    RetailX.showToast('No prediction data available', 'info');
                }
            },
            error: (xhr) => {
                console.error('❌ Festival prediction failed:', xhr);
                RetailX.showToast(xhr.responseJSON?.error || 'Prediction failed', 'error');
            },
            complete: () => {
                btn.prop('disabled', false).html('<i class="fas fa-search"></i> Predict Festival Sales');
            }
        });
    },

    createFestivalCharts: function(topProducts, leastProducts, festivalName) {
        console.log('📊 Creating festival charts:', { topProducts, leastProducts });
        
        // Destroy existing charts
        if (this.topChart) this.topChart.destroy();
        if (this.leastChart) this.leastChart.destroy();
        
        // Format data
        const formattedTop = this.formatChartData(topProducts);
        const formattedLeast = this.formatChartData(leastProducts);
        
        // Create top products chart
        if (formattedTop.length > 0) {
            this.topChart = this.createHorizontalBarChart(
                'festivalTopSellingChart',
                formattedTop,
                '#e67e22',
                'Expected Units'
            );
        }
        
        // Create least products chart
        if (formattedLeast.length > 0) {
            this.leastChart = this.createHorizontalBarChart(
                'festivalLeastSellingChart',
                formattedLeast,
                '#3498db',
                'Expected Units'
            );
        }
    },

    formatChartData: function(products) {
        if (!products || !Array.isArray(products)) return [];
        
        return products.map(item => ({
            product: item.product || 'Unknown',
            units: parseFloat(item.predicted_sales) || 0
        })).filter(item => item.units > 0);
    },

    createHorizontalBarChart: function(canvasId, data, color, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
        // Sort by units descending
        const sortedData = [...data].sort((a, b) => b.units - a.units);
        
        // Truncate long names
        const labels = sortedData.map(item => {
            return item.product.length > 25 
                ? item.product.substring(0, 22) + '...' 
                : item.product;
        });
        
        const values = sortedData.map(item => item.units);
        
        // Create gradient colors
        const backgroundColors = values.map((val, idx) => {
            const opacity = 0.8 - (idx * 0.05);
            return color.replace('#', `rgba(${this.hexToRgb(color)}, ${Math.max(opacity, 0.3)})`);
        });
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: color,
                    borderWidth: 1,
                    borderRadius: 5,
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
                            label: (context) => {
                                const item = sortedData[context.dataIndex];
                                return `${item.product}: ${context.raw.toLocaleString()} units`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        title: {
                            display: true,
                            text: 'Expected Units',
                            color: '#666',
                            font: { size: 11 }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                }
            }
        });
    },

    hexToRgb: function(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    },

    resetForm: function() {
        $('#festival_select').val('');
        $('#festival_date').val('');
        $('#festival_hidden').val('');
        $('#festivalResults').hide();
        $('#festival-banner').hide();
        $('#festival-charts').hide();
        $('#festivalEmptyState').show();
        
        if (this.topChart) this.topChart.destroy();
        if (this.leastChart) this.leastChart.destroy();
    }
};

// Initialize tabs when document is ready
$(document).ready(function() {
    initAnalysisTabs();
    
    if ($('#analysis-page').hasClass('active')) {
        setTimeout(() => {
            if (typeof RetailX.AgePrediction !== 'undefined') {
                RetailX.AgePrediction.init();
            }
            if (typeof RetailX.AgeSegmentation !== 'undefined') {
                RetailX.AgeSegmentation.init();
            }
            if (typeof RetailX.FestivalPrediction !== 'undefined') {
                RetailX.FestivalPrediction.init();
            }
        }, 500);
    }
});


// Initialize modules when analysis page is opened
$(document).on('click', '.menu-item[data-page="analysis"]', function() {
    setTimeout(() => {
        if (typeof RetailX.AgePrediction !== 'undefined') {
            RetailX.AgePrediction.init();
        }
        if (typeof RetailX.AgeSegmentation !== 'undefined') {
            RetailX.AgeSegmentation.init();
        }
        if (typeof RetailX.FestivalPrediction !== 'undefined') {
            RetailX.FestivalPrediction.init();
        }
    }, 200);
});

// ============================================
// SUPPLIER CONNECTIVITY MODULE - WITH EXPANDABLE CHAT
// ============================================

RetailX.SupplierConnectivity = {
    // Static supplier database
    suppliers: [
        {
            id: 1,
            name: "Shree Enterprises",
            location: "Khamgaon",
            distance: 2.5,
            rating: 4.8,
            reviews: 156,
            verified: true,
            products: ["Whole Wheat Bread", "White Rice", "Toor Dal"],
            avatar: "SE",
            phone: "+91 98765 43210",
            responseTime: "< 1 hour"
        },
        {
            id: 2,
            name: "Krishna Dairy Farm",
            location: "Akola",
            distance: 15.8,
            rating: 4.9,
            reviews: 342,
            verified: true,
            products: ["Whole Milk", "Paneer", "Curd"],
            avatar: "KD",
            phone: "+91 98765 43211",
            responseTime: "< 30 mins"
        },
        {
            id: 3,
            name: "Green Valley Farms",
            location: "Buldhana",
            distance: 8.2,
            rating: 4.7,
            reviews: 89,
            verified: true,
            products: ["Tomatoes", "Onions", "Potatoes"],
            avatar: "GV",
            phone: "+91 98765 43212",
            responseTime: "< 2 hours"
        },
        {
            id: 4,
            name: "Fresh Fruits Hub",
            location: "Shegaon",
            distance: 5.3,
            rating: 4.6,
            reviews: 67,
            verified: false,
            products: ["Bananas", "Apples", "Oranges"],
            avatar: "FF",
            phone: "+91 98765 43213",
            responseTime: "< 3 hours"
        }
    ],

    locations: ["Khamgaon", "Akola", "Buldhana", "Shegaon", "Amravati", "Nagpur"],
    currentChatSupplier: null,
    chatMessages: {},
    isChatExpanded: false,

    init: function() {
        console.log('🚚 Initializing Supplier Connectivity...');
        this.bindEvents();
        this.initializeLocationAutocomplete();
    },

    bindEvents: function() {
        $('#findSuppliersBtn').off('click').on('click', (e) => {
            e.preventDefault();
            this.findSuppliers();
        });

        $('.quick-location-tag').off('click').on('click', (e) => {
            const location = $(e.currentTarget).data('location');
            $('#supplierLocation').val(location);
            this.findSuppliers();
        });

        $('.filter-chip').off('click').on('click', (e) => {
            $('.filter-chip').removeClass('active');
            $(e.currentTarget).addClass('active');
            this.filterSuppliers($(e.currentTarget).data('filter'));
        });

        $('#resetSearchBtn').off('click').on('click', () => {
            this.resetSearch();
        });

        $('#viewAllSuppliersBtn').off('click').on('click', () => {
            this.showAllSuppliers();
        });

        // Send message
        $('#sendMessageBtn').off('click').on('click', () => {
            this.sendChatMessage();
        });

        $('#chatInput').off('keypress').on('keypress', (e) => {
            if (e.which === 13) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });

        // Quick replies
        $('.quick-reply-chip').off('click').on('click', (e) => {
            const message = $(e.currentTarget).text();
            $('#chatInput').val(message);
            this.sendChatMessage();
        });

        // Back to suppliers (minimize chat)
        $('#backToSuppliersBtn').off('click').on('click', () => {
            this.minimizeChat();
        });

        // Minimize chat button
        $('#minimizeChatBtn').off('click').on('click', () => {
            this.minimizeChat();
        });
    },

    initializeLocationAutocomplete: function() {
        const input = $('#supplierLocation');
        const suggestions = $('#locationSuggestions');

        input.off('input').on('input', () => {
            const value = input.val().toLowerCase();
            if (value.length < 1) {
                suggestions.removeClass('show');
                return;
            }

            const matches = this.locations.filter(loc => 
                loc.toLowerCase().includes(value)
            ).slice(0, 5);

            if (matches.length > 0) {
                suggestions.empty();
                matches.forEach(loc => {
                    suggestions.append(`
                        <div class="location-suggestion-item" data-location="${loc}">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${loc}</span>
                        </div>
                    `);
                });
                suggestions.addClass('show');
            }
        });

        $(document).off('click', '.location-suggestion-item').on('click', '.location-suggestion-item', (e) => {
            const location = $(e.currentTarget).data('location');
            input.val(location);
            suggestions.removeClass('show');
            this.findSuppliers();
        });
    },

    findSuppliers: function() {
        const product = $('#supplierProductSelect').val();
        const location = $('#supplierLocation').val().trim();

        if (!product || !location) {
            RetailX.showToast('Please select product and location', 'warning');
            return;
        }

        $('#suppliersGrid').html('<div class="loading-spinner"></div>');

        setTimeout(() => {
            let filteredSuppliers = this.suppliers.filter(supplier => 
                supplier.products.includes(product) && 
                supplier.location.toLowerCase() === location.toLowerCase()
            );

            filteredSuppliers.sort((a, b) => a.distance - b.distance);

            if (filteredSuppliers.length > 0) {
                this.displaySuppliers(filteredSuppliers);
                $('#supplierCount').text(filteredSuppliers.length);
                $('#noResultsState').hide();
            } else {
                $('#suppliersGrid').empty();
                $('#noResultsState').show();
            }
        }, 800);
    },

    displaySuppliers: function(suppliers) {
        const grid = $('#suppliersGrid');
        grid.empty();

        suppliers.forEach(supplier => {
            const stars = '★'.repeat(Math.floor(supplier.rating)) + '☆'.repeat(5 - Math.floor(supplier.rating));
            
            const card = `
                <div class="supplier-card" data-supplier-id="${supplier.id}" onclick="RetailX.SupplierConnectivity.selectSupplier(${supplier.id})">
                    <div class="supplier-card-header">
                        <div class="supplier-avatar-large">
                            <img src="https://ui-avatars.com/api/?name=${supplier.avatar}&background=25D366&color=fff&size=50" alt="${supplier.name}">
                        </div>
                        <div class="supplier-info">
                            <h4>${supplier.name}</h4>
                            <div class="supplier-rating">
                                <span class="stars">${stars}</span>
                                <span class="rating-count">(${supplier.reviews})</span>
                            </div>
                            <div class="supplier-location">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${supplier.location} • ${supplier.distance} km</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="supplier-details">
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${supplier.responseTime}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-star"></i>
                            <span>${supplier.rating}</span>
                        </div>
                    </div>

                    <div class="supplier-actions">
                        <button class="dm-btn" onclick="event.stopPropagation(); RetailX.SupplierConnectivity.openChat(${supplier.id})">
                            <i class="fas fa-comment-dots"></i> DM Supplier
                        </button>
                        <button class="contact-btn" onclick="event.stopPropagation(); RetailX.SupplierConnectivity.contactSupplier(${supplier.id})">
                            <i class="fas fa-phone-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            
            grid.append(card);
        });

        $('#noResultsState').hide();
    },

    selectSupplier: function(supplierId) {
        $('.supplier-card').removeClass('active');
        $(`.supplier-card[data-supplier-id="${supplierId}"]`).addClass('active');
    },

    openChat: function(supplierId) {
        const supplier = this.suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        this.currentChatSupplier = supplier;
        this.selectSupplier(supplierId);

        // Initialize chat for this supplier if not exists
        if (!this.chatMessages[supplierId]) {
            this.chatMessages[supplierId] = [
                {
                    type: 'received',
                    content: 'Hello! How can I help you with your order today?',
                    time: 'Just now',
                    sender: supplier.name
                }
            ];
        }

        // Update chat header
        $('#chatSupplierName').text(supplier.name);
        $('#chatSupplierLocation').text(supplier.location);
        $('#chatAvatar').attr('src', 
            `https://ui-avatars.com/api/?name=${supplier.avatar}&background=25D366&color=fff&size=44`
        );

        // Show chat section and expand it
        $('#chatSection').show();
        this.expandChat();
        
        // Render messages
        this.renderChatMessages(supplierId);
    },

    expandChat: function() {
        this.isChatExpanded = true;
        $('.supplier-split-view').addClass('chat-expanded');
        $('#suppliersListSection').addClass('minimized');
        
        // Scroll to show chat on mobile
        if ($(window).width() <= 768) {
            $('html, body').animate({
                scrollTop: $('#chatSection').offset().top - 100
            }, 500);
        }
    },

    minimizeChat: function() {
        this.isChatExpanded = false;
        $('.supplier-split-view').removeClass('chat-expanded');
        $('#suppliersListSection').removeClass('minimized');
        $('#chatSection').hide();
        $('.supplier-card').removeClass('active');
        this.currentChatSupplier = null;
    },

    renderChatMessages: function(supplierId) {
        const messages = this.chatMessages[supplierId] || [];
        const container = $('#chatMessages');
        container.empty();

        messages.forEach(msg => {
            if (msg.type === 'received') {
                container.append(`
                    <div class="message-whatsapp received">
                        <div class="message-bubble">
                            <div class="message-sender">${msg.sender}</div>
                            <div class="message-text">${this.escapeHtml(msg.content)}</div>
                            <div class="message-time">${msg.time}</div>
                        </div>
                    </div>
                `);
            } else {
                container.append(`
                    <div class="message-whatsapp sent">
                        <div class="message-bubble">
                            <div class="message-text">${this.escapeHtml(msg.content)}</div>
                            <div class="message-time">${msg.time}</div>
                        </div>
                    </div>
                `);
            }
        });

        container.scrollTop(container[0].scrollHeight);
    },

    sendChatMessage: function() {
        if (!this.currentChatSupplier) {
            RetailX.showToast('Please select a supplier first', 'warning');
            return;
        }

        const input = $('#chatInput');
        const message = input.val().trim();

        if (!message) return;

        const supplierId = this.currentChatSupplier.id;

        // Add user message
        this.chatMessages[supplierId].push({
            type: 'sent',
            content: message,
            time: 'Just now',
            sender: 'You'
        });

        this.renderChatMessages(supplierId);
        input.val('');

        // Show typing indicator
        $('#chatMessages').append(`
            <div class="typing-indicator-whatsapp">
                <span></span><span></span><span></span>
            </div>
        `);
        $('#chatMessages').scrollTop($('#chatMessages')[0].scrollHeight);

        // Simulate reply
        setTimeout(() => {
            $('.typing-indicator-whatsapp').remove();

            const replies = [
                "Sure, I'll check availability and get back to you.",
                "Yes, we have that in stock. Would you like to place an order?",
                "We can deliver by tomorrow morning.",
                "The price is ₹45 per unit. Minimum order is ₹1000.",
                "Great choice! I'll send you the details."
            ];
            
            const randomReply = replies[Math.floor(Math.random() * replies.length)];

            this.chatMessages[supplierId].push({
                type: 'received',
                content: randomReply,
                time: 'Just now',
                sender: this.currentChatSupplier.name
            });

            this.renderChatMessages(supplierId);
        }, 2000);
    },

    filterSuppliers: function(filter) {
        const cards = $('.supplier-card');
        
        if (filter === 'all') {
            cards.show();
        } else if (filter === 'nearby') {
            cards.each(function() {
                const distanceText = $(this).find('.supplier-location span').text();
                const distance = parseFloat(distanceText.split('•')[1]?.replace('km', '').trim() || 10);
                $(this).toggle(distance <= 5);
            });
        } else if (filter === 'verified') {
            cards.each(function() {
                $(this).toggle($(this).hasClass('verified'));
            });
        }
    },

    showAllSuppliers: function() {
        $('#supplierProductSelect').val('');
        $('#supplierLocation').val('Khamgaon');
        this.displaySuppliers(this.suppliers);
        $('#supplierCount').text(this.suppliers.length);
        $('#noResultsState').hide();
    },

    resetSearch: function() {
        $('#supplierProductSelect').val('');
        $('#supplierLocation').val('');
        $('#suppliersGrid').empty();
        $('#noResultsState').hide();
        this.minimizeChat();
    },

    contactSupplier: function(supplierId) {
        const supplier = this.suppliers.find(s => s.id === supplierId);
        if (supplier) {
            RetailX.showToast(`Calling ${supplier.name}...`, 'info');
        }
    },

    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize module
$(document).ready(function() {
    // Replace menu item
    $('.menu-item[data-page="overview"]').attr('data-page', 'supplier');
    $('.menu-item[data-page="supplier"] span').text('Supplier Connectivity');
    
    // Initialize when page opens
    $(document).on('click', '.menu-item[data-page="supplier"]', function() {
        setTimeout(() => {
            if (typeof RetailX.SupplierConnectivity !== 'undefined') {
                RetailX.SupplierConnectivity.init();
                // Show default suppliers
                RetailX.SupplierConnectivity.showAllSuppliers();
            }
        }, 200);
    });
});

// ============================================
// REPORTS MODULE - ADVANCED ANALYTICS DASHBOARD
// ============================================

RetailX.Reports = {
    // Data storage
    lowStockProducts: [],
    topProducts: [],
    bottomProducts: [],
    suppliers: [],
    charts: {},
    insightInterval: null,
    
    init: function() {
        console.log('📊 Initializing Advanced Reports Module...');
        this.loadData();
        this.bindEvents();
        this.initCounters();
        this.initCharts();
        this.startInsightCarousel();
        this.initDatePicker();
    },
    
    loadData: function() {
        this.loadLowStockData();
        this.loadProductPerformance();
        this.loadSupplierData();
    },
    
    bindEvents: function() {
        // Tab switching
        $('.tab-btn-small').off('click').on('click', (e) => {
            const tab = $(e.currentTarget).data('tab');
            $('.tab-btn-small').removeClass('active');
            $(e.currentTarget).addClass('active');
            
            if (tab === 'top') {
                $('#topProductsTab').addClass('active');
                $('#bottomProductsTab').removeClass('active');
            } else {
                $('#topProductsTab').removeClass('active');
                $('#bottomProductsTab').addClass('active');
            }
        });
        
        // Period selector
        $('#plPeriod').off('change').on('change', (e) => {
            this.updateProfitLoss(e.target.value);
        });
        
        // Carousel dots
        $('.dot').off('click').on('click', (e) => {
            const index = $(e.currentTarget).index();
            this.showInsight(index);
        });
        
        // Schedule report button
        $('[onclick="RetailX.Reports.scheduleReport()"]').off('click').on('click', (e) => {
            e.preventDefault();
            this.scheduleReport();
        });
        
        // Generate report buttons
        $('[onclick^="RetailX.Reports.generateReport"]').off('click').on('click', (e) => {
            e.preventDefault();
            const type = $(e.currentTarget).attr('onclick').match(/'([^']+)'/)[1];
            this.generateReport(type);
        });
        
        // Modal close
        $('.modal-close').off('click').on('click', () => {
            $('.modal').fadeOut(300);
        });
        
        // Schedule form submit
        $('#scheduleForm').off('submit').on('submit', (e) => {
            e.preventDefault();
            this.saveSchedule();
        });
    },
    
    initCounters: function() {
        $('.kpi-value[data-target]').each(function() {
            const $this = $(this);
            const target = parseInt($this.data('target'));
            const isCurrency = $this.text().includes('₹');
            
            $this.prop('Counter', 0).animate({
                Counter: target
            }, {
                duration: 2000,
                step: (now) => {
                    if (isCurrency) {
                        $this.text('₹' + Math.ceil(now).toLocaleString());
                    } else {
                        $this.text(Math.ceil(now).toLocaleString());
                    }
                }
            });
        });
    },
    
    initCharts: function() {
        // Profit & Loss Mini Chart
        const plCtx = document.getElementById('plMiniChart')?.getContext('2d');
        if (plCtx) {
            this.charts.pl = new Chart(plCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        data: [42500, 47800, 51200, 48900, 61000, 84500, 73200],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    },
                    elements: { line: { tension: 0.4 } }
                }
            });
        }
        
        // Health Gauge
        this.createHealthGauge();
    },
    
    createHealthGauge: function() {
        const canvas = document.getElementById('healthGauge');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const value = 82; // Health percentage
        
        // Draw gauge background
        ctx.beginPath();
        ctx.arc(100, 80, 70, 0.8 * Math.PI, 2.2 * Math.PI);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 15;
        ctx.stroke();
        
        // Draw gauge value
        ctx.beginPath();
        ctx.arc(100, 80, 70, 0.8 * Math.PI, 0.8 * Math.PI + (1.4 * Math.PI * value / 100));
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 15;
        ctx.stroke();
        
        // Add gradient
        const gradient = ctx.createLinearGradient(0, 0, 200, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#059669');
        
        this.charts.gauge = { value };
    },
    
    loadLowStockData: function() {
        // Simulated data - replace with actual API call
        this.lowStockProducts = [
            { name: 'Whole Wheat Bread', quantity: 5, threshold: 10, category: 'Bakery', supplier: 'Shree Enterprises', supplierId: 1, price: 45 },
            { name: 'Paneer', quantity: 2, threshold: 15, category: 'Dairy', supplier: 'Krishna Dairy Farm', supplierId: 2, price: 60 },
            { name: 'Tomatoes', quantity: 8, threshold: 20, category: 'Vegetables', supplier: 'Green Valley Farms', supplierId: 3, price: 40 },
            { name: 'White Rice', quantity: 3, threshold: 25, category: 'Grains', supplier: 'Shree Enterprises', supplierId: 1, price: 220 },
            { name: 'Milk', quantity: 12, threshold: 30, category: 'Dairy', supplier: 'Krishna Dairy Farm', supplierId: 2, price: 28 }
        ];
        
        this.renderLowStock();
        this.calculateRestockCost();
    },
    
    renderLowStock: function() {
        const container = $('#lowStockList');
        container.empty();
        
        $('#lowStockCount').text(this.lowStockProducts.length);
        
        this.lowStockProducts.forEach((product, index) => {
            const status = product.quantity <= 5 ? 'critical' : 'warning';
            const needs = product.threshold - product.quantity;
            
            const item = `
                <div class="low-stock-item ${status}" style="animation: slideIn 0.3s ease ${index * 0.1}s forwards; opacity: 0;">
                    <div class="product-info">
                        <div class="product-icon ${status}">
                            <i class="fas fa-${product.category === 'Dairy' ? 'cheese' : 'box'}"></i>
                        </div>
                        <div class="product-details">
                            <h4>${product.name}</h4>
                            <p>${product.category}</p>
                        </div>
                    </div>
                    <div class="stock-badge ${status}">${product.quantity} left</div>
                    <div class="supplier-suggest">
                        <i class="fas fa-truck"></i>
                        <span>${product.supplier}</span>
                        <button class="order-now-btn" onclick="RetailX.Reports.orderFromSupplier(${product.supplierId}, '${product.name}', ${needs})">
                            Order ${needs}
                        </button>
                    </div>
                </div>
            `;
            
            container.append(item);
        });
    },
    
    calculateRestockCost: function() {
        const total = this.lowStockProducts.reduce((sum, product) => {
            const needs = product.threshold - product.quantity;
            return sum + (needs * product.price);
        }, 0);
        
        $('#restockCost').text(total.toLocaleString());
    },
    
    loadProductPerformance: function() {
        // Simulated data
        this.topProducts = [
            { name: 'Whole Wheat Bread', category: 'Bakery', sales: 1245, revenue: 56025, rank: 1 },
            { name: 'Milk', category: 'Dairy', sales: 982, revenue: 27496, rank: 2 },
            { name: 'Tomatoes', category: 'Vegetables', sales: 856, revenue: 34240, rank: 3 },
            { name: 'Paneer', category: 'Dairy', sales: 743, revenue: 44580, rank: 4 },
            { name: 'Bananas', category: 'Fruits', sales: 712, revenue: 25632, rank: 5 }
        ];
        
        this.bottomProducts = [
            { name: 'Spices Pack', category: 'Pantry', sales: 23, revenue: 2300, rank: 10 },
            { name: 'Imported Cheese', category: 'Dairy', sales: 18, revenue: 1620, rank: 9 },
            { name: 'Organic Rice', category: 'Grains', sales: 15, revenue: 3300, rank: 8 },
            { name: 'Gourmet Coffee', category: 'Beverages', sales: 12, revenue: 3600, rank: 7 },
            { name: 'Exotic Fruits', category: 'Fruits', sales: 8, revenue: 960, rank: 6 }
        ];
        
        this.renderTopProducts();
        this.renderBottomProducts();
    },
    
    renderTopProducts: function() {
        const container = $('#topProductsList');
        container.empty();
        
        this.topProducts.forEach((product, index) => {
            const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : 'other';
            
            const item = `
                <div class="product-rank-item" style="animation: slideIn 0.3s ease ${index * 0.1}s forwards; opacity: 0;">
                    <div class="rank ${rankClass}">${index + 1}</div>
                    <div class="product-details">
                        <div class="product-name">${product.name}</div>
                        <div class="product-meta">${product.category}</div>
                    </div>
                    <div class="sales-value">₹${product.revenue.toLocaleString()}</div>
                </div>
            `;
            
            container.append(item);
        });
    },
    
    renderBottomProducts: function() {
        const container = $('#bottomProductsList');
        container.empty();
        
        this.bottomProducts.forEach((product, index) => {
            const item = `
                <div class="product-rank-item" style="animation: slideIn 0.3s ease ${index * 0.1}s forwards; opacity: 0;">
                    <div class="rank other">${index + 1}</div>
                    <div class="product-details">
                        <div class="product-name">${product.name}</div>
                        <div class="product-meta">${product.category}</div>
                    </div>
                    <div class="sales-value bottom">₹${product.revenue.toLocaleString()}</div>
                </div>
            `;
            
            container.append(item);
        });
    },
    
    loadSupplierData: function() {
        const container = $('#supplierScoreList');
        container.empty();
        
        const suppliers = [
            { name: 'Shree Enterprises', avatar: 'SE', response: '15 min', reliability: 98, score: 4.9 },
            { name: 'Krishna Dairy', avatar: 'KD', response: '25 min', reliability: 96, score: 4.8 },
            { name: 'Green Valley', avatar: 'GV', response: '45 min', reliability: 92, score: 4.6 },
            { name: 'Fresh Fruits', avatar: 'FF', response: '60 min', reliability: 88, score: 4.4 }
        ];
        
        suppliers.forEach((supplier, index) => {
            const scoreClass = supplier.score >= 4.8 ? 'high' : supplier.score >= 4.5 ? 'medium' : '';
            
            const item = `
                <div class="supplier-score-item" style="animation: slideIn 0.3s ease ${index * 0.1}s forwards; opacity: 0;">
                    <div class="supplier-avatar-mini">${supplier.avatar}</div>
                    <div class="supplier-score-info">
                        <h4>${supplier.name}</h4>
                        <p><i class="fas fa-circle"></i> Response: ${supplier.response}</p>
                    </div>
                    <div class="score-badge ${scoreClass}">${supplier.score}</div>
                </div>
            `;
            
            container.append(item);
        });
    },
    
    updateProfitLoss: function(period) {
        // Simulated data update
        const data = {
            daily: { revenue: 22450, cogs: 14200, expenses: 2800, margin: 24 },
            weekly: { revenue: 156780, cogs: 98450, expenses: 12500, margin: 29 },
            monthly: { revenue: 628000, cogs: 398000, expenses: 52000, margin: 28 }
        };
        
        const d = data[period];
        const gross = d.revenue - d.cogs;
        const net = gross - d.expenses;
        
        $('#plRevenue').text(d.revenue.toLocaleString());
        $('#plCogs').text(d.cogs.toLocaleString());
        $('#plGross').text(gross.toLocaleString());
        $('#plExpenses').text(d.expenses.toLocaleString());
        $('#plNet').text(net.toLocaleString());
        
        $('.margin-fill').css('width', d.margin + '%');
        
        // Animate numbers
        $('.pl-summary strong').each(function() {
            const $this = $(this);
            const text = $this.text();
            const value = parseInt(text.replace(/[^0-9]/g, ''));
            
            $this.prop('Counter', 0).animate({
                Counter: value
            }, {
                duration: 1000,
                step: (now) => {
                    $this.text('₹' + Math.ceil(now).toLocaleString());
                }
            });
        });
    },
    
    startInsightCarousel: function() {
        let currentIndex = 0;
        const items = $('.insight-item');
        const dots = $('.dot');
        
        this.insightInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % items.length;
            this.showInsight(currentIndex);
        }, 5000);
    },
    
    showInsight: function(index) {
        $('.insight-item').removeClass('active');
        $('.insight-item').eq(index).addClass('active');
        $('.dot').removeClass('active');
        $('.dot').eq(index).addClass('active');
    },
    
    initDatePicker: function() {
        // Simple date picker simulation
        $('#dateRangePicker').on('click', function() {
            RetailX.showToast('Date range selector coming soon!', 'info');
        });
    },
    
    // Report generation functions
    generateReport: function(type) {
        $('#reportGenerationModal').fadeIn(300).css('display', 'flex');
        
        // Simulate report generation
        setTimeout(() => {
            $('.preview-loading').hide();
            $('.preview-complete').fadeIn(300);
        }, 2000);
    },
    
    scheduleReport: function() {
        $('#scheduleModal').fadeIn(300).css('display', 'flex');
    },
    
    saveSchedule: function() {
        RetailX.showToast('Report scheduled successfully!', 'success');
        $('#scheduleModal').fadeOut(300);
    },
    
    orderFromSupplier: function(supplierId, productName, quantity) {
        RetailX.showToast(`Order placed for ${quantity} units of ${productName}`, 'success');
        
        // Open supplier chat if available
        if (typeof RetailX.SupplierConnectivity !== 'undefined') {
            RetailX.SupplierConnectivity.openChat(supplierId);
        }
    },
    
    refreshLowStock: function() {
        RetailX.showToast('Refreshing low stock data...', 'info');
        this.loadLowStockData();
    },
    
    exportLowStock: function() {
        this.exportToCSV(this.lowStockProducts, 'low_stock_report');
    },
    
    exportToCSV: function(data, filename) {
        // CSV export logic
        RetailX.showToast('Report exported successfully!', 'success');
    },
    
    viewAllLowStock: function(e) {
        e?.preventDefault();
        RetailX.showToast('Viewing all low stock products', 'info');
    }
};

// Initialize when reports page is opened
$(document).on('click', '.menu-item[data-page="reports"]', function() {
    setTimeout(() => {
        if (typeof RetailX.Reports !== 'undefined') {
            RetailX.Reports.init();
        }
    }, 200);
});

// Inventory Value Management
const InventoryManager = {
    // Cache DOM elements
    inventoryValueElement: document.getElementById('inventoryValue'),
    inventoryTrendElement: document.querySelector('#inventoryTrend'),
    
    // Initialize
    init: function() {
        this.fetchInventoryValue();
        // Set up auto-refresh every 5 minutes
        setInterval(() => this.fetchInventoryValue(), 5 * 60 * 1000);
    },
    
    // Fetch inventory value from API
    fetchInventoryValue: function() {
        // Show loading state
        if (this.inventoryValueElement) {
            this.inventoryValueElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        fetch('/api/inventory-value/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cache-Control': 'no-cache'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                this.updateInventoryValue(data);
            } else {
                console.error('Failed to fetch inventory value:', data.error);
                this.showError();
            }
        })
        .catch(error => {
            console.error('Error fetching inventory value:', error);
            this.showError();
        });
    },
    
    // Update UI with new inventory value
    updateInventoryValue: function(data) {
        if (this.inventoryValueElement) {
            // Add animation class
            this.inventoryValueElement.classList.add('value-updated');
            this.inventoryValueElement.textContent = data.formatted_value || `₹${data.total_inventory_value.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            // Remove animation class after animation completes
            setTimeout(() => {
                this.inventoryValueElement.classList.remove('value-updated');
            }, 500);
        }
        
        // Update trend text if exists
        if (this.inventoryTrendElement) {
            // You could add a comparison with previous value here
            // For now, just show the raw number
            const countElement = document.getElementById('inventoryCount');
            if (countElement) {
                // Keep the count as is or update it
            }
        }
        
        // Also update any other places showing inventory value
        this.updateOtherInstances(data);
    },
    
    // Update other places that might show inventory value
    updateOtherInstances: function(data) {
        // Update in reports page if visible
        const healthStockValue = document.getElementById('healthStockValue');
        if (healthStockValue) {
            healthStockValue.textContent = data.formatted_value || `₹${(data.total_inventory_value/1000).toFixed(1)}k`;
        }
        
        // Update in any other cards
        const inventoryValueCards = document.querySelectorAll('.inventory-value-display');
        inventoryValueCards.forEach(card => {
            card.textContent = data.formatted_value || `₹${data.total_inventory_value.toFixed(2)}`;
        });
    },
    
    // Show error state
    showError: function() {
        if (this.inventoryValueElement) {
            this.inventoryValueElement.innerHTML = '₹<span class="error-text">Error</span>';
            this.inventoryValueElement.classList.add('text-danger');
        }
    },
    
    // Manually refresh
    refresh: function() {
        this.fetchInventoryValue();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    InventoryManager.init();
});

// Add refresh button handler if exists
document.getElementById('refreshBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    InventoryManager.refresh();
    
    // Show toast notification
    showToast('Refreshing inventory value...', 'info');
});

// Toast notification helper
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }
}