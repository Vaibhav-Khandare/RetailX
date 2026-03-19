// ============================================
// RETAILX - MANAGER CHAT MODULE (REAL DATABASE)
// ============================================

console.log('📱 Loading Manager Chat Module...');

// Make sure RetailX namespace exists
window.RetailX = window.RetailX || {};

RetailX.ManagerChat = {
    // Variables
    suppliers: [],
    currentChatSupplier: null,
    currentChatRoomId: null,
    messagePollingInterval: null,
    isChatExpanded: false,
    chatMessages: {},
    
    // Initialize
    init: function() {
        console.log('🚀 Initializing Manager Chat with Real Database...');
        this.bindEvents();
        this.loadRealSuppliers();
    },
    
    // Bind all events
    bindEvents: function() {
        console.log('🔗 Binding chat events...');
        
        // Find suppliers button
        $('#findSuppliersBtn').off('click').on('click', (e) => {
            e.preventDefault();
            this.findSuppliers();
        });
        
        // Quick location tags
        $('.quick-location-tag').off('click').on('click', (e) => {
            const location = $(e.currentTarget).data('location');
            $('#supplierLocation').val(location);
            this.findSuppliers();
        });
        
        // Filter chips
        $('.filter-chip').off('click').on('click', (e) => {
            $('.filter-chip').removeClass('active');
            $(e.currentTarget).addClass('active');
            this.filterSuppliers($(e.currentTarget).data('filter'));
        });
        
        // Reset search
        $('#resetSearchBtn').off('click').on('click', () => {
            this.resetSearch();
        });
        
        // View all suppliers
        $('#viewAllSuppliersBtn').off('click').on('click', () => {
            this.showAllSuppliers();
        });
        
        // Send message
        $('#sendMessageBtn').off('click').on('click', () => {
            this.sendChatMessage();
        });
        
        // Enter key in chat input
        $('#chatInput').off('keypress').on('keypress', (e) => {
            if (e.which === 13) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });
        
        // Quick reply chips
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
        
        // Location suggestions
        $('#supplierLocation').off('input').on('input', () => {
            this.showLocationSuggestions();
        });
    },
    
    // ========== SUPPLIER DATA ==========
    
    // Load real suppliers from database
    loadRealSuppliers: function() {
        console.log('📡 Loading suppliers from database...');
        
        $('#suppliersGrid').html(`
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 15px; color: #64748b;">Loading suppliers...</p>
            </div>
        `);
        
        $.ajax({
            url: '/api/suppliers-for-manager/',
            method: 'GET',
            timeout: 10000,
            success: (response) => {
                console.log('✅ Suppliers loaded:', response);
                
                if (response.success && response.suppliers) {
                    this.suppliers = response.suppliers;
                    this.displaySuppliers(this.suppliers);
                    $('#supplierCount').text(this.suppliers.length);
                    
                    // Show success message
                    RetailX.showToast(`Loaded ${this.suppliers.length} suppliers`, 'success');
                } else {
                    this.showNoResults('No suppliers found in database');
                }
            },
            error: (xhr) => {
                console.error('❌ Failed to load suppliers:', xhr);
                this.showNoResults('Failed to load suppliers. Please refresh.');
                RetailX.showToast('Failed to load suppliers', 'error');
            }
        });
    },
    
    // Find suppliers by product and location
    findSuppliers: function() {
        const product = $('#supplierProductSelect').val();
        const location = $('#supplierLocation').val().trim();
        
        if (!product || !location) {
            RetailX.showToast('Please select product and location', 'warning');
            return;
        }
        
        console.log(`🔍 Finding suppliers for product: ${product}, location: ${location}`);
        
        $('#suppliersGrid').html(`
            <div style="grid-column: 1/-1; text-align: center; padding: 30px;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 15px;">Searching suppliers...</p>
            </div>
        `);
        
        // Filter from loaded suppliers
        setTimeout(() => {
            const filtered = this.suppliers.filter(s => {
                // Match by category (product) and location
                const categoryMatch = s.category && 
                    s.category.toLowerCase().includes(product.toLowerCase());
                const locationMatch = s.location && 
                    s.location.toLowerCase() === location.toLowerCase();
                
                return categoryMatch && locationMatch;
            });
            
            console.log(`Found ${filtered.length} matching suppliers`);
            
            if (filtered.length > 0) {
                this.displaySuppliers(filtered);
                $('#supplierCount').text(filtered.length);
                $('#noResultsState').hide();
                
                // Highlight search criteria
                $('#supplierProductSelect, #supplierLocation').css({
                    'border-color': '#10b981',
                    'transition': 'all 0.3s ease'
                });
                setTimeout(() => {
                    $('#supplierProductSelect, #supplierLocation').css('border-color', '#e2e8f0');
                }, 1000);
            } else {
                $('#suppliersGrid').empty();
                $('#noResultsState').show();
            }
        }, 500);
    },
    
    // Display suppliers in grid
    displaySuppliers: function(suppliers) {
        const grid = $('#suppliersGrid');
        grid.empty();
        
        if (!suppliers || suppliers.length === 0) {
            this.showNoResults('No suppliers found');
            return;
        }
        
        suppliers.forEach(supplier => {
            // Generate star rating (mock)
            const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0
            const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
            
            // Determine if verified (random for now)
            const isVerified = supplier.id % 2 === 0;
            
            const card = `
                <div class="supplier-card ${isVerified ? 'verified' : ''}" 
                     data-supplier-id="${supplier.id}" 
                     onclick="RetailX.ManagerChat.selectSupplier(${supplier.id})">
                    
                    <div class="supplier-card-header">
                        <div class="supplier-avatar-large">
                            <img src="https://ui-avatars.com/api/?name=${supplier.avatar || supplier.fullname.charAt(0)}&background=25D366&color=fff&size=50" 
                                 alt="${supplier.fullname}">
                        </div>
                        <div class="supplier-info">
                            <h4>${this.escapeHtml(supplier.fullname)}</h4>
                            <div class="supplier-rating">
                                <span class="stars">${stars}</span>
                                <span class="rating-count">(${Math.floor(Math.random() * 100 + 20)})</span>
                            </div>
                            <div class="supplier-location">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${supplier.location || 'Location not set'} • ${(Math.random() * 10 + 1).toFixed(1)} km</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="supplier-details">
                        <div class="detail-item">
                            <i class="fas fa-tag"></i>
                            <span>${supplier.category || 'General'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-box"></i>
                            <span>${Math.floor(Math.random() * 50 + 10)} products</span>
                        </div>
                        ${supplier.unread_count > 0 ? `
                        <div class="detail-item" style="color: #25D366;">
                            <i class="fas fa-envelope"></i>
                            <span>${supplier.unread_count} new</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="supplier-actions">
                        <button class="dm-btn" onclick="event.stopPropagation(); RetailX.ManagerChat.openChat(${supplier.id})">
                            <i class="fas fa-comment-dots"></i> 
                            ${supplier.unread_count > 0 ? `Chat (${supplier.unread_count})` : 'Message'}
                        </button>
                        <button class="contact-btn" onclick="event.stopPropagation(); RetailX.ManagerChat.callSupplier(${supplier.id})">
                            <i class="fas fa-phone-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            
            grid.append(card);
        });
        
        $('#noResultsState').hide();
    },
    
    // Show no results message
    showNoResults: function(message) {
        $('#suppliersGrid').html(`
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-store-slash" style="font-size: 48px; color: #94a3b8; margin-bottom: 15px;"></i>
                <h3 style="color: #1e293b; margin-bottom: 10px;">No Suppliers Found</h3>
                <p style="color: #64748b;">${message || 'Try adjusting your search filters'}</p>
            </div>
        `);
    },
    
    // ========== CHAT FUNCTIONALITY ==========
    
    // Select supplier (highlight only)
    selectSupplier: function(supplierId) {
        $('.supplier-card').removeClass('active');
        $(`.supplier-card[data-supplier-id="${supplierId}"]`).addClass('active');
    },
    
    // Open chat with supplier
    openChat: function(supplierId) {
        const supplier = this.suppliers.find(s => s.id === supplierId);
        if (!supplier) {
            RetailX.showToast('Supplier not found', 'error');
            return;
        }
        
        console.log(`💬 Opening chat with supplier: ${supplier.fullname}`);
        
        this.currentChatSupplier = supplier;
        this.selectSupplier(supplierId);
        
        // Update chat header
        $('#chatSupplierName').text(supplier.fullname);
        $('#chatSupplierLocation').text(supplier.location || 'Unknown location');
        $('#chatAvatar').attr('src', 
            `https://ui-avatars.com/api/?name=${supplier.avatar || supplier.fullname.charAt(0)}&background=25D366&color=fff&size=44`
        );
        
        // Show loading in messages
        $('#chatMessages').html(`
            <div style="text-align: center; padding: 40px;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 15px; color: #64748b;">Loading chat...</p>
            </div>
        `);
        
        // Show chat section
        $('#chatSection').show();
        this.expandChat();
        
        // ========== FIXED URL ==========
        // Get or create chat room using the correct endpoint for manager
        $.ajax({
            url: `/api/chat/room/for-manager/${supplierId}/`,
            method: 'GET',
            success: (response) => {
                console.log('✅ Chat room ready:', response);
                
                this.currentChatRoomId = response.chat_room_id;
                
                // Load messages
                this.loadMessages(this.currentChatRoomId);
                
                // Start polling for new messages
                this.startMessagePolling();
                
                // Focus on input
                setTimeout(() => $('#chatInput').focus(), 500);
            },
            error: (xhr) => {
                console.error('❌ Failed to create chat room:', xhr);
                $('#chatMessages').html(`
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 40px; color: #ef4444;"></i>
                        <p style="margin-top: 15px; color: #ef4444;">Failed to open chat</p>
                        <button onclick="RetailX.ManagerChat.retryOpenChat(${supplierId})" 
                                style="margin-top: 15px; padding: 8px 20px; background: #4361ee; color: white; border: none; border-radius: 8px;">
                            Retry
                        </button>
                    </div>
                `);
                RetailX.showToast('Failed to open chat', 'error');
            }
        });
    },
    
    // Retry opening chat
    retryOpenChat: function(supplierId) {
        this.openChat(supplierId);
    },
    
    // Load messages from database
    loadMessages: function(chatRoomId) {
        $.ajax({
            url: `/api/chat/messages/${chatRoomId}/`,
            method: 'GET',
            success: (response) => {
                console.log(`📨 Loaded ${response.messages.length} messages`);
                
                // Store messages
                if (!this.chatMessages) this.chatMessages = {};
                this.chatMessages[chatRoomId] = response.messages;
                
                // Render messages
                this.renderChatMessages(chatRoomId);
                
                // Update unread count in supplier list
                this.updateSupplierUnreadCount(response.messages);
            },
            error: (xhr) => {
                console.error('❌ Failed to load messages:', xhr);
                $('#chatMessages').html(`
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: #f59e0b;"></i>
                        <p style="margin-top: 15px;">Failed to load messages</p>
                    </div>
                `);
            }
        });
    },
    
    // Render messages in chat area
    renderChatMessages: function(chatRoomId) {
        const messages = this.chatMessages[chatRoomId] || [];
        const container = $('#chatMessages');
        
        if (messages.length === 0) {
            container.html(`
                <div class="no-chat-selected">
                    <i class="fas fa-comments"></i>
                    <p>No messages yet. Start the conversation!</p>
                    <small style="color: #94a3b8; margin-top: 10px; display: block;">
                        Say hello to ${this.currentChatSupplier?.fullname || 'the supplier'}
                    </small>
                </div>
            `);
            return;
        }
        
        container.empty();
        
        let lastDate = null;
        
        messages.forEach(msg => {
            const messageClass = msg.sender_type === 'manager' ? 'sent' : 'received';
            
            // Add date separator if new day
            const msgDate = new Date(msg.created_at).toDateString();
            if (msgDate !== lastDate) {
                container.append(`
                    <div style="text-align: center; margin: 15px 0;">
                        <span style="background: rgba(0,0,0,0.05); padding: 4px 12px; border-radius: 20px; font-size: 11px; color: #64748b;">
                            ${this.formatDate(msg.created_at)}
                        </span>
                    </div>
                `);
                lastDate = msgDate;
            }
            
            container.append(`
                <div class="message-whatsapp ${messageClass}">
                    <div class="message-bubble">
                        <div class="message-text">${this.escapeHtml(msg.content)}</div>
                        <div class="message-time">
                            ${msg.created_at}
                            ${msg.sender_type === 'manager' && msg.is_read ? ' ✓✓' : ''}
                        </div>
                    </div>
                </div>
            `);
        });
        
        // Scroll to bottom
        container.scrollTop(container[0].scrollHeight);
    },
    
    // Start polling for new messages
    startMessagePolling: function() {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
        }
        
        console.log('🔄 Starting message polling...');
        
        this.messagePollingInterval = setInterval(() => {
            if (this.currentChatRoomId && this.currentChatSupplier) {
                console.log('🔄 Polling for new messages...');
                
                $.ajax({
                    url: `/api/chat/messages/${this.currentChatRoomId}/`,
                    method: 'GET',
                    success: (response) => {
                        const oldCount = this.chatMessages[this.currentChatRoomId]?.length || 0;
                        const newCount = response.messages.length;
                        
                        if (newCount > oldCount) {
                            console.log(`📨 ${newCount - oldCount} new messages received`);
                            this.chatMessages[this.currentChatRoomId] = response.messages;
                            this.renderChatMessages(this.currentChatRoomId);
                            
                            // Play notification sound (optional)
                            // this.playNotificationSound();
                        }
                        
                        // Update supplier unread count
                        this.updateSupplierUnreadCount(response.messages);
                    },
                    error: (xhr) => {
                        console.error('Polling error:', xhr);
                    }
                });
            }
        }, 3000); // Poll every 3 seconds
    },
    
    // Send message
    sendChatMessage: function() {
        if (!this.currentChatSupplier || !this.currentChatRoomId) {
            RetailX.showToast('Please select a supplier first', 'warning');
            return;
        }
        
        const input = $('#chatInput');
        const message = input.val().trim();
        
        if (!message) return;
        
        console.log(`📤 Sending message: "${message.substring(0, 30)}..."`);
        
        // Add message to UI optimistically
        const tempId = 'temp-' + Date.now();
        const container = $('#chatMessages');
        
        // Remove "no messages" if present
        if ($('.no-chat-selected').length) {
            container.empty();
        }
        
        container.append(`
            <div class="message-whatsapp sent" id="${tempId}">
                <div class="message-bubble">
                    <div class="message-text">${this.escapeHtml(message)}</div>
                    <div class="message-time">Just now • Sending...</div>
                </div>
            </div>
        `);
        
        container.scrollTop(container[0].scrollHeight);
        input.val('');
        
        // Send to server
        $.ajax({
            url: '/api/chat/send/',
            method: 'POST',
            headers: { 
                'X-CSRFToken': this.getCSRFToken(),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                chat_room_id: this.currentChatRoomId,
                content: message,
                sender_type: 'manager'
            }),
            success: (response) => {
                console.log('✅ Message sent successfully');
                
                // Remove temp message
                $(`#${tempId}`).remove();
                
                // Add the real message
                this.addMessageToUI(response.message);
                
                // Update messages in storage
                if (!this.chatMessages[this.currentChatRoomId]) {
                    this.chatMessages[this.currentChatRoomId] = [];
                }
                this.chatMessages[this.currentChatRoomId].push(response.message);
            },
            error: (xhr) => {
                console.error('❌ Failed to send message:', xhr);
                
                // Update temp message to show error
                $(`#${tempId} .message-time`).text('Failed to send • Click to retry');
                $(`#${tempId}`).css('opacity', '0.7').click(() => {
                    input.val(message);
                    $(`#${tempId}`).remove();
                    this.sendChatMessage();
                });
                
                RetailX.showToast('Failed to send message', 'error');
            }
        });
    },
    
    // Add message to UI
    addMessageToUI: function(message) {
        const container = $('#chatMessages');
        
        container.append(`
            <div class="message-whatsapp sent">
                <div class="message-bubble">
                    <div class="message-text">${this.escapeHtml(message.content)}</div>
                    <div class="message-time">${message.created_at}</div>
                </div>
            </div>
        `);
        
        container.scrollTop(container[0].scrollHeight);
    },
    
    // Update supplier unread count in list
    updateSupplierUnreadCount: function(messages) {
        if (!this.currentChatSupplier) return;
        
        const unreadCount = messages.filter(m => 
            m.sender_type === 'supplier' && !m.is_read
        ).length;
        
        // Update in suppliers array
        const supplierIndex = this.suppliers.findIndex(s => s.id === this.currentChatSupplier.id);
        if (supplierIndex !== -1) {
            this.suppliers[supplierIndex].unread_count = unreadCount;
        }
        
        // Update in UI
        const supplierCard = $(`.supplier-card[data-supplier-id="${this.currentChatSupplier.id}"]`);
        const dmBtn = supplierCard.find('.dm-btn');
        
        if (unreadCount > 0) {
            dmBtn.html(`<i class="fas fa-comment-dots"></i> Chat (${unreadCount})`);
            dmBtn.css('background', '#25D366');
            
            // Add badge if not exists
            if (!supplierCard.find('.unread-badge').length) {
                supplierCard.append(`<span class="unread-badge" style="position: absolute; top: 10px; right: 10px; background: #ef4444; color: white; border-radius: 20px; padding: 2px 8px; font-size: 11px;">${unreadCount}</span>`);
            }
        } else {
            dmBtn.html('<i class="fas fa-comment-dots"></i> Message');
            
            // Remove badge
            supplierCard.find('.unread-badge').remove();
        }
    },
    
    // ========== UI CONTROLS ==========
    
    expandChat: function() {
        this.isChatExpanded = true;
        $('.supplier-split-view').addClass('chat-expanded');
        $('#suppliersListSection').addClass('minimized');
        
        // On mobile, scroll to chat
        if ($(window).width() <= 768) {
            $('html, body').animate({
                scrollTop: $('#chatSection').offset().top - 80
            }, 500);
        }
    },
    
    minimizeChat: function() {
        this.isChatExpanded = false;
        $('.supplier-split-view').removeClass('chat-expanded');
        $('#suppliersListSection').removeClass('minimized');
        $('#chatSection').hide();
        $('.supplier-card').removeClass('active');
        
        // Stop polling
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }
        
        this.currentChatSupplier = null;
        this.currentChatRoomId = null;
    },
    
    // ========== FILTERING ==========
    
    filterSuppliers: function(filter) {
        const cards = $('.supplier-card');
        
        if (filter === 'all') {
            cards.show();
        } else if (filter === 'nearby') {
            cards.each(function() {
                const locationText = $(this).find('.supplier-location span').text();
                const distanceMatch = locationText.match(/(\d+\.?\d*)\s*km/);
                const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 10;
                $(this).toggle(distance <= 5);
            });
        } else if (filter === 'verified') {
            cards.each(function() {
                $(this).toggle($(this).hasClass('verified'));
            });
        }
    },
    
    showAllSuppliers: function() {
        this.displaySuppliers(this.suppliers);
        $('#supplierCount').text(this.suppliers.length);
        $('#noResultsState').hide();
    },
    
    resetSearch: function() {
        $('#supplierProductSelect').val('');
        $('#supplierLocation').val('Khamgaon');
        this.showAllSuppliers();
        this.minimizeChat();
    },
    
    // ========== LOCATION SUGGESTIONS ==========
    
    showLocationSuggestions: function() {
        const input = $('#supplierLocation');
        const value = input.val().toLowerCase();
        const suggestions = $('#locationSuggestions');
        
        if (value.length < 1) {
            suggestions.removeClass('show');
            return;
        }
        
        // Get unique locations from suppliers
        const locations = [...new Set(this.suppliers
            .map(s => s.location)
            .filter(l => l && l.toLowerCase().includes(value))
        )].slice(0, 5);
        
        if (locations.length > 0) {
            suggestions.empty();
            locations.forEach(loc => {
                suggestions.append(`
                    <div class="location-suggestion-item" data-location="${loc}">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${loc}</span>
                    </div>
                `);
            });
            suggestions.addClass('show');
            
            // Handle click on suggestion
            $('.location-suggestion-item').off('click').on('click', (e) => {
                const location = $(e.currentTarget).data('location');
                input.val(location);
                suggestions.removeClass('show');
                this.findSuppliers();
            });
        } else {
            suggestions.removeClass('show');
        }
    },
    
    // ========== UTILITY FUNCTIONS ==========
    
    callSupplier: function(supplierId) {
        const supplier = this.suppliers.find(s => s.id === supplierId);
        if (supplier) {
            RetailX.showToast(`Calling ${supplier.fullname}...`, 'info');
        }
    },
    
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    formatDate: function(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    },
    
    getCSRFToken: function() {
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
};

// Initialize when page loads
$(document).ready(function() {
    // Initialize when supplier page is opened
    $(document).on('click', '.menu-item[data-page="supplier"]', function() {
        setTimeout(() => {
            if (typeof RetailX.ManagerChat !== 'undefined') {
                RetailX.ManagerChat.init();
            }
        }, 200);
    });
    
    // Also initialize if supplier page is active on load
    if ($('#supplier-page').hasClass('active')) {
        setTimeout(() => {
            if (typeof RetailX.ManagerChat !== 'undefined') {
                RetailX.ManagerChat.init();
            }
        }, 500);
    }
});

console.log('✅ Manager Chat Module Loaded');