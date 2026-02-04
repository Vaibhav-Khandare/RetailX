// =====================
// GLOBAL STATE
// =====================
const state = {
    currentPage: 'dashboard',
    bill: {
        items: [],
        subtotal: 0,
        gst: 0,
        discountPercent: 0,
        discountAmount: 0,
        total: 0
    },
    paymentMethod: 'cash',
    notifications: [
        { type: 'info', msg: 'Low stock: Wireless Mouse' },
        { type: 'success', msg: 'Bill INV-023 completed' },
        { type: 'warning', msg: 'Printer needs paper' }
    ]
};

// =====================
// SAMPLE DATA
// =====================
const products = [
    { code: 'P001', name: 'Coffee 500g', price: 450 },
    { code: 'P002', name: 'Tea 250g', price: 220 },
    { code: 'P003', name: 'Wireless Mouse', price: 1299 },
    { code: 'P004', name: 'USB Cable', price: 299 }
];

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDateTime();
    initDashboard();
    initBilling();
    initModals();
    initNotifications();
});

// =====================
// SIDEBAR NAVIGATION
// =====================
function initNavigation() {
    document.querySelectorAll('.menu-item[data-page]').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();

            const page = item.dataset.page;
            switchPage(page);

            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');

    document.getElementById('pageTitle').innerText =
        page.charAt(0).toUpperCase() + page.slice(1);

    document.getElementById('breadcrumb').innerText = `Home / ${page}`;
}

// =====================
// DATE & TIME
// =====================
function initDateTime() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDate').innerText =
        now.toLocaleDateString('en-IN');
    document.getElementById('currentTime').innerText =
        now.toLocaleTimeString('en-IN');
}

// =====================
// DASHBOARD
// =====================
function initDashboard() {
    document.getElementById('todaySales').innerText = `₹${random(5000,15000)}`;
    document.getElementById('totalBills').innerText = random(10,40);
    document.getElementById('customersServed').innerText = random(15,50);
    document.getElementById('itemsSold').innerText = random(50,200);

    loadRecentTransactions();
}

function loadRecentTransactions() {
    const tbody = document.querySelector('#recentTransactions tbody');
    tbody.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        tbody.innerHTML += `
            <tr>
                <td>INV-00${i}</td>
                <td>${random(9,12)}:${random(10,59)} AM</td>
                <td>Walk-in</td>
                <td>₹${random(500,3000)}</td>
                <td><span class="status-badge status-paid">Paid</span></td>
            </tr>
        `;
    }
}

// =====================
// BILLING
// =====================
function initBilling() {
    document.getElementById('scanBtn').onclick = addProductByCode;
    document.getElementById('applyDiscount').onclick = applyDiscount;
    document.getElementById('amountReceived').oninput = calculateChange;
    document.getElementById('clearBillBtn').onclick = clearBill;
    document.getElementById('processPaymentBtn').onclick = processPayment;

    document.querySelectorAll('.payment-method').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.paymentMethod = btn.dataset.method;
        };
    });

    updateBillDate();
}

function addProductByCode() {
    const code = document.getElementById('productCode').value.trim();
    const product = products.find(p => p.code === code);
    if (!product) return showToast('Product not found', 'error');

    state.bill.items.push({ ...product, qty: 1 });
    renderBill();
    showToast('Product added', 'success');
}

function renderBill() {
    const tbody = document.getElementById('billItems');
    tbody.innerHTML = '';

    state.bill.subtotal = 0;

    state.bill.items.forEach((item, index) => {
        const total = item.price * item.qty;
        state.bill.subtotal += total;

        tbody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>₹${item.price}</td>
                <td>${item.qty}</td>
                <td>₹${total}</td>
                <td><button onclick="removeItem(${index})">✖</button></td>
            </tr>
        `;
    });

    calculateTotals();
}

function calculateTotals() {
    state.bill.gst = state.bill.subtotal * 0.18;
    state.bill.discountAmount = (state.bill.subtotal * state.bill.discountPercent) / 100;
    state.bill.total = state.bill.subtotal + state.bill.gst - state.bill.discountAmount;

    document.getElementById('subtotal').innerText = `₹${state.bill.subtotal.toFixed(2)}`;
    document.getElementById('gstAmount').innerText = `₹${state.bill.gst.toFixed(2)}`;
    document.getElementById('discountAmount').innerText = `₹${state.bill.discountAmount.toFixed(2)}`;
    document.getElementById('totalAmount').innerText = `₹${state.bill.total.toFixed(2)}`;
}

function applyDiscount() {
    state.bill.discountPercent = Number(document.getElementById('discountInput').value || 0);
    calculateTotals();
}

function calculateChange() {
    const received = Number(document.getElementById('amountReceived').value || 0);
    const change = received - state.bill.total;
    document.getElementById('changeAmount').innerText = `Change: ₹${change.toFixed(2)}`;
}

function clearBill() {
    state.bill.items = [];
    state.bill.discountPercent = 0;
    renderBill();
    showToast('Bill cleared');
}

function processPayment() {
    if (!state.bill.items.length) return showToast('No items in bill', 'error');
    showToast('Payment successful', 'success');
    clearBill();
}

function removeItem(index) {
    state.bill.items.splice(index, 1);
    renderBill();
}

function updateBillDate() {
    document.getElementById('billDate').innerText =
        new Date().toLocaleDateString('en-IN');
}

// =====================
// MODALS
// =====================
function initModals() {
    document.getElementById('searchProductBtn').onclick = () =>
        openModal('productSearchModal');

    document.querySelectorAll('.modal-close').forEach(btn =>
        btn.onclick = () => closeModals()
    );
}

function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
}

// =====================
// NOTIFICATIONS
// =====================
function initNotifications() {
    document.getElementById('notificationsBtn').onclick = () => {
        const list = document.getElementById('notificationList');
        list.innerHTML = '';
        state.notifications.forEach(n => {
            list.innerHTML += `<div class="notification ${n.type}">${n.msg}</div>`;
        });
        openModal('notificationModal');
    };
}

// =====================
// TOAST
// =====================
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// =====================
// UTILS
// =====================
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
