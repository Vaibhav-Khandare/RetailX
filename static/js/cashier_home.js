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
    currencySymbol: '₹',
    storeName: 'RetailX Main',
    registerId: 'REG-04',
    maxCartItems: 100
};

// Initialize state from localStorage if available
RetailX.State = {
    cart: [],
    discountType: 'percent',
    discountValue: 0,
    currentCustomer: null,
    currentBillNo: '',
    paymentMethod: 'cash',
    shift: {
        startTime: null,
        totalSales: 0,
        totalRefunds: 0,
        billsGenerated: 0,
        itemsSold: 0,
        cashTendered: 0,
        cardTendered: 0,
        digitalTendered: 0,
        isActive: true
    },
    transactions: [],
    heldBills: [],
    // Camera state
    cameraStream: null,
    currentCamera: 'environment',
    isCameraActive: false,
    availableCameras: [],
    scanMode: 'qr', // 'qr' or 'barcode'
    scanLoopActive: false,
    scanLoopId: null,
    quaggaInitialized: false,
    scanningEnabled: false,
    initialized: false
};

// Load saved state from localStorage
RetailX.loadSavedState = function() {
    console.log('📦 loadSavedState called');
    try {
        // Load shift if exists, otherwise start a new one
        const savedShift = localStorage.getItem('retailx_shift');
        console.log('savedShift from localStorage:', savedShift);
        
        if (savedShift) {
            const shiftData = JSON.parse(savedShift);
            console.log('Parsed shiftData:', shiftData);
            
            if (shiftData.startTime) {
                shiftData.startTime = new Date(shiftData.startTime);
                console.log('Converted startTime to Date:', shiftData.startTime);
            } else {
                console.warn('savedShift had no startTime');
            }
            
            // Only load if shift is active; otherwise start a new one
            if (shiftData.isActive) {
                RetailX.State.shift = { ...RetailX.State.shift, ...shiftData };
                console.log('✅ Loaded active shift from localStorage');
            } else {
                console.log('⚠️ Saved shift is inactive – starting new shift');
                RetailX.State.shift.startTime = new Date();
                RetailX.State.shift.isActive = true;
            }
        } else {
            console.log('No saved shift found – starting new one');
            RetailX.State.shift.startTime = new Date();
            RetailX.State.shift.isActive = true;
        }

        // If shift is active but startTime is missing (shouldn't happen), set it now
        if (RetailX.State.shift.isActive && !RetailX.State.shift.startTime) {
            console.warn('Shift was active without startTime – setting to now');
            RetailX.State.shift.startTime = new Date();
        }

        // Load transactions (these persist even after logout)
        const savedTransactions = localStorage.getItem('retailx_transactions');
        console.log('savedTransactions from localStorage:', savedTransactions);
        
        if (savedTransactions) {
            const txData = JSON.parse(savedTransactions);
            RetailX.State.transactions = txData.map(tx => ({
                ...tx,
                date: new Date(tx.date)
            }));
            console.log(`✅ Loaded ${RetailX.State.transactions.length} transactions`);
        } else {
            RetailX.State.transactions = [];
            console.log('No saved transactions');
        }
    } catch (e) {
        console.error('Error loading saved state:', e);
        // Fallback – start a new shift
        RetailX.State.shift.startTime = new Date();
        RetailX.State.shift.isActive = true;
        RetailX.State.transactions = [];
        console.log('Fallback: new shift started');
    }
    
    // Final check
    console.log('Final shift state:', RetailX.State.shift);
};

// Save state to localStorage
RetailX.saveState = function() {
    try {
        const shiftToSave = {
            ...RetailX.State.shift,
            startTime: RetailX.State.shift.startTime?.toISOString()
        };
        localStorage.setItem('retailx_shift', JSON.stringify(shiftToSave));
        localStorage.setItem('retailx_transactions', JSON.stringify(RetailX.State.transactions));
        console.log('✅ State saved to localStorage');
    } catch (e) {
        console.error('Error saving state:', e);
    }
};

// Clear shift on logout – transactions are NOT cleared
RetailX.clearState = function() {
    console.log('🔴 clearState called – ending shift');
    localStorage.removeItem('retailx_shift');
    // Do NOT remove transactions – they persist across logins
    // Reset shift in memory to inactive (but keep startTime as null)
    RetailX.State.shift = {
        startTime: null,
        totalSales: 0,
        totalRefunds: 0,
        billsGenerated: 0,
        itemsSold: 0,
        cashTendered: 0,
        cardTendered: 0,
        digitalTendered: 0,
        isActive: false
    };
    console.log('Shift reset to inactive');
};

// ============================================
// MOCK DATABASE (Simulating Backend)
// ============================================
RetailX.Database = {
    products: [
        // ... (your existing 900+ products) ...
        // For brevity, I've kept the same list as before; ensure it's included in your actual file.
        // { sku: 'ELEC001', barcode: '8801234567890', name: 'Samsung 65" 4K Smart TV', category: 'Electronics', price: 899.99, stock: 25 },
        // ... rest of the products

        
        // Electronics (50 products - abbreviated for brevity, include all from your list)
        { sku: 'ELEC001', barcode: '8801234567890', name: 'Samsung 65" 4K Smart TV', category: 'Electronics', price: 899.99, stock: 25 },
        { sku: 'ELEC002', barcode: '8801234567891', name: 'LG 55" OLED TV', category: 'Electronics', price: 1299.99, stock: 15 },
        { sku: 'ELEC003', barcode: '8801234567892', name: 'Sony WH-1000XM4 Headphones', category: 'Electronics', price: 348.00, stock: 42 },
        { sku: 'ELEC004', barcode: '8801234567893', name: 'Apple AirPods Pro', category: 'Electronics', price: 249.00, stock: 78 },
        { sku: 'ELEC005', barcode: '8801234567894', name: 'Samsung Galaxy S23 Ultra', category: 'Electronics', price: 1199.99, stock: 32 },
        { sku: 'ELEC006', barcode: '8801234567895', name: 'iPhone 15 Pro Max', category: 'Electronics', price: 1399.99, stock: 28 },
        { sku: 'ELEC007', barcode: '8801234567896', name: 'Google Pixel 8 Pro', category: 'Electronics', price: 999.99, stock: 19 },
        { sku: 'ELEC008', barcode: '8801234567897', name: 'OnePlus 12', category: 'Electronics', price: 799.99, stock: 34 },
        { sku: 'ELEC009', barcode: '8801234567898', name: 'Xiaomi Mi 11', category: 'Electronics', price: 699.99, stock: 23 },
        { sku: 'ELEC010', barcode: '8801234567899', name: 'MacBook Pro 16"', category: 'Electronics', price: 2499.99, stock: 12 },
        { sku: 'ELEC011', barcode: '8801234567900', name: 'Dell XPS 15', category: 'Electronics', price: 1899.99, stock: 18 },
        { sku: 'ELEC012', barcode: '8801234567901', name: 'HP Spectre x360', category: 'Electronics', price: 1599.99, stock: 14 },
        { sku: 'ELEC013', barcode: '8801234567902', name: 'Lenovo ThinkPad X1', category: 'Electronics', price: 1799.99, stock: 11 },
        { sku: 'ELEC014', barcode: '8801234567903', name: 'Asus ROG Zephyrus', category: 'Electronics', price: 2199.99, stock: 9 },
        { sku: 'ELEC015', barcode: '8801234567904', name: 'Microsoft Surface Pro 9', category: 'Electronics', price: 1299.99, stock: 16 },
        { sku: 'ELEC016', barcode: '8801234567905', name: 'iPad Pro 12.9"', category: 'Electronics', price: 1099.99, stock: 31 },
        { sku: 'ELEC017', barcode: '8801234567906', name: 'Samsung Tab S9 Ultra', category: 'Electronics', price: 1199.99, stock: 22 },
        { sku: 'ELEC018', barcode: '8801234567907', name: 'Kindle Paperwhite', category: 'Electronics', price: 139.99, stock: 67 },
        { sku: 'ELEC019', barcode: '8801234567908', name: 'Bose QuietComfort 45', category: 'Electronics', price: 329.00, stock: 38 },
        { sku: 'ELEC020', barcode: '8801234567909', name: 'JBL Flip 6 Speaker', category: 'Electronics', price: 129.95, stock: 89 },
        { sku: 'ELEC021', barcode: '8801234567910', name: 'Canon EOS R6 Camera', category: 'Electronics', price: 2499.00, stock: 7 },
        { sku: 'ELEC022', barcode: '8801234567911', name: 'Sony A7 III Camera', category: 'Electronics', price: 1999.99, stock: 10 },
        { sku: 'ELEC023', barcode: '8801234567912', name: 'GoPro Hero 12', category: 'Electronics', price: 399.99, stock: 29 },
        { sku: 'ELEC024', barcode: '8801234567913', name: 'DJI Mini 3 Drone', category: 'Electronics', price: 469.00, stock: 16 },
        { sku: 'ELEC025', barcode: '8801234567914', name: 'Ring Video Doorbell', category: 'Electronics', price: 99.99, stock: 73 },
        { sku: 'ELEC026', barcode: '8801234567915', name: 'Nest Learning Thermostat', category: 'Electronics', price: 249.99, stock: 41 },
        { sku: 'ELEC027', barcode: '8801234567916', name: 'Arlo Pro 4 Camera', category: 'Electronics', price: 199.99, stock: 35 },
        { sku: 'ELEC028', barcode: '8801234567917', name: 'Eufy RoboVac 11S', category: 'Electronics', price: 249.99, stock: 27 },
        { sku: 'ELEC029', barcode: '8801234567918', name: 'iRobot Roomba j7+', category: 'Electronics', price: 799.99, stock: 13 },
        { sku: 'ELEC030', barcode: '8801234567919', name: 'Breville Espresso Machine', category: 'Electronics', price: 699.95, stock: 19 },
        { sku: 'ELEC031', barcode: '8801234567920', name: 'Instant Pot Duo', category: 'Electronics', price: 89.99, stock: 112 },
        { sku: 'ELEC032', barcode: '8801234567921', name: 'Ninja Air Fryer', category: 'Electronics', price: 129.99, stock: 84 },
        { sku: 'ELEC033', barcode: '8801234567922', name: 'KitchenAid Stand Mixer', category: 'Electronics', price: 399.99, stock: 33 },
        { sku: 'ELEC034', barcode: '8801234567923', name: 'Vitamix Blender', category: 'Electronics', price: 449.95, stock: 21 },
        { sku: 'ELEC035', barcode: '8801234567924', name: 'Philips Sonicare Toothbrush', category: 'Electronics', price: 79.99, stock: 156 },
        { sku: 'ELEC036', barcode: '8801234567925', name: 'Braun Series 9 Shaver', category: 'Electronics', price: 299.99, stock: 44 },
        { sku: 'ELEC037', barcode: '8801234567926', name: 'Garmin Fenix 7 Watch', category: 'Electronics', price: 699.99, stock: 23 },
        { sku: 'ELEC038', barcode: '8801234567927', name: 'Apple Watch Series 9', category: 'Electronics', price: 399.99, stock: 67 },
        { sku: 'ELEC039', barcode: '8801234567928', name: 'Samsung Galaxy Watch 6', category: 'Electronics', price: 329.99, stock: 45 },
        { sku: 'ELEC040', barcode: '8801234567929', name: 'Fitbit Charge 6', category: 'Electronics', price: 159.95, stock: 89 },
        { sku: 'ELEC041', barcode: '8801234567930', name: 'Logitech MX Master 3S', category: 'Electronics', price: 99.99, stock: 134 },
        { sku: 'ELEC042', barcode: '8801234567931', name: 'Razer DeathAdder V3', category: 'Electronics', price: 69.99, stock: 98 },
        { sku: 'ELEC043', barcode: '8801234567932', name: 'Corsair K95 Keyboard', category: 'Electronics', price: 199.99, stock: 42 },
        { sku: 'ELEC044', barcode: '8801234567933', name: 'SteelSeries Arctis 7', category: 'Electronics', price: 149.99, stock: 56 },
        { sku: 'ELEC045', barcode: '8801234567934', name: 'HyperX Cloud II', category: 'Electronics', price: 99.99, stock: 78 },
        { sku: 'ELEC046', barcode: '8801234567935', name: 'Samsung 980 Pro SSD 1TB', category: 'Electronics', price: 89.99, stock: 145 },
        { sku: 'ELEC047', barcode: '8801234567936', name: 'WD Black 2TB HDD', category: 'Electronics', price: 79.99, stock: 167 },
        { sku: 'ELEC048', barcode: '8801234567937', name: 'Corsair Vengeance RAM 32GB', category: 'Electronics', price: 149.99, stock: 89 },
        { sku: 'ELEC049', barcode: '8801234567938', name: 'ASUS RT-AX88U Router', category: 'Electronics', price: 299.99, stock: 34 },
        { sku: 'ELEC050', barcode: '8801234567939', name: 'Netgear Nighthawk Router', category: 'Electronics', price: 249.99, stock: 28 },

        // Groceries (50 products - abbreviated)
        { sku: 'GROC001', barcode: '8901234567012', name: 'Organic Avocados (3-pack)', category: 'Grocery', price: 5.99, stock: 234 },
        { sku: 'GROC002', barcode: '8901234567013', name: 'Fresh Strawberries 1lb', category: 'Grocery', price: 4.99, stock: 189 },
        { sku: 'GROC003', barcode: '8901234567014', name: 'Blueberries 6oz', category: 'Grocery', price: 3.99, stock: 267 },
        { sku: 'GROC004', barcode: '8901234567015', name: 'Raspberries 6oz', category: 'Grocery', price: 4.49, stock: 198 },
        { sku: 'GROC005', barcode: '8901234567016', name: 'Organic Bananas 2lb', category: 'Grocery', price: 2.99, stock: 345 },
        { sku: 'GROC006', barcode: '8901234567017', name: 'Gala Apples 3lb', category: 'Grocery', price: 5.49, stock: 278 },
        { sku: 'GROC007', barcode: '8901234567018', name: 'Fuji Apples 3lb', category: 'Grocery', price: 5.99, stock: 234 },
        { sku: 'GROC008', barcode: '8901234567019', name: 'Navel Oranges 4lb', category: 'Grocery', price: 6.99, stock: 189 },
        { sku: 'GROC009', barcode: '8901234567020', name: 'Seedless Grapes 2lb', category: 'Grocery', price: 7.99, stock: 156 },
        { sku: 'GROC010', barcode: '8901234567021', name: 'Pineapple Whole', category: 'Grocery', price: 3.99, stock: 145 },
        { sku: 'GROC011', barcode: '8901234567022', name: 'Watermelon Seedless', category: 'Grocery', price: 5.99, stock: 89 },
        { sku: 'GROC012', barcode: '8901234567023', name: 'Honeydew Melon', category: 'Grocery', price: 4.99, stock: 67 },
        { sku: 'GROC013', barcode: '8901234567024', name: 'Organic Broccoli', category: 'Grocery', price: 2.99, stock: 234 },
        { sku: 'GROC014', barcode: '8901234567025', name: 'Cauliflower Head', category: 'Grocery', price: 3.49, stock: 189 },
        { sku: 'GROC015', barcode: '8901234567026', name: 'Organic Carrots 2lb', category: 'Grocery', price: 2.99, stock: 267 },
        { sku: 'GROC016', barcode: '8901234567027', name: 'Baby Spinach 5oz', category: 'Grocery', price: 3.99, stock: 278 },
        { sku: 'GROC017', barcode: '8901234567028', name: 'Kale Bunch', category: 'Grocery', price: 2.49, stock: 198 },
        { sku: 'GROC018', barcode: '8901234567029', name: 'Romaine Lettuce', category: 'Grocery', price: 2.99, stock: 245 },
        { sku: 'GROC019', barcode: '8901234567030', name: 'Iceberg Lettuce', category: 'Grocery', price: 1.99, stock: 234 },
        { sku: 'GROC020', barcode: '8901234567031', name: 'Organic Tomatoes 1lb', category: 'Grocery', price: 3.99, stock: 267 },
        { sku: 'GROC021', barcode: '8901234567032', name: 'Cherry Tomatoes 1pt', category: 'Grocery', price: 4.49, stock: 189 },
        { sku: 'GROC022', barcode: '8901234567033', name: 'Cucumber English', category: 'Grocery', price: 1.99, stock: 278 },
        { sku: 'GROC023', barcode: '8901234567034', name: 'Bell Pepper 3-pack', category: 'Grocery', price: 4.99, stock: 198 },
        { sku: 'GROC024', barcode: '8901234567035', name: 'Jalapeno Peppers 4oz', category: 'Grocery', price: 1.49, stock: 145 },
        { sku: 'GROC025', barcode: '8901234567036', name: 'Organic Potatoes 5lb', category: 'Grocery', price: 4.99, stock: 234 },
        { sku: 'GROC026', barcode: '8901234567037', name: 'Sweet Potatoes 3lb', category: 'Grocery', price: 3.99, stock: 189 },
        { sku: 'GROC027', barcode: '8901234567038', name: 'Yellow Onions 3lb', category: 'Grocery', price: 2.99, stock: 267 },
        { sku: 'GROC028', barcode: '8901234567039', name: 'Garlic Whole', category: 'Grocery', price: 1.99, stock: 278 },
        { sku: 'GROC029', barcode: '8901234567040', name: 'Fresh Ginger 4oz', category: 'Grocery', price: 1.49, stock: 198 },
        { sku: 'GROC030', barcode: '8901234567041', name: 'Organic Milk 1/2 gal', category: 'Grocery', price: 3.99, stock: 312 },
        { sku: 'GROC031', barcode: '8901234567042', name: 'Almond Milk 64oz', category: 'Grocery', price: 3.49, stock: 245 },
        { sku: 'GROC032', barcode: '8901234567043', name: 'Oat Milk 64oz', category: 'Grocery', price: 4.49, stock: 198 },
        { sku: 'GROC033', barcode: '8901234567044', name: 'Greek Yogurt 32oz', category: 'Grocery', price: 5.99, stock: 267 },
        { sku: 'GROC034', barcode: '8901234567045', name: 'Butter Unsalted 1lb', category: 'Grocery', price: 4.99, stock: 234 },
        { sku: 'GROC035', barcode: '8901234567046', name: 'Cheddar Cheese 8oz', category: 'Grocery', price: 3.99, stock: 278 },
        { sku: 'GROC036', barcode: '8901234567047', name: 'Mozzarella Cheese 8oz', category: 'Grocery', price: 3.99, stock: 245 },
        { sku: 'GROC037', barcode: '8901234567048', name: 'Parmesan Cheese 8oz', category: 'Grocery', price: 5.99, stock: 189 },
        { sku: 'GROC038', barcode: '8901234567049', name: 'Cream Cheese 8oz', category: 'Grocery', price: 2.99, stock: 267 },
        { sku: 'GROC039', barcode: '8901234567050', name: 'Sour Cream 16oz', category: 'Grocery', price: 2.99, stock: 234 },
        { sku: 'GROC040', barcode: '8901234567051', name: 'Large Eggs 12-pack', category: 'Grocery', price: 4.99, stock: 345 },
        { sku: 'GROC041', barcode: '8901234567052', name: 'Organic Eggs 12-pack', category: 'Grocery', price: 6.99, stock: 267 },
        { sku: 'GROC042', barcode: '8901234567053', name: 'Bacon 16oz', category: 'Grocery', price: 7.99, stock: 198 },
        { sku: 'GROC043', barcode: '8901234567054', name: 'Turkey Bacon 12oz', category: 'Grocery', price: 5.99, stock: 156 },
        { sku: 'GROC044', barcode: '8901234567055', name: 'Chicken Breast 1lb', category: 'Grocery', price: 5.99, stock: 278 },
        { sku: 'GROC045', barcode: '8901234567056', name: 'Ground Beef 1lb 85/15', category: 'Grocery', price: 6.99, stock: 234 },
        { sku: 'GROC046', barcode: '8901234567057', name: 'Salmon Fillet 1lb', category: 'Grocery', price: 12.99, stock: 145 },
        { sku: 'GROC047', barcode: '8901234567058', name: 'Shrimp 16/20 1lb', category: 'Grocery', price: 11.99, stock: 167 },
        { sku: 'GROC048', barcode: '8901234567059', name: 'Whole Wheat Bread', category: 'Grocery', price: 3.49, stock: 289 },
        { sku: 'GROC049', barcode: '8901234567060', name: 'Sourdough Bread', category: 'Grocery', price: 4.49, stock: 234 },
        { sku: 'GROC050', barcode: '8901234567061', name: 'Croissants 4-pack', category: 'Grocery', price: 4.99, stock: 178 },

        // Apparel (50 products - abbreviated)
        { sku: 'APP001', barcode: '8909876543012', name: 'Men\'s Cotton T-Shirt White M', category: 'Apparel', price: 14.99, stock: 234 },
        { sku: 'APP002', barcode: '8909876543013', name: 'Men\'s Cotton T-Shirt White L', category: 'Apparel', price: 14.99, stock: 198 },
        { sku: 'APP003', barcode: '8909876543014', name: 'Men\'s Cotton T-Shirt White XL', category: 'Apparel', price: 16.99, stock: 167 },
        { sku: 'APP004', barcode: '8909876543015', name: 'Men\'s Cotton T-Shirt Black M', category: 'Apparel', price: 14.99, stock: 245 },
        { sku: 'APP005', barcode: '8909876543016', name: 'Men\'s Cotton T-Shirt Black L', category: 'Apparel', price: 14.99, stock: 223 },
        { sku: 'APP006', barcode: '8909876543017', name: 'Men\'s Cotton T-Shirt Black XL', category: 'Apparel', price: 16.99, stock: 189 },
        { sku: 'APP007', barcode: '8909876543018', name: 'Men\'s Cotton T-Shirt Navy M', category: 'Apparel', price: 14.99, stock: 198 },
        { sku: 'APP008', barcode: '8909876543019', name: 'Men\'s Cotton T-Shirt Navy L', category: 'Apparel', price: 14.99, stock: 176 },
        { sku: 'APP009', barcode: '8909876543020', name: 'Men\'s Cotton T-Shirt Navy XL', category: 'Apparel', price: 16.99, stock: 145 },
        { sku: 'APP010', barcode: '8909876543021', name: 'Women\'s Cotton T-Shirt White S', category: 'Apparel', price: 14.99, stock: 267 },
        { sku: 'APP011', barcode: '8909876543022', name: 'Women\'s Cotton T-Shirt White M', category: 'Apparel', price: 14.99, stock: 234 },
        { sku: 'APP012', barcode: '8909876543023', name: 'Women\'s Cotton T-Shirt White L', category: 'Apparel', price: 16.99, stock: 198 },
        { sku: 'APP013', barcode: '8909876543024', name: 'Women\'s Cotton T-Shirt Black S', category: 'Apparel', price: 14.99, stock: 278 },
        { sku: 'APP014', barcode: '8909876543025', name: 'Women\'s Cotton T-Shirt Black M', category: 'Apparel', price: 14.99, stock: 245 },
        { sku: 'APP015', barcode: '8909876543026', name: 'Women\'s Cotton T-Shirt Black L', category: 'Apparel', price: 16.99, stock: 212 },
        { sku: 'APP016', barcode: '8909876543027', name: 'Men\'s Polo Shirt Navy M', category: 'Apparel', price: 29.99, stock: 156 },
        { sku: 'APP017', barcode: '8909876543028', name: 'Men\'s Polo Shirt Navy L', category: 'Apparel', price: 29.99, stock: 145 },
        { sku: 'APP018', barcode: '8909876543029', name: 'Men\'s Polo Shirt Navy XL', category: 'Apparel', price: 32.99, stock: 123 },
        { sku: 'APP019', barcode: '8909876543030', name: 'Men\'s Polo Shirt Black M', category: 'Apparel', price: 29.99, stock: 167 },
        { sku: 'APP020', barcode: '8909876543031', name: 'Men\'s Polo Shirt Black L', category: 'Apparel', price: 29.99, stock: 145 },
        { sku: 'APP021', barcode: '8909876543032', name: 'Men\'s Polo Shirt Black XL', category: 'Apparel', price: 32.99, stock: 134 },
        { sku: 'APP022', barcode: '8909876543033', name: 'Women\'s Blouse White S', category: 'Apparel', price: 34.99, stock: 178 },
        { sku: 'APP023', barcode: '8909876543034', name: 'Women\'s Blouse White M', category: 'Apparel', price: 34.99, stock: 167 },
        { sku: 'APP024', barcode: '8909876543035', name: 'Women\'s Blouse White L', category: 'Apparel', price: 36.99, stock: 145 },
        { sku: 'APP025', barcode: '8909876543036', name: 'Women\'s Blouse Black S', category: 'Apparel', price: 34.99, stock: 189 },
        { sku: 'APP026', barcode: '8909876543037', name: 'Women\'s Blouse Black M', category: 'Apparel', price: 34.99, stock: 178 },
        { sku: 'APP027', barcode: '8909876543038', name: 'Women\'s Blouse Black L', category: 'Apparel', price: 36.99, stock: 156 },
        { sku: 'APP028', barcode: '8909876543039', name: 'Men\'s Jeans Slim Fit 30x32', category: 'Apparel', price: 49.99, stock: 134 },
        { sku: 'APP029', barcode: '8909876543040', name: 'Men\'s Jeans Slim Fit 32x32', category: 'Apparel', price: 49.99, stock: 156 },
        { sku: 'APP030', barcode: '8909876543041', name: 'Men\'s Jeans Slim Fit 34x32', category: 'Apparel', price: 49.99, stock: 145 },
        { sku: 'APP031', barcode: '8909876543042', name: 'Men\'s Jeans Slim Fit 36x32', category: 'Apparel', price: 52.99, stock: 123 },
        { sku: 'APP032', barcode: '8909876543043', name: 'Men\'s Jeans Relaxed Fit 32x32', category: 'Apparel', price: 49.99, stock: 167 },
        { sku: 'APP033', barcode: '8909876543044', name: 'Men\'s Jeans Relaxed Fit 34x32', category: 'Apparel', price: 49.99, stock: 145 },
        { sku: 'APP034', barcode: '8909876543045', name: 'Men\'s Jeans Relaxed Fit 36x32', category: 'Apparel', price: 52.99, stock: 134 },
        { sku: 'APP035', barcode: '8909876543046', name: 'Women\'s Jeans Skinny 4', category: 'Apparel', price: 49.99, stock: 178 },
        { sku: 'APP036', barcode: '8909876543047', name: 'Women\'s Jeans Skinny 6', category: 'Apparel', price: 49.99, stock: 189 },
        { sku: 'APP037', barcode: '8909876543048', name: 'Women\'s Jeans Skinny 8', category: 'Apparel', price: 49.99, stock: 167 },
        { sku: 'APP038', barcode: '8909876543049', name: 'Women\'s Jeans Skinny 10', category: 'Apparel', price: 52.99, stock: 145 },
        { sku: 'APP039', barcode: '8909876543050', name: 'Women\'s Jeans Bootcut 6', category: 'Apparel', price: 49.99, stock: 156 },
        { sku: 'APP040', barcode: '8909876543051', name: 'Women\'s Jeans Bootcut 8', category: 'Apparel', price: 49.99, stock: 145 },
        { sku: 'APP041', barcode: '8909876543052', name: 'Men\'s Hoodie Grey M', category: 'Apparel', price: 39.99, stock: 189 },
        { sku: 'APP042', barcode: '8909876543053', name: 'Men\'s Hoodie Grey L', category: 'Apparel', price: 39.99, stock: 178 },
        { sku: 'APP043', barcode: '8909876543054', name: 'Men\'s Hoodie Grey XL', category: 'Apparel', price: 42.99, stock: 167 },
        { sku: 'APP044', barcode: '8909876543055', name: 'Men\'s Hoodie Black M', category: 'Apparel', price: 39.99, stock: 198 },
        { sku: 'APP045', barcode: '8909876543056', name: 'Men\'s Hoodie Black L', category: 'Apparel', price: 39.99, stock: 189 },
        { sku: 'APP046', barcode: '8909876543057', name: 'Men\'s Hoodie Black XL', category: 'Apparel', price: 42.99, stock: 178 },
        { sku: 'APP047', barcode: '8909876543058', name: 'Women\'s Hoodie Pink S', category: 'Apparel', price: 39.99, stock: 212 },
        { sku: 'APP048', barcode: '8909876543059', name: 'Women\'s Hoodie Pink M', category: 'Apparel', price: 39.99, stock: 198 },
        { sku: 'APP049', barcode: '8909876543060', name: 'Women\'s Hoodie Pink L', category: 'Apparel', price: 42.99, stock: 189 },
        { sku: 'APP050', barcode: '8909876543061', name: 'Men\'s Dress Shirt White 15.5/32', category: 'Apparel', price: 44.99, stock: 134 },

        // Home & Garden (50 products - abbreviated)
        { sku: 'HOME001', barcode: '8801357924680', name: 'Bed Sheets Queen 4pc', category: 'Home', price: 49.99, stock: 156 },
        { sku: 'HOME002', barcode: '8801357924681', name: 'Bed Sheets King 4pc', category: 'Home', price: 59.99, stock: 134 },
        { sku: 'HOME003', barcode: '8801357924682', name: 'Pillows Standard 2-pack', category: 'Home', price: 29.99, stock: 245 },
        { sku: 'HOME004', barcode: '8801357924683', name: 'Pillows Queen 2-pack', category: 'Home', price: 34.99, stock: 223 },
        { sku: 'HOME005', barcode: '8801357924684', name: 'Comforter Queen', category: 'Home', price: 79.99, stock: 134 },
        { sku: 'HOME006', barcode: '8801357924685', name: 'Comforter King', category: 'Home', price: 89.99, stock: 123 },
        { sku: 'HOME007', barcode: '8801357924686', name: 'Blanket Fleece Throw', category: 'Home', price: 24.99, stock: 267 },
        { sku: 'HOME008', barcode: '8801357924687', name: 'Towel Set 6-piece', category: 'Home', price: 39.99, stock: 198 },
        { sku: 'HOME009', barcode: '8801357924688', name: 'Bath Mat', category: 'Home', price: 14.99, stock: 234 },
        { sku: 'HOME010', barcode: '8801357924689', name: 'Shower Curtain', category: 'Home', price: 19.99, stock: 189 },
        { sku: 'HOME011', barcode: '8801357924690', name: 'Curtains 84" 2-pack', category: 'Home', price: 34.99, stock: 167 },
        { sku: 'HOME012', barcode: '8801357924691', name: 'Curtain Rod 72-120"', category: 'Home', price: 24.99, stock: 145 },
        { sku: 'HOME013', barcode: '8801357924692', name: 'Area Rug 5x7', category: 'Home', price: 89.99, stock: 89 },
        { sku: 'HOME014', barcode: '8801357924693', name: 'Area Rug 8x10', category: 'Home', price: 149.99, stock: 67 },
        { sku: 'HOME015', barcode: '8801357924694', name: 'Coffee Table Wood', category: 'Home', price: 199.99, stock: 45 },
        { sku: 'HOME016', barcode: '8801357924695', name: 'End Table Wood', category: 'Home', price: 129.99, stock: 56 },
        { sku: 'HOME017', barcode: '8801357924696', name: 'TV Stand 60"', category: 'Home', price: 249.99, stock: 34 },
        { sku: 'HOME018', barcode: '8801357924697', name: 'Bookshelf 5-shelf', category: 'Home', price: 179.99, stock: 45 },
        { sku: 'HOME019', barcode: '8801357924698', name: 'Dining Table 6-seat', category: 'Home', price: 399.99, stock: 23 },
        { sku: 'HOME020', barcode: '8801357924699', name: 'Dining Chair Set of 4', category: 'Home', price: 299.99, stock: 34 },
        { sku: 'HOME021', barcode: '8801357924700', name: 'Sofa 3-seat Fabric', category: 'Home', price: 599.99, stock: 19 },
        { sku: 'HOME022', barcode: '8801357924701', name: 'Sofa 3-seat Leather', category: 'Home', price: 899.99, stock: 12 },
        { sku: 'HOME023', barcode: '8801357924702', name: 'Armchair Accent', category: 'Home', price: 199.99, stock: 34 },
        { sku: 'HOME024', barcode: '8801357924703', name: 'Ottoman', category: 'Home', price: 79.99, stock: 56 },
        { sku: 'HOME025', barcode: '8801357924704', name: 'Lamp Table', category: 'Home', price: 49.99, stock: 78 },
        { sku: 'HOME026', barcode: '8801357924705', name: 'Lamp Floor', category: 'Home', price: 89.99, stock: 67 },
        { sku: 'HOME027', barcode: '8801357924706', name: 'Ceiling Light Fixture', category: 'Home', price: 79.99, stock: 45 },
        { sku: 'HOME028', barcode: '8801357924707', name: 'Pendant Light', category: 'Home', price: 69.99, stock: 56 },
        { sku: 'HOME029', barcode: '8801357924708', name: 'Wall Sconce', category: 'Home', price: 39.99, stock: 78 },
        { sku: 'HOME030', barcode: '8801357924709', name: 'Mirror Wall 24x36', category: 'Home', price: 59.99, stock: 89 },
        { sku: 'HOME031', barcode: '8801357924710', name: 'Wall Art 16x20', category: 'Home', price: 29.99, stock: 123 },
        { sku: 'HOME032', barcode: '8801357924711', name: 'Wall Clock Large', category: 'Home', price: 34.99, stock: 98 },
        { sku: 'HOME033', barcode: '8801357924712', name: 'Vase Ceramic 12"', category: 'Home', price: 24.99, stock: 134 },
        { sku: 'HOME034', barcode: '8801357924713', name: 'Candle Holder Set', category: 'Home', price: 19.99, stock: 145 },
        { sku: 'HOME035', barcode: '8801357924714', name: 'Candles Scented 3-pack', category: 'Home', price: 14.99, stock: 234 },
        { sku: 'HOME036', barcode: '8801357924715', name: 'Picture Frames 5x7 3-pack', category: 'Home', price: 24.99, stock: 178 },
        { sku: 'HOME037', barcode: '8801357924716', name: 'Photo Album', category: 'Home', price: 19.99, stock: 156 },
        { sku: 'HOME038', barcode: '8801357924717', name: 'Storage Bins 3-pack', category: 'Home', price: 29.99, stock: 189 },
        { sku: 'HOME039', barcode: '8801357924718', name: 'Closet Organizer', category: 'Home', price: 39.99, stock: 123 },
        { sku: 'HOME040', barcode: '8801357924719', name: 'Shoe Rack 10-tier', category: 'Home', price: 44.99, stock: 145 },
        { sku: 'HOME041', barcode: '8801357924720', name: 'Laundry Hamper', category: 'Home', price: 29.99, stock: 167 },
        { sku: 'HOME042', barcode: '8801357924721', name: 'Ironing Board', category: 'Home', price: 24.99, stock: 134 },
        { sku: 'HOME043', barcode: '8801357924722', name: 'Steam Iron', category: 'Home', price: 34.99, stock: 123 },
        { sku: 'HOME044', barcode: '8801357924723', name: 'Vacuum Cleaner', category: 'Home', price: 149.99, stock: 89 },
        { sku: 'HOME045', barcode: '8801357924724', name: 'Robot Vacuum', category: 'Home', price: 299.99, stock: 45 },
        { sku: 'HOME046', barcode: '8801357924725', name: 'Broom and Dustpan', category: 'Home', price: 14.99, stock: 234 },
        { sku: 'HOME047', barcode: '8801357924726', name: 'Mop and Bucket', category: 'Home', price: 24.99, stock: 189 },
        { sku: 'HOME048', barcode: '8801357924727', name: 'Trash Can 13 gal', category: 'Home', price: 19.99, stock: 267 },
        { sku: 'HOME049', barcode: '8801357924728', name: 'Recycling Bin', category: 'Home', price: 24.99, stock: 198 },
        { sku: 'HOME050', barcode: '8801357924729', name: 'Step Stool', category: 'Home', price: 19.99, stock: 156 },

        // Beauty & Personal Care (50 products - abbreviated)
        { sku: 'BEAU001', barcode: '7701234567890', name: 'Shampoo Moisturizing 12oz', category: 'Beauty', price: 8.99, stock: 345 },
        { sku: 'BEAU002', barcode: '7701234567891', name: 'Conditioner 12oz', category: 'Beauty', price: 8.99, stock: 334 },
        { sku: 'BEAU003', barcode: '7701234567892', name: 'Body Wash 16oz', category: 'Beauty', price: 7.99, stock: 356 },
        { sku: 'BEAU004', barcode: '7701234567893', name: 'Bar Soap 6-pack', category: 'Beauty', price: 5.99, stock: 389 },
        { sku: 'BEAU005', barcode: '7701234567894', name: 'Face Wash 6oz', category: 'Beauty', price: 9.99, stock: 278 },
        { sku: 'BEAU006', barcode: '7701234567895', name: 'Moisturizer 4oz', category: 'Beauty', price: 14.99, stock: 245 },
        { sku: 'BEAU007', barcode: '7701234567896', name: 'Sunscreen SPF50 3oz', category: 'Beauty', price: 11.99, stock: 267 },
        { sku: 'BEAU008', barcode: '7701234567897', name: 'Lip Balm 2-pack', category: 'Beauty', price: 3.99, stock: 412 },
        { sku: 'BEAU009', barcode: '7701234567898', name: 'Lipstick Red', category: 'Beauty', price: 12.99, stock: 234 },
        { sku: 'BEAU010', barcode: '7701234567899', name: 'Lipstick Pink', category: 'Beauty', price: 12.99, stock: 245 },
        { sku: 'BEAU011', barcode: '7701234567900', name: 'Mascara Black', category: 'Beauty', price: 10.99, stock: 267 },
        { sku: 'BEAU012', barcode: '7701234567901', name: 'Eyeliner Black', category: 'Beauty', price: 8.99, stock: 278 },
        { sku: 'BEAU013', barcode: '7701234567902', name: 'Eyeshadow Palette', category: 'Beauty', price: 24.99, stock: 189 },
        { sku: 'BEAU014', barcode: '7701234567903', name: 'Foundation Light', category: 'Beauty', price: 16.99, stock: 198 },
        { sku: 'BEAU015', barcode: '7701234567904', name: 'Foundation Medium', category: 'Beauty', price: 16.99, stock: 212 },
        { sku: 'BEAU016', barcode: '7701234567905', name: 'Concealer', category: 'Beauty', price: 11.99, stock: 234 },
        { sku: 'BEAU017', barcode: '7701234567906', name: 'Blush Powder', category: 'Beauty', price: 13.99, stock: 198 },
        { sku: 'BEAU018', barcode: '7701234567907', name: 'Highlighter', category: 'Beauty', price: 14.99, stock: 189 },
        { sku: 'BEAU019', barcode: '7701234567908', name: 'Setting Spray', category: 'Beauty', price: 12.99, stock: 212 },
        { sku: 'BEAU020', barcode: '7701234567909', name: 'Makeup Remover 8oz', category: 'Beauty', price: 9.99, stock: 245 },
        { sku: 'BEAU021', barcode: '7701234567910', name: 'Cotton Rounds 100ct', category: 'Beauty', price: 3.99, stock: 367 },
        { sku: 'BEAU022', barcode: '7701234567911', name: 'Nail Polish Red', category: 'Beauty', price: 6.99, stock: 278 },
        { sku: 'BEAU023', barcode: '7701234567912', name: 'Nail Polish Pink', category: 'Beauty', price: 6.99, stock: 267 },
        { sku: 'BEAU024', barcode: '7701234567913', name: 'Nail Polish Remover', category: 'Beauty', price: 4.99, stock: 289 },
        { sku: 'BEAU025', barcode: '7701234567914', name: 'Nail File Set', category: 'Beauty', price: 5.99, stock: 298 },
        { sku: 'BEAU026', barcode: '7701234567915', name: 'Deodorant Men', category: 'Beauty', price: 5.99, stock: 345 },
        { sku: 'BEAU027', barcode: '7701234567916', name: 'Deodorant Women', category: 'Beauty', price: 5.99, stock: 356 },
        { sku: 'BEAU028', barcode: '7701234567917', name: 'Razor 5-blade 4-pack', category: 'Beauty', price: 14.99, stock: 267 },
        { sku: 'BEAU029', barcode: '7701234567918', name: 'Shaving Cream 10oz', category: 'Beauty', price: 4.99, stock: 278 },
        { sku: 'BEAU030', barcode: '7701234567919', name: 'Aftershave 4oz', category: 'Beauty', price: 9.99, stock: 198 },
        { sku: 'BEAU031', barcode: '7701234567920', name: 'Toothpaste 6oz', category: 'Beauty', price: 3.99, stock: 389 },
        { sku: 'BEAU032', barcode: '7701234567921', name: 'Toothbrush 4-pack', category: 'Beauty', price: 5.99, stock: 367 },
        { sku: 'BEAU033', barcode: '7701234567922', name: 'Electric Toothbrush', category: 'Beauty', price: 49.99, stock: 145 },
        { sku: 'BEAU034', barcode: '7701234567923', name: 'Mouthwash 16oz', category: 'Beauty', price: 4.99, stock: 312 },
        { sku: 'BEAU035', barcode: '7701234567924', name: 'Dental Floss 2-pack', category: 'Beauty', price: 3.99, stock: 334 },
        { sku: 'BEAU036', barcode: '7701234567925', name: 'Hair Gel 6oz', category: 'Beauty', price: 5.99, stock: 245 },
        { sku: 'BEAU037', barcode: '7701234567926', name: 'Hair Spray 8oz', category: 'Beauty', price: 6.99, stock: 234 },
        { sku: 'BEAU038', barcode: '7701234567927', name: 'Hair Mousse 8oz', category: 'Beauty', price: 7.99, stock: 223 },
        { sku: 'BEAU039', barcode: '7701234567928', name: 'Hair Wax 4oz', category: 'Beauty', price: 8.99, stock: 212 },
        { sku: 'BEAU040', barcode: '7701234567929', name: 'Hair Brush', category: 'Beauty', price: 9.99, stock: 267 },
        { sku: 'BEAU041', barcode: '7701234567930', name: 'Comb', category: 'Beauty', price: 2.99, stock: 289 },
        { sku: 'BEAU042', barcode: '7701234567931', name: 'Hair Dryer', category: 'Beauty', price: 29.99, stock: 156 },
        { sku: 'BEAU043', barcode: '7701234567932', name: 'Curling Iron', category: 'Beauty', price: 24.99, stock: 145 },
        { sku: 'BEAU044', barcode: '7701234567933', name: 'Flat Iron', category: 'Beauty', price: 34.99, stock: 134 },
        { sku: 'BEAU045', barcode: '7701234567934', name: 'Hair Clips 12-pack', category: 'Beauty', price: 4.99, stock: 278 },
        { sku: 'BEAU046', barcode: '7701234567935', name: 'Hair Ties 20-pack', category: 'Beauty', price: 3.99, stock: 298 },
        { sku: 'BEAU047', barcode: '7701234567936', name: 'Headband', category: 'Beauty', price: 5.99, stock: 234 },
        { sku: 'BEAU048', barcode: '7701234567937', name: 'Face Mask Sheet 5-pack', category: 'Beauty', price: 9.99, stock: 245 },
        { sku: 'BEAU049', barcode: '7701234567938', name: 'Face Mask Clay', category: 'Beauty', price: 12.99, stock: 212 },
        { sku: 'BEAU050', barcode: '7701234567939', name: 'Eye Cream 0.5oz', category: 'Beauty', price: 19.99, stock: 178 },

        // Sports & Outdoors (50 products - abbreviated)
        { sku: 'SPRT001', barcode: '6601234567890', name: 'Yoga Mat', category: 'Sports', price: 24.99, stock: 189 },
        { sku: 'SPRT002', barcode: '6601234567891', name: 'Yoga Block 2-pack', category: 'Sports', price: 12.99, stock: 234 },
        { sku: 'SPRT003', barcode: '6601234567892', name: 'Yoga Strap', category: 'Sports', price: 9.99, stock: 245 },
        { sku: 'SPRT004', barcode: '6601234567893', name: 'Exercise Mat', category: 'Sports', price: 29.99, stock: 178 },
        { sku: 'SPRT005', barcode: '6601234567894', name: 'Dumbbells 5lb Pair', category: 'Sports', price: 19.99, stock: 156 },
        { sku: 'SPRT006', barcode: '6601234567895', name: 'Dumbbells 10lb Pair', category: 'Sports', price: 29.99, stock: 145 },
        { sku: 'SPRT007', barcode: '6601234567896', name: 'Kettlebell 15lb', category: 'Sports', price: 24.99, stock: 134 },
        { sku: 'SPRT008', barcode: '6601234567897', name: 'Kettlebell 25lb', category: 'Sports', price: 34.99, stock: 123 },
        { sku: 'SPRT009', barcode: '6601234567898', name: 'Resistance Bands Set', category: 'Sports', price: 19.99, stock: 189 },
        { sku: 'SPRT010', barcode: '6601234567899', name: 'Jump Rope', category: 'Sports', price: 9.99, stock: 234 },
        { sku: 'SPRT011', barcode: '6601234567900', name: 'Push Up Bars', category: 'Sports', price: 14.99, stock: 178 },
        { sku: 'SPRT012', barcode: '6601234567901', name: 'Ab Roller', category: 'Sports', price: 16.99, stock: 167 },
        { sku: 'SPRT013', barcode: '6601234567902', name: 'Foam Roller', category: 'Sports', price: 19.99, stock: 156 },
        { sku: 'SPRT014', barcode: '6601234567903', name: 'Gym Ball 65cm', category: 'Sports', price: 22.99, stock: 145 },
        { sku: 'SPRT015', barcode: '6601234567904', name: 'Workout Gloves', category: 'Sports', price: 14.99, stock: 178 },
        { sku: 'SPRT016', barcode: '6601234567905', name: 'Waist Trimmer', category: 'Sports', price: 12.99, stock: 189 },
        { sku: 'SPRT017', barcode: '6601234567906', name: 'Sweatband', category: 'Sports', price: 5.99, stock: 234 },
        { sku: 'SPRT018', barcode: '6601234567907', name: 'Water Bottle 32oz', category: 'Sports', price: 12.99, stock: 267 },
        { sku: 'SPRT019', barcode: '6601234567908', name: 'Shaker Bottle', category: 'Sports', price: 9.99, stock: 245 },
        { sku: 'SPRT020', barcode: '6601234567909', name: 'Protein Powder 2lb', category: 'Sports', price: 34.99, stock: 156 },
        { sku: 'SPRT021', barcode: '6601234567910', name: 'Pre-Workout 30 servings', category: 'Sports', price: 29.99, stock: 145 },
        { sku: 'SPRT022', barcode: '6601234567911', name: 'BCAA 60 servings', category: 'Sports', price: 24.99, stock: 134 },
        { sku: 'SPRT023', barcode: '6601234567912', name: 'Creatine 300g', category: 'Sports', price: 19.99, stock: 167 },
        { sku: 'SPRT024', barcode: '6601234567913', name: 'Running Shoes Men Size 9', category: 'Sports', price: 79.99, stock: 89 },
        { sku: 'SPRT025', barcode: '6601234567914', name: 'Running Shoes Men Size 10', category: 'Sports', price: 79.99, stock: 98 },
        { sku: 'SPRT026', barcode: '6601234567915', name: 'Running Shoes Men Size 11', category: 'Sports', price: 79.99, stock: 87 },
        { sku: 'SPRT027', barcode: '6601234567916', name: 'Running Shoes Women Size 7', category: 'Sports', price: 79.99, stock: 112 },
        { sku: 'SPRT028', barcode: '6601234567917', name: 'Running Shoes Women Size 8', category: 'Sports', price: 79.99, stock: 123 },
        { sku: 'SPRT029', barcode: '6601234567918', name: 'Running Shoes Women Size 9', category: 'Sports', price: 79.99, stock: 98 },
        { sku: 'SPRT030', barcode: '6601234567919', name: 'Training Shoes Men Size 9', category: 'Sports', price: 69.99, stock: 134 },
        { sku: 'SPRT031', barcode: '6601234567920', name: 'Training Shoes Women Size 7', category: 'Sports', price: 69.99, stock: 145 },
        { sku: 'SPRT032', barcode: '6601234567921', name: 'Running Shorts Men M', category: 'Sports', price: 24.99, stock: 178 },
        { sku: 'SPRT033', barcode: '6601234567922', name: 'Running Shorts Men L', category: 'Sports', price: 24.99, stock: 167 },
        { sku: 'SPRT034', barcode: '6601234567923', name: 'Running Shorts Women S', category: 'Sports', price: 24.99, stock: 189 },
        { sku: 'SPRT035', barcode: '6601234567924', name: 'Running Shorts Women M', category: 'Sports', price: 24.99, stock: 178 },
        { sku: 'SPRT036', barcode: '6601234567925', name: 'Sports Bra S', category: 'Sports', price: 19.99, stock: 234 },
        { sku: 'SPRT037', barcode: '6601234567926', name: 'Sports Bra M', category: 'Sports', price: 19.99, stock: 223 },
        { sku: 'SPRT038', barcode: '6601234567927', name: 'Sports Bra L', category: 'Sports', price: 21.99, stock: 212 },
        { sku: 'SPRT039', barcode: '6601234567928', name: 'Tank Top Men M', category: 'Sports', price: 14.99, stock: 198 },
        { sku: 'SPRT040', barcode: '6601234567929', name: 'Tank Top Men L', category: 'Sports', price: 14.99, stock: 187 },
        { sku: 'SPRT041', barcode: '6601234567930', name: 'Tank Top Women S', category: 'Sports', price: 14.99, stock: 212 },
        { sku: 'SPRT042', barcode: '6601234567931', name: 'Tank Top Women M', category: 'Sports', price: 14.99, stock: 198 },
        { sku: 'SPRT043', barcode: '6601234567932', name: 'Hoodie Men M', category: 'Sports', price: 34.99, stock: 145 },
        { sku: 'SPRT044', barcode: '6601234567933', name: 'Hoodie Women S', category: 'Sports', price: 34.99, stock: 156 },
        { sku: 'SPRT045', barcode: '6601234567934', name: 'Jacket Men L', category: 'Sports', price: 49.99, stock: 123 },
        { sku: 'SPRT046', barcode: '6601234567935', name: 'Jacket Women M', category: 'Sports', price: 49.99, stock: 134 },
        { sku: 'SPRT047', barcode: '6601234567936', name: 'Baseball Glove', category: 'Sports', price: 39.99, stock: 89 },
        { sku: 'SPRT048', barcode: '6601234567937', name: 'Baseball Bat', category: 'Sports', price: 59.99, stock: 78 },
        { sku: 'SPRT049', barcode: '6601234567938', name: 'Baseball 3-pack', category: 'Sports', price: 9.99, stock: 156 },
        { sku: 'SPRT050', barcode: '6601234567939', name: 'Basketball', category: 'Sports', price: 24.99, stock: 145 },

        // Books & Media (50 products - abbreviated)
        { sku: 'BOOK001', barcode: '9781234567890', name: 'The Great Novel Hardcover', category: 'Books', price: 24.99, stock: 234 },
        { sku: 'BOOK002', barcode: '9781234567891', name: 'Mystery Thriller Paperback', category: 'Books', price: 14.99, stock: 267 },
        { sku: 'BOOK003', barcode: '9781234567892', name: 'Science Fiction Epic', category: 'Books', price: 16.99, stock: 245 },
        { sku: 'BOOK004', barcode: '9781234567893', name: 'Romance Novel', category: 'Books', price: 12.99, stock: 278 },
        { sku: 'BOOK005', barcode: '9781234567894', name: 'Historical Fiction', category: 'Books', price: 15.99, stock: 234 },
        { sku: 'BOOK006', barcode: '9781234567895', name: 'Biography Celebrity', category: 'Books', price: 22.99, stock: 198 },
        { sku: 'BOOK007', barcode: '9781234567896', name: 'Autobiography Athlete', category: 'Books', price: 19.99, stock: 189 },
        { sku: 'BOOK008', barcode: '9781234567897', name: 'Cookbook Italian', category: 'Books', price: 29.99, stock: 167 },
        { sku: 'BOOK009', barcode: '9781234567898', name: 'Cookbook Vegan', category: 'Books', price: 27.99, stock: 156 },
        { sku: 'BOOK010', barcode: '9781234567899', name: 'Self-Help Success', category: 'Books', price: 18.99, stock: 212 },
        { sku: 'BOOK011', barcode: '9781234567900', name: 'Psychology of Money', category: 'Books', price: 21.99, stock: 198 },
        { sku: 'BOOK012', barcode: '9781234567901', name: 'Business Strategy', category: 'Books', price: 32.99, stock: 145 },
        { sku: 'BOOK013', barcode: '9781234567902', name: 'Marketing 101', category: 'Books', price: 26.99, stock: 156 },
        { sku: 'BOOK014', barcode: '9781234567903', name: 'Leadership Principles', category: 'Books', price: 24.99, stock: 167 },
        { sku: 'BOOK015', barcode: '9781234567904', name: 'History of World War II', category: 'Books', price: 34.99, stock: 134 },
        { sku: 'BOOK016', barcode: '9781234567905', name: 'Ancient Civilizations', category: 'Books', price: 29.99, stock: 145 },
        { sku: 'BOOK017', barcode: '9781234567906', name: 'Space Exploration', category: 'Books', price: 27.99, stock: 123 },
        { sku: 'BOOK018', barcode: '9781234567907', name: 'Ocean Life', category: 'Books', price: 22.99, stock: 134 },
        { sku: 'BOOK019', barcode: '9781234567908', name: 'Bird Guide', category: 'Books', price: 19.99, stock: 145 },
        { sku: 'BOOK020', barcode: '9781234567909', name: 'Tree Identification', category: 'Books', price: 18.99, stock: 156 },
        { sku: 'BOOK021', barcode: '9781234567910', name: 'Children\'s Picture Book', category: 'Books', price: 12.99, stock: 267 },
        { sku: 'BOOK022', barcode: '9781234567911', name: 'Bedtime Stories', category: 'Books', price: 11.99, stock: 278 },
        { sku: 'BOOK023', barcode: '9781234567912', name: 'Young Adult Fantasy', category: 'Books', price: 14.99, stock: 245 },
        { sku: 'BOOK024', barcode: '9781234567913', name: 'Teen Drama', category: 'Books', price: 13.99, stock: 234 },
        { sku: 'BOOK025', barcode: '9781234567914', name: 'Poetry Collection', category: 'Books', price: 16.99, stock: 198 },
        { sku: 'BOOK026', barcode: '9781234567915', name: 'Shakespeare Complete', category: 'Books', price: 29.99, stock: 156 },
        { sku: 'BOOK027', barcode: '9781234567916', name: 'Classic Literature Set', category: 'Books', price: 39.99, stock: 134 },
        { sku: 'BOOK028', barcode: '9781234567917', name: 'Dictionary', category: 'Books', price: 24.99, stock: 167 },
        { sku: 'BOOK029', barcode: '9781234567918', name: 'Thesaurus', category: 'Books', price: 19.99, stock: 145 },
        { sku: 'BOOK030', barcode: '9781234567919', name: 'Encyclopedia Set', category: 'Books', price: 89.99, stock: 67 },
        { sku: 'BOOK031', barcode: '9781234567920', name: 'Atlas World', category: 'Books', price: 34.99, stock: 98 },
        { sku: 'BOOK032', barcode: '9781234567921', name: 'Map United States', category: 'Books', price: 14.99, stock: 123 },
        { sku: 'BOOK033', barcode: '9781234567922', name: 'Learning Spanish', category: 'Books', price: 21.99, stock: 145 },
        { sku: 'BOOK034', barcode: '9781234567923', name: 'Learning French', category: 'Books', price: 21.99, stock: 134 },
        { sku: 'BOOK035', barcode: '9781234567924', name: 'Learning Italian', category: 'Books', price: 21.99, stock: 123 },
        { sku: 'BOOK036', barcode: '9781234567925', name: 'German Dictionary', category: 'Books', price: 19.99, stock: 112 },
        { sku: 'BOOK037', barcode: '9781234567926', name: 'Japanese Phrasebook', category: 'Books', price: 12.99, stock: 145 },
        { sku: 'BOOK038', barcode: '9781234567927', name: 'Chinese Characters', category: 'Books', price: 16.99, stock: 134 },
        { sku: 'BOOK039', barcode: '9781234567928', name: 'Russian Language', category: 'Books', price: 18.99, stock: 123 },
        { sku: 'BOOK040', barcode: '9781234567929', name: 'Arabic Script', category: 'Books', price: 17.99, stock: 112 },
        { sku: 'BOOK041', barcode: '9781234567930', name: 'Programming Python', category: 'Books', price: 39.99, stock: 156 },
        { sku: 'BOOK042', barcode: '9781234567931', name: 'JavaScript Guide', category: 'Books', price: 34.99, stock: 167 },
        { sku: 'BOOK043', barcode: '9781234567932', name: 'Web Development', category: 'Books', price: 29.99, stock: 145 },
        { sku: 'BOOK044', barcode: '9781234567933', name: 'Data Science', category: 'Books', price: 44.99, stock: 134 },
        { sku: 'BOOK045', barcode: '9781234567934', name: 'Machine Learning', category: 'Books', price: 49.99, stock: 123 },
        { sku: 'BOOK046', barcode: '9781234567935', name: 'Artificial Intelligence', category: 'Books', price: 54.99, stock: 112 },
        { sku: 'BOOK047', barcode: '9781234567936', name: 'Cybersecurity', category: 'Books', price: 39.99, stock: 134 },
        { sku: 'BOOK048', barcode: '9781234567937', name: 'Network Security', category: 'Books', price: 42.99, stock: 123 },
        { sku: 'BOOK049', barcode: '9781234567938', name: 'Cloud Computing', category: 'Books', price: 37.99, stock: 145 },
        { sku: 'BOOK050', barcode: '9781234567939', name: 'DevOps Handbook', category: 'Books', price: 34.99, stock: 134 }
    
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
    },

    getProductByQR: function(qrCode) {
        const cleanCode = qrCode.trim();
        
        if (cleanCode.includes('product/')) {
            const sku = cleanCode.split('/').pop();
            return this.products.find(p => p.sku === sku);
        }
        
        if (cleanCode.startsWith('QR-')) {
            return this.products.find(p => p.barcode === cleanCode);
        }
        
        return this.getProductByCode(cleanCode);
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
        if(beep) { 
            beep.currentTime = 0; 
            beep.play().catch(e => console.log("Audio play prevented")); 
        }
    },
    
    showToast: (title, message, type = 'info') => {
        const container = document.getElementById('toastContainer');
        const iconMap = { 
            'success': 'fa-check-circle', 
            'error': 'fa-exclamation-circle', 
            'warning': 'fa-exclamation-triangle', 
            'info': 'fa-info-circle' 
        };
        
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
        
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },
    
    showNotificationPopup: function() {
        Swal.fire({
            title: 'Notifications',
            html: `
                <div style="text-align:left;">
                    <p><i class="fas fa-info-circle" style="color:#3b82f6;"></i> Welcome to POS terminal</p>
                    <p><i class="fas fa-check-circle" style="color:#10b981;"></i> Shift started at ${RetailX.State.shift.startTime?.toLocaleTimeString()}</p>
                    <p><i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> Low stock on Wireless Mouse</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Dismiss'
        });
    },

    hideLoader: function() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 400);
        }
    },

    // Print receipt for a given transaction
    printReceipt: function(transaction) {
        if (!transaction) {
            RetailX.Utils.showToast('No Receipt', 'No transaction selected', 'error');
            return false;
        }

        // Generate receipt HTML using same logic as in POS.completeTransaction
        let itemsHtml = '';
        transaction.items.forEach(i => {
            itemsHtml += `
                <tr>
                    <td>${i.name.substring(0, 20)}</td>
                    <td class="qty">${i.qty}</td>
                    <td class="amt">₹${i.price.toFixed(2)}</td>
                    <td class="amt">₹${(i.qty * i.price).toFixed(2)}</td>
                </tr>
            `;
        });

        const html = `
            <div class="rcpt-header">
                <h2>${RetailX.Config.storeName}</h2>
                <p>123 Main Street, Cityville</p>
                <p>Tel: (555) 123-4567</p>
            </div>
            <div class="rcpt-meta">
                <span>Date: ${transaction.date.toLocaleDateString()}</span>
                <span>Time: ${transaction.date.toLocaleTimeString()}</span>
            </div>
            <div class="rcpt-meta">
                <span>Reg: ${RetailX.Config.registerId}</span>
                <span>Bill: ${transaction.id}</span>
            </div>
            <table class="rcpt-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div class="rcpt-totals">
                <div class="rcpt-line"><span>Subtotal:</span><span>₹${transaction.totals.subtotal.toFixed(2)}</span></div>
                ${transaction.totals.discountAmt > 0 ? `<div class="rcpt-line"><span>Discount:</span><span>-₹${transaction.totals.discountAmt.toFixed(2)}</span></div>` : ''}
                <div class="rcpt-line"><span>Tax (8.5%):</span><span>₹${transaction.totals.tax.toFixed(2)}</span></div>
                <div class="rcpt-line bold"><span>TOTAL:</span><span>₹${transaction.totals.grandTotal.toFixed(2)}</span></div>
            </div>
            <div class="rcpt-totals">
                <div class="rcpt-line"><span>Paid by ${transaction.method.toUpperCase()}:</span><span>₹${transaction.tendered.toFixed(2)}</span></div>
                <div class="rcpt-line"><span>Change:</span><span>₹${transaction.change.toFixed(2)}</span></div>
            </div>
            <div class="rcpt-barcode">
                *${transaction.id}*
            </div>
            <div class="rcpt-footer">
                <p>Thank you for shopping with us!</p>
                <p>Retain receipt for returns.</p>
            </div>
        `;

        $('#receiptPrintArea').html(html);
        $('#receiptModal').addClass('show');

        // Automatically trigger print after a short delay
        setTimeout(() => {
            window.print();
            // Close modal after printing (or after a short delay)
            setTimeout(() => {
                $('#receiptModal').removeClass('show');
            }, 1000);
        }, 300);
    },

    // Generate Z-Report PDF
    generateZReport: function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const s = RetailX.State.shift;
        const endTime = new Date();
        const shiftDuration = Math.floor((endTime - s.startTime) / 1000);
        const hours = String(Math.floor(shiftDuration / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((shiftDuration % 3600) / 60)).padStart(2, '0');
        const seconds = String(shiftDuration % 60).padStart(2, '0');
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(67, 97, 238);
        doc.text('RETAILX - Z REPORT', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Store: ${RetailX.Config.storeName}`, 20, 35);
        doc.text(`Register: ${RetailX.Config.registerId}`, 20, 42);
        doc.text(`Cashier: ${$('#cashierName').text()}`, 20, 49);
        doc.text(`Date: ${endTime.toLocaleDateString()}`, 20, 56);
        doc.text(`Time: ${endTime.toLocaleTimeString()}`, 20, 63);
        doc.text(`Shift Duration: ${hours}:${minutes}:${seconds}`, 20, 70);
        
        // Summary
        doc.setFontSize(14);
        doc.setTextColor(67, 97, 238);
        doc.text('SHIFT SUMMARY', 20, 85);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Bills Generated: ${s.billsGenerated}`, 20, 95);
        doc.text(`Items Sold: ${s.itemsSold}`, 20, 102);
        
        // Financial Summary
        doc.setFontSize(14);
        doc.setTextColor(67, 97, 238);
        doc.text('FINANCIAL SUMMARY', 20, 117);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Gross Sales: ₹${s.totalSales.toFixed(2)}`, 20, 127);
        doc.text(`Refunds: ₹${s.totalRefunds.toFixed(2)}`, 20, 134);
        doc.text(`Net Sales: ₹${(s.totalSales - s.totalRefunds).toFixed(2)}`, 20, 141);
        
        // Tax Calculation (approximate)
        const taxAmount = s.totalSales - (s.totalSales / (1 + RetailX.Config.taxRate));
        doc.text(`Tax Collected (${RetailX.Config.taxRate * 100}%): ₹${taxAmount.toFixed(2)}`, 20, 148);
        
        // Tender Breakdown
        doc.setFontSize(14);
        doc.setTextColor(67, 97, 238);
        doc.text('TENDER BREAKDOWN', 20, 163);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Cash: ₹${s.cashTendered.toFixed(2)}`, 20, 173);
        doc.text(`Card: ₹${s.cardTendered.toFixed(2)}`, 20, 180);
        doc.text(`Digital: ₹${s.digitalTendered.toFixed(2)}`, 20, 187);
        doc.text(`Total: ₹${(s.cashTendered + s.cardTendered + s.digitalTendered).toFixed(2)}`, 20, 194);
        
        // Footer
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('This is an official Z-Report generated by RetailX POS System', 105, 280, { align: 'center' });
        
        // Save PDF
        const filename = `Z-Report_${endTime.toISOString().slice(0,10)}_${endTime.toTimeString().slice(0,8).replace(/:/g, '-')}.pdf`;
        doc.save(filename);
        
        return doc;
    }
};

// ============================================
// UNIFIED CAMERA SCANNER MODULE (QR & Barcode)
// ============================================
RetailX.CameraScanner = {
    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        const self = this;

        $('#cameraScanBtn').off('click').on('click', function() {
            self.openScanner();
        });

        $('#scannerClose').off('click').on('click', function() {
            self.closeScanner();
        });

        $('#applyCameraBtn').off('click').on('click', function() {
            const selected = $('#cameraSelect').val();
            self.applyCameraSelection(selected);
        });

        $('#switchCameraBtn').off('click').on('click', function() {
            self.quickSwitchCamera();
        });

        $('#detectCamerasBtn').off('click').on('click', function() {
            RetailX.Utils.showToast('Detecting Cameras', 'Searching for available cameras...', 'info');
            self.enumerateCameras();
        });

        // Mode selection cards
        $('#modeQR').off('click').on('click', function() {
            self.setMode('qr');
        });

        $('#modeBarcode').off('click').on('click', function() {
            self.setMode('barcode');
        });

        $(window).off('click').on('click', function(e) {
            if ($(e.target).hasClass('modal')) {
                self.closeScanner();
            }
        });

        $(document).off('keydown').on('keydown', function(e) {
            if (e.key === 'Escape' && $('#scannerModal').hasClass('show')) {
                self.closeScanner();
            }
        });
    },

    setMode: function(mode) {
        if (mode === RetailX.State.scanMode) return;
        RetailX.State.scanMode = mode;
        $('.mode-card').removeClass('active');
        $(`#mode${mode === 'qr' ? 'QR' : 'Barcode'}`).addClass('active');
        $('#scanner-status').html(`<i class="fas fa-info-circle"></i> Switched to ${mode === 'qr' ? 'QR' : 'Barcode'} mode.`);
        
        // Restart scanning if camera is active
        if (RetailX.State.isCameraActive) {
            this.stopContinuousScan();
            this.startContinuousScan();
        }
    },

    // Helper to disable/enable apply button during enumeration
    disableApplyButton: function(disabled) {
        $('#applyCameraBtn').prop('disabled', disabled);
        if (disabled) {
            $('#applyCameraBtn').addClass('disabled');
        } else {
            $('#applyCameraBtn').removeClass('disabled');
        }
    },

    enumerateCameras: function() {
        const self = this;
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            RetailX.Utils.showToast('Camera Detection', 'Your browser does not support camera enumeration', 'warning');
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop());
                return navigator.mediaDevices.enumerateDevices();
            })
            .then(devices => {
                RetailX.State.availableCameras = devices.filter(device => device.kind === 'videoinput');
                console.log(`📷 Found ${RetailX.State.availableCameras.length} cameras`);
                this.updateCameraDropdown();
                
                if (RetailX.State.availableCameras.length > 0) {
                    RetailX.Utils.showToast('Cameras Detected', `Found ${RetailX.State.availableCameras.length} camera(s)`, 'success');
                }
                self.disableApplyButton(false);
                $('#scanner-status').html('<i class="fas fa-info-circle"></i> Cameras detected. Select a camera.');
            })
            .catch(err => {
                console.error('Error enumerating cameras:', err);
                self.disableApplyButton(false);
                $('#scanner-status').html('<i class="fas fa-exclamation-triangle"></i> Camera enumeration failed. Try default.');
            });
    },

    updateCameraDropdown: function() {
        const select = $('#cameraSelect');
        if (!select.length) return;

        const currentValue = select.val();
        select.empty();
        
        select.append('<option value="default">📷 Default Camera</option>');
        select.append('<option value="environment">📱 Back Camera</option>');
        select.append('<option value="user">🤳 Front Camera</option>');
        select.append('<option value="droidcam">📱 DroidCam (Mobile Camera)</option>');
        
        if (RetailX.State.availableCameras.length > 0) {
            select.append('<option disabled>──────────</option>');
            
            RetailX.State.availableCameras.forEach((camera, index) => {
                let label = camera.label || `Camera ${index + 1}`;
                label = label.replace(' (046d:0825)', '').trim();
                
                const isDroidCam = label.toLowerCase().includes('droidcam') || 
                                   label.toLowerCase().includes('droid') ||
                                   label.toLowerCase().includes('mobile') ||
                                   label.toLowerCase().includes('phone');
                
                if (label.length > 40) {
                    label = label.substring(0, 40) + '...';
                }
                
                const optionValue = camera.deviceId;
                const optionLabel = isDroidCam ? `📱 ${label}` : `📷 ${label}`;
                
                select.append(`<option value="${optionValue}">${optionLabel}</option>`);
            });
        }

        if (currentValue) {
            if (select.find(`option[value="${currentValue}"]`).length) {
                select.val(currentValue);
            }
        }
    },

    applyCameraSelection: function(selection) {
        // Special handling for DroidCam
        if (selection === 'droidcam') {
            const droidCamDevice = RetailX.State.availableCameras.find(device => 
                device.label && device.label.toLowerCase().includes('droidcam')
            );
            if (droidCamDevice) {
                RetailX.State.currentCamera = droidCamDevice.deviceId;
                RetailX.Utils.showToast('DroidCam Found', 'Using DroidCam as camera source', 'success');
            } else {
                RetailX.Utils.showToast('DroidCam Not Found', 'Falling back to back camera', 'warning');
                RetailX.State.currentCamera = 'environment';
                $('#cameraSelect').val('environment');
            }
        } else if (selection === 'default') {
            RetailX.State.currentCamera = '';
        } else if (selection === 'environment' || selection === 'user') {
            RetailX.State.currentCamera = selection;
        } else {
            RetailX.State.currentCamera = selection;
        }
        this.startCamera();
    },

    quickSwitchCamera: function() {
        if (RetailX.State.currentCamera === 'environment') {
            RetailX.State.currentCamera = 'user';
        } else if (RetailX.State.currentCamera === 'user') {
            RetailX.State.currentCamera = 'environment';
        } else {
            RetailX.State.currentCamera = 'environment';
        }
        
        $('#cameraSelect').val(RetailX.State.currentCamera);
        this.startCamera();
        RetailX.Utils.showToast('Camera Switched', `Switched to ${RetailX.State.currentCamera === 'environment' ? 'back' : 'front'} camera`, 'info');
    },

    openScanner: function() {
        $('#scannerModal').addClass('show');
        $('#scanner-result').removeClass('show').empty();
        $('#scanner-status').html('<i class="fas fa-info-circle"></i> Detecting cameras...');
        
        // Set default mode to QR (active)
        RetailX.State.scanMode = 'qr';
        $('.mode-card').removeClass('active');
        $('#modeQR').addClass('active');
        
        this.disableApplyButton(true);
        this.enumerateCameras();
        
        setTimeout(() => {
            RetailX.State.currentCamera = 'environment';
            this.startCamera();
        }, 500);
    },

    closeScanner: function() {
        this.stopContinuousScan();
        this.stopCamera();
        $('#scannerModal').removeClass('show');
        $('#scanner-result').removeClass('show').empty();
        $('#scanner-status').html('<i class="fas fa-info-circle"></i> Camera closed');
        
        setTimeout(() => {
            $('#posBarcodeScanner').focus();
        }, 300);
    },

    startCamera: function() {
        const self = this;
        const video = document.getElementById('scanner-video');
        
        if (!video) return;

        this.stopCamera();
        this.stopContinuousScan();

        const container = document.querySelector('.camera-container');
        if (container) {
            if (RetailX.State.currentCamera === 'user') {
                container.classList.remove('camera-back');
            } else {
                container.classList.add('camera-back');
            }
        }

        let constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        if (RetailX.State.currentCamera && RetailX.State.currentCamera !== '') {
            if (RetailX.State.currentCamera === 'environment' || RetailX.State.currentCamera === 'user') {
                constraints.video.facingMode = RetailX.State.currentCamera;
            } else {
                constraints.video.deviceId = { exact: RetailX.State.currentCamera };
            }
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
                RetailX.State.cameraStream = stream;
                RetailX.State.isCameraActive = true;
                video.srcObject = stream;
                return video.play();
            })
            .then(() => {
                $('#scanner-status').removeClass('error').addClass('success').html('<i class="fas fa-check-circle"></i> Camera ready. Scanning automatically...');
                self.startContinuousScan();
            })
            .catch(function(err) {
                console.error('Camera error:', err);
                RetailX.State.isCameraActive = false;
                
                let errorMessage = 'Could not access camera';
                if (err.name === 'NotAllowedError') {
                    errorMessage = 'Camera permission denied';
                } else if (err.name === 'NotFoundError') {
                    errorMessage = 'No camera found';
                }
                
                RetailX.Utils.showToast('Camera Error', errorMessage, 'error');
                $('#scanner-status').removeClass('success').addClass('error').html(`<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`);
            });
    },

    stopCamera: function() {
        if (RetailX.State.cameraStream && RetailX.State.isCameraActive) {
            RetailX.State.cameraStream.getTracks().forEach(track => {
                track.stop();
            });
            RetailX.State.cameraStream = null;
            RetailX.State.isCameraActive = false;
        }
        
        const video = document.getElementById('scanner-video');
        if (video) {
            video.srcObject = null;
        }
    },

    startContinuousScan: function() {
        if (!RetailX.State.isCameraActive) return;
        this.stopContinuousScan();
        RetailX.State.scanningEnabled = true;

        if (RetailX.State.scanMode === 'qr') {
            this.startQRScan();
        } else {
            this.startBarcodeScan();
        }
    },

    stopContinuousScan: function() {
        RetailX.State.scanningEnabled = false;
        if (RetailX.State.scanLoopId) {
            cancelAnimationFrame(RetailX.State.scanLoopId);
            RetailX.State.scanLoopId = null;
        }
        if (RetailX.State.quaggaInitialized) {
            Quagga.stop();
            RetailX.State.quaggaInitialized = false;
        }
    },

    startQRScan: function() {
        const self = this;
        const video = document.getElementById('scanner-video');
        const canvas = document.getElementById('scanner-canvas');
        
        if (!video || !canvas || typeof jsQR === 'undefined') return;

        const scanFrame = function() {
            if (!RetailX.State.isCameraActive || RetailX.State.scanMode !== 'qr' || !RetailX.State.scanningEnabled) return;

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                if (canvas.width > 0 && canvas.height > 0) {
                    const context = canvas.getContext('2d', { willReadFrequently: true });
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert"
                    });

                    if (code) {
                        self.handleDetection(code.data);
                        return;
                    }
                }
            }
            if (RetailX.State.scanningEnabled) {
                RetailX.State.scanLoopId = requestAnimationFrame(scanFrame);
            }
        };

        RetailX.State.scanLoopId = requestAnimationFrame(scanFrame);
    },

    startBarcodeScan: function() {
        const self = this;
        if (typeof Quagga === 'undefined') {
            $('#scanner-status').html('<i class="fas fa-exclamation-triangle"></i> Barcode library not loaded');
            return;
        }

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#scanner-video'),
                constraints: {
                    width: { min: 640 },
                    height: { min: 480 },
                    facingMode: RetailX.State.currentCamera === 'user' ? 'user' : 'environment',
                    aspectRatio: { min: 1, max: 2 }
                }
            },
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader", "code_39_reader"]
            },
            locate: true
        }, function(err) {
            if (err) {
                console.error('Quagga init failed:', err);
                $('#scanner-status').html('<i class="fas fa-exclamation-triangle"></i> Failed to start barcode scanner');
                return;
            }
            Quagga.start();
            RetailX.State.quaggaInitialized = true;
        });

        Quagga.onDetected(function(data) {
            if (!RetailX.State.scanningEnabled) return;
            const code = data.codeResult.code;
            self.handleDetection(code);
        });
    },

    handleDetection: function(code) {
        this.stopContinuousScan();

        RetailX.Utils.playBeep();
        const product = RetailX.Database.getProductByCode(code);
        
        if (product) {
            RetailX.POS.addToCart(product);
            RetailX.Utils.showToast('Product Found', `${product.name} added to cart`, 'success');
        } else {
            RetailX.Utils.showToast('Product Not Found', `No product matches code: ${code.substring(0, 20)}`, 'error');
        }
        
        this.closeScanner();
    }
};

// ============================================
// UI & NAVIGATION MODULE
// ============================================
RetailX.Navigation = {
    init: function() {
        $('.menu-item[data-page]').on('click', function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            RetailX.Navigation.switchPage(page);
            
            if(window.innerWidth <= 768) $('.sidebar').removeClass('active');
        });

        $('#mobileMenuToggle').on('click', () => $('.sidebar').toggleClass('active'));

        $('#fullscreenBtn').on('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });

        this.updateClocks();
        setInterval(() => this.updateClocks(), 1000);
    },

    switchPage: function(pageId) {
        $('.page').removeClass('active');
        $(`#${pageId}-page`).addClass('active');
        
        $('.menu-item').removeClass('active highlight');
        $(`.menu-item[data-page="${pageId}"]`).addClass(pageId === 'pos' ? 'highlight' : 'active');

        const titles = { 
            'dashboard': 'Terminal Dashboard', 
            'pos': 'Point of Sale', 
            'inventory': 'Product Lookup', 
            'transactions': 'Shift Transactions', 
            'summary': 'End of Shift Summary' 
        };
        
        $('#pageTitle').text(titles[pageId]);
        $('#breadcrumb').text(`Terminal / ${titles[pageId]}`);

        if(pageId === 'pos') $('#posBarcodeScanner').focus();
        if(pageId === 'inventory') RetailX.Inventory.renderTable();
        if(pageId === 'transactions') RetailX.Transactions.renderTable();
        if(pageId === 'summary') RetailX.Summary.render();
    },

    updateClocks: function() {
        const now = new Date();
        $('#currentDate').text(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        $('#currentTime').text(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit'}));
        
        if (RetailX.State.shift.isActive && RetailX.State.shift.startTime) {
            const diff = Math.floor((now - RetailX.State.shift.startTime) / 1000);
            const h = String(Math.floor(diff / 3600)).padStart(2, '0');
            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
            const s = String(diff % 60).padStart(2, '0');
            $('#shiftTimer').text(`${h}:${m}:${s}`);
        } else {
            $('#shiftTimer').text('00:00:00');
        }
    }
};

// ============================================
// POINT OF SALE (POS) MODULE
// ============================================
RetailX.POS = {
    init: function() {
        this.resetTransaction();
        this.bindEvents();
        this.updateDashboardKPIs();
    },

    bindEvents: function() {
        const self = this;

        $('#posBarcodeScanner').on('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                self.processScan($(this).val());
                $(this).val('');
            }
        });

        $('#posManualSearchBtn').on('click', () => {
            $('#posSearchModal').addClass('show');
            $('#posModalSearchInput').val('').focus();
            this.renderSearchModal(RetailX.Database.products.slice(0, 50));
        });

        $('#posModalSearchInput').on('input', RetailX.Utils.debounce(function() {
            const results = RetailX.Database.searchProducts($(this).val());
            self.renderSearchModal(results.slice(0, 50));
        }, 300));

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

        $('#suspendTransactionBtn').on('click', () => {
            if (RetailX.State.cart.length === 0) {
                RetailX.Utils.showToast('Empty Cart', 'Add items before holding.', 'error');
                return;
            }
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

        $('#removeCustomerBtn').on('click', () => {
            RetailX.State.currentCustomer = null;
            $('#activeCustomerDisplay').slideUp();
            RetailX.Utils.showToast('Customer Removed', 'Customer detached from bill.', 'info');
        });

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

        $('.pay-method-btn').on('click', function() {
            $('.pay-method-btn').removeClass('active');
            $(this).addClass('active');
            RetailX.State.paymentMethod = $(this).data('method');
            
            if(RetailX.State.paymentMethod === 'cash') {
                $('#tenderAreaCash').slideDown();
                setTimeout(()=> $('#tenderAmount').focus(), 100);
            } else {
                $('#tenderAreaCash').slideUp();
                self.validateCheckout();
            }
        });

        $('#tenderAmount').on('input', () => this.validateCheckout());
        
        $('.quick-cash-btn').on('click', function() {
            const val = $(this).data('val');
            let amt = 0;
            if(val === 'exact') amt = RetailX.State.billTotals ? RetailX.State.billTotals.grandTotal : 0;
            else amt = parseFloat(val);
            
            $('#tenderAmount').val(amt.toFixed(2));
            self.validateCheckout();
        });

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
            RetailX.State.cart.unshift({ ...product, qty: 1 });
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
                    <i class="fas fa-qrcode"></i>
                    <p>Scan a barcode or QR code to begin transaction</p>
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

        let discountAmt = 0;
        if(RetailX.State.discountValue > 0) {
            if(RetailX.State.discountType === 'percent') {
                discountAmt = subtotal * (RetailX.State.discountValue / 100);
            } else {
                discountAmt = Math.min(subtotal, RetailX.State.discountValue);
            }
        }

        let afterDiscount = subtotal - discountAmt;
        let tax = afterDiscount * RetailX.Config.taxRate;
        let grandTotal = afterDiscount + tax;

        RetailX.State.billTotals = { subtotal, discountAmt, tax, grandTotal, itemCount };

        $('#cartItemCount').text(itemCount);
        $('#cartSubtotal').text(RetailX.Utils.formatMoney(subtotal));
        $('#cartDiscount').text(`-${RetailX.Utils.formatMoney(discountAmt)}`);
        $('#cartTax').text(RetailX.Utils.formatMoney(tax));
        $('#cartGrandTotal').text(RetailX.Utils.formatMoney(grandTotal));

        $('#topbarSales').text(RetailX.Utils.formatMoney(RetailX.State.shift.totalSales + grandTotal));

        this.validateCheckout();
    },

    validateCheckout: function() {
        const btn = $('#completeCheckoutBtn');
        const totals = RetailX.State.billTotals;
        
        if(!totals || totals.itemCount === 0) {
            btn.prop('disabled', true);
            $('#changeDueAmount').text('₹0.00').removeClass('text-success text-danger');
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

        RetailX.State.shift.totalSales += totals.grandTotal;
        RetailX.State.shift.billsGenerated += 1;
        RetailX.State.shift.itemsSold += totals.itemCount;
        
        if(transaction.method === 'cash') RetailX.State.shift.cashTendered += totals.grandTotal;
        else if(transaction.method === 'card') RetailX.State.shift.cardTendered += totals.grandTotal;
        else RetailX.State.shift.digitalTendered += totals.grandTotal;

        RetailX.State.transactions.unshift(transaction);
        
        RetailX.saveState();
        
        this.updateDashboardKPIs();
        this.generateReceiptHTML(transaction);

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
                <tr>
                    <td>${i.name.substring(0, 20)}</td>
                    <td class="qty">${i.qty}</td>
                    <td class="amt">₹${i.price.toFixed(2)}</td>
                    <td class="amt">₹${(i.qty * i.price).toFixed(2)}</td>
                </tr>
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
            <table class="rcpt-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div class="rcpt-totals">
                <div class="rcpt-line"><span>Subtotal:</span><span>₹${tx.totals.subtotal.toFixed(2)}</span></div>
                ${tx.totals.discountAmt > 0 ? `<div class="rcpt-line"><span>Discount:</span><span>-₹${tx.totals.discountAmt.toFixed(2)}</span></div>` : ''}
                <div class="rcpt-line"><span>Tax (8.5%):</span><span>₹${tx.totals.tax.toFixed(2)}</span></div>
                <div class="rcpt-line bold"><span>TOTAL:</span><span>₹${tx.totals.grandTotal.toFixed(2)}</span></div>
            </div>
            <div class="rcpt-totals">
                <div class="rcpt-line"><span>Paid by ${tx.method.toUpperCase()}:</span><span>₹${tx.tendered.toFixed(2)}</span></div>
                <div class="rcpt-line"><span>Change:</span><span>₹${tx.change.toFixed(2)}</span></div>
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

        $('#topbarDrawer').text(RetailX.Utils.formatMoney(150 + s.cashTendered));

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
        
        const data = RetailX.Database.searchProducts(query).slice(0, 100);
        
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
// TRANSACTIONS MODULE
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
                        <button class="btn-outline print-receipt" data-id="${tx.id}"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `);
        });

        // Attach print event to each button
        $('.print-receipt').off('click').on('click', function() {
            const id = $(this).data('id');
            const transaction = RetailX.State.transactions.find(t => t.id === id);
            RetailX.Utils.printReceipt(transaction);
        });
    }
};

$('#txTypeFilter').on('change', () => RetailX.Transactions.renderTable());

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
// SUMMARY MODULE
// ============================================
RetailX.Summary = {
    chartInstance: null,
    
    render: function() {
        const s = RetailX.State.shift;
        
        $('#repGross').text(RetailX.Utils.formatMoney(s.totalSales));
        $('#repRefunds').text(RetailX.Utils.formatMoney(s.totalRefunds));
        $('#repNet').text(RetailX.Utils.formatMoney(s.totalSales - s.totalRefunds));
        
        const taxAmount = s.totalSales - (s.totalSales / (1 + RetailX.Config.taxRate));
        $('#repTax').text(RetailX.Utils.formatMoney(taxAmount));
        
        $('#repCash').text(RetailX.Utils.formatMoney(s.cashTendered));
        $('#repCard').text(RetailX.Utils.formatMoney(s.cardTendered));
        $('#repDigital').text(RetailX.Utils.formatMoney(s.digitalTendered));

        const endTime = new Date();
        const startTimeStr = s.startTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || 'N/A';
        $('#reportShiftTime').text(`${startTimeStr} - ${endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`);

        this.renderChart();
    },

    renderChart: function() {
        const ctx = document.getElementById('hourlySalesChart');
        if(!ctx) return;

        if(this.chartInstance) this.chartInstance.destroy();

        const labels = ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', 'Now'];
        const dataPoints = [0, 0, 0, 0, 0, 0, 0, RetailX.State.shift.totalSales];

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales Vol (₹)',
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

$('#printZReportBtn, #endShiftBtn').on('click', function(e) {
    e.preventDefault();
    
    if (!RetailX.State.shift.isActive) {
        RetailX.Utils.showToast('No Active Shift', 'There is no active shift to end', 'warning');
        return;
    }
    
    Swal.fire({
        title: 'End Shift & Print Z-Report?',
        html: `
            <p>This will close the current register session.</p>
            <p><strong>Shift Summary:</strong></p>
            <p>Bills: ${RetailX.State.shift.billsGenerated}</p>
            <p>Total Sales: ₹${RetailX.State.shift.totalSales.toFixed(2)}</p>
            <p>Items Sold: ${RetailX.State.shift.itemsSold}</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4361ee',
        confirmButtonText: 'Yes, End Shift',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            RetailX.Utils.generateZReport();
            RetailX.State.shift.isActive = false;
            RetailX.clearState();
            RetailX.Utils.showToast('Shift Ended', 'Z-Report has been downloaded', 'success');
            setTimeout(() => {
                // Adjust this URL to match your login page
                window.location.href = '/cashier_login';
            }, 2000);
        }
    });
});

// Dashboard reprint button
$('#reprintLastBtn').on('click', function() {
    const lastTx = RetailX.State.transactions[0];
    if (!lastTx) {
        RetailX.Utils.showToast('No Receipt', 'No transactions yet', 'error');
        return;
    }
    RetailX.Utils.printReceipt(lastTx);
});

// ============================================
// GLOBAL EVENT BINDINGS
// ============================================
$(document).ready(function() {
    console.log('📦 Document ready, initializing modules...');
    
    RetailX.loadSavedState();
    
    RetailX.Navigation.init();
    RetailX.POS.init();
    RetailX.CameraScanner.init();

    setTimeout(() => {
        RetailX.Utils.hideLoader();
        console.log('✅ All modules initialized, loader hidden');
        
        if (typeof jsQR !== 'undefined') {
            console.log('✅ jsQR library loaded successfully');
        } else {
            console.error('❌ jsQR library not loaded');
        }
        if (typeof Quagga !== 'undefined') {
            console.log('✅ Quagga library loaded successfully');
        } else {
            console.error('❌ Quagga library not loaded');
        }
    }, 1000);

    $('.modal-close').on('click', function() {
        $(this).closest('.modal').removeClass('show');
    });

    $('#printActualReceiptBtn').on('click', function() {
        window.print();
    });

    $('#openDrawerBtn').on('click', () => {
        RetailX.Utils.playBeep();
        RetailX.Utils.showToast('Drawer Opened', 'Cash drawer kicked open.', 'warning');
    });

    $('#notificationsBtn').on('click', () => {
        RetailX.Utils.showNotificationPopup();
    });

    window.addEventListener('beforeunload', function() {
        RetailX.saveState();
    });

    window.addEventListener('load', function() {
        setTimeout(RetailX.Utils.hideLoader, 2000);
    });
});

if (document.readyState === 'complete') {
    setTimeout(RetailX.Utils.hideLoader, 500);
}