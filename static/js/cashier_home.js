// =====================================================================
// RETAILX ADVANCED POS - CASHIER TERMINAL LOGIC
// =====================================================================

console.log('🚀 Initializing RetailX Advanced POS Terminal...');

window.RetailX = window.RetailX || {};

// ============================================
// CORE STATE & CONFIGURATION
// ============================================
RetailX.Config = {
    taxRate: 0.085, // 8.5% Standard Tax
    currencySymbol: '$',
    storeName: 'RetailX Main',
    registerId: 'REG-04',
    maxCartItems: 100
};

RetailX.State = {
    cart: [],
    discountType: 'percent', // 'percent' or 'amount'
    discountValue: 0,
    currentCustomer: null,
    currentBillNo: '',
    paymentMethod: 'cash',
    shift: {
        startTime: new Date(),
        totalSales: 0,
        totalRefunds: 0,
        billsGenerated: 0,
        itemsSold: 0,
        cashTendered: 0,
        cardTendered: 0,
        digitalTendered: 0
    },
    transactions: [], // Session history
    // NEW: Hold bills storage
    heldBills: []
};

// ============================================
// MOCK DATABASE (Simulating Backend)
// ============================================
RetailX.Database = {
    products: [
        { sku: '10001', barcode: '012345678901', name: 'Premium Coffee Beans 1kg', category: 'Grocery', price: 24.99, stock: 45 },
        { sku: '10002', barcode: '012345678902', name: 'Organic Green Tea', category: 'Grocery', price: 12.50, stock: 120 },
        { sku: '20001', barcode: '012345678903', name: 'Wireless Mouse', category: 'Electronics', price: 29.99, stock: 15 },
        { sku: '20002', barcode: '012345678904', name: 'USB-C Fast Charger', category: 'Electronics', price: 19.99, stock: 50 },
        { sku: '30001', barcode: '012345678905', name: 'Cotton T-Shirt (M)', category: 'Apparel', price: 15.00, stock: 200 },
        { sku: '40001', barcode: '012345678906', name: 'Water Bottle 1L', category: 'Accessories', price: 9.99, stock: 85 }
    ],

    searchProducts: function(query) {
        query = query.toLowerCase().trim();
        if (!query) return this.products;
        return this.products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.sku.includes(query) || 
            p.barcode === query ||
            p.category.toLowerCase().includes(query)
        );
    },

    getProductByCode: function(code) {
        return this.products.find(p => p.barcode === code || p.sku === code);
    }
};

// ============================================
// UTILITY & HELPER FUNCTIONS
// ============================================
RetailX.Utils = {
    formatMoney: (amount) => `${RetailX.Config.currencySymbol}${parseFloat(amount).toFixed(2)}`,
    generateBillNo: () => {
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `INV-${dateStr}-${random}`;
    },
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    playBeep: () => {
        const beep = document.getElementById('beepSound');
        if(beep) { beep.currentTime = 0; beep.play().catch(e=>console.log("Audio play prevented")); }
    },
    showToast: (title, message, type = 'info') => {
        const container = document.getElementById('toastContainer');
        const iconMap = { 'success': 'fa-check-circle', 'error': 'fa-exclamation-circle', 'warning': 'fa-exclamation-triangle', 'info': 'fa-info-circle' };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${iconMap[type]}"></i>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        container.appendChild(toast);
        
        // Trigger reflow to start animation
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },
    // NEW: Simple notification popup
    showNotificationPopup: function() {
        // Use SweetAlert2 for a simple popup
        const unreadCount = 2; // hardcoded for demo
        Swal.fire({
            title: 'Notifications',
            html: `
                <div style="text-align:left;">
                    <p><i class="fas fa-info-circle" style="color:#3b82f6;"></i> Welcome to POS terminal</p>
                    <p><i class="fas fa-check-circle" style="color:#10b981;"></i> Shift started at 08:00 AM</p>
                    <p><i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> Low stock on Wireless Mouse</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Dismiss'
        });
    }
};

// ============================================
// UI & NAVIGATION MODULE
// ============================================
RetailX.Navigation = {
    init: function() {
        // Handle Sidebar Routing
        $('.menu-item[data-page]').on('click', function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            RetailX.Navigation.switchPage(page);
            
            // Mobile close
            if(window.innerWidth <= 768) $('.sidebar').removeClass('active');
        });

        // Mobile Toggle
        $('#mobileMenuToggle').on('click', () => $('.sidebar').toggleClass('active'));

        // Fullscreen
        $('#fullscreenBtn').on('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else if (document.exitFullscreen) document.exitFullscreen();
        });

        // Initialize Clocks
        this.updateClocks();
        setInterval(() => this.updateClocks(), 1000);
    },

    switchPage: function(pageId) {
        $('.page').removeClass('active');
        $(`#${pageId}-page`).addClass('active');
        
        $('.menu-item').removeClass('active highlight');
        $(`.menu-item[data-page="${pageId}"]`).addClass(pageId === 'pos' ? 'highlight' : 'active');

        const titles = { 'dashboard': 'Terminal Dashboard', 'pos': 'Point of Sale', 'inventory': 'Product Lookup', 'transactions': 'Shift Transactions', 'summary': 'End of Shift Summary' };
        $('#pageTitle').text(titles[pageId]);
        $('#breadcrumb').text(`Terminal / ${titles[pageId]}`);

        // Page specific initializations
        if(pageId === 'pos') $('#posBarcodeScanner').focus();
        if(pageId === 'inventory') RetailX.Inventory.renderTable();
        if(pageId === 'transactions') RetailX.Transactions.renderTable();
        if(pageId === 'summary') RetailX.Summary.render();
    },

    updateClocks: function() {
        const now = new Date();
        $('#currentDate').text(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        $('#currentTime').text(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit'}));
        
        // Shift Timer
        const diff = Math.floor((now - RetailX.State.shift.startTime) / 1000);
        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');
        $('#shiftTimer').text(`${h}:${m}:${s}`);
    }
};

// ============================================
// POINT OF SALE (POS) MODULE
// ============================================
RetailX.POS = {
    init: function() {
        this.resetTransaction();
        this.bindEvents();
    },

    bindEvents: function() {
        const self = this;

        // Scanner Input (Enter Key)
        $('#posBarcodeScanner').on('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                self.processScan($(this).val());
                $(this).val('');
            }
        });

        // Search Modals
        $('#posManualSearchBtn').on('click', () => {
            $('#posSearchModal').addClass('show');
            $('#posModalSearchInput').val('').focus();
            this.renderSearchModal(RetailX.Database.products);
        });

        $('#posModalSearchInput').on('input', RetailX.Utils.debounce(function() {
            const results = RetailX.Database.searchProducts($(this).val());
            self.renderSearchModal(results);
        }, 300));

        // Cart Actions
        $('#voidTransactionBtn').on('click', () => {
            if(RetailX.State.cart.length === 0) return;
            Swal.fire({
                title: 'Void Transaction?',
                text: "This will clear all items from the current bill.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Yes, void it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.resetTransaction();
                    RetailX.Utils.showToast('Transaction Voided', 'Cart has been cleared.', 'warning');
                }
            });
        });

        // NEW: Hold Bill button functionality
        $('#suspendTransactionBtn').on('click', () => {
            if (RetailX.State.cart.length === 0) {
                RetailX.Utils.showToast('Empty Cart', 'Add items before holding.', 'error');
                return;
            }
            // Ask for a hold name
            Swal.fire({
                title: 'Hold Bill',
                input: 'text',
                inputLabel: 'Enter a reference (e.g., customer name)',
                inputPlaceholder: 'Optional',
                showCancelButton: true,
                confirmButtonText: 'Hold Bill',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    const holdName = result.value || `Bill ${RetailX.State.currentBillNo}`;
                    const heldBill = {
                        id: RetailX.State.currentBillNo,
                        name: holdName,
                        cart: [...RetailX.State.cart],
                        discountType: RetailX.State.discountType,
                        discountValue: RetailX.State.discountValue,
                        timestamp: new Date()
                    };
                    RetailX.State.heldBills.push(heldBill);
                    RetailX.Utils.showToast('Bill Held', `Bill #${heldBill.id} saved.`, 'success');
                    this.resetTransaction();
                }
            });
        });

        // NEW: Add Customer button functionality
        $('#addCustomerBtn').on('click', () => {
            Swal.fire({
                title: 'Attach Customer',
                html: `
                    <input id="swal-input1" class="swal2-input" placeholder="Customer Name">
                    <input id="swal-input2" class="swal2-input" placeholder="Phone (optional)">
                `,
                focusConfirm: false,
                preConfirm: () => {
                    const name = document.getElementById('swal-input1').value;
                    if (!name) {
                        Swal.showValidationMessage('Name is required');
                        return false;
                    }
                    return { name: name, phone: document.getElementById('swal-input2').value };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    RetailX.State.currentCustomer = result.value;
                    $('#activeCustomerName').text(result.value.name);
                    $('#activeCustomerDisplay').slideDown();
                    RetailX.Utils.showToast('Customer Added', result.value.name + ' attached.', 'success');
                }
            });
        });

        // Remove Customer button
        $('#removeCustomerBtn').on('click', () => {
            RetailX.State.currentCustomer = null;
            $('#activeCustomerDisplay').slideUp();
            RetailX.Utils.showToast('Customer Removed', 'Customer detached from bill.', 'info');
        });

        // Discount Modal
        $('#editDiscountBtn').on('click', () => {
            if(RetailX.State.cart.length === 0) {
                RetailX.Utils.showToast('Empty Cart', 'Add items before applying discount.', 'error');
                return;
            }
            $('#discountValueInput').val(RetailX.State.discountValue || '');
            $('#discountModal').addClass('show');
            $('#discountValueInput').focus();
        });

        $('.disc-type').on('click', function() {
            $('.disc-type').removeClass('active');
            $(this).addClass('active');
            RetailX.State.discountType = $(this).data('type');
        });

        $('#confirmDiscountBtn').on('click', () => {
            const val = parseFloat($('#discountValueInput').val()) || 0;
            RetailX.State.discountValue = val;
            $('#discountModal').removeClass('show');
            this.updateTotals();
            RetailX.Utils.showToast('Discount Applied', 'Cart totals updated.', 'success');
        });

        // Payment Tenders
        $('.pay-method-btn').on('click', function() {
            $('.pay-method-btn').removeClass('active');
            $(this).addClass('active');
            RetailX.State.paymentMethod = $(this).data('method');
            
            // Toggle tender areas
            if(RetailX.State.paymentMethod === 'cash') {
                $('#tenderAreaCash').slideDown();
                setTimeout(()=> $('#tenderAmount').focus(), 100);
            } else {
                $('#tenderAreaCash').slideUp();
                self.validateCheckout();
            }
        });

        // Cash Tender Logic
        $('#tenderAmount').on('input', () => this.validateCheckout());
        $('.quick-cash-btn').on('click', function() {
            const val = $(this).data('val');
            let amt = 0;
            if(val === 'exact') amt = RetailX.State.billTotals.grandTotal;
            else amt = parseFloat(val);
            
            $('#tenderAmount').val(amt.toFixed(2));
            self.validateCheckout();
        });

        // Checkout execution
        $('#completeCheckoutBtn').on('click', () => this.completeTransaction());
    },

    processScan: function(code) {
        if(!code.trim()) return;
        const product = RetailX.Database.getProductByCode(code.trim());
        
        if(product) {
            RetailX.Utils.playBeep();
            this.addToCart(product);
        } else {
            RetailX.Utils.showToast('Not Found', `Product ${code} not found in database.`, 'error');
        }
    },

    renderSearchModal: function(products) {
        const container = $('#posModalResults');
        container.empty();
        
        if(products.length === 0) {
            container.html('<p style="grid-column: 1/-1; text-align:center; color: #64748b; padding: 20px;">No products match your search.</p>');
            return;
        }

        products.forEach(p => {
            const card = $(`
                <div class="product-card">
                    <div class="product-card-title">${p.name}</div>
                    <div class="product-card-meta">
                        <span>SKU: ${p.sku}</span>
                        <span>Stock: ${p.stock}</span>
                    </div>
                    <div class="product-card-price">${RetailX.Utils.formatMoney(p.price)}</div>
                </div>
            `);
            card.on('click', () => {
                this.addToCart(p);
                $('#posSearchModal').removeClass('show');
                $('#posBarcodeScanner').focus();
                RetailX.Utils.playBeep();
            });
            container.append(card);
        });
    },

    addToCart: function(product) {
        const existing = RetailX.State.cart.find(i => i.sku === product.sku);
        if(existing) {
            existing.qty += 1;
        } else {
            RetailX.State.cart.unshift({ ...product, qty: 1 }); // Add to top
        }
        this.renderCart();
    },

    updateItemQty: function(sku, delta) {
        const item = RetailX.State.cart.find(i => i.sku === sku);
        if(item) {
            item.qty += delta;
            if(item.qty <= 0) {
                RetailX.State.cart = RetailX.State.cart.filter(i => i.sku !== sku);
            }
            this.renderCart();
        }
    },

    renderCart: function() {
        const container = $('#cartItemsContainer');
        container.empty();

        if(RetailX.State.cart.length === 0) {
            container.html(`
                <div class="cart-empty-state">
                    <i class="fas fa-barcode"></i>
                    <p>Scan an item to begin transaction</p>
                </div>
            `);
        } else {
            RetailX.State.cart.forEach(item => {
                const total = item.price * item.qty;
                const row = $(`
                    <div class="cart-item-row">
                        <div class="col-item item-details">
                            <h4>${item.name}</h4>
                            <small>SKU: ${item.sku}</small>
                        </div>
                        <div class="col-price item-price">${RetailX.Utils.formatMoney(item.price)}</div>
                        <div class="col-qty">
                            <div class="qty-control">
                                <button onclick="RetailX.POS.updateItemQty('${item.sku}', -1)">-</button>
                                <span>${item.qty}</span>
                                <button onclick="RetailX.POS.updateItemQty('${item.sku}', 1)">+</button>
                            </div>
                        </div>
                        <div class="col-total item-total">${RetailX.Utils.formatMoney(total)}</div>
                        <div class="col-action">
                            <button class="remove-item-btn" onclick="RetailX.POS.updateItemQty('${item.sku}', -999)"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                `);
                container.append(row);
            });
        }
        
        // Scroll to top
        container.scrollTop(0);
        this.updateTotals();
    },

    updateTotals: function() {
        let subtotal = 0;
        let itemCount = 0;
        
        RetailX.State.cart.forEach(item => {
            subtotal += (item.price * item.qty);
            itemCount += item.qty;
        });

        // Calculate Discount
        let discountAmt = 0;
        if(RetailX.State.discountValue > 0) {
            if(RetailX.State.discountType === 'percent') {
                discountAmt = subtotal * (RetailX.State.discountValue / 100);
            } else {
                discountAmt = Math.min(subtotal, RetailX.State.discountValue); // Cap discount to subtotal
            }
        }

        let afterDiscount = subtotal - discountAmt;
        let tax = afterDiscount * RetailX.Config.taxRate;
        let grandTotal = afterDiscount + tax;

        // Store globally
        RetailX.State.billTotals = { subtotal, discountAmt, tax, grandTotal, itemCount };

        // Update UI
        $('#cartItemCount').text(itemCount);
        $('#cartSubtotal').text(RetailX.Utils.formatMoney(subtotal));
        $('#cartDiscount').text(`-${RetailX.Utils.formatMoney(discountAmt)}`);
        $('#cartTax').text(RetailX.Utils.formatMoney(tax));
        $('#cartGrandTotal').text(RetailX.Utils.formatMoney(grandTotal));

        // Topbar
        $('#topbarSales').text(RetailX.Utils.formatMoney(RetailX.State.shift.totalSales + grandTotal));

        this.validateCheckout();
    },

    validateCheckout: function() {
        const btn = $('#completeCheckoutBtn');
        const totals = RetailX.State.billTotals;
        
        if(!totals || totals.itemCount === 0) {
            btn.prop('disabled', true);
            $('#changeDueAmount').text('$0.00').removeClass('text-success text-danger');
            return;
        }

        if(RetailX.State.paymentMethod === 'cash') {
            const tendered = parseFloat($('#tenderAmount').val()) || 0;
            const change = tendered - totals.grandTotal;
            
            const changeEl = $('#changeDueAmount');
            changeEl.text(RetailX.Utils.formatMoney(Math.abs(change)));
            
            if(change >= 0) {
                changeEl.addClass('text-success').removeClass('text-danger');
                btn.prop('disabled', false);
            } else {
                changeEl.addClass('text-danger').removeClass('text-success');
                btn.prop('disabled', true);
            }
        } else {
            // Card or Digital assume auto-validation in this simulation
            btn.prop('disabled', false);
        }
    },

    resetTransaction: function() {
        RetailX.State.cart = [];
        RetailX.State.discountValue = 0;
        RetailX.State.currentBillNo = RetailX.Utils.generateBillNo();
        RetailX.State.currentCustomer = null;
        $('#currentBillNo').text(`Order: ${RetailX.State.currentBillNo}`);
        $('#tenderAmount').val('');
        $('#activeCustomerDisplay').slideUp();
        
        this.renderCart();
        $('#posBarcodeScanner').focus();
    },

    completeTransaction: function() {
        const totals = RetailX.State.billTotals;
        
        // Build transaction record
        const transaction = {
            id: RetailX.State.currentBillNo,
            date: new Date(),
            method: RetailX.State.paymentMethod,
            customer: RetailX.State.currentCustomer ? RetailX.State.currentCustomer.name : 'Walk-in Customer',
            items: [...RetailX.State.cart],
            totals: {...totals},
            tendered: parseFloat($('#tenderAmount').val()) || totals.grandTotal,
            change: (parseFloat($('#tenderAmount').val()) || totals.grandTotal) - totals.grandTotal
        };

        // Update Shift State
        RetailX.State.shift.totalSales += totals.grandTotal;
        RetailX.State.shift.billsGenerated += 1;
        RetailX.State.shift.itemsSold += totals.itemCount;
        
        if(transaction.method === 'cash') RetailX.State.shift.cashTendered += totals.grandTotal;
        else if(transaction.method === 'card') RetailX.State.shift.cardTendered += totals.grandTotal;
        else RetailX.State.shift.digitalTendered += totals.grandTotal;

        // Save to local history
        RetailX.State.transactions.unshift(transaction);
        
        // Update Dashboard KPIs
        this.updateDashboardKPIs();

        // Print Receipt UI
        this.generateReceiptHTML(transaction);

        // UI Feedback
        $('#global-loader .loader-text').text('Processing Payment...');
        $('#global-loader').removeClass('fade-out');
        
        setTimeout(() => {
            $('#global-loader').addClass('fade-out');
            $('#receiptModal').addClass('show');
            this.resetTransaction();
        }, 800);
    },

    generateReceiptHTML: function(tx) {
        let itemsHtml = '';
        tx.items.forEach(i => {
            itemsHtml += `
                <div class="rcpt-line">
                    <span style="flex:2">${i.name.substring(0, 15)}</span>
                    <span style="flex:1" class="qty">${i.qty} x ${i.price}</span>
                    <span style="flex:1" class="amt">${(i.qty * i.price).toFixed(2)}</span>
                </div>
            `;
        });

        const html = `
            <div class="rcpt-header">
                <h2>${RetailX.Config.storeName}</h2>
                <p>123 Main Street, Cityville</p>
                <p>Tel: (555) 123-4567</p>
            </div>
            <div class="rcpt-meta">
                <span>Date: ${tx.date.toLocaleDateString()}</span>
                <span>Time: ${tx.date.toLocaleTimeString()}</span>
            </div>
            <div class="rcpt-meta">
                <span>Reg: ${RetailX.Config.registerId}</span>
                <span>Bill: ${tx.id}</span>
            </div>
            <div class="rcpt-totals">
                ${itemsHtml}
            </div>
            <div class="rcpt-totals" style="margin-top: 10px;">
                <div class="rcpt-line"><span>Subtotal:</span><span>${tx.totals.subtotal.toFixed(2)}</span></div>
                ${tx.totals.discountAmt > 0 ? `<div class="rcpt-line"><span>Discount:</span><span>-${tx.totals.discountAmt.toFixed(2)}</span></div>` : ''}
                <div class="rcpt-line"><span>Tax (8.5%):</span><span>${tx.totals.tax.toFixed(2)}</span></div>
                <div class="rcpt-line bold"><span>TOTAL:</span><span>$${tx.totals.grandTotal.toFixed(2)}</span></div>
            </div>
            <div class="rcpt-totals" style="margin-top: 10px;">
                <div class="rcpt-line"><span>Paid by ${tx.method.toUpperCase()}:</span><span>${tx.tendered.toFixed(2)}</span></div>
                <div class="rcpt-line"><span>Change:</span><span>${tx.change.toFixed(2)}</span></div>
            </div>
            <div class="rcpt-barcode">
                *${tx.id}*
            </div>
            <div class="rcpt-footer">
                <p>Thank you for shopping with us!</p>
                <p>Retain receipt for returns.</p>
            </div>
        `;
        $('#receiptPrintArea').html(html);
    },

    updateDashboardKPIs: function() {
        const s = RetailX.State.shift;
        $('#dashTotalSales').text(RetailX.Utils.formatMoney(s.totalSales));
        $('#dashTotalBills').text(s.billsGenerated);
        $('#dashTotalItems').text(s.itemsSold);
        
        const aov = s.billsGenerated > 0 ? (s.totalSales / s.billsGenerated) : 0;
        $('#dashAov').text(RetailX.Utils.formatMoney(aov));

        $('#topbarDrawer').text(RetailX.Utils.formatMoney(150 + s.cashTendered)); // Assuming $150 float

        // Update mini recent list
        const cont = $('#dashboardRecentTx');
        cont.empty();
        RetailX.State.transactions.slice(0, 4).forEach(tx => {
            cont.append(`
                <div class="tx-mini-item">
                    <div class="tx-mini-left">
                        <h4>${tx.id}</h4>
                        <p>${tx.date.toLocaleTimeString()} · ${tx.method.toUpperCase()}</p>
                    </div>
                    <div class="tx-mini-right">
                        +${RetailX.Utils.formatMoney(tx.totals.grandTotal)}
                    </div>
                </div>
            `);
        });
    }
};

// ============================================
// INVENTORY MODULE
// ============================================
RetailX.Inventory = {
    renderTable: function(query = '') {
        const tbody = $('#inventoryTableBody');
        tbody.empty();
        
        const data = RetailX.Database.searchProducts(query);
        
        if(data.length === 0) {
            tbody.html('<tr><td colspan="6" style="text-align:center; padding: 30px;">No products found.</td></tr>');
            return;
        }

        data.forEach(p => {
            const stockClass = p.stock < 20 ? 'text-danger' : 'text-success';
            tbody.append(`
                <tr>
                    <td><span class="badge-blue">${p.sku}</span></td>
                    <td><strong>${p.name}</strong><br><small class="text-muted">${p.barcode}</small></td>
                    <td>${p.category}</td>
                    <td><strong>${RetailX.Utils.formatMoney(p.price)}</strong></td>
                    <td class="${stockClass} font-weight-bold">${p.stock} units</td>
                    <td>
                        <button class="btn-outline-info" onclick="RetailX.Navigation.switchPage('pos'); setTimeout(()=>RetailX.POS.processScan('${p.sku}'), 100)">
                            Sell Item
                        </button>
                    </td>
                </tr>
            `);
        });
    }
};

$('#inventorySearch').on('input', RetailX.Utils.debounce(function() {
    RetailX.Inventory.renderTable($(this).val());
}, 300));

// ============================================
// TRANSACTIONS (HISTORY) MODULE
// ============================================
RetailX.Transactions = {
    renderTable: function() {
        const tbody = $('#txTableBody');
        tbody.empty();
        
        const data = RetailX.State.transactions;
        const filter = $('#txTypeFilter').val();
        
        if(data.length === 0) {
            tbody.html('<tr><td colspan="7" style="text-align:center; padding: 30px;">No transactions recorded in this shift.</td></tr>');
            return;
        }

        data.forEach(tx => {
            // Simplified filter (everything is a sale in this mock)
            if(filter === 'refund') return; 

            tbody.append(`
                <tr>
                    <td><strong>${tx.id}</strong></td>
                    <td>${tx.date.toLocaleTimeString()}</td>
                    <td>${tx.customer}</td>
                    <td><span style="text-transform: uppercase; font-size:12px; font-weight:bold;">${tx.method}</span></td>
                    <td>${tx.totals.itemCount} items</td>
                    <td><strong>${RetailX.Utils.formatMoney(tx.totals.grandTotal)}</strong></td>
                    <td>
                        <button class="btn-outline" onclick="RetailX.Utils.showToast('Printing', 'Receipt sent to printer', 'info')"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `);
        });
    }
};

$('#txTypeFilter').on('change', () => RetailX.Transactions.renderTable());

// Export Transactions logic
$('#exportTxBtn').on('click', () => {
    if(RetailX.State.transactions.length === 0) {
        RetailX.Utils.showToast('No Data', 'No transactions to export', 'warning');
        return;
    }
    const data = RetailX.State.transactions.map(t => ({
        ReceiptID: t.id,
        Date: t.date.toLocaleString(),
        Method: t.method,
        Items: t.totals.itemCount,
        Subtotal: t.totals.subtotal,
        Tax: t.totals.tax,
        Total: t.totals.grandTotal
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Shift_Transactions_${new Date().getTime()}.xlsx`);
    RetailX.Utils.showToast('Export Complete', 'Excel file downloaded', 'success');
});


// ============================================
// SUMMARY MODULE (Chart & Reports)
// ============================================
RetailX.Summary = {
    chartInstance: null,
    
    render: function() {
        const s = RetailX.State.shift;
        
        $('#repGross').text(RetailX.Utils.formatMoney(s.totalSales));
        $('#repRefunds').text(RetailX.Utils.formatMoney(s.totalRefunds));
        $('#repNet').text(RetailX.Utils.formatMoney(s.totalSales - s.totalRefunds));
        // Approximate total tax based on flat rate (for mock purposes)
        $('#repTax').text(RetailX.Utils.formatMoney(s.totalSales - (s.totalSales / (1 + RetailX.Config.taxRate))));
        
        $('#repCash').text(RetailX.Utils.formatMoney(s.cashTendered));
        $('#repCard').text(RetailX.Utils.formatMoney(s.cardTendered));
        $('#repDigital').text(RetailX.Utils.formatMoney(s.digitalTendered));

        this.renderChart();
    },

    renderChart: function() {
        const ctx = document.getElementById('hourlySalesChart');
        if(!ctx) return;

        // Destroy previous to prevent memory leaks
        if(this.chartInstance) this.chartInstance.destroy();

        // Generate mock hourly data based on current transactions
        const labels = ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', 'Now'];
        const dataPoints = [0, 0, 0, 0, 0, 0, 0, RetailX.State.shift.totalSales]; // simplified

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales Vol ($)',
                    data: dataPoints,
                    backgroundColor: 'rgba(67, 97, 238, 0.7)',
                    borderColor: '#4361ee',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
};

// Summary Actions
$('#printXReportBtn').on('click', () => {
    RetailX.Utils.showToast('Printing', 'X-Report generated and sent to printer', 'info');
});

$('#printZReportBtn').on('click', () => {
    Swal.fire({
        title: 'End Shift & Print Z-Report?',
        text: "This will close the current register session and log you out.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4361ee',
        confirmButtonText: 'Yes, End Shift'
    }).then((result) => {
        if (result.isConfirmed) {
            $('#global-loader .loader-text').text('Generating Z-Report & Closing Shift...');
            $('#global-loader').removeClass('fade-out');
            setTimeout(() => window.location.reload(), 2000);
        }
    });
});

// ============================================
// GLOBAL EVENT BINDINGS
// ============================================
$(document).ready(function() {
    
    // Hide Preloader
    setTimeout(() => {
        $('#global-loader').addClass('fade-out');
    }, 800);

    // Init Modules
    RetailX.Navigation.init();
    RetailX.POS.init();

    // Global Modal Closers
    $('.modal-close').on('click', function() {
        $(this).closest('.modal').removeClass('show');
    });

    // Handle Hardware Print
    $('#printActualReceiptBtn').on('click', function() {
        window.print();
    });

    // Drawer Simulation (already working)
    $('#openDrawerBtn').on('click', () => {
        RetailX.Utils.playBeep();
        RetailX.Utils.showToast('Drawer Opened', 'Cash drawer kicked open.', 'warning');
    });

    // NEW: Notifications button handler
    $('#notificationsBtn').on('click', () => {
        RetailX.Utils.showNotificationPopup();
    });

    // Logout
    $('#endShiftBtn').on('click', (e) => {
        e.preventDefault();
        $('#printZReportBtn').click(); // Reuse Z-report logic
    });
});