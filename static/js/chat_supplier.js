// ============================================
// RETAILX - SUPPLIER CHAT MODULE (FIXED - NO ERRORS)
// ============================================

(function() {
    console.log('🚨 SUPPLIER CHAT: Loading module...');

    // Use existing globals from supplier_home.js
    // currentManagerId, managers, messages are already declared globally
    
    let currentChatRoomId = null;
    let messagePollingInterval = null;

    // Initialize immediately when page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔥 DOM LOADED - Initializing Supplier Chat');
        loadManagers();
        setupChatEvents();
    });

    // Force initialization if DOMContentLoaded already fired
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('🔥 PAGE ALREADY LOADED - Forcing initialization');
        setTimeout(() => {
            loadManagers();
            setupChatEvents();
        }, 100);
    }

    function setupChatEvents() {
        console.log('🔧 Setting up chat events');
        
        const searchInput = document.getElementById('managerSearch');
        if (searchInput) {
            searchInput.removeEventListener('input', filterManagers);
            searchInput.addEventListener('input', filterManagers);
        }
        
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.removeEventListener('submit', sendMessage);
            messageForm.addEventListener('submit', sendMessage);
        }
        
        document.querySelectorAll('.quick-reply-chip').forEach(chip => {
            chip.removeEventListener('click', handleQuickReply);
            chip.addEventListener('click', handleQuickReply);
        });
        
        const backBtn = document.getElementById('backToManagersBtn');
        if (backBtn) {
            backBtn.removeEventListener('click', minimizeChat);
            backBtn.addEventListener('click', minimizeChat);
        }
        
        const minimizeBtn = document.getElementById('minimizeChatBtn');
        if (minimizeBtn) {
            minimizeBtn.removeEventListener('click', minimizeChat);
            minimizeBtn.addEventListener('click', minimizeChat);
        }
    }

    function handleQuickReply(e) {
        const message = e.currentTarget.getAttribute('data-message');
        if (message) {
            document.getElementById('messageText').value = message;
            sendMessage(new Event('submit'));
        }
    }

    // ========== LOAD MANAGERS ==========

    async function loadManagers() {
        console.log('📡 Loading managers from database...');
        
        const listElement = document.getElementById('managerList');
        if (!listElement) {
            console.error('❌ Manager list element not found!');
            return;
        }
        
        listElement.innerHTML = '<div class="loading-managers">Loading managers...</div>';
        
        try {
            const response = await fetch('/api/managers-for-supplier/');
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Managers response:', data);
            
            if (data.success && data.managers) {
                window.managers = data.managers;
                console.log(`✅ Loaded ${window.managers.length} managers`);
                renderManagers(window.managers);
            } else {
                listElement.innerHTML = '<div class="loading-managers">No managers found</div>';
            }
        } catch (error) {
            console.error('❌ Failed to load managers:', error);
            listElement.innerHTML = '<div class="loading-managers">Error loading managers</div>';
        }
    }

    function renderManagers(managers) {
        const list = document.getElementById('managerList');
        if (!list) return;
        
        if (!managers || managers.length === 0) {
            list.innerHTML = '<div class="loading-managers">No managers found</div>';
            return;
        }
        
        list.innerHTML = managers.map(m => `
            <div class="manager-item" onclick="selectManager(${m.id}, '${escapeHtml(m.fullname)}')">
                <div class="manager-avatar">${m.avatar || m.fullname.charAt(0)}</div>
                <div class="manager-info">
                    <h4>${escapeHtml(m.fullname)}</h4>
                    <p>${m.email || 'Manager'}</p>
                    ${m.unread_count > 0 ? `<span class="manager-badge">${m.unread_count}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    function filterManagers() {
        const search = document.getElementById('managerSearch')?.value.toLowerCase() || '';
        const filtered = window.managers.filter(m => 
            m.fullname.toLowerCase().includes(search) || 
            (m.email && m.email.toLowerCase().includes(search))
        );
        renderManagers(filtered);
    }

    // ========== SELECT MANAGER ==========

    window.selectManager = async function(managerId, managerName) {
        console.log(`💬 Selecting manager: ${managerName} (ID: ${managerId})`);
        
        window.currentManagerId = managerId;
        
        // Update active state
        document.querySelectorAll('.manager-item').forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        // Update chat header
        document.getElementById('chatManagerName').textContent = managerName;
        document.getElementById('chatManagerAvatar').textContent = managerName.charAt(0);
        document.getElementById('managerStatusDot').className = 'status-dot online';
        document.getElementById('chatManagerStatus').textContent = 'Online';
        
        // Show loading
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        
        // Show input area
        document.getElementById('messageInputArea').style.display = 'block';
        document.getElementById('minimizeChatBtn').style.display = 'flex';
        
        try {
            console.log(`📡 Getting chat room for manager ${managerId}...`);
            
            // ========== FIXED URL ==========
            const response = await fetch(`/api/chat/room/for-supplier/${managerId}/`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Chat room response:', data);
            
            if (data.success) {
                currentChatRoomId = data.chat_room_id;
                console.log(`✅ Chat room ID: ${currentChatRoomId}`);
                
                // Load messages immediately
                await loadMessages(currentChatRoomId);
                
                // Start polling
                startMessagePolling();
                
                setTimeout(() => document.getElementById('messageText')?.focus(), 300);
            } else {
                throw new Error(data.error || 'Failed to get chat room');
            }
            
        } catch (error) {
            console.error('❌ Failed to open chat:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 40px; color: #ef4444;"></i>
                    <p style="margin-top: 15px; color: #ef4444;">Failed to open chat</p>
                    <button onclick="selectManager(${managerId}, '${escapeHtml(managerName)}')" 
                            style="margin-top: 15px; padding: 8px 20px; background: #4361ee; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    };

    // ========== LOAD MESSAGES ==========

    async function loadMessages(chatRoomId) {
        console.log(`📨 LOADING MESSAGES for room: ${chatRoomId}`);
        
        try {
            const response = await fetch(`/api/chat/messages/${chatRoomId}/`);
            console.log('📡 Messages response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Messages response data:', data);
            
            if (data.success && data.messages) {
                console.log(`✅ Loaded ${data.messages.length} messages`);
                window.messages = data.messages;
                renderMessages(window.messages);
            } else {
                console.error('❌ Invalid response format:', data);
                showMessagesError('Invalid response from server');
            }
            
        } catch (error) {
            console.error('❌ Failed to load messages:', error);
            showMessagesError('Failed to load messages');
        }
    }

    function renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        if (!messages || messages.length === 0) {
            container.innerHTML = `
                <div class="no-chat-selected">
                    <i class="fas fa-comments"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }
        
        console.log('🎨 Rendering', messages.length, 'messages');
        
        container.innerHTML = '';
        let lastDate = null;
        
        messages.forEach(msg => {
            const messageClass = msg.sender_type === 'supplier' ? 'sent' : 'received';
            
            const msgDate = new Date(msg.created_at).toDateString();
            if (msgDate !== lastDate) {
                container.innerHTML += `
                    <div style="text-align: center; margin: 15px 0;">
                        <span style="background: rgba(0,0,0,0.05); padding: 4px 12px; border-radius: 20px; font-size: 11px; color: #64748b;">
                            ${formatDate(msg.created_at)}
                        </span>
                    </div>
                `;
                lastDate = msgDate;
            }
            
            container.innerHTML += `
                <div class="message ${messageClass}">
                    <div class="message-content">${escapeHtml(msg.content)}</div>
                    <div class="message-time">${msg.created_at}</div>
                </div>
            `;
        });
        
        container.scrollTop = container.scrollHeight;
    }

    function showMessagesError(message) {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: #f59e0b;"></i>
                    <p style="margin-top: 15px; color: #64748b;">${escapeHtml(message)}</p>
                    <button onclick="loadMessages(${currentChatRoomId})" 
                            style="margin-top: 15px; padding: 8px 20px; background: #4361ee; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // ========== START POLLING ==========

    function startMessagePolling() {
        if (messagePollingInterval) {
            clearInterval(messagePollingInterval);
        }
        
        console.log('🔄 Starting message polling every 3 seconds');
        
        messagePollingInterval = setInterval(async () => {
            if (currentChatRoomId && window.currentManagerId) {
                console.log('🔄 Polling for new messages...');
                
                try {
                    const response = await fetch(`/api/chat/messages/${currentChatRoomId}/`);
                    const data = await response.json();
                    
                    if (data.success && data.messages.length > window.messages.length) {
                        console.log(`📨 ${data.messages.length - window.messages.length} new messages`);
                        window.messages = data.messages;
                        renderMessages(window.messages);
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }
        }, 3000);
    }

    // ========== SEND MESSAGE ==========

    async function sendMessage(e) {
        e.preventDefault();
        
        if (!currentChatRoomId) {
            alert('Please select a manager first');
            return;
        }
        
        const input = document.getElementById('messageText');
        const message = input.value.trim();
        
        if (!message) return;
        
        console.log(`📤 Sending message: "${message}"`);
        
        // Optimistic UI update
        const tempId = 'temp-' + Date.now();
        const container = document.getElementById('messagesContainer');
        
        if (container.querySelector('.no-chat-selected')) {
            container.innerHTML = '';
        }
        
        container.innerHTML += `
            <div class="message sent" id="${tempId}">
                <div class="message-content">${escapeHtml(message)}</div>
                <div class="message-time">Just now • Sending...</div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;
        input.value = '';
        
        try {
            const response = await fetch('/api/chat/send/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_room_id: currentChatRoomId,
                    content: message,
                    sender_type: 'supplier'
                })
            });
            
            const data = await response.json();
            console.log('✅ Send response:', data);
            
            if (data.success) {
                document.getElementById(tempId)?.remove();
                
                container.innerHTML += `
                    <div class="message sent">
                        <div class="message-content">${escapeHtml(data.message.content)}</div>
                        <div class="message-time">${data.message.created_at}</div>
                    </div>
                `;
                container.scrollTop = container.scrollHeight;
                
                window.messages.push(data.message);
            }
            
        } catch (error) {
            console.error('❌ Failed to send:', error);
            const tempMsg = document.getElementById(tempId);
            if (tempMsg) {
                tempMsg.querySelector('.message-time').textContent = 'Failed to send';
            }
        }
    }

    // ========== MINIMIZE CHAT ==========

    function minimizeChat() {
        console.log('🗑️ Minimizing chat');
        
        window.currentManagerId = null;
        currentChatRoomId = null;
        
        document.getElementById('messageInputArea').style.display = 'none';
        document.getElementById('minimizeChatBtn').style.display = 'none';
        
        document.getElementById('messagesContainer').innerHTML = `
            <div class="no-chat-selected">
                <i class="fas fa-comments"></i>
                <p>Select a manager to start chatting</p>
            </div>
        `;
        
        document.getElementById('chatManagerName').textContent = 'Select a manager';
        document.getElementById('chatManagerStatus').textContent = 'Click to start chatting';
        document.getElementById('managerStatusDot').className = 'status-dot offline';
        
        if (messagePollingInterval) {
            clearInterval(messagePollingInterval);
            messagePollingInterval = null;
        }
        
        document.querySelectorAll('.manager-item').forEach(item => item.classList.remove('active'));
    }

    // ========== UTILITY FUNCTIONS ==========

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

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

    console.log('✅ Supplier Chat Module Loaded - FIX APPLIED');
})();