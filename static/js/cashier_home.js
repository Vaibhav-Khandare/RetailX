// DOM Elements
const elements = {
    // Navigation
    menuItems: document.querySelectorAll('.menu-item'),
    pages: document.querySelectorAll('.page'),
    pageTitle: document.getElementById('pageTitle'),
    breadcrumb: document.getElementById('breadcrumb'),
    
    // Dashboard
    todaySales: document.getElementById('todaySales'),
    totalBills: document.getElementById('totalBills'),
    customersServed: document.getElementById('customersServed'),
    itemsSold: document.getElementById('itemsSold'),
    recentTransactions: document.querySelector('#recentTransactions tbody'),
    
    // Quick Actions
    newBillBtn: document.getElementById('newBillBtn'),
    quickSaleBtn: document.getElementById('quickSaleBtn'),
    checkInventoryBtn: document.getElementById('checkInventoryBtn'),
    printLastBtn: document.getElementById('printLastBtn'),
    
    // Billing
    productCode: document.getElementById('productCode'),
    scanBtn: document.getElementById('scanBtn'),
    searchProductBtn: document.getElementById('searchProductBtn'),
    billItems: document.getElementById('billItems'),
    subtotal: document.getElementById('subtotal'),
    gstAmount: document.getElementById('gstAmount'),
    discountInput: document.getElementById('discountInput'),
    applyDiscount: document.getElementById('applyDiscount'),
    discountAmount: document.getElementById('discountAmount'),
    totalAmount: document.getElementById('totalAmount'),
    amountReceived: document.getElementById('amountReceived'),
    changeAmount: document.getElementById('changeAmount'),
    paymentMethods: document.querySelectorAll('.payment-method'),
    clearBillBtn: document.getElementById('clearBillBtn'),
    processPaymentBtn: document.getElementById('processPaymentBtn'),
    printBillBtn: document.getElementById('printBillBtn'),
    
    // Modals
    productSearchModal: document.getElementById('productSearchModal'),
    notificationModal: document.getElementById('notificationModal'),
    notificationsBtn: document.getElementById('notificationsBtn'),
    
    // Toast
    toast: document.getElementById('toast'),
    
    // Time
    currentDate: document.getElementById('currentDate'),
    currentTime: document.getElementById('currentTime')
};

// State Management
let state = {
    currentPage: 'dashboard',
    bill: {
        items: [],
        subtotal: 0,
        gst: 0,
        discount: 0,
        total: 0,
        discountPercentage: 0
    },
    selectedPaymentMethod: 'cash',
    cashierData: {
        name: 'John Doe',
        id: 'CSH001',
        shift: '08:00 - 16:00',
        store: 'Main Branch'
    },
    notifications: [
        { id: 1, type: 'info', message: 'Low stock alert: Product #P123', time: '10:30 AM' },
        { id: 2, type: 'success', message: 'Bill #INV-001 processed successfully', time: '09:45 AM' },
        { id: 3, type: 'warning', message: 'Printer requires maintenance', time: 'Yesterday' }
    ]
};

// Sample Data
const sampleProducts = [
    { id: 'P001', name: 'Premium Coffee 500g', price: 899.99, stock: 45, category: 'Beverages' },
    { id: 'P002', name: 'Organic Tea 250g', price: 499.99, stock: 32, category: 'Beverages' },
    { id: 'P003', name: 'Wireless Mouse', price: 1299.99, stock: 15, category: 'Electronics' },
    { id: 'P004', name: 'USB Type-C Cable', price: 299.99, stock: 87, category: 'Electronics' },
    { id: 'P005', name: 'Notebook Set', price: 249.99, stock: 56, category: 'Stationery' }
];

const sampleTransactions = [
    { id: 'INV-001', time: '10:30 AM', customer: 'Regular Customer', amount: 2499.99, status: 'Paid' },
    { id: 'INV-002', time: '09:45 AM', customer: 'Walk-in Customer', amount: 1599.99, status: 'Paid' },
    { id: 'INV-003', time: '09:15 AM', customer: 'Member #M123', amount: 3299.99, status: 'Refunded' },
    { id: 'INV-004', time: 'Yesterday', customer: 'Online Order', amount: 4599.99, status: 'Paid' }
];

// Initialize Application
function init() {
    setupEventListeners();
    updateDateTime();
    loadDashboardData();
    generateBillNumber();
    updateBillDate();
    loadNotifications();
    updateCashierInfo();
    
    // Set interval for time updates
    setInterval(updateDateTime, 1000);
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    elements.menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });
    
    // Quick Actions
    elements.newBillBtn.addEventListener('click', () => navigateToPage('billing'));
    elements.quickSaleBtn.addEventListener('click', quickSale);
    elements.checkInventoryBtn.addEventListener('click', checkInventory);
    elements.printLastBtn.addEventListener('click', printLastBill);
    
    // Billing
    elements.scanBtn.addEventListener('click', scanProduct);
    elements.searchProductBtn.addEventListener('click', openProductSearch);
    elements.productCode.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addProductByCode();
    });
    elements.applyDiscount.addEventListener('click', applyDiscount);
    elements.discountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyDiscount();
    });
    elements.clearBillBtn.addEventListener('click', clearBill);
    elements.processPaymentBtn.addEventListener('click', processPayment);
    elements.printBillBtn.addEventListener('click', printBill);
    
    // Payment Methods
    elements.paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            elements.paymentMethods.forEach(m => m.classList.remove('active'));
            method.classList.add('active');
            state.selectedPaymentMethod = method.dataset.method;
        });
    });
    
    // Amount Received Calculation
    elements.amountReceived.addEventListener('input', calculateChange);
    
    // Notifications
    elements.notificationsBtn.addEventListener('click', openNotifications);
    
    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Navigation
function navigateToPage(page) {
    // Update active menu item
    elements.menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Update active page
    elements.pages.forEach(p => {
        p.classList.remove('active');
        if (p.id === `${page}-page`) {
            p.classList.add('active');
        }
    });
    
    // Update page title and breadcrumb
    const pageTitles = {
        dashboard: 'Dashboard',
        billing: 'Billing',
        sales: 'Sales Entry',
        inventory: 'Quick Inventory',
        transactions: 'Transactions',
        summary: 'Daily Summary'
    };
    
    const breadcrumbs = {
        dashboard: 'Home / Dashboard',
        billing: 'Home / Billing',
        sales: 'Home / Sales Entry',
        inventory: 'Home / Quick Inventory',
        transactions: 'Home / Transactions',
        summary: 'Home / Daily Summary'
    };
    
    elements.pageTitle.textContent = pageTitles[page];
    elements.breadcrumb.textContent = breadcrumbs[page];
    state.currentPage = page;
    
    // Load page-specific data
    if (page === 'dashboard') {
        loadDashboardData();
    } else if (page === 'sales') {
        loadSalesData();
    } else if (page === 'summary') {
        loadSummaryData();
    }
}

// Dashboard Functions
function loadDashboardData() {
    // Simulate AJAX loading
    simulateAjax(() => {
        elements.todaySales.textContent = '₹' + (Math.random() * 10000 + 5000).toFixed(2);
        elements.totalBills.textContent = Math.floor(Math.random() * 20 + 5);
        elements.customersServed.textContent = Math.floor(Math.random() * 50 + 15);
        elements.itemsSold.textContent = Math.floor(Math.random() * 200 + 50);
        
        // Load recent transactions
        loadRecentTransactions();
    });
}

function loadRecentTransactions() {
    elements.recentTransactions.innerHTML = '';
    sampleTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.time}</td>
            <td>${transaction.customer}</td>
            <td>₹${transaction.amount.toFixed(2)}</td>
            <td><span class="status-badge status-${transaction.status.toLowerCase()}">${transaction.status}</span></td>
        `;
        elements.recentTransactions.appendChild(row);
    });
}

// Billing Functions
function generateBillNumber() {
    const billNumber = 'INV-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    document.getElementById('billNumber').textContent = billNumber;
}

function updateBillDate() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    document.getElementById('billDate').textContent = formattedDate;
}

function addProductByCode() {
    const code = elements.productCode.value.trim();
    if (!code) {
        showToast('Please enter a product code', 'error');
        return;
    }
    
    const product = sampleProducts.find(p => p.id === code);
    if (product) {
        addProductToBill(product);
        elements.productCode.value = '';
        showToast(`${product.name} added to bill`, 'success');
    } else {
        showToast('Product not found', 'error');
    }
}

function scanProduct() {
    // Simulate barcode scanning
    showToast('Scanning... Please wait', 'info');
    
    setTimeout(() => {
        const randomProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        addProductToBill(randomProduct);
        showToast(`Scanned: ${randomProduct.name}`, 'success');
    }, 1000);
}

function addProductToBill(product) {
    // Check if product already exists in bill
    const existingItem = state.bill.items.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.total = existingItem.quantity * existingItem.price;
    } else {
        state.bill.items.push({
            ...product,
            quantity: 1,
            total: product.price
        });
    }
    
    updateBillDisplay();
}

function updateBillDisplay() {
    elements.billItems.innerHTML = '';
    
    state.bill.items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${item.name}</strong><br>
                <small>${item.id} | ${item.category}</small>
            </td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
            </td>
            <td>₹${item.total.toFixed(2)}</td>
            <td>
                <button class="remove-btn" onclick="removeItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        elements.billItems.appendChild(row);
    });
    
    calculateBillTotals();
}

function updateQuantity(index, change) {
    const item = state.bill.items[index];
    item.quantity = Math.max(1, item.quantity + change);
    item.total = item.quantity * item.price;
    updateBillDisplay();
}

function removeItem(index) {
    state.bill.items.splice(index, 1);
    updateBillDisplay();
    showToast('Item removed from bill', 'warning');
}

function calculateBillTotals() {
    state.bill.subtotal = state.bill.items.reduce((sum, item) => sum + item.total, 0);
    state.bill.gst = state.bill.subtotal * 0.18;
    state.bill.discount = state.bill.subtotal * (state.bill.discountPercentage / 100);
    state.bill.total = state.bill.subtotal + state.bill.gst - state.bill.discount;
    
    updateBillSummary();
}

function updateBillSummary() {
    elements.subtotal.textContent = '₹' + state.bill.subtotal.toFixed(2);
    elements.gstAmount.textContent = '₹' + state.bill.gst.toFixed(2);
    elements.discountAmount.textContent = '₹' + state.bill.discount.toFixed(2);
    elements.totalAmount.textContent = '₹' + state.bill.total.toFixed(2);
}

function applyDiscount() {
    const discountValue = parseInt(elements.discountInput.value) || 0;
    if (discountValue < 0 || discountValue > 100) {
        showToast('Discount must be between 0-100%', 'error');
        return;
    }
    
    state.bill.discountPercentage = discountValue;
    calculateBillTotals();
    showToast(`${discountValue}% discount applied`, 'success');
}

function calculateChange() {
    const amountReceived = parseFloat(elements.amountReceived.value) || 0;
    const change = amountReceived - state.bill.total;
    
    if (change >= 0) {
        elements.changeAmount.textContent = `Change: ₹${change.toFixed(2)}`;
        elements.changeAmount.style.color = '#2ecc71';
    } else {
        elements.changeAmount.textContent = `Short: ₹${Math.abs(change).toFixed(2)}`;
        elements.changeAmount.style.color = '#e74c3c';
    }
}

function clearBill() {
    if (state.bill.items.length === 0) {
        showToast('Bill is already empty', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear the current bill?')) {
        state.bill.items = [];
        state.bill.discountPercentage = 0;
        elements.discountInput.value = '';
        elements.amountReceived.value = '';
        updateBillDisplay();
        generateBillNumber();
        showToast('Bill cleared successfully', 'success');
    }
}

function processPayment() {
    if (state.bill.items.length === 0) {
        showToast('Add items to bill first', 'error');
        return;
    }
    
    const amountReceived = parseFloat(elements.amountReceived.value) || 0;
    if (amountReceived < state.bill.total) {
        showToast('Amount received is less than total', 'error');
        return;
    }
    
    // Simulate payment processing
    showToast('Processing payment...', 'info');
    
    setTimeout(() => {
        // Record transaction
        const transaction = {
            id: document.getElementById('billNumber').textContent,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            customer: 'Walk-in Customer',
            amount: state.bill.total,
            status: 'Paid',
            paymentMethod: state.selectedPaymentMethod
        };
        
        sampleTransactions.unshift(transaction);
        
        // Update dashboard stats
        loadDashboardData();
        
        // Reset bill
        state.bill.items = [];
        state.bill.discountPercentage = 0;
        elements.discountInput.value = '';
        elements.amountReceived.value = '';
        updateBillDisplay();
        generateBillNumber();
        
        showToast(`Payment of ₹${state.bill.total.toFixed(2)} processed successfully!`, 'success');
    }, 2000);
}

function printBill() {
    if (state.bill.items.length === 0) {
        showToast('No items to print', 'error');
        return;
    }
    
    // Create printable content
    const printContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="text-align: center; color: #FF4A2D;">RetailX Invoice</h2>
            <p><strong>Bill No:</strong> ${document.getElementById('billNumber').textContent}</p>
            <p><strong>Date:</strong> ${document.getElementById('billDate').textContent}</p>
            <p><strong>Cashier:</strong> ${state.cashierData.name}</p>
            <hr>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="padding: 10px; text-align: left;">Item</th>
                        <th style="padding: 10px; text-align: right;">Qty</th>
                        <th style="padding: 10px; text-align: right;">Price</th>
                        <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.bill.items.map(item => `
                        <tr>
                            <td style="padding: 8px;">${item.name}</td>
                            <td style="padding: 8px; text-align: right;">${item.quantity}</td>
                            <td style="padding: 8px; text-align: right;">₹${item.price.toFixed(2)}</td>
                            <td style="padding: 8px; text-align: right;">₹${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <hr>
            <div style="text-align: right;">
                <p><strong>Subtotal:</strong> ₹${state.bill.subtotal.toFixed(2)}</p>
                <p><strong>GST (18%):</strong> ₹${state.bill.gst.toFixed(2)}</p>
                <p><strong>Discount:</strong> ₹${state.bill.discount.toFixed(2)}</p>
                <p><strong style="font-size: 18px;">Total:</strong> ₹${state.bill.total.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> ${state.selectedPaymentMethod.toUpperCase()}</p>
            </div>
            <hr>
            <p style="text-align: center; margin-top: 30px;">
                Thank you for shopping with us!<br>
                Visit again
            </p>
        </div>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    showToast('Bill sent to printer', 'success');
}

// Product Search Modal
function openProductSearch() {
    elements.productSearchModal.style.display = 'flex';
    document.getElementById('productSearchInput').focus();
    
    // Add event listener for search input
    document.getElementById('productSearchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = sampleProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.id.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
        
        displaySearchResults(filteredProducts);
    });
    
    // Display all products initially
    displaySearchResults(sampleProducts);
}

function displaySearchResults(products) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'search-result-item';
        productElement.innerHTML = `
            <div>
                <strong>${product.name}</strong>
                <small>${product.id} | ${product.category}</small>
            </div>
            <div>
                <span>₹${product.price.toFixed(2)}</span>
                <span style="color: ${product.stock < 10 ? '#e74c3c' : '#2ecc71'};">
                    Stock: ${product.stock}
                </span>
                <button onclick="addProductFromSearch('${product.id}')" class="add-btn">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>
        `;
        resultsContainer.appendChild(productElement);
    });
}

function addProductFromSearch(productId) {
    const product = sampleProducts.find(p => p.id === productId);
    if (product) {
        addProductToBill(product);
        elements.productSearchModal.style.display = 'none';
        showToast(`${product.name} added to bill`, 'success');
    }
}

// Quick Actions
function quickSale() {
    // Add a random product for quick sale
    const randomProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
    addProductToBill(randomProduct);
    navigateToPage('billing');
    showToast(`Quick sale: ${randomProduct.name} added`, 'success');
}

function checkInventory() {
    // Open product search with low stock filter
    openProductSearch();
    document.getElementById('productSearchInput').value = '';
    const lowStockProducts = sampleProducts.filter(p => p.stock < 20);
    displaySearchResults(lowStockProducts);
    showToast('Showing low stock items', 'info');
}

function printLastBill() {
    if (sampleTransactions.length > 0) {
        showToast('Printing last bill...', 'info');
        // In a real app, this would fetch and print the last bill
        setTimeout(() => {
            showToast('Last bill sent to printer', 'success');
        }, 1000);
    } else {
        showToast('No recent bills found', 'error');
    }
}

// Notifications
function loadNotifications() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    state.notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item notification-${notification.type}`;
        notificationElement.innerHTML = `
            <div class="notification-content">
                <p>${notification.message}</p>
                <small>${notification.time}</small>
            </div>
        `;
        notificationList.appendChild(notificationElement);
    });
}

function openNotifications() {
    elements.notificationModal.style.display = 'flex';
    loadNotifications();
}

// Date and Time
function updateDateTime() {
    const now = new Date();
    
    // Update date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDate.textContent = now.toLocaleDateString('en-IN', options);
    
    // Update time
    elements.currentTime.textContent = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

// Cashier Info
function updateCashierInfo() {
    document.getElementById('cashierName').textContent = state.cashierData.name;
    document.getElementById('cashierId').textContent = `ID: ${state.cashierData.id}`;
    document.getElementById('shiftTime').textContent = state.cashierData.shift;
    document.getElementById('storeName').textContent = state.cashierData.store;
}

// Toast Notification
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = 'toast';
    
    // Set color based on type
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    elements.toast.style.backgroundColor = colors[type] || colors.info;
    elements.toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// AJAX Simulation
function simulateAjax(callback, delay = 1000) {
    showToast('Loading data...', 'info');
    setTimeout(() => {
        callback();
        showToast('Data loaded successfully', 'success');
    }, delay);
}

// Sales Data (for sales page)
function loadSalesData() {
    // This would be an AJAX call in real application
    simulateAjax(() => {
        // Update sales table
        const salesTable = document.querySelector('#salesTable tbody');
        if (salesTable) {
            salesTable.innerHTML = sampleTransactions.map(transaction => `
                <tr>
                    <td>${transaction.id}</td>
                    <td>${new Date().toLocaleString('en-IN')}</td>
                    <td>${transaction.customer}</td>
                    <td>${Math.floor(Math.random() * 5) + 1} items</td>
                    <td>${transaction.status}</td>
                    <td>₹${transaction.amount.toFixed(2)}</td>
                    <td>
                        <button class="action-icon" title="View Details"><i class="fas fa-eye"></i></button>
                        <button class="action-icon" title="Print"><i class="fas fa-print"></i></button>
                        <button class="action-icon" title="Refund"><i class="fas fa-undo"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    });
}

// Summary Data (for summary page)
function loadSummaryData() {
    simulateAjax(() => {
        const today = new Date();
        document.getElementById('summaryDate').textContent = today.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Update summary stats
        document.getElementById('cashCollection').textContent = '₹' + (Math.random() * 50000 + 10000).toFixed(2);
        document.getElementById('cashAmount').textContent = '₹' + (Math.random() * 30000 + 5000).toFixed(2);
        document.getElementById('cardAmount').textContent = '₹' + (Math.random() * 20000 + 3000).toFixed(2);
        document.getElementById('upiAmount').textContent = '₹' + (Math.random() * 10000 + 2000).toFixed(2);
        document.getElementById('totalTransactions').textContent = Math.floor(Math.random() * 50 + 10);
        document.getElementById('successfulTx').textContent = Math.floor(Math.random() * 45 + 8);
        document.getElementById('refundedTx').textContent = Math.floor(Math.random() * 3 + 1);
        document.getElementById('voidTx').textContent = Math.floor(Math.random() * 2);
    });
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showToast('Logging out...', 'info');
        setTimeout(() => {
            // In a real app, this would redirect to login page
            alert('Logged out successfully. Redirecting to login...');
            // window.location.href = '/cashier_login';
        }, 1500);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally for inline onclick handlers
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.addProductFromSearch = addProductFromSearch;