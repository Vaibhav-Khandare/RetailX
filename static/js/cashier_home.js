// ============================================
// RETAILX CASHIER DASHBOARD - OPTIMIZED SCRIPT
// ============================================

/*
   This script handles all functionality for the cashier dashboard with performance optimizations:
   - Memory-efficient chart rendering
   - Debounced event handlers
   - Lazy loading of data
   - Garbage collection optimizations
   - Crash protection with error boundaries
*/

// ============================================
// PERFORMANCE CONSTANTS
// ============================================

const PERFORMANCE = {
    MAX_CHART_DATA_POINTS: 24, // Limit chart data to prevent memory issues
    DEBOUNCE_DELAY: 300, // Debounce delay for input events
    CHART_UPDATE_THROTTLE: 1000, // Throttle chart updates
    MAX_ITEMS_IN_BILL: 50, // Prevent too many items in bill
    MAX_NOTIFICATIONS: 20 // Limit notifications to prevent memory leaks
};

// ============================================
// GLOBAL STATE MANAGEMENT (MEMORY OPTIMIZED)
// ============================================

const state = {
    // Current active page
    currentPage: 'dashboard',
    
    // Current bill being processed
    bill: {
        items: [],
        subtotal: 0,
        gst: 0.18,
        discountPercent: 0,
        discountAmount: 0,
        total: 0,
        billNumber: '',
        date: new Date()
    },
    
    // Selected payment method
    paymentMethod: 'cash',
    
    // Notifications queue (limited size)
    notifications: [],
    
    // Summary data (lightweight)
    summaryData: {
        todaySales: 0,
        totalBills: 0,
        customersServed: 0,
        itemsSold: 0,
        cashCollection: 0,
        cashAmount: 0,
        cardAmount: 0,
        upiAmount: 0,
        totalTransactions: 0,
        successfulTx: 0,
        pendingTx: 0,
        failedTx: 0
    },
    
    // Chart instance (null when not needed)
    salesChart: null,
    
    // Performance flags
    isChartInitialized: false,
    isProcessing: false,
    
    // Cached data for performance
    cachedSalesData: null,
    cachedTransactions: null,
    
    // Debounce timers
    debounceTimers: {}
};

// ============================================
// ERROR BOUNDARY AND CRASH PROTECTION
// ============================================

/**
 * Safe execution wrapper to prevent crashes
 */
function safeExecute(fn, context = null, fallback = null) {
    try {
        return fn.call(context);
    } catch (error) {
        console.error('Error in safeExecute:', error);
        
        // Log error but don't crash
        if (typeof showToast === 'function') {
            showToast('An error occurred. Please try again.', 'error');
        }
        
        return fallback;
    }
}

/**
 * Initialize with error protection
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeApplication();
    } catch (error) {
        console.error('Fatal error during initialization:', error);
        showCriticalError('Failed to initialize application. Please refresh the page.');
    }
});

/**
 * Show critical error message
 */
function showCriticalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'critical-error';
    errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: #ef4444;
        color: white;
        padding: 20px;
        text-align: center;
        z-index: 9999;
        font-family: sans-serif;
    `;
    errorDiv.innerHTML = `
        <strong>Error:</strong> ${message}
        <button onclick="location.reload()" style="margin-left: 20px; padding: 5px 15px; background: white; color: #ef4444; border: none; border-radius: 4px; cursor: pointer;">
            Reload Page
        </button>
    `;
    document.body.appendChild(errorDiv);
}

// ============================================
// MEMORY-EFFICIENT DATA MANAGEMENT
// ============================================

// Lightweight product database
const products = [
    { id: 1, code: 'P001', name: 'Coffee 500g', price: 450.00, category: 'Grocery', stock: 25 },
    { id: 2, code: 'P002', name: 'Tea 250g', price: 220.00, category: 'Grocery', stock: 42 },
    { id: 3, code: 'P003', name: 'Wireless Mouse', price: 1299.00, category: 'Electronics', stock: 8 },
    { id: 4, code: 'P004', name: 'USB Cable', price: 299.00, category: 'Electronics', stock: 56 }
];

/**
 * Generate lightweight sample data on demand
 */
function generateLightweightSalesData(count = 20) {
    const sales = [];
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0);
        
        const itemsCount = Math.floor(Math.random() * 5) + 1;
        const amount = (Math.random() * 2000) + 100;
        
        sales.push({
            id: `INV-${(1000 + i).toString().padStart(4, '0')}`,
            date: date,
            customer: ['Walk-in', 'Regular'][Math.floor(Math.random() * 2)],
            itemsCount: itemsCount,
            paymentMethod: ['cash', 'card', 'upi'][Math.floor(Math.random() * 3)],
            amount: parseFloat(amount.toFixed(2)),
            status: 'success'
        });
    }
    
    return sales.sort((a, b) => b.date - a.date);
}

/**
 * Generate lightweight transactions
 */
function generateLightweightTransactions(count = 15) {
    const transactions = [];
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
        const date = new Date(today);
        date.setHours(date.getHours() - Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));
        
        const amount = (Math.random() * 1500) + 100;
        
        transactions.push({
            id: `TRX-${Date.now().toString().slice(-6)}-${i}`,
            billNo: `INV-${(1000 + i).toString().padStart(4, '0')}`,
            date: date,
            paymentMethod: ['cash', 'card', 'upi'][Math.floor(Math.random() * 3)],
            customer: 'Walk-in',
            amount: parseFloat(amount.toFixed(2)),
            status: 'success'
        });
    }
    
    return transactions.sort((a, b) => b.date - a.date);
}

// ============================================
// INITIALIZATION WITH PERFORMANCE OPTIMIZATIONS
// ============================================

function initializeApplication() {
    console.log('Initializing RetailX Cashier Dashboard with performance optimizations...');
    
    // Generate minimal initial data
    state.cachedSalesData = generateLightweightSalesData(15);
    state.cachedTransactions = generateLightweightTransactions(10);
    state.notifications = generateLightweightNotifications(3);
    
    // Initialize components with error handling
    safeExecute(initNavigation);
    safeExecute(initDateTime);
    safeExecute(initDashboard);
    safeExecute(initBilling);
    safeExecute(initSalesPage);
    safeExecute(initTransactionsPage);
    safeExecute(initSummaryPage);
    safeExecute(initModals);
    safeExecute(initNotifications);
    safeExecute(initQuickActions);
    safeExecute(initEventListeners);
    
    // Calculate initial summary data
    safeExecute(calculateSummaryData);
    
    // Update notification badge
    safeExecute(updateNotificationBadge);
    
    // Start memory monitor (development only)
    if (process.env.NODE_ENV === 'development') {
        safeExecute(startMemoryMonitor);
    }
    
    console.log('Dashboard initialized successfully with performance optimizations');
    safeExecute(() => showToast('Dashboard loaded!', 'success'));
}

/**
 * Generate lightweight notifications
 */
function generateLightweightNotifications(count = 3) {
    const notifications = [];
    const messages = [
        'System running optimally',
        'Welcome to RetailX Dashboard',
        'All systems operational'
    ];
    
    for (let i = 0; i < Math.min(count, messages.length); i++) {
        notifications.push({
            type: 'info',
            msg: messages[i],
            time: new Date(Date.now() - (i * 3600000))
        });
    }
    
    return notifications;
}

// ============================================
// NAVIGATION MANAGEMENT (OPTIMIZED)
// ============================================

function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item[data-page]');
    
    menuItems.forEach(item => {
        // Use event delegation for better performance
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const page = item.dataset.page;
            safeExecute(() => navigateToPage(page));
            
            // Update active state
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function navigateToPage(page) {
    if (state.currentPage === page && page === 'summary') {
        // If already on summary page and clicking again, just refresh
        refreshPageData(page);
        return;
    }
    
    // Clean up previous page resources
    cleanupPageResources(state.currentPage);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = page;
        
        // Update page title
        updatePageTitle(page);
        
        // Refresh page data with debounce
        debounce(`refresh-${page}`, () => {
            refreshPageData(page);
        }, 100);
    }
}

function cleanupPageResources(page) {
    switch(page) {
        case 'summary':
            // Clean up chart resources if leaving summary page
            if (state.salesChart && state.currentPage !== 'summary') {
                safeExecute(() => {
                    state.salesChart.destroy();
                    state.salesChart = null;
                    state.isChartInitialized = false;
                });
            }
            break;
        case 'sales':
        case 'transactions':
            // Clear large table data when leaving
            const tableIds = ['salesTable', 'transactionsTable', 'recentTransactions'];
            tableIds.forEach(id => {
                const tbody = document.querySelector(`#${id} tbody`);
                if (tbody) tbody.innerHTML = '';
            });
            break;
    }
}

function updatePageTitle(page) {
    const pageTitles = {
        'dashboard': 'Dashboard',
        'billing': 'Billing',
        'sales': 'Sales Entry',
        'transactions': 'Transactions',
        'summary': 'Daily Summary'
    };
    
    const pageTitle = pageTitles[page] || 'Dashboard';
    const titleElement = document.getElementById('pageTitle');
    const breadcrumb = document.getElementById('breadcrumb');
    
    if (titleElement) titleElement.textContent = pageTitle;
    if (breadcrumb) breadcrumb.textContent = `Home / ${pageTitle}`;
}

function refreshPageData(page) {
    switch(page) {
        case 'dashboard':
            loadRecentTransactions();
            break;
        case 'billing':
            generateBillNumber();
            break;
        case 'sales':
            loadSalesData();
            break;
        case 'transactions':
            loadTransactionsData();
            break;
        case 'summary':
            loadSummaryData();
            break;
    }
}

// ============================================
// DATE & TIME MANAGEMENT (OPTIMIZED)
// ============================================

function initDateTime() {
    updateDateTime();
    
    // Update less frequently to reduce CPU usage
    setInterval(updateDateTime, 30000); // Every 30 seconds instead of 1 second
}

function updateDateTime() {
    try {
        const now = new Date();
        
        // Update date (less frequent operation)
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-IN', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
        
        // Update time
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
        
        // Update summary date
        const summaryDate = document.getElementById('summaryDate');
        if (summaryDate) {
            summaryDate.textContent = now.toLocaleDateString('en-IN');
        }
        
        // Update bill date
        const billDate = document.getElementById('billDate');
        if (billDate) {
            billDate.textContent = now.toLocaleDateString('en-IN');
        }
    } catch (error) {
        console.error('Error updating date/time:', error);
    }
}

// ============================================
// DASHBOARD PAGE (OPTIMIZED)
// ============================================

function initDashboard() {
    loadRecentTransactions();
}

function loadRecentTransactions() {
    const tbody = document.querySelector('#recentTransactions tbody');
    if (!tbody) return;
    
    // Clear only if needed
    if (tbody.children.length > 0) {
        tbody.innerHTML = '';
    }
    
    if (!state.cachedTransactions || state.cachedTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No recent transactions</td></tr>';
        return;
    }
    
    // Show only last 3 transactions for performance
    const recent = state.cachedTransactions.slice(0, 3);
    
    recent.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.billNo}</td>
            <td>${transaction.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${transaction.customer}</td>
            <td>₹${transaction.amount.toFixed(2)}</td>
            <td><span class="status-badge status-success">Paid</span></td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// QUICK ACTIONS (OPTIMIZED)
// ============================================

function initQuickActions() {
    const actions = {
        'newBillBtn': () => {
            navigateToPage('billing');
            showToast('New bill ready', 'success');
        },
        'quickSaleBtn': () => {
            // Add limited items for quick sale
            state.bill.items = [
                { ...products[0], qty: 1 },
                { ...products[1], qty: 1 }
            ];
            safeExecute(renderBill);
            navigateToPage('billing');
            showToast('Quick sale items added', 'success');
        },
        'checkInventoryBtn': () => {
            openProductSearchModal();
            showToast('Search products', 'info');
        },
        'printLastBtn': () => {
            if (state.cachedTransactions && state.cachedTransactions.length > 0) {
                const lastTransaction = state.cachedTransactions[0];
                printReceipt(lastTransaction);
            } else {
                showToast('No previous bills', 'error');
            }
        }
    };
    
    Object.entries(actions).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    });
}

// ============================================
// BILLING PAGE (OPTIMIZED)
// ============================================

function initBilling() {
    // Scanner functionality
    document.getElementById('scanBtn')?.addEventListener('click', scanProduct);
    document.getElementById('searchProductBtn')?.addEventListener('click', openProductSearchModal);
    
    // Discount with debounce
    document.getElementById('applyDiscount')?.addEventListener('click', () => {
        debounce('applyDiscount', applyDiscount, 500);
    });
    
    // Payment amount with debounce
    document.getElementById('amountReceived')?.addEventListener('input', () => {
        debounce('calculateChange', calculateChange, 300);
    });
    
    // Bill actions
    document.getElementById('clearBillBtn')?.addEventListener('click', clearBill);
    document.getElementById('processPaymentBtn')?.addEventListener('click', processPayment);
    document.getElementById('printBillBtn')?.addEventListener('click', printCurrentBill);
    
    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.paymentMethod = btn.dataset.method;
        });
    });
    
    // Enter key for product code
    document.getElementById('productCode')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            scanProduct();
        }
    });
    
    // Generate initial bill number
    generateBillNumber();
}

function scanProduct() {
    const productCodeInput = document.getElementById('productCode');
    if (!productCodeInput) return;
    
    const code = productCodeInput.value.trim();
    if (!code) {
        showToast('Enter product code', 'error');
        return;
    }
    
    // Clear input
    productCodeInput.value = '';
    
    // Find product
    const product = products.find(p => p.code === code);
    if (!product) {
        showScannerFeedback('Product not found', 'error');
        return;
    }
    
    // Check stock
    if (product.stock <= 0) {
        showScannerFeedback('Out of stock', 'error');
        return;
    }
    
    // Limit items in bill
    if (state.bill.items.length >= PERFORMANCE.MAX_ITEMS_IN_BILL) {
        showScannerFeedback('Bill item limit reached', 'error');
        return;
    }
    
    // Add to bill
    const existingItem = state.bill.items.find(item => item.code === product.code);
    if (existingItem) {
        if (existingItem.qty >= product.stock) {
            showScannerFeedback('Stock limit reached', 'error');
            return;
        }
        existingItem.qty += 1;
    } else {
        state.bill.items.push({ ...product, qty: 1 });
    }
    
    renderBill();
    showScannerFeedback('Product added', 'success');
}

function showScannerFeedback(message, type) {
    const feedback = document.getElementById('scannerFeedback');
    if (!feedback) return;
    
    feedback.textContent = message;
    feedback.className = `scanner-feedback ${type}`;
    
    setTimeout(() => {
        feedback.className = 'scanner-feedback';
    }, 2000);
}

function renderBill() {
    const tbody = document.getElementById('billItems');
    if (!tbody) return;
    
    // Clear existing rows efficiently
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Reset subtotal
    state.bill.subtotal = 0;
    
    if (state.bill.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No items in bill</td></tr>';
        calculateTotals();
        return;
    }
    
    // Render items with virtual scrolling concept for large bills
    const itemsToRender = state.bill.items.slice(0, 20); // Limit rendering
    
    itemsToRender.forEach((item, index) => {
        const total = item.price * item.qty;
        state.bill.subtotal += total;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div>${item.name}</div>
                <small>${item.code}</small>
            </td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
            </td>
            <td>₹${total.toFixed(2)}</td>
            <td>
                <button class="remove-btn" onclick="removeItem(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Show "more items" indicator if there are more
    if (state.bill.items.length > 20) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center; color: #666;">+${state.bill.items.length - 20} more items</td>`;
        tbody.appendChild(row);
    }
    
    calculateTotals();
}

// Expose these functions globally for HTML onclick handlers
window.updateQuantity = function(index, change) {
    if (index < 0 || index >= state.bill.items.length) return;
    
    const item = state.bill.items[index];
    const newQty = item.qty + change;
    
    if (newQty < 1) {
        removeItem(index);
        return;
    }
    
    if (newQty > item.stock) {
        showToast('Stock limit reached', 'error');
        return;
    }
    
    item.qty = newQty;
    renderBill();
};

window.removeItem = function(index) {
    if (index < 0 || index >= state.bill.items.length) return;
    
    state.bill.items.splice(index, 1);
    renderBill();
    showToast('Item removed', 'info');
};

function calculateTotals() {
    try {
        state.bill.gstAmount = state.bill.subtotal * state.bill.gst;
        state.bill.discountAmount = (state.bill.subtotal * state.bill.discountPercent) / 100;
        state.bill.total = state.bill.subtotal + state.bill.gstAmount - state.bill.discountAmount;
        
        // Update UI efficiently
        const updates = {
            'subtotal': `₹${state.bill.subtotal.toFixed(2)}`,
            'gstAmount': `₹${state.bill.gstAmount.toFixed(2)}`,
            'discountAmount': `₹${state.bill.discountAmount.toFixed(2)}`,
            'totalAmount': `₹${state.bill.total.toFixed(2)}`
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Calculate change if needed
        calculateChange();
    } catch (error) {
        console.error('Error calculating totals:', error);
    }
}

function applyDiscount() {
    const discountInput = document.getElementById('discountInput');
    if (!discountInput) return;
    
    let discount = parseFloat(discountInput.value);
    
    if (isNaN(discount) || discount < 0) {
        showToast('Invalid discount', 'error');
        return;
    }
    
    if (discount > 100) {
        discount = 100;
        discountInput.value = '100';
    }
    
    state.bill.discountPercent = discount;
    calculateTotals();
    
    if (discount > 0) {
        showToast(`${discount}% discount applied`, 'success');
    }
}

function calculateChange() {
    const amountReceivedInput = document.getElementById('amountReceived');
    const changeAmountElement = document.getElementById('changeAmount');
    
    if (!amountReceivedInput || !changeAmountElement) return;
    
    const amountReceived = parseFloat(amountReceivedInput.value) || 0;
    const change = amountReceived - state.bill.total;
    
    if (change >= 0) {
        changeAmountElement.textContent = `Change: ₹${change.toFixed(2)}`;
        changeAmountElement.className = 'positive';
    } else {
        changeAmountElement.textContent = `Short: ₹${Math.abs(change).toFixed(2)}`;
        changeAmountElement.className = 'negative';
    }
}

function clearBill() {
    if (state.bill.items.length === 0) {
        showToast('Bill already empty', 'info');
        return;
    }
    
    if (confirm('Clear current bill?')) {
        state.bill.items = [];
        state.bill.discountPercent = 0;
        
        const discountInput = document.getElementById('discountInput');
        const amountReceived = document.getElementById('amountReceived');
        
        if (discountInput) discountInput.value = '';
        if (amountReceived) amountReceived.value = '';
        
        renderBill();
        showToast('Bill cleared', 'success');
    }
}

function processPayment() {
    if (state.bill.items.length === 0) {
        showToast('No items in bill', 'error');
        return;
    }
    
    const amountReceivedInput = document.getElementById('amountReceived');
    const amountReceived = parseFloat(amountReceivedInput?.value) || 0;
    
    if (amountReceived < state.bill.total) {
        showToast(`Need ₹${(state.bill.total - amountReceived).toFixed(2)} more`, 'error');
        return;
    }
    
    showLoading();
    
    // Simulate processing
    setTimeout(() => {
        // Create transaction
        const transaction = {
            id: `TRX-${Date.now().toString().slice(-6)}`,
            billNo: state.bill.billNumber,
            date: new Date(),
            paymentMethod: state.paymentMethod,
            customer: 'Walk-in',
            amount: state.bill.total,
            status: 'success',
            items: [...state.bill.items]
        };
        
        // Update cached data
        if (!state.cachedTransactions) state.cachedTransactions = [];
        state.cachedTransactions.unshift(transaction);
        
        // Update summary
        updateSummaryAfterTransaction(transaction);
        
        // Clear bill
        clearBill();
        generateBillNumber();
        
        hideLoading();
        showToast(`Payment of ₹${state.bill.total.toFixed(2)} successful`, 'success');
        
        // Refresh affected pages
        if (state.currentPage === 'dashboard') loadRecentTransactions();
        if (state.currentPage === 'summary') loadSummaryData();
        
    }, 1000);
}

function printCurrentBill() {
    if (state.bill.items.length === 0) {
        showToast('No items to print', 'error');
        return;
    }
    
    showToast('Printing bill...', 'info');
    setTimeout(() => showToast('Bill printed', 'success'), 500);
}

function generateBillNumber() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    state.bill.billNumber = `INV-${day}${month}${year}-${random}`;
    
    const billNumberElement = document.getElementById('billNumber');
    if (billNumberElement) {
        billNumberElement.textContent = state.bill.billNumber;
    }
}

// ============================================
// SALES PAGE (OPTIMIZED)
// ============================================

function initSalesPage() {
    document.getElementById('applySalesFilter')?.addEventListener('click', () => {
        debounce('loadSalesData', loadSalesData, 300);
    });
    
    document.getElementById('exportSalesBtn')?.addEventListener('click', exportSalesToExcel);
    document.getElementById('printSalesBtn')?.addEventListener('click', printSalesReport);
    
    // Load initial data lazily
    setTimeout(loadSalesData, 100);
}

function loadSalesData() {
    const tbody = document.querySelector('#salesTable tbody');
    if (!tbody) return;
    
    // Clear efficiently
    tbody.innerHTML = '';
    
    if (!state.cachedSalesData || state.cachedSalesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No sales data</td></tr>';
        return;
    }
    
    // Get filter values
    const dateFilter = document.getElementById('salesDateFilter')?.value;
    const typeFilter = document.getElementById('salesTypeFilter')?.value || 'all';
    
    // Filter data
    let filteredData = state.cachedSalesData;
    
    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredData = filteredData.filter(sale => 
            sale.date.toDateString() === filterDate.toDateString()
        );
    }
    
    if (typeFilter !== 'all') {
        filteredData = filteredData.filter(sale => sale.paymentMethod === typeFilter);
    }
    
    // Limit display for performance
    const displayData = filteredData.slice(0, 50);
    
    displayData.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.id}</td>
            <td>${sale.date.toLocaleString('en-IN')}</td>
            <td>${sale.customer}</td>
            <td>${sale.itemsCount}</td>
            <td><span class="payment-badge ${sale.paymentMethod}">${sale.paymentMethod.toUpperCase()}</span></td>
            <td>₹${sale.amount.toFixed(2)}</td>
            <td>
                <button class="action-icon" onclick="viewSaleDetails('${sale.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-icon" onclick="reprintSaleBill('${sale.id}')">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Show count if limited
    if (filteredData.length > 50) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" style="text-align: center; color: #666;">Showing 50 of ${filteredData.length} records</td>`;
        tbody.appendChild(row);
    }
}

// Export functions for HTML onclick handlers
window.viewSaleDetails = function(saleId) {
    const sale = state.cachedSalesData?.find(s => s.id === saleId);
    if (sale) {
        alert(`Sale ${sale.id}\nAmount: ₹${sale.amount.toFixed(2)}\nDate: ${sale.date.toLocaleString()}`);
    }
};

window.reprintSaleBill = function(saleId) {
    const sale = state.cachedSalesData?.find(s => s.id === saleId);
    if (sale) {
        showToast(`Reprinting ${sale.id}`, 'info');
        setTimeout(() => showToast('Bill reprinted', 'success'), 500);
    }
};

function exportSalesToExcel() {
    showLoading();
    
    try {
        // Prepare data
        const exportData = state.cachedSalesData?.map(sale => ({
            'Bill ID': sale.id,
            'Date': sale.date.toLocaleString('en-IN'),
            'Customer': sale.customer,
            'Items': sale.itemsCount,
            'Payment': sale.paymentMethod.toUpperCase(),
            'Amount': sale.amount,
            'Status': sale.status
        })) || [];
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sales');
        
        // Export
        const fileName = `Sales_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('Excel file downloaded', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed', 'error');
    } finally {
        hideLoading();
    }
}

function printSalesReport() {
    showToast('Printing sales report...', 'info');
    setTimeout(() => {
        window.print();
        showToast('Report sent to printer', 'success');
    }, 500);
}

// ============================================
// TRANSACTIONS PAGE (OPTIMIZED)
// ============================================

function initTransactionsPage() {
    document.getElementById('applyTransFilter')?.addEventListener('click', () => {
        debounce('loadTransactionsData', loadTransactionsData, 300);
    });
    
    document.getElementById('exportTransBtn')?.addEventListener('click', exportTransactionsToExcel);
    
    // Lazy load
    setTimeout(loadTransactionsData, 100);
}

function loadTransactionsData() {
    const tbody = document.querySelector('#transactionsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!state.cachedTransactions || state.cachedTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No transactions</td></tr>';
        return;
    }
    
    // Get filters
    const dateFilter = document.getElementById('transDateFilter')?.value;
    const statusFilter = document.getElementById('transStatusFilter')?.value || 'all';
    
    // Filter
    let filteredData = state.cachedTransactions;
    
    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredData = filteredData.filter(t => 
            t.date.toDateString() === filterDate.toDateString()
        );
    }
    
    if (statusFilter !== 'all') {
        filteredData = filteredData.filter(t => t.status === statusFilter);
    }
    
    // Limit display
    const displayData = filteredData.slice(0, 50);
    
    displayData.forEach(trans => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trans.id}</td>
            <td>${trans.billNo}</td>
            <td>${trans.date.toLocaleString('en-IN')}</td>
            <td><span class="payment-badge ${trans.paymentMethod}">${trans.paymentMethod.toUpperCase()}</span></td>
            <td>${trans.customer}</td>
            <td>₹${trans.amount.toFixed(2)}</td>
            <td><span class="status-badge status-success">${trans.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function exportTransactionsToExcel() {
    showLoading();
    
    try {
        const exportData = state.cachedTransactions?.map(trans => ({
            'Transaction ID': trans.id,
            'Bill No': trans.billNo,
            'Date': trans.date.toLocaleString('en-IN'),
            'Payment': trans.paymentMethod.toUpperCase(),
            'Customer': trans.customer,
            'Amount': trans.amount,
            'Status': trans.status
        })) || [];
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
        
        const fileName = `Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('Transactions exported', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// DAILY SUMMARY PAGE (HEAVILY OPTIMIZED)
// ============================================

function initSummaryPage() {
    // Use lightweight event handlers
    document.getElementById('generateReportBtn')?.addEventListener('click', generatePDFReport);
    document.getElementById('emailReportBtn')?.addEventListener('click', emailReport);
    document.getElementById('endShiftBtn')?.addEventListener('click', endShift);
    
    // Initialize chart only when needed
    if (state.currentPage === 'summary') {
        setTimeout(initializeChartIfNeeded, 100);
    }
    
    // Load data with debounce
    debounce('loadSummaryData', loadSummaryData, 200);
}

function loadSummaryData() {
    if (state.currentPage !== 'summary') return;
    
    try {
        // Calculate summary data
        calculateSummaryData();
        
        // Update stats cards (batch updates)
        const updates = {
            'todaySales': `₹${state.summaryData.todaySales.toFixed(2)}`,
            'totalBills': state.summaryData.totalBills,
            'customersServed': state.summaryData.customersServed,
            'itemsSold': state.summaryData.itemsSold,
            'cashCollection': `₹${state.summaryData.cashCollection.toFixed(2)}`,
            'cashAmount': `₹${state.summaryData.cashAmount.toFixed(2)}`,
            'cardAmount': `₹${state.summaryData.cardAmount.toFixed(2)}`,
            'upiAmount': `₹${state.summaryData.upiAmount.toFixed(2)}`,
            'totalTransactions': state.summaryData.totalTransactions,
            'successfulTx': state.summaryData.successfulTx,
            'pendingTx': state.summaryData.pendingTx,
            'failedTx': state.summaryData.failedTx
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Update chart with throttling
        throttle('updateChart', updateSalesChart, PERFORMANCE.CHART_UPDATE_THROTTLE);
        
        // Load top products
        loadTopProducts();
        
    } catch (error) {
        console.error('Error loading summary data:', error);
    }
}

function calculateSummaryData() {
    // Reset data
    Object.keys(state.summaryData).forEach(key => {
        state.summaryData[key] = 0;
    });
    
    // Calculate from transactions
    if (state.cachedTransactions) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        state.cachedTransactions.forEach(trans => {
            const transDate = new Date(trans.date);
            transDate.setHours(0, 0, 0, 0);
            
            if (transDate.getTime() === today.getTime()) {
                state.summaryData.totalTransactions++;
                state.summaryData.successfulTx++;
                
                if (trans.amount > 0) {
                    state.summaryData.todaySales += trans.amount;
                    state.summaryData.totalBills++;
                    state.summaryData.cashCollection += trans.amount;
                    state.summaryData.customersServed++;
                    
                    switch(trans.paymentMethod) {
                        case 'cash': state.summaryData.cashAmount += trans.amount; break;
                        case 'card': state.summaryData.cardAmount += trans.amount; break;
                        case 'upi': state.summaryData.upiAmount += trans.amount; break;
                    }
                }
            }
        });
    }
}

function updateSummaryAfterTransaction(transaction) {
    if (transaction.amount > 0) {
        state.summaryData.todaySales += transaction.amount;
        state.summaryData.totalBills++;
        state.summaryData.customersServed++;
        state.summaryData.cashCollection += transaction.amount;
        state.summaryData.itemsSold += transaction.items.reduce((sum, item) => sum + item.qty, 0);
        
        switch(transaction.paymentMethod) {
            case 'cash': state.summaryData.cashAmount += transaction.amount; break;
            case 'card': state.summaryData.cardAmount += transaction.amount; break;
            case 'upi': state.summaryData.upiAmount += transaction.amount; break;
        }
    }
    
    state.summaryData.totalTransactions++;
    state.summaryData.successfulTx++;
}

function initializeChartIfNeeded() {
    if (state.isChartInitialized || !document.getElementById('salesChart')) {
        return;
    }
    
    try {
        const ctx = document.getElementById('salesChart').getContext('2d');
        
        // Create lightweight chart with minimal options
        state.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['9AM', '12PM', '3PM', '6PM'],
                datasets: [{
                    label: 'Sales',
                    data: [0, 0, 0, 0],
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.05)',
                    borderWidth: 1,
                    fill: true,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '₹' + value,
                            maxTicksLimit: 5
                        }
                    },
                    x: {
                        ticks: {
                            maxTicksLimit: 4
                        }
                    }
                },
                animation: {
                    duration: 500 // Shorter animation
                }
            }
        });
        
        state.isChartInitialized = true;
        console.log('Chart initialized with performance optimizations');
        
    } catch (error) {
        console.error('Chart initialization error:', error);
        // Fallback: Hide chart container
        const chartContainer = document.getElementById('salesChart')?.parentElement;
        if (chartContainer) {
            chartContainer.innerHTML = '<p style="color: #666; text-align: center;">Chart unavailable</p>';
        }
    }
}

function updateSalesChart() {
    if (!state.salesChart || !state.isChartInitialized) {
        return;
    }
    
    try {
        // Generate simple data (limited points)
        const hourlyData = [0, 0, 0, 0];
        
        if (state.cachedTransactions) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            state.cachedTransactions.forEach(trans => {
                const transDate = new Date(trans.date);
                transDate.setHours(0, 0, 0, 0);
                
                if (transDate.getTime() === today.getTime() && trans.amount > 0) {
                    const hour = trans.date.getHours();
                    
                    // Simple hour grouping
                    if (hour < 12) hourlyData[0] += trans.amount;
                    else if (hour < 15) hourlyData[1] += trans.amount;
                    else if (hour < 18) hourlyData[2] += trans.amount;
                    else hourlyData[3] += trans.amount;
                }
            });
        }
        
        // Update chart data
        state.salesChart.data.datasets[0].data = hourlyData;
        state.salesChart.update('none'); // Update without animation
        
    } catch (error) {
        console.error('Chart update error:', error);
    }
}

function loadTopProducts() {
    const container = document.getElementById('topProductsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Simple top products calculation
    const productSales = {};
    
    if (state.cachedSalesData) {
        state.cachedSalesData.forEach(sale => {
            // Simplified: just count sales per product category
            const productName = sale.paymentMethod === 'cash' ? 'Cash Sales' : 
                               sale.paymentMethod === 'card' ? 'Card Sales' : 'UPI Sales';
            
            if (!productSales[productName]) {
                productSales[productName] = 0;
            }
            productSales[productName] += sale.amount;
        });
    }
    
    // Display top 3
    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    if (topProducts.length === 0) {
        container.innerHTML = '<div class="no-data">No sales data yet</div>';
        return;
    }
    
    topProducts.forEach(([name, amount], index) => {
        const productEl = document.createElement('div');
        productEl.className = 'product-item';
        productEl.innerHTML = `
            <div class="product-icon" style="background: ${getChartColor(index)}">
                <i class="fas fa-${getProductIconByIndex(index)}"></i>
            </div>
            <div class="product-info">
                <h4>${name}</h4>
                <p>#${index + 1} in sales</p>
            </div>
            <div class="product-sales">
                <div class="amount">₹${amount.toFixed(2)}</div>
            </div>
        `;
        container.appendChild(productEl);
    });
}

function getChartColor(index) {
    const colors = [
        'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
        'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    ];
    return colors[index % colors.length];
}

function getProductIconByIndex(index) {
    const icons = ['money-bill-wave', 'credit-card', 'mobile-alt'];
    return icons[index % icons.length];
}

function generatePDFReport() {
    showLoading();
    
    try {
        // Use jsPDF in safe mode
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Simple report
        doc.setFontSize(16);
        doc.text('Daily Summary Report', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 40);
        doc.text(`Cashier: ${document.getElementById('cashierName')?.textContent || 'N/A'}`, 20, 50);
        
        doc.text(`Total Sales: ₹${state.summaryData.todaySales.toFixed(2)}`, 20, 70);
        doc.text(`Transactions: ${state.summaryData.totalTransactions}`, 20, 80);
        
        // Save
        const fileName = `Summary_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        
        showToast('PDF report downloaded', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Failed to generate PDF', 'error');
    } finally {
        hideLoading();
    }
}

function emailReport() {
    const email = prompt('Enter email address:');
    if (email) {
        showToast(`Report sent to ${email}`, 'success');
    }
}

function endShift() {
    if (confirm('End current shift?')) {
        showLoading();
        setTimeout(() => {
            showToast('Shift ended successfully', 'success');
            hideLoading();
        }, 1000);
    }
}

// ============================================
// MODAL MANAGEMENT (OPTIMIZED)
// ============================================

function initModals() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Close on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModals();
        });
    });
    
    // Notification button
    document.getElementById('notificationsBtn')?.addEventListener('click', openNotificationModal);
}

function openProductSearchModal() {
    const modal = document.getElementById('productSearchModal');
    if (!modal) return;
    
    modal.classList.add('show');
    
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        loadSearchResults('');
        
        // Debounced search
        searchInput.addEventListener('input', (e) => {
            debounce('searchProducts', () => {
                loadSearchResults(e.target.value);
            }, PERFORMANCE.DEBOUNCE_DELAY);
        });
    }
}

function loadSearchResults(query) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    const searchTerm = query.toLowerCase().trim();
    
    // Filter products
    let filteredProducts = products;
    if (searchTerm) {
        filteredProducts = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.code.toLowerCase().includes(searchTerm)
        );
    }
    
    // Clear and render
    resultsContainer.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No products found</div>';
        return;
    }
    
    // Limit results
    const displayProducts = filteredProducts.slice(0, 10);
    
    displayProducts.forEach(product => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <div class="result-info">
                <h4>${product.name}</h4>
                <p>₹${product.price.toFixed(2)} | Stock: ${product.stock}</p>
            </div>
            <button class="add-to-bill-btn" onclick="addProductToBill('${product.code}')">
                <i class="fas fa-plus"></i>
            </button>
        `;
        resultsContainer.appendChild(item);
    });
}

// Global function for onclick handler
window.addProductToBill = function(productCode) {
    const product = products.find(p => p.code === productCode);
    if (!product) return;
    
    if (state.bill.items.length >= PERFORMANCE.MAX_ITEMS_IN_BILL) {
        showToast('Bill item limit reached', 'error');
        return;
    }
    
    const existingItem = state.bill.items.find(item => item.code === product.code);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        state.bill.items.push({ ...product, qty: 1 });
    }
    
    renderBill();
    closeModals();
    
    if (state.currentPage !== 'billing') {
        navigateToPage('billing');
    }
    
    showToast('Product added', 'success');
};

function openNotificationModal() {
    const modal = document.getElementById('notificationModal');
    const list = document.getElementById('notificationList');
    
    if (!modal || !list) return;
    
    list.innerHTML = '';
    
    // Limit notifications
    const displayNotifications = state.notifications.slice(0, PERFORMANCE.MAX_NOTIFICATIONS);
    
    if (displayNotifications.length === 0) {
        list.innerHTML = '<div class="no-notifications">No notifications</div>';
    } else {
        displayNotifications.forEach(notif => {
            const el = document.createElement('div');
            el.className = `notification ${notif.type}`;
            el.innerHTML = `
                <i class="fas fa-bell"></i>
                <div>${notif.msg}</div>
            `;
            list.appendChild(el);
        });
    }
    
    modal.classList.add('show');
}

function updateNotificationBadge() {
    const badge = document.querySelector('.badge');
    if (badge) {
        const count = Math.min(state.notifications.length, 99);
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

// ============================================
// RECEIPT FUNCTIONALITY (OPTIMIZED)
// ============================================

function printReceipt(transaction) {
    try {
        // Simple receipt printing
        const printWindow = window.open('', '_blank');
        
        let itemsHTML = '';
        if (transaction.items) {
            transaction.items.forEach(item => {
                itemsHTML += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.qty}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>₹${(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                `;
            });
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: monospace; width: 80mm; padding: 10px; }
                    table { width: 100%; border-collapse: collapse; }
                    td, th { padding: 5px; border-bottom: 1px dashed #000; }
                    .total { font-weight: bold; border-top: 2px solid #000; }
                </style>
            </head>
            <body>
                <h3>RETAILX STORE</h3>
                <p>Bill: ${transaction.billNo}</p>
                <p>Date: ${new Date().toLocaleString('en-IN')}</p>
                <hr>
                <table>
                    ${itemsHTML}
                </table>
                <hr>
                <p class="total">Total: ₹${transaction.amount.toFixed(2)}</p>
                <p>Thank you!</p>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 100);
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
    } catch (error) {
        console.error('Print error:', error);
        showToast('Print failed', 'error');
    }
}

// ============================================
// UTILITY FUNCTIONS (PERFORMANCE OPTIMIZED)
// ============================================

function showToast(message, type = 'info') {
    try {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        // Clear any existing timeout
        if (toast.timeoutId) {
            clearTimeout(toast.timeoutId);
        }
        
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        // Auto hide
        toast.timeoutId = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
        
    } catch (error) {
        console.error('Toast error:', error);
    }
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

function initEventListeners() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Logout?')) {
            showLoading();
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // Ctrl+N: New bill
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        navigateToPage('billing');
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
        closeModals();
    }
}

// ============================================
// PERFORMANCE UTILITIES
// ============================================

function debounce(id, fn, delay) {
    // Clear existing timer
    if (state.debounceTimers[id]) {
        clearTimeout(state.debounceTimers[id]);
    }
    
    // Set new timer
    state.debounceTimers[id] = setTimeout(() => {
        fn();
        delete state.debounceTimers[id];
    }, delay);
}

function throttle(id, fn, limit) {
    if (state.debounceTimers[id]) return;
    
    fn();
    
    state.debounceTimers[id] = setTimeout(() => {
        delete state.debounceTimers[id];
    }, limit);
}

function startMemoryMonitor() {
    // Development only - monitor memory usage
    if (window.performance && window.performance.memory) {
        setInterval(() => {
            const memory = window.performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
            
            if (usedMB > 50) { // 50MB threshold
                console.warn(`High memory usage: ${usedMB}MB / ${totalMB}MB`);
                
                // Force garbage collection if available
                if (window.gc) {
                    window.gc();
                }
            }
        }, 30000); // Check every 30 seconds
    }
}

// ============================================
// CLEANUP ON PAGE UNLOAD
// ============================================

window.addEventListener('beforeunload', () => {
    // Clean up chart
    if (state.salesChart) {
        try {
            state.salesChart.destroy();
        } catch (e) {
            // Ignore destruction errors
        }
    }
    
    // Clear all timeouts
    Object.values(state.debounceTimers).forEach(timer => {
        clearTimeout(timer);
    });
    
    // Clear state
    state.bill.items = [];
    state.notifications = [];
    state.cachedSalesData = null;
    state.cachedTransactions = null;
});

console.log('Performance-optimized RetailX Dashboard loaded');