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
    heldBills: [], // Hold bills storage
    // Camera state
    cameraStream: null,
    currentCamera: 'environment', // 'environment' for back camera, 'user' for front, or deviceId for specific camera
    isCameraActive: false,
    availableCameras: [], // List of available cameras
    initialized: false // Track if initialization is complete
};

// ============================================
// MOCK DATABASE (Simulating Backend)
// ============================================
RetailX.Database = {
    products: [
    // Electronics (150 products)
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

    // Groceries (200 products)
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
    { sku: 'GROC051', barcode: '8901234567062', name: 'Bagels 6-pack', category: 'Grocery', price: 3.99, stock: 245 },
    { sku: 'GROC052', barcode: '8901234567063', name: 'English Muffins 6-pack', category: 'Grocery', price: 3.49, stock: 267 },
    { sku: 'GROC053', barcode: '8901234567064', name: 'Tortillas 10-pack', category: 'Grocery', price: 2.99, stock: 278 },
    { sku: 'GROC054', barcode: '8901234567065', name: 'Pasta Spaghetti 16oz', category: 'Grocery', price: 1.99, stock: 389 },
    { sku: 'GROC055', barcode: '8901234567066', name: 'Penne Pasta 16oz', category: 'Grocery', price: 1.99, stock: 345 },
    { sku: 'GROC056', barcode: '8901234567067', name: 'Basmati Rice 5lb', category: 'Grocery', price: 7.99, stock: 234 },
    { sku: 'GROC057', barcode: '8901234567068', name: 'Brown Rice 2lb', category: 'Grocery', price: 3.99, stock: 267 },
    { sku: 'GROC058', barcode: '8901234567069', name: 'Quinoa 16oz', category: 'Grocery', price: 4.99, stock: 198 },
    { sku: 'GROC059', barcode: '8901234567070', name: 'Couscous 12oz', category: 'Grocery', price: 2.99, stock: 189 },
    { sku: 'GROC060', barcode: '8901234567071', name: 'Tomato Sauce 15oz', category: 'Grocery', price: 1.49, stock: 345 },
    { sku: 'GROC061', barcode: '8901234567072', name: 'Crushed Tomatoes 28oz', category: 'Grocery', price: 2.49, stock: 267 },
    { sku: 'GROC062', barcode: '8901234567073', name: 'Tomato Paste 6oz', category: 'Grocery', price: 1.29, stock: 389 },
    { sku: 'GROC063', barcode: '8901234567074', name: 'Canned Corn 15oz', category: 'Grocery', price: 1.19, stock: 412 },
    { sku: 'GROC064', barcode: '8901234567075', name: 'Canned Peas 15oz', category: 'Grocery', price: 1.19, stock: 398 },
    { sku: 'GROC065', barcode: '8901234567076', name: 'Canned Beans 15oz', category: 'Grocery', price: 1.29, stock: 456 },
    { sku: 'GROC066', barcode: '8901234567077', name: 'Chickpeas 15oz', category: 'Grocery', price: 1.49, stock: 367 },
    { sku: 'GROC067', barcode: '8901234567078', name: 'Black Beans 15oz', category: 'Grocery', price: 1.29, stock: 389 },
    { sku: 'GROC068', barcode: '8901234567079', name: 'Kidney Beans 15oz', category: 'Grocery', price: 1.29, stock: 378 },
    { sku: 'GROC069', barcode: '8901234567080', name: 'Tuna Chunk 5oz', category: 'Grocery', price: 1.99, stock: 456 },
    { sku: 'GROC070', barcode: '8901234567081', name: 'Salmon Canned 7.5oz', category: 'Grocery', price: 3.99, stock: 267 },
    { sku: 'GROC071', barcode: '8901234567082', name: 'Sardines 3.75oz', category: 'Grocery', price: 2.49, stock: 189 },
    { sku: 'GROC072', barcode: '8901234567083', name: 'Chicken Broth 32oz', category: 'Grocery', price: 2.99, stock: 345 },
    { sku: 'GROC073', barcode: '8901234567084', name: 'Vegetable Broth 32oz', category: 'Grocery', price: 2.99, stock: 312 },
    { sku: 'GROC074', barcode: '8901234567085', name: 'Beef Broth 32oz', category: 'Grocery', price: 2.99, stock: 289 },
    { sku: 'GROC075', barcode: '8901234567086', name: 'Olive Oil 16.9oz', category: 'Grocery', price: 8.99, stock: 234 },
    { sku: 'GROC076', barcode: '8901234567087', name: 'Avocado Oil 16.9oz', category: 'Grocery', price: 9.99, stock: 189 },
    { sku: 'GROC077', barcode: '8901234567088', name: 'Vegetable Oil 48oz', category: 'Grocery', price: 4.99, stock: 267 },
    { sku: 'GROC078', barcode: '8901234567089', name: 'Coconut Oil 14oz', category: 'Grocery', price: 6.99, stock: 198 },
    { sku: 'GROC079', barcode: '8901234567090', name: 'Balsamic Vinegar 16.9oz', category: 'Grocery', price: 5.99, stock: 234 },
    { sku: 'GROC080', barcode: '8901234567091', name: 'Red Wine Vinegar 16oz', category: 'Grocery', price: 3.99, stock: 245 },
    { sku: 'GROC081', barcode: '8901234567092', name: 'Soy Sauce 10oz', category: 'Grocery', price: 2.99, stock: 278 },
    { sku: 'GROC082', barcode: '8901234567093', name: 'Teriyaki Sauce 10oz', category: 'Grocery', price: 3.49, stock: 234 },
    { sku: 'GROC083', barcode: '8901234567094', name: 'Sriracha 17oz', category: 'Grocery', price: 4.49, stock: 267 },
    { sku: 'GROC084', barcode: '8901234567095', name: 'Hot Sauce 5oz', category: 'Grocery', price: 2.99, stock: 289 },
    { sku: 'GROC085', barcode: '8901234567096', name: 'Ketchup 20oz', category: 'Grocery', price: 3.49, stock: 312 },
    { sku: 'GROC086', barcode: '8901234567097', name: 'Mustard 12oz', category: 'Grocery', price: 2.49, stock: 278 },
    { sku: 'GROC087', barcode: '8901234567098', name: 'Mayonnaise 30oz', category: 'Grocery', price: 4.99, stock: 245 },
    { sku: 'GROC088', barcode: '8901234567099', name: 'BBQ Sauce 18oz', category: 'Grocery', price: 3.99, stock: 234 },
    { sku: 'GROC089', barcode: '8901234567100', name: 'Pasta Sauce 24oz', category: 'Grocery', price: 3.99, stock: 267 },
    { sku: 'GROC090', barcode: '8901234567101', name: 'Alfredo Sauce 15oz', category: 'Grocery', price: 3.49, stock: 234 },
    { sku: 'GROC091', barcode: '8901234567102', name: 'Pesto Sauce 8oz', category: 'Grocery', price: 4.99, stock: 189 },
    { sku: 'GROC092', barcode: '8901234567103', name: 'Peanut Butter 16oz', category: 'Grocery', price: 3.99, stock: 278 },
    { sku: 'GROC093', barcode: '8901234567104', name: 'Almond Butter 16oz', category: 'Grocery', price: 6.99, stock: 198 },
    { sku: 'GROC094', barcode: '8901234567105', name: 'Jelly Grape 18oz', category: 'Grocery', price: 3.49, stock: 245 },
    { sku: 'GROC095', barcode: '8901234567106', name: 'Strawberry Jam 18oz', category: 'Grocery', price: 3.49, stock: 234 },
    { sku: 'GROC096', barcode: '8901234567107', name: 'Honey 12oz', category: 'Grocery', price: 5.99, stock: 267 },
    { sku: 'GROC097', barcode: '8901234567108', name: 'Maple Syrup 8oz', category: 'Grocery', price: 6.99, stock: 198 },
    { sku: 'GROC098', barcode: '8901234567109', name: 'Granola 12oz', category: 'Grocery', price: 4.99, stock: 234 },
    { sku: 'GROC099', barcode: '8901234567110', name: 'Oatmeal 18oz', category: 'Grocery', price: 3.99, stock: 267 },
    { sku: 'GROC100', barcode: '8901234567111', name: 'Cereal Cheerios 18oz', category: 'Grocery', price: 4.99, stock: 289 },

    // Apparel (150 products)
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
    { sku: 'APP051', barcode: '8909876543062', name: 'Men\'s Dress Shirt White 16/33', category: 'Apparel', price: 44.99, stock: 145 },
    { sku: 'APP052', barcode: '8909876543063', name: 'Men\'s Dress Shirt White 16.5/34', category: 'Apparel', price: 44.99, stock: 123 },
    { sku: 'APP053', barcode: '8909876543064', name: 'Men\'s Dress Shirt Blue 15.5/32', category: 'Apparel', price: 44.99, stock: 156 },
    { sku: 'APP054', barcode: '8909876543065', name: 'Men\'s Dress Shirt Blue 16/33', category: 'Apparel', price: 44.99, stock: 145 },
    { sku: 'APP055', barcode: '8909876543066', name: 'Men\'s Dress Shirt Blue 16.5/34', category: 'Apparel', price: 44.99, stock: 134 },
    { sku: 'APP056', barcode: '8909876543067', name: 'Women\'s Dress Blouse S', category: 'Apparel', price: 49.99, stock: 178 },
    { sku: 'APP057', barcode: '8909876543068', name: 'Women\'s Dress Blouse M', category: 'Apparel', price: 49.99, stock: 167 },
    { sku: 'APP058', barcode: '8909876543069', name: 'Women\'s Dress Blouse L', category: 'Apparel', price: 52.99, stock: 145 },
    { sku: 'APP059', barcode: '8909876543070', name: 'Men\'s Shorts Khaki 32', category: 'Apparel', price: 29.99, stock: 167 },
    { sku: 'APP060', barcode: '8909876543071', name: 'Men\'s Shorts Khaki 34', category: 'Apparel', price: 29.99, stock: 156 },
    { sku: 'APP061', barcode: '8909876543072', name: 'Men\'s Shorts Khaki 36', category: 'Apparel', price: 32.99, stock: 145 },
    { sku: 'APP062', barcode: '8909876543073', name: 'Men\'s Shorts Black 32', category: 'Apparel', price: 29.99, stock: 178 },
    { sku: 'APP063', barcode: '8909876543074', name: 'Men\'s Shorts Black 34', category: 'Apparel', price: 29.99, stock: 167 },
    { sku: 'APP064', barcode: '8909876543075', name: 'Men\'s Shorts Black 36', category: 'Apparel', price: 32.99, stock: 156 },
    { sku: 'APP065', barcode: '8909876543076', name: 'Women\'s Shorts Denim 4', category: 'Apparel', price: 29.99, stock: 189 },
    { sku: 'APP066', barcode: '8909876543077', name: 'Women\'s Shorts Denim 6', category: 'Apparel', price: 29.99, stock: 178 },
    { sku: 'APP067', barcode: '8909876543078', name: 'Women\'s Shorts Denim 8', category: 'Apparel', price: 29.99, stock: 167 },
    { sku: 'APP068', barcode: '8909876543079', name: 'Men\'s Sweater Cashmere M', category: 'Apparel', price: 89.99, stock: 89 },
    { sku: 'APP069', barcode: '8909876543080', name: 'Men\'s Sweater Cashmere L', category: 'Apparel', price: 89.99, stock: 78 },
    { sku: 'APP070', barcode: '8909876543081', name: 'Men\'s Sweater Cashmere XL', category: 'Apparel', price: 94.99, stock: 67 },
    { sku: 'APP071', barcode: '8909876543082', name: 'Women\'s Sweater Cashmere S', category: 'Apparel', price: 89.99, stock: 98 },
    { sku: 'APP072', barcode: '8909876543083', name: 'Women\'s Sweater Cashmere M', category: 'Apparel', price: 89.99, stock: 89 },
    { sku: 'APP073', barcode: '8909876543084', name: 'Women\'s Sweater Cashmere L', category: 'Apparel', price: 94.99, stock: 78 },
    { sku: 'APP074', barcode: '8909876543085', name: 'Men\'s Jacket Leather M', category: 'Apparel', price: 199.99, stock: 45 },
    { sku: 'APP075', barcode: '8909876543086', name: 'Men\'s Jacket Leather L', category: 'Apparel', price: 199.99, stock: 56 },
    { sku: 'APP076', barcode: '8909876543087', name: 'Men\'s Jacket Leather XL', category: 'Apparel', price: 219.99, stock: 34 },
    { sku: 'APP077', barcode: '8909876543088', name: 'Women\'s Jacket Denim S', category: 'Apparel', price: 79.99, stock: 78 },
    { sku: 'APP078', barcode: '8909876543089', name: 'Women\'s Jacket Denim M', category: 'Apparel', price: 79.99, stock: 67 },
    { sku: 'APP079', barcode: '8909876543090', name: 'Women\'s Jacket Denim L', category: 'Apparel', price: 84.99, stock: 56 },
    { sku: 'APP080', barcode: '8909876543091', name: 'Men\'s Swim Trunks 32', category: 'Apparel', price: 24.99, stock: 156 },
    { sku: 'APP081', barcode: '8909876543092', name: 'Men\'s Swim Trunks 34', category: 'Apparel', price: 24.99, stock: 145 },
    { sku: 'APP082', barcode: '8909876543093', name: 'Men\'s Swim Trunks 36', category: 'Apparel', price: 26.99, stock: 134 },
    { sku: 'APP083', barcode: '8909876543094', name: 'Women\'s Bikini Top S', category: 'Apparel', price: 29.99, stock: 178 },
    { sku: 'APP084', barcode: '8909876543095', name: 'Women\'s Bikini Top M', category: 'Apparel', price: 29.99, stock: 167 },
    { sku: 'APP085', barcode: '8909876543096', name: 'Women\'s Bikini Bottom S', category: 'Apparel', price: 24.99, stock: 178 },
    { sku: 'APP086', barcode: '8909876543097', name: 'Women\'s Bikini Bottom M', category: 'Apparel', price: 24.99, stock: 167 },
    { sku: 'APP087', barcode: '8909876543098', name: 'Men\'s Socks 6-pack', category: 'Apparel', price: 12.99, stock: 345 },
    { sku: 'APP088', barcode: '8909876543099', name: 'Women\'s Socks 6-pack', category: 'Apparel', price: 12.99, stock: 367 },
    { sku: 'APP089', barcode: '8909876543100', name: 'Men\'s Boxers 3-pack M', category: 'Apparel', price: 19.99, stock: 234 },
    { sku: 'APP090', barcode: '8909876543101', name: 'Men\'s Boxers 3-pack L', category: 'Apparel', price: 19.99, stock: 223 },
    { sku: 'APP091', barcode: '8909876543102', name: 'Men\'s Boxers 3-pack XL', category: 'Apparel', price: 22.99, stock: 198 },
    { sku: 'APP092', barcode: '8909876543103', name: 'Women\'s Panties 5-pack S', category: 'Apparel', price: 24.99, stock: 267 },
    { sku: 'APP093', barcode: '8909876543104', name: 'Women\'s Panties 5-pack M', category: 'Apparel', price: 24.99, stock: 245 },
    { sku: 'APP094', barcode: '8909876543105', name: 'Women\'s Panties 5-pack L', category: 'Apparel', price: 27.99, stock: 223 },
    { sku: 'APP095', barcode: '8909876543106', name: 'Men\'s Belt Black 36', category: 'Apparel', price: 24.99, stock: 178 },
    { sku: 'APP096', barcode: '8909876543107', name: 'Men\'s Belt Brown 36', category: 'Apparel', price: 24.99, stock: 167 },
    { sku: 'APP097', barcode: '8909876543108', name: 'Women\'s Belt Black', category: 'Apparel', price: 22.99, stock: 189 },
    { sku: 'APP098', barcode: '8909876543109', name: 'Women\'s Belt Brown', category: 'Apparel', price: 22.99, stock: 178 },
    { sku: 'APP099', barcode: '8909876543110', name: 'Men\'s Tie Silk Blue', category: 'Apparel', price: 29.99, stock: 123 },
    { sku: 'APP100', barcode: '8909876543111', name: 'Men\'s Tie Silk Red', category: 'Apparel', price: 29.99, stock: 145 },

    // Home & Garden (150 products)
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
    { sku: 'HOME051', barcode: '8801357924730', name: 'Tool Set 100-piece', category: 'Home', price: 79.99, stock: 89 },
    { sku: 'HOME052', barcode: '8801357924731', name: 'Hammer', category: 'Home', price: 9.99, stock: 234 },
    { sku: 'HOME053', barcode: '8801357924732', name: 'Screwdriver Set', category: 'Home', price: 14.99, stock: 189 },
    { sku: 'HOME054', barcode: '8801357924733', name: 'Wrench Set', category: 'Home', price: 24.99, stock: 145 },
    { sku: 'HOME055', barcode: '8801357924734', name: 'Pliers Set', category: 'Home', price: 19.99, stock: 156 },
    { sku: 'HOME056', barcode: '8801357924735', name: 'Tape Measure 25ft', category: 'Home', price: 12.99, stock: 178 },
    { sku: 'HOME057', barcode: '8801357924736', name: 'Level 24"', category: 'Home', price: 16.99, stock: 145 },
    { sku: 'HOME058', barcode: '8801357924737', name: 'Utility Knife', category: 'Home', price: 7.99, stock: 234 },
    { sku: 'HOME059', barcode: '8801357924738', name: 'Flashlight LED', category: 'Home', price: 14.99, stock: 198 },
    { sku: 'HOME060', barcode: '8801357924739', name: 'Extension Cord 25ft', category: 'Home', price: 16.99, stock: 167 },
    { sku: 'HOME061', barcode: '8801357924740', name: 'Power Strip 6-outlet', category: 'Home', price: 19.99, stock: 189 },
    { sku: 'HOME062', barcode: '8801357924741', name: 'Surge Protector', category: 'Home', price: 24.99, stock: 156 },
    { sku: 'HOME063', barcode: '8801357924742', name: 'Batteries AA 12-pack', category: 'Home', price: 9.99, stock: 345 },
    { sku: 'HOME064', barcode: '8801357924743', name: 'Batteries AAA 12-pack', category: 'Home', price: 9.99, stock: 334 },
    { sku: 'HOME065', barcode: '8801357924744', name: 'Rechargeable Batteries', category: 'Home', price: 19.99, stock: 267 },
    { sku: 'HOME066', barcode: '8801357924745', name: 'Battery Charger', category: 'Home', price: 24.99, stock: 189 },
    { sku: 'HOME067', barcode: '8801357924746', name: 'Smoke Detector', category: 'Home', price: 19.99, stock: 156 },
    { sku: 'HOME068', barcode: '8801357924747', name: 'Carbon Monoxide Detector', category: 'Home', price: 29.99, stock: 134 },
    { sku: 'HOME069', barcode: '8801357924748', name: 'Fire Extinguisher', category: 'Home', price: 34.99, stock: 123 },
    { sku: 'HOME070', barcode: '8801357924749', name: 'First Aid Kit', category: 'Home', price: 19.99, stock: 198 },
    { sku: 'HOME071', barcode: '8801357924750', name: 'Plant Pot 6"', category: 'Garden', price: 9.99, stock: 234 },
    { sku: 'HOME072', barcode: '8801357924751', name: 'Plant Pot 8"', category: 'Garden', price: 12.99, stock: 223 },
    { sku: 'HOME073', barcode: '8801357924752', name: 'Plant Pot 10"', category: 'Garden', price: 14.99, stock: 212 },
    { sku: 'HOME074', barcode: '8801357924753', name: 'Hanging Basket', category: 'Garden', price: 16.99, stock: 178 },
    { sku: 'HOME075', barcode: '8801357924754', name: 'Garden Soil 1cu ft', category: 'Garden', price: 8.99, stock: 267 },
    { sku: 'HOME076', barcode: '8801357924755', name: 'Fertilizer 5lb', category: 'Garden', price: 14.99, stock: 198 },
    { sku: 'HOME077', barcode: '8801357924756', name: 'Plant Food', category: 'Garden', price: 9.99, stock: 234 },
    { sku: 'HOME078', barcode: '8801357924757', name: 'Garden Hose 50ft', category: 'Garden', price: 24.99, stock: 156 },
    { sku: 'HOME079', barcode: '8801357924758', name: 'Sprinkler', category: 'Garden', price: 14.99, stock: 178 },
    { sku: 'HOME080', barcode: '8801357924759', name: 'Watering Can', category: 'Garden', price: 12.99, stock: 189 },
    { sku: 'HOME081', barcode: '8801357924760', name: 'Garden Gloves', category: 'Garden', price: 7.99, stock: 245 },
    { sku: 'HOME082', barcode: '8801357924761', name: 'Pruning Shears', category: 'Garden', price: 14.99, stock: 167 },
    { sku: 'HOME083', barcode: '8801357924762', name: 'Shovel Garden', category: 'Garden', price: 19.99, stock: 145 },
    { sku: 'HOME084', barcode: '8801357924763', name: 'Rake Garden', category: 'Garden', price: 21.99, stock: 134 },
    { sku: 'HOME085', barcode: '8801357924764', name: 'Hoe Garden', category: 'Garden', price: 18.99, stock: 123 },
    { sku: 'HOME086', barcode: '8801357924765', name: 'Trowel', category: 'Garden', price: 8.99, stock: 189 },
    { sku: 'HOME087', barcode: '8801357924766', name: 'Weeder', category: 'Garden', price: 7.99, stock: 178 },
    { sku: 'HOME088', barcode: '8801357924767', name: 'Bird Feeder', category: 'Garden', price: 19.99, stock: 145 },
    { sku: 'HOME089', barcode: '8801357924768', name: 'Bird Bath', category: 'Garden', price: 34.99, stock: 89 },
    { sku: 'HOME090', barcode: '8801357924769', name: 'Wind Chime', category: 'Garden', price: 14.99, stock: 134 },
    { sku: 'HOME091', barcode: '8801357924770', name: 'Outdoor String Lights', category: 'Garden', price: 24.99, stock: 156 },
    { sku: 'HOME092', barcode: '8801357924771', name: 'Solar Path Lights 6-pack', category: 'Garden', price: 29.99, stock: 145 },
    { sku: 'HOME093', barcode: '8801357924772', name: 'Patio Umbrella', category: 'Garden', price: 79.99, stock: 67 },
    { sku: 'HOME094', barcode: '8801357924773', name: 'Outdoor Chair', category: 'Garden', price: 49.99, stock: 89 },
    { sku: 'HOME095', barcode: '8801357924774', name: 'Outdoor Table', category: 'Garden', price: 99.99, stock: 56 },
    { sku: 'HOME096', barcode: '8801357924775', name: 'Grill Gas', category: 'Garden', price: 299.99, stock: 34 },
    { sku: 'HOME097', barcode: '8801357924776', name: 'Grill Charcoal', category: 'Garden', price: 149.99, stock: 45 },
    { sku: 'HOME098', barcode: '8801357924777', name: 'Grill Cover', category: 'Garden', price: 29.99, stock: 78 },
    { sku: 'HOME099', barcode: '8801357924778', name: 'Charcoal 20lb', category: 'Garden', price: 19.99, stock: 156 },
    { sku: 'HOME100', barcode: '8801357924779', name: 'Lighter Fluid', category: 'Garden', price: 4.99, stock: 267 },

    // Beauty & Personal Care (150 products)
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
    { sku: 'BEAU051', barcode: '7701234567940', name: 'Serum Vitamin C', category: 'Beauty', price: 24.99, stock: 167 },
    { sku: 'BEAU052', barcode: '7701234567941', name: 'Retinol Cream 1oz', category: 'Beauty', price: 22.99, stock: 156 },
    { sku: 'BEAU053', barcode: '7701234567942', name: 'Toner 8oz', category: 'Beauty', price: 14.99, stock: 189 },
    { sku: 'BEAU054', barcode: '7701234567943', name: 'Exfoliator 4oz', category: 'Beauty', price: 12.99, stock: 198 },
    { sku: 'BEAU055', barcode: '7701234567944', name: 'Micellar Water 13oz', category: 'Beauty', price: 9.99, stock: 212 },
    { sku: 'BEAU056', barcode: '7701234567945', name: 'Hand Cream 2oz', category: 'Beauty', price: 5.99, stock: 267 },
    { sku: 'BEAU057', barcode: '7701234567946', name: 'Foot Cream 4oz', category: 'Beauty', price: 7.99, stock: 234 },
    { sku: 'BEAU058', barcode: '7701234567947', name: 'Body Lotion 16oz', category: 'Beauty', price: 8.99, stock: 278 },
    { sku: 'BEAU059', barcode: '7701234567948', name: 'Body Butter 8oz', category: 'Beauty', price: 12.99, stock: 245 },
    { sku: 'BEAU060', barcode: '7701234567949', name: 'Body Scrub 12oz', category: 'Beauty', price: 10.99, stock: 223 },
    { sku: 'BEAU061', barcode: '7701234567950', name: 'Essential Oil Lavender', category: 'Beauty', price: 9.99, stock: 198 },
    { sku: 'BEAU062', barcode: '7701234567951', name: 'Essential Oil Peppermint', category: 'Beauty', price: 9.99, stock: 189 },
    { sku: 'BEAU063', barcode: '7701234567952', name: 'Diffuser', category: 'Beauty', price: 24.99, stock: 156 },
    { sku: 'BEAU064', barcode: '7701234567953', name: 'Bath Bombs 4-pack', category: 'Beauty', price: 12.99, stock: 234 },
    { sku: 'BEAU065', barcode: '7701234567954', name: 'Bath Salts 16oz', category: 'Beauty', price: 8.99, stock: 245 },
    { sku: 'BEAU066', barcode: '7701234567955', name: 'Loofah', category: 'Beauty', price: 3.99, stock: 267 },
    { sku: 'BEAU067', barcode: '7701234567956', name: 'Shower Pouf', category: 'Beauty', price: 2.99, stock: 278 },
    { sku: 'BEAU068', barcode: '7701234567957', name: 'Pumice Stone', category: 'Beauty', price: 4.99, stock: 212 },
    { sku: 'BEAU069', barcode: '7701234567958', name: 'Nail Clipper Set', category: 'Beauty', price: 7.99, stock: 234 },
    { sku: 'BEAU070', barcode: '7701234567959', name: 'Tweezers', category: 'Beauty', price: 5.99, stock: 245 },
    { sku: 'BEAU071', barcode: '7701234567960', name: 'Eye Lash Curler', category: 'Beauty', price: 6.99, stock: 223 },
    { sku: 'BEAU072', barcode: '7701234567961', name: 'Makeup Brushes Set 12pc', category: 'Beauty', price: 19.99, stock: 198 },
    { sku: 'BEAU073', barcode: '7701234567962', name: 'Beauty Sponge 2-pack', category: 'Beauty', price: 5.99, stock: 234 },
    { sku: 'BEAU074', barcode: '7701234567963', name: 'Makeup Bag', category: 'Beauty', price: 12.99, stock: 189 },
    { sku: 'BEAU075', barcode: '7701234567964', name: 'Travel Bottles 4-pack', category: 'Beauty', price: 6.99, stock: 245 },
    { sku: 'BEAU076', barcode: '7701234567965', name: 'Perfume Women 1.7oz', category: 'Beauty', price: 49.99, stock: 134 },
    { sku: 'BEAU077', barcode: '7701234567966', name: 'Cologne Men 1.7oz', category: 'Beauty', price: 49.99, stock: 145 },
    { sku: 'BEAU078', barcode: '7701234567967', name: 'Body Spray 4oz', category: 'Beauty', price: 7.99, stock: 234 },
    { sku: 'BEAU079', barcode: '7701234567968', name: 'Rollerball Perfume', category: 'Beauty', price: 14.99, stock: 189 },
    { sku: 'BEAU080', barcode: '7701234567969', name: 'Solid Perfume', category: 'Beauty', price: 12.99, stock: 178 },
    { sku: 'BEAU081', barcode: '7701234567970', name: 'Beard Oil 1oz', category: 'Beauty', price: 12.99, stock: 198 },
    { sku: 'BEAU082', barcode: '7701234567971', name: 'Beard Balm 2oz', category: 'Beauty', price: 11.99, stock: 189 },
    { sku: 'BEAU083', barcode: '7701234567972', name: 'Beard Comb', category: 'Beauty', price: 6.99, stock: 212 },
    { sku: 'BEAU084', barcode: '7701234567973', name: 'Beard Trimmer', category: 'Beauty', price: 29.99, stock: 156 },
    { sku: 'BEAU085', barcode: '7701234567974', name: 'Hair Clippers', category: 'Beauty', price: 39.99, stock: 145 },
    { sku: 'BEAU086', barcode: '7701234567975', name: 'Nose Hair Trimmer', category: 'Beauty', price: 14.99, stock: 167 },
    { sku: 'BEAU087', barcode: '7701234567976', name: 'Ear Wax Removal Kit', category: 'Beauty', price: 9.99, stock: 189 },
    { sku: 'BEAU088', barcode: '7701234567977', name: 'Nasal Spray', category: 'Beauty', price: 7.99, stock: 212 },
    { sku: 'BEAU089', barcode: '7701234567978', name: 'Eye Drops', category: 'Beauty', price: 5.99, stock: 234 },
    { sku: 'BEAU090', barcode: '7701234567979', name: 'Antihistamine 24ct', category: 'Beauty', price: 8.99, stock: 245 },
    { sku: 'BEAU091', barcode: '7701234567980', name: 'Pain Reliever 50ct', category: 'Beauty', price: 7.99, stock: 267 },
    { sku: 'BEAU092', barcode: '7701234567981', name: 'First Aid Tape', category: 'Beauty', price: 3.99, stock: 278 },
    { sku: 'BEAU093', barcode: '7701234567982', name: 'Bandages 100ct', category: 'Beauty', price: 4.99, stock: 289 },
    { sku: 'BEAU094', barcode: '7701234567983', name: 'Gauze Pads', category: 'Beauty', price: 3.99, stock: 256 },
    { sku: 'BEAU095', barcode: '7701234567984', name: 'Antiseptic Wipes 25ct', category: 'Beauty', price: 4.99, stock: 267 },
    { sku: 'BEAU096', barcode: '7701234567985', name: 'Hydrocortisone Cream', category: 'Beauty', price: 5.99, stock: 234 },
    { sku: 'BEAU097', barcode: '7701234567986', name: 'Antifungal Cream', category: 'Beauty', price: 6.99, stock: 223 },
    { sku: 'BEAU098', barcode: '7701234567987', name: 'Lip Balm Medicated', category: 'Beauty', price: 2.99, stock: 289 },
    { sku: 'BEAU099', barcode: '7701234567988', name: 'Hand Sanitizer 8oz', category: 'Beauty', price: 3.99, stock: 312 },
    { sku: 'BEAU100', barcode: '7701234567989', name: 'Face Mask 50ct', category: 'Beauty', price: 14.99, stock: 278 },

    // Sports & Outdoors (150 products)
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
    { sku: 'SPRT051', barcode: '6601234567940', name: 'Football', category: 'Sports', price: 22.99, stock: 134 },
    { sku: 'SPRT052', barcode: '6601234567941', name: 'Soccer Ball', category: 'Sports', price: 19.99, stock: 167 },
    { sku: 'SPRT053', barcode: '6601234567942', name: 'Volleyball', category: 'Sports', price: 17.99, stock: 145 },
    { sku: 'SPRT054', barcode: '6601234567943', name: 'Tennis Racquet', category: 'Sports', price: 49.99, stock: 98 },
    { sku: 'SPRT055', barcode: '6601234567944', name: 'Tennis Balls 3-pack', category: 'Sports', price: 5.99, stock: 234 },
    { sku: 'SPRT056', barcode: '6601234567945', name: 'Badminton Racquet', category: 'Sports', price: 29.99, stock: 112 },
    { sku: 'SPRT057', barcode: '6601234567946', name: 'Badminton Set', category: 'Sports', price: 39.99, stock: 98 },
    { sku: 'SPRT058', barcode: '6601234567947', name: 'Table Tennis Paddle', category: 'Sports', price: 19.99, stock: 134 },
    { sku: 'SPRT059', barcode: '6601234567948', name: 'Table Tennis Balls 6-pack', category: 'Sports', price: 4.99, stock: 189 },
    { sku: 'SPRT060', barcode: '6601234567949', name: 'Golf Club Driver', category: 'Sports', price: 199.99, stock: 45 },
    { sku: 'SPRT061', barcode: '6601234567950', name: 'Golf Club Putter', category: 'Sports', price: 99.99, stock: 56 },
    { sku: 'SPRT062', barcode: '6601234567951', name: 'Golf Balls 12-pack', category: 'Sports', price: 29.99, stock: 134 },
    { sku: 'SPRT063', barcode: '6601234567952', name: 'Golf Tees 50-pack', category: 'Sports', price: 5.99, stock: 178 },
    { sku: 'SPRT064', barcode: '6601234567953', name: 'Golf Glove', category: 'Sports', price: 14.99, stock: 145 },
    { sku: 'SPRT065', barcode: '6601234567954', name: 'Fishing Rod', category: 'Sports', price: 49.99, stock: 78 },
    { sku: 'SPRT066', barcode: '6601234567955', name: 'Fishing Reel', category: 'Sports', price: 39.99, stock: 67 },
    { sku: 'SPRT067', barcode: '6601234567956', name: 'Fishing Lures 10-pack', category: 'Sports', price: 14.99, stock: 134 },
    { sku: 'SPRT068', barcode: '6601234567957', name: 'Tackle Box', category: 'Sports', price: 24.99, stock: 98 },
    { sku: 'SPRT069', barcode: '6601234567958', name: 'Camping Tent 4-person', category: 'Sports', price: 129.99, stock: 45 },
    { sku: 'SPRT070', barcode: '6601234567959', name: 'Sleeping Bag', category: 'Sports', price: 49.99, stock: 67 },
    { sku: 'SPRT071', barcode: '6601234567960', name: 'Camping Stove', category: 'Sports', price: 39.99, stock: 56 },
    { sku: 'SPRT072', barcode: '6601234567961', name: 'Camping Lantern', category: 'Sports', price: 24.99, stock: 78 },
    { sku: 'SPRT073', barcode: '6601234567962', name: 'Camping Chair', category: 'Sports', price: 29.99, stock: 89 },
    { sku: 'SPRT074', barcode: '6601234567963', name: 'Cooler 20qt', category: 'Sports', price: 34.99, stock: 67 },
    { sku: 'SPRT075', barcode: '6601234567964', name: 'Hiking Backpack 40L', category: 'Sports', price: 59.99, stock: 56 },
    { sku: 'SPRT076', barcode: '6601234567965', name: 'Hiking Boots Men 9', category: 'Sports', price: 89.99, stock: 45 },
    { sku: 'SPRT077', barcode: '6601234567966', name: 'Hiking Boots Women 7', category: 'Sports', price: 89.99, stock: 54 },
    { sku: 'SPRT078', barcode: '6601234567967', name: 'Trekking Poles', category: 'Sports', price: 39.99, stock: 67 },
    { sku: 'SPRT079', barcode: '6601234567968', name: 'Headlamp', category: 'Sports', price: 19.99, stock: 89 },
    { sku: 'SPRT080', barcode: '6601234567969', name: 'Compass', category: 'Sports', price: 12.99, stock: 98 },
    { sku: 'SPRT081', barcode: '6601234567970', name: 'Whistle', category: 'Sports', price: 4.99, stock: 145 },
    { sku: 'SPRT082', barcode: '6601234567971', name: 'First Aid Kit Camping', category: 'Sports', price: 19.99, stock: 112 },
    { sku: 'SPRT083', barcode: '6601234567972', name: 'Water Filter', category: 'Sports', price: 34.99, stock: 67 },
    { sku: 'SPRT084', barcode: '6601234567973', name: 'Bicycle Helmet', category: 'Sports', price: 49.99, stock: 89 },
    { sku: 'SPRT085', barcode: '6601234567974', name: 'Bike Lock', category: 'Sports', price: 19.99, stock: 134 },
    { sku: 'SPRT086', barcode: '6601234567975', name: 'Bike Lights Set', category: 'Sports', price: 24.99, stock: 112 },
    { sku: 'SPRT087', barcode: '6601234567976', name: 'Water Bottle Cage', category: 'Sports', price: 9.99, stock: 145 },
    { sku: 'SPRT088', barcode: '6601234567977', name: 'Bike Pump', category: 'Sports', price: 19.99, stock: 98 },
    { sku: 'SPRT089', barcode: '6601234567978', name: 'Skateboard', category: 'Sports', price: 59.99, stock: 67 },
    { sku: 'SPRT090', barcode: '6601234567979', name: 'Scooter', category: 'Sports', price: 79.99, stock: 56 },
    { sku: 'SPRT091', barcode: '6601234567980', name: 'Roller Skates', category: 'Sports', price: 69.99, stock: 45 },
    { sku: 'SPRT092', barcode: '6601234567981', name: 'Helmet Skate', category: 'Sports', price: 29.99, stock: 78 },
    { sku: 'SPRT093', barcode: '6601234567982', name: 'Knee Pads', category: 'Sports', price: 14.99, stock: 89 },
    { sku: 'SPRT094', barcode: '6601234567983', name: 'Elbow Pads', category: 'Sports', price: 12.99, stock: 87 },
    { sku: 'SPRT095', barcode: '6601234567984', name: 'Wrist Guards', category: 'Sports', price: 9.99, stock: 98 },
    { sku: 'SPRT096', barcode: '6601234567985', name: 'Sunglasses Sports', category: 'Sports', price: 19.99, stock: 134 },
    { sku: 'SPRT097', barcode: '6601234567986', name: 'Swim Goggles', category: 'Sports', price: 12.99, stock: 145 },
    { sku: 'SPRT098', barcode: '6601234567987', name: 'Swim Cap', category: 'Sports', price: 7.99, stock: 156 },
    { sku: 'SPRT099', barcode: '6601234567988', name: 'Kickboard', category: 'Sports', price: 19.99, stock: 89 },
    { sku: 'SPRT100', barcode: '6601234567989', name: 'Swim Fins', category: 'Sports', price: 29.99, stock: 78 },

    // Books & Media (100 products)
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
    { sku: 'BOOK050', barcode: '9781234567939', name: 'DevOps Handbook', category: 'Books', price: 34.99, stock: 134 },
    { sku: 'BOOK051', barcode: '9781234567940', name: 'Agile Project Management', category: 'Books', price: 29.99, stock: 156 },
    { sku: 'BOOK052', barcode: '9781234567941', name: 'Scrum Guide', category: 'Books', price: 24.99, stock: 167 },
    { sku: 'BOOK053', barcode: '9781234567942', name: 'Product Management', category: 'Books', price: 32.99, stock: 145 },
    { sku: 'BOOK054', barcode: '9781234567943', name: 'UX Design', category: 'Books', price: 28.99, stock: 156 },
    { sku: 'BOOK055', barcode: '9781234567944', name: 'Graphic Design', category: 'Books', price: 26.99, stock: 134 },
    { sku: 'BOOK056', barcode: '9781234567945', name: 'Photography Guide', category: 'Books', price: 29.99, stock: 145 },
    { sku: 'BOOK057', barcode: '9781234567946', name: 'Film Making', category: 'Books', price: 34.99, stock: 123 },
    { sku: 'BOOK058', barcode: '9781234567947', name: 'Music Theory', category: 'Books', price: 22.99, stock: 134 },
    { sku: 'BOOK059', barcode: '9781234567948', name: 'Guitar Chords', category: 'Books', price: 16.99, stock: 145 },
    { sku: 'BOOK060', barcode: '9781234567949', name: 'Piano Lessons', category: 'Books', price: 19.99, stock: 134 },
    { sku: 'BOOK061', barcode: '9781234567950', name: 'Songwriting', category: 'Books', price: 18.99, stock: 123 },
    { sku: 'BOOK062', barcode: '9781234567951', name: 'Music Production', category: 'Books', price: 27.99, stock: 112 },
    { sku: 'BOOK063', barcode: '9781234567952', name: 'Audio Engineering', category: 'Books', price: 32.99, stock: 98 },
    { sku: 'BOOK064', barcode: '9781234567953', name: 'Guitar Tablature', category: 'Books', price: 14.99, stock: 156 },
    { sku: 'BOOK065', barcode: '9781234567954', name: 'Fitness Guide', category: 'Books', price: 19.99, stock: 178 },
    { sku: 'BOOK066', barcode: '9781234567955', name: 'Weight Training', category: 'Books', price: 22.99, stock: 167 },
    { sku: 'BOOK067', barcode: '9781234567956', name: 'Yoga for Beginners', category: 'Books', price: 16.99, stock: 189 },
    { sku: 'BOOK068', barcode: '9781234567957', name: 'Pilates Method', category: 'Books', price: 18.99, stock: 178 },
    { sku: 'BOOK069', barcode: '9781234567958', name: 'Running Techniques', category: 'Books', price: 17.99, stock: 156 },
    { sku: 'BOOK070', barcode: '9781234567959', name: 'Marathon Training', category: 'Books', price: 21.99, stock: 145 },
    { sku: 'BOOK071', barcode: '9781234567960', name: 'Cycling Guide', category: 'Books', price: 19.99, stock: 134 },
    { sku: 'BOOK072', barcode: '9781234567961', name: 'Swimming Techniques', category: 'Books', price: 16.99, stock: 145 },
    { sku: 'BOOK073', barcode: '9781234567962', name: 'Triathlon Training', category: 'Books', price: 24.99, stock: 123 },
    { sku: 'BOOK074', barcode: '9781234567963', name: 'Nutrition Guide', category: 'Books', price: 22.99, stock: 156 },
    { sku: 'BOOK075', barcode: '9781234567964', name: 'Healthy Recipes', category: 'Books', price: 19.99, stock: 145 },
    { sku: 'BOOK076', barcode: '9781234567965', name: 'Meal Prep', category: 'Books', price: 18.99, stock: 167 },
    { sku: 'BOOK077', barcode: '9781234567966', name: 'Smoothie Bible', category: 'Books', price: 14.99, stock: 178 },
    { sku: 'BOOK078', barcode: '9781234567967', name: 'Gardening Guide', category: 'Books', price: 21.99, stock: 145 },
    { sku: 'BOOK079', barcode: '9781234567968', name: 'Vegetable Gardening', category: 'Books', price: 19.99, stock: 156 },
    { sku: 'BOOK080', barcode: '9781234567969', name: 'Flower Gardening', category: 'Books', price: 18.99, stock: 134 },
    { sku: 'BOOK081', barcode: '9781234567970', name: 'Houseplants Care', category: 'Books', price: 16.99, stock: 145 },
    { sku: 'BOOK082', barcode: '9781234567971', name: 'Bonsai Basics', category: 'Books', price: 15.99, stock: 123 },
    { sku: 'BOOK083', barcode: '9781234567972', name: 'Landscape Design', category: 'Books', price: 24.99, stock: 112 },
    { sku: 'BOOK084', barcode: '9781234567973', name: 'Home Improvement', category: 'Books', price: 22.99, stock: 134 },
    { sku: 'BOOK085', barcode: '9781234567974', name: 'Woodworking', category: 'Books', price: 26.99, stock: 123 },
    { sku: 'BOOK086', barcode: '9781234567975', name: 'DIY Projects', category: 'Books', price: 19.99, stock: 145 },
    { sku: 'BOOK087', barcode: '9781234567976', name: 'Electrical Wiring', category: 'Books', price: 21.99, stock: 134 },
    { sku: 'BOOK088', barcode: '9781234567977', name: 'Plumbing Guide', category: 'Books', price: 20.99, stock: 123 },
    { sku: 'BOOK089', barcode: '9781234567978', name: 'Home Painting', category: 'Books', price: 17.99, stock: 145 },
    { sku: 'BOOK090', barcode: '9781234567979', name: 'Flooring Installation', category: 'Books', price: 18.99, stock: 134 },
    { sku: 'BOOK091', barcode: '9781234567980', name: 'Travel Guide Europe', category: 'Books', price: 24.99, stock: 156 },
    { sku: 'BOOK092', barcode: '9781234567981', name: 'Travel Guide Asia', category: 'Books', price: 24.99, stock: 145 },
    { sku: 'BOOK093', barcode: '9781234567982', name: 'Travel Guide USA', category: 'Books', price: 22.99, stock: 167 },
    { sku: 'BOOK094', barcode: '9781234567983', name: 'Road Trip Guide', category: 'Books', price: 19.99, stock: 145 },
    { sku: 'BOOK095', barcode: '9781234567984', name: 'Camping Guide', category: 'Books', price: 18.99, stock: 156 },
    { sku: 'BOOK096', barcode: '9781234567985', name: 'Hiking Trails', category: 'Books', price: 17.99, stock: 134 },
    { sku: 'BOOK097', barcode: '9781234567986', name: 'National Parks', category: 'Books', price: 21.99, stock: 145 },
    { sku: 'BOOK098', barcode: '9781234567987', name: 'World Atlas', category: 'Books', price: 29.99, stock: 123 },
    { sku: 'BOOK099', barcode: '9781234567988', name: 'Map Collection', category: 'Books', price: 24.99, stock: 112 },
    { sku: 'BOOK100', barcode: '9781234567989', name: 'Globe 12"', category: 'Books', price: 34.99, stock: 89 }
],

    /**
     * Search products by query
     * @param {string} query - Search term
     * @returns {Array} Filtered products
     */
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

    /**
     * Get product by barcode or SKU
     * @param {string} code - Barcode or SKU
     * @returns {Object|undefined} Product object
     */
    getProductByCode: function(code) {
        return this.products.find(p => p.barcode === code || p.sku === code);
    },

    /**
     * Get product by QR code
     * @param {string} qrCode - QR code value
     * @returns {Object|undefined} Product object
     */
    getProductByQR: function(qrCode) {
        const cleanCode = qrCode.trim();
        
        // Check if it's a product URL (simulate)
        if (cleanCode.includes('product/')) {
            const sku = cleanCode.split('/').pop();
            return this.products.find(p => p.sku === sku);
        }
        
        // Check if it's a barcode format
        if (cleanCode.startsWith('QR-')) {
            return this.products.find(p => p.barcode === cleanCode);
        }
        
        // Default: treat as SKU/barcode
        return this.getProductByCode(cleanCode);
    }
};

// ============================================
// UTILITY & HELPER FUNCTIONS
// ============================================
RetailX.Utils = {
    /**
     * Format money amount
     * @param {number} amount - Amount to format
     * @returns {string} Formatted money string
     */
    formatMoney: (amount) => `${RetailX.Config.currencySymbol}${parseFloat(amount).toFixed(2)}`,
    
    /**
     * Generate unique bill number
     * @returns {string} Bill number
     */
    generateBillNo: () => {
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `INV-${dateStr}-${random}`;
    },
    
    /**
     * Debounce function for performance
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Play beep sound
     */
    playBeep: () => {
        const beep = document.getElementById('beepSound');
        if(beep) { 
            beep.currentTime = 0; 
            beep.play().catch(e => console.log("Audio play prevented")); 
        }
    },
    
    /**
     * Show toast notification
     * @param {string} title - Toast title
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     */
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
        
        // Trigger reflow to start animation
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },
    
    /**
     * Show notification popup
     */
    showNotificationPopup: function() {
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
    },

    /**
     * Hide loader with animation
     */
    hideLoader: function() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 400);
        }
    }
};

// ============================================
// ENHANCED CAMERA QR SCANNER MODULE WITH FIXED DROIDCAM SUPPORT
// ============================================
RetailX.CameraScanner = {
    /**
     * Initialize camera scanner
     */
    init: function() {
        this.bindEvents();
        this.checkLibrary();
        // Try to enumerate cameras on init
        setTimeout(() => {
            this.enumerateCameras();
        }, 1000);
    },

    /**
     * Check if jsQR library is loaded
     */
    checkLibrary: function() {
        if (typeof jsQR === 'undefined') {
            console.error('❌ jsQR library not loaded');
            RetailX.Utils.showToast('Library Error', 'QR decoder not loaded. Please refresh.', 'error');
        } else {
            console.log('✅ jsQR library loaded successfully');
        }
    },

    /**
     * Enumerate available cameras with improved detection
     */
    enumerateCameras: function() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.log('Camera enumeration not supported');
            RetailX.Utils.showToast('Camera Detection', 'Your browser does not support camera enumeration', 'warning');
            return;
        }

        // First, request camera permission to get labels
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                // Stop the stream immediately after getting permission
                stream.getTracks().forEach(track => track.stop());
                
                // Now enumerate devices with labels
                return navigator.mediaDevices.enumerateDevices();
            })
            .then(devices => {
                RetailX.State.availableCameras = devices.filter(device => device.kind === 'videoinput');
                console.log(`📷 Found ${RetailX.State.availableCameras.length} cameras:`, RetailX.State.availableCameras);
                
                // Log camera details for debugging
                RetailX.State.availableCameras.forEach((camera, index) => {
                    console.log(`Camera ${index + 1}:`, {
                        label: camera.label || 'Unnamed',
                        deviceId: camera.deviceId,
                        groupId: camera.groupId
                    });
                });
                
                // Update camera dropdown with detected cameras
                this.updateCameraDropdown();
                
                // Show success message
                if (RetailX.State.availableCameras.length > 0) {
                    RetailX.Utils.showToast('Cameras Detected', `Found ${RetailX.State.availableCameras.length} camera(s)`, 'success');
                } else {
                    RetailX.Utils.showToast('No Cameras', 'No cameras detected on this device', 'warning');
                }
            })
            .catch(err => {
                console.error('Error enumerating cameras:', err);
                RetailX.Utils.showToast('Camera Error', 'Could not access camera information', 'error');
            });
    },

    /**
     * Update camera dropdown with detected cameras - FIXED VERSION
     */
    updateCameraDropdown: function() {
        const select = $('#cameraSelect');
        if (!select.length) return;

        // Save current selection
        const currentValue = select.val();
        
        // Clear and rebuild
        select.empty();
        
        // Add standard options
        select.append('<option value="default">📷 Default Camera</option>');
        select.append('<option value="environment">📱 Back Camera (Environment)</option>');
        select.append('<option value="user">🤳 Front Camera (User)</option>');
        
        // Add separator if there are detected cameras
        if (RetailX.State.availableCameras.length > 0) {
            select.append('<option disabled>──────────</option>');
            select.append('<option value="droidcam-auto">📱 Auto-Detect DroidCam</option>');
            
            // Add all detected cameras with their labels
            RetailX.State.availableCameras.forEach((camera, index) => {
                let label = camera.label || `Camera ${index + 1}`;
                
                // Clean up the label
                label = label.replace(' (046d:0825)', '').trim();
                
                // Check if it might be DroidCam
                const isDroidCam = label.toLowerCase().includes('droidcam') || 
                                   label.toLowerCase().includes('droid') ||
                                   label.toLowerCase().includes('mobile') ||
                                   label.toLowerCase().includes('phone') ||
                                   label.toLowerCase().includes('android') ||
                                   label.toLowerCase().includes('iphone') ||
                                   label.toLowerCase().includes('ipad') ||
                                   label.toLowerCase().includes('wireless') ||
                                   label.toLowerCase().includes('wifi');
                
                // Truncate very long labels
                if (label.length > 40) {
                    label = label.substring(0, 40) + '...';
                }
                
                const optionValue = camera.deviceId;
                const optionLabel = isDroidCam ? `📱 DroidCam: ${label}` : `📷 ${label}`;
                
                select.append(`<option value="${optionValue}">${optionLabel}</option>`);
            });
        }

        // Try to restore previous selection
        if (currentValue) {
            if (select.find(`option[value="${currentValue}"]`).length) {
                select.val(currentValue);
            }
        }
        
        // Add change event to update selection
        select.off('change').on('change', function() {
            const selected = $(this).val();
            console.log('Camera selected:', selected);
        });
    },

    /**
     * Bind camera-related events
     */
    bindEvents: function() {
        const self = this;

        // Camera Scan Button
        $('#cameraScanBtn').off('click').on('click', function() {
            self.openScanner();
        });

        // Close scanner modal
        $('#qrScannerClose').off('click').on('click', function() {
            self.closeScanner();
        });

        // Apply selected camera - FIXED VERSION
        $('#applyCameraBtn').off('click').on('click', function() {
            const selected = $('#cameraSelect').val();
            console.log('Applying camera selection:', selected);
            self.applyCameraSelection(selected);
        });

        // Quick switch camera button
        $('#switchCameraBtn').off('click').on('click', function() {
            self.quickSwitchCamera();
        });

        // Detect cameras button
        $('#detectCamerasBtn').off('click').on('click', function() {
            RetailX.Utils.showToast('Detecting Cameras', 'Searching for available cameras...', 'info');
            self.enumerateCameras();
        });

        // Capture QR button
        $('#captureQRBtn').off('click').on('click', function() {
            self.captureQR();
        });

        // Close on click outside
        $(window).off('click').on('click', function(e) {
            if ($(e.target).hasClass('modal')) {
                self.closeScanner();
            }
        });

        // ESC key to close
        $(document).off('keydown').on('keydown', function(e) {
            if (e.key === 'Escape' && $('#qrScannerModal').hasClass('show')) {
                self.closeScanner();
            }
        });
    },

    /**
     * Apply selected camera - FIXED VERSION with better DroidCam support
     * @param {string} selection - Camera selection value
     */
    applyCameraSelection: function(selection) {
        console.log('Applying camera:', selection);
        
        if (selection === 'droidcam-auto') {
            // Auto-detect DroidCam
            const droidCam = this.findDroidCam();
            
            if (droidCam) {
                RetailX.State.currentCamera = droidCam.deviceId;
                RetailX.Utils.showToast('✅ DroidCam Found', 'Using mobile camera via DroidCam', 'success');
                console.log('DroidCam device:', droidCam);
            } else {
                // Try to use any available camera
                if (RetailX.State.availableCameras.length > 0) {
                    // Use the first available camera
                    RetailX.State.currentCamera = RetailX.State.availableCameras[0].deviceId;
                    RetailX.Utils.showToast('DroidCam Not Found', 'Using first available camera instead', 'warning');
                } else {
                    RetailX.State.currentCamera = 'environment';
                    RetailX.Utils.showToast('No Cameras Found', 'Using default back camera', 'warning');
                }
            }
        } else if (selection === 'default') {
            // Use default camera (no specific constraints)
            RetailX.State.currentCamera = '';
        } else if (selection === 'environment' || selection === 'user') {
            RetailX.State.currentCamera = selection;
        } else {
            // Assume it's a deviceId
            RetailX.State.currentCamera = selection;
        }
        
        console.log('Camera set to:', RetailX.State.currentCamera);
        
        // Restart camera with new selection
        this.startCamera();
    },

    /**
     * Find DroidCam in available cameras - NEW HELPER FUNCTION
     * @returns {Object|null} DroidCam device or null
     */
    findDroidCam: function() {
        if (RetailX.State.availableCameras.length === 0) {
            return null;
        }
        
        // First, look for cameras with DroidCam in the label
        const droidCam = RetailX.State.availableCameras.find(cam => 
            cam.label && (
                cam.label.toLowerCase().includes('droidcam') || 
                cam.label.toLowerCase().includes('droid') ||
                cam.label.toLowerCase().includes('mobile') ||
                cam.label.toLowerCase().includes('phone') ||
                cam.label.toLowerCase().includes('android') ||
                cam.label.toLowerCase().includes('iphone') ||
                cam.label.toLowerCase().includes('ipad') ||
                cam.label.toLowerCase().includes('wireless') ||
                cam.label.toLowerCase().includes('wifi')
            )
        );
        
        if (droidCam) {
            console.log('Found DroidCam by label:', droidCam.label);
            return droidCam;
        }
        
        // If no DroidCam found, return the last camera (often DroidCam appears last)
        if (RetailX.State.availableCameras.length > 0) {
            console.log('No DroidCam label found, using last camera:', RetailX.State.availableCameras[RetailX.State.availableCameras.length - 1].label);
            return RetailX.State.availableCameras[RetailX.State.availableCameras.length - 1];
        }
        
        return null;
    },

    /**
     * Quick switch between front/back cameras
     */
    quickSwitchCamera: function() {
        if (RetailX.State.currentCamera === 'environment') {
            RetailX.State.currentCamera = 'user';
        } else if (RetailX.State.currentCamera === 'user') {
            RetailX.State.currentCamera = 'environment';
        } else {
            // If it's a deviceId, switch to environment
            RetailX.State.currentCamera = 'environment';
        }
        
        // Update dropdown
        if (RetailX.State.currentCamera === 'environment') {
            $('#cameraSelect').val('environment');
        } else if (RetailX.State.currentCamera === 'user') {
            $('#cameraSelect').val('user');
        }
        
        this.startCamera();
        RetailX.Utils.showToast('Camera Switched', `Switched to ${RetailX.State.currentCamera === 'environment' ? 'back' : 'front'} camera`, 'info');
    },

    /**
     * Open camera scanner modal
     */
    openScanner: function() {
        const self = this;
        
        // Show modal
        $('#qrScannerModal').addClass('show');
        
        // Clear previous results
        $('#qr-result').removeClass('show').empty();
        $('#qr-status').removeClass('success error warning').html('<i class="fas fa-info-circle"></i> Select camera and click "Apply"');
        
        // Enumerate cameras
        this.enumerateCameras();
        
        // Initialize camera with a slight delay
        setTimeout(() => {
            self.startCamera();
        }, 500);
    },

    /**
     * Close camera scanner modal
     */
    closeScanner: function() {
        this.stopCamera();
        $('#qrScannerModal').removeClass('show');
        $('#qr-result').removeClass('show').empty();
        $('#qr-status').removeClass('success error warning').html('<i class="fas fa-info-circle"></i> Camera closed');
        
        // Focus back on barcode scanner
        setTimeout(() => {
            $('#posBarcodeScanner').focus();
        }, 300);
    },

    /**
     * Start camera stream - FIXED VERSION with better error handling
     */
    startCamera: function() {
        const self = this;
        const video = document.getElementById('qr-video');
        
        if (!video) {
            console.error('Video element not found');
            return;
        }

        // Stop any existing stream
        this.stopCamera();

        // Set mirror class based on camera
        const container = document.querySelector('.camera-container');
        if (container) {
            if (RetailX.State.currentCamera === 'user') {
                container.classList.remove('camera-back');
            } else {
                container.classList.add('camera-back');
            }
        }

        // Build constraints based on selection
        let constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        // Handle different camera selections
        if (RetailX.State.currentCamera && RetailX.State.currentCamera !== '') {
            if (RetailX.State.currentCamera === 'environment' || RetailX.State.currentCamera === 'user') {
                constraints.video.facingMode = RetailX.State.currentCamera;
            } else {
                // It's a deviceId - use exact constraint for reliability
                constraints.video.deviceId = { exact: RetailX.State.currentCamera };
            }
        }

        console.log('Camera constraints:', JSON.stringify(constraints, null, 2));

        // Request camera access
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
                // Store stream for later cleanup
                RetailX.State.cameraStream = stream;
                RetailX.State.isCameraActive = true;
                
                // Set video source
                video.srcObject = stream;
                
                // Play video
                return video.play();
            })
            .then(() => {
                console.log('✅ Camera started successfully');
                
                // Get camera info
                const track = RetailX.State.cameraStream.getVideoTracks()[0];
                const settings = track.getSettings();
                console.log('Camera settings:', settings);
                
                $('#qr-status').removeClass('error warning').addClass('success').html('<i class="fas fa-check-circle"></i> Camera ready - Point at QR code and click "Capture QR"');
            })
            .catch(function(err) {
                console.error('❌ Camera error:', err);
                RetailX.State.isCameraActive = false;
                
                let errorMessage = 'Could not access camera';
                let errorDetail = '';
                
                if (err.name === 'NotAllowedError') {
                    errorMessage = 'Camera permission denied';
                    errorDetail = 'Please allow camera access in your browser settings.';
                } else if (err.name === 'NotFoundError') {
                    errorMessage = 'No camera found';
                    errorDetail = 'Make sure DroidCam is running and connected.';
                } else if (err.name === 'NotReadableError') {
                    errorMessage = 'Camera is busy';
                    errorDetail = 'Camera is already in use by another application.';
                } else if (err.name === 'OverconstrainedError') {
                    errorMessage = 'Camera not available';
                    errorDetail = 'The selected camera cannot be used. Try another camera.';
                } else if (err.name === 'AbortError') {
                    errorMessage = 'Camera access aborted';
                    errorDetail = 'The camera request was aborted.';
                } else {
                    errorDetail = err.message || 'Unknown error';
                }
                
                RetailX.Utils.showToast('Camera Error', errorMessage, 'error');
                $('#qr-status').removeClass('success').addClass('error').html(`
                    <i class="fas fa-exclamation-triangle"></i> ${errorMessage}<br>
                    <small>${errorDetail}</small>
                `);
                
                // If deviceId failed, try falling back to environment
                if (RetailX.State.currentCamera && RetailX.State.currentCamera !== 'environment' && RetailX.State.currentCamera !== 'user') {
                    console.log('Falling back to environment camera');
                    RetailX.State.currentCamera = 'environment';
                    $('#cameraSelect').val('environment');
                    
                    // Show retry button
                    $('#qr-status').append('<br><button class="btn-primary btn-sm mt-2" onclick="RetailX.CameraScanner.startCamera()">Retry with Back Camera</button>');
                }
            });
    },

    /**
     * Stop camera stream
     */
    stopCamera: function() {
        if (RetailX.State.cameraStream && RetailX.State.isCameraActive) {
            RetailX.State.cameraStream.getTracks().forEach(track => {
                track.stop();
            });
            RetailX.State.cameraStream = null;
            RetailX.State.isCameraActive = false;
            console.log('✅ Camera stopped');
        }
        
        const video = document.getElementById('qr-video');
        if (video) {
            video.srcObject = null;
        }
    },

    /**
     * Capture and decode QR code from video frame
     */
    captureQR: function() {
        const self = this;
        const video = document.getElementById('qr-video');
        const canvas = document.getElementById('qr-canvas');
        
        if (!video || !canvas) {
            RetailX.Utils.showToast('Error', 'Camera not ready', 'error');
            return;
        }

        // Check if video is playing
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            RetailX.Utils.showToast('Error', 'Camera not initialized', 'error');
            return;
        }

        // Check if jsQR is loaded
        if (typeof jsQR === 'undefined') {
            RetailX.Utils.showToast('Error', 'QR decoder not loaded', 'error');
            return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (canvas.width === 0 || canvas.height === 0) {
            RetailX.Utils.showToast('Error', 'No video feed', 'error');
            return;
        }
        
        // Draw video frame to canvas
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Decode QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
        });

        if (code) {
            // QR code found
            const qrData = code.data;
            console.log('✅ QR Code detected:', qrData);
            
            // Play success sound
            RetailX.Utils.playBeep();
            
            // Show result
            $('#qr-result').html(`
                <div class="success">
                    <i class="fas fa-check-circle"></i> QR Code: ${qrData}
                </div>
            `).addClass('show');
            
            $('#qr-status').removeClass('error warning').addClass('success').html('<i class="fas fa-info-circle"></i> Processing QR code...');
            
            // Process the QR code
            this.processQRData(qrData);
            
            // Close scanner after short delay
            setTimeout(() => {
                self.closeScanner();
            }, 1500);
            
        } else {
            // No QR code found
            RetailX.Utils.showToast('No QR Code', 'No QR code detected in the frame', 'warning');
            $('#qr-status').removeClass('success').addClass('warning').html('<i class="fas fa-exclamation-triangle"></i> No QR code detected - Try again');
        }
    },

    /**
     * Process decoded QR data
     * @param {string} qrData - Decoded QR data
     */
    processQRData: function(qrData) {
        // Find product by QR code
        const product = RetailX.Database.getProductByQR(qrData);
        
        if (product) {
            RetailX.POS.addToCart(product);
            RetailX.Utils.showToast('Product Found', `${product.name} added to cart`, 'success');
        } else {
            RetailX.Utils.showToast('Product Not Found', `No product matches QR: ${qrData.substring(0, 20)}`, 'error');
        }
    }
};

// ============================================
// UI & NAVIGATION MODULE
// ============================================
RetailX.Navigation = {
    /**
     * Initialize navigation
     */
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
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });

        // Initialize Clocks
        this.updateClocks();
        setInterval(() => this.updateClocks(), 1000);
    },

    /**
     * Switch to a specific page
     * @param {string} pageId - Page identifier
     */
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

        // Page specific initializations
        if(pageId === 'pos') $('#posBarcodeScanner').focus();
        if(pageId === 'inventory') RetailX.Inventory.renderTable();
        if(pageId === 'transactions') RetailX.Transactions.renderTable();
        if(pageId === 'summary') RetailX.Summary.render();
    },

    /**
     * Update clocks and timer
     */
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
    /**
     * Initialize POS module
     */
    init: function() {
        this.resetTransaction();
        this.bindEvents();
    },

    /**
     * Bind POS events
     */
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

        // Hold Bill button functionality
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

        // Add Customer button functionality
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
            if(val === 'exact') amt = RetailX.State.billTotals ? RetailX.State.billTotals.grandTotal : 0;
            else amt = parseFloat(val);
            
            $('#tenderAmount').val(amt.toFixed(2));
            self.validateCheckout();
        });

        // Checkout execution
        $('#completeCheckoutBtn').on('click', () => this.completeTransaction());
    },

    /**
     * Process barcode scan
     * @param {string} code - Scanned barcode
     */
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

    /**
     * Render search modal with products
     * @param {Array} products - Products to display
     */
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

    /**
     * Add product to cart
     * @param {Object} product - Product to add
     */
    addToCart: function(product) {
        const existing = RetailX.State.cart.find(i => i.sku === product.sku);
        if(existing) {
            existing.qty += 1;
        } else {
            RetailX.State.cart.unshift({ ...product, qty: 1 }); // Add to top
        }
        this.renderCart();
    },

    /**
     * Update item quantity
     * @param {string} sku - Product SKU
     * @param {number} delta - Quantity change
     */
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

    /**
     * Render cart items
     */
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
        
        // Scroll to top
        container.scrollTop(0);
        this.updateTotals();
    },

    /**
     * Update cart totals
     */
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

    /**
     * Validate checkout button state
     */
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

    /**
     * Reset current transaction
     */
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

    /**
     * Complete current transaction
     */
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

    /**
     * Generate receipt HTML
     * @param {Object} tx - Transaction object
     */
    generateReceiptHTML: function(tx) {
        let itemsHtml = '';
        tx.items.forEach(i => {
            itemsHtml += `
                <tr>
                    <td>${i.name.substring(0, 20)}</td>
                    <td class="qty">${i.qty}</td>
                    <td class="amt">$${i.price.toFixed(2)}</td>
                    <td class="amt">$${(i.qty * i.price).toFixed(2)}</td>
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
                <div class="rcpt-line"><span>Subtotal:</span><span>$${tx.totals.subtotal.toFixed(2)}</span></div>
                ${tx.totals.discountAmt > 0 ? `<div class="rcpt-line"><span>Discount:</span><span>-$${tx.totals.discountAmt.toFixed(2)}</span></div>` : ''}
                <div class="rcpt-line"><span>Tax (8.5%):</span><span>$${tx.totals.tax.toFixed(2)}</span></div>
                <div class="rcpt-line bold"><span>TOTAL:</span><span>$${tx.totals.grandTotal.toFixed(2)}</span></div>
            </div>
            <div class="rcpt-totals">
                <div class="rcpt-line"><span>Paid by ${tx.method.toUpperCase()}:</span><span>$${tx.tendered.toFixed(2)}</span></div>
                <div class="rcpt-line"><span>Change:</span><span>$${tx.change.toFixed(2)}</span></div>
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

    /**
     * Update dashboard KPIs
     */
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
    /**
     * Render inventory table
     * @param {string} query - Search query
     */
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
    /**
     * Render transactions table
     */
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
    
    /**
     * Render summary page
     */
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

    /**
     * Render hourly sales chart
     */
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
    console.log('📦 Document ready, initializing modules...');
    
    // Initialize modules
    RetailX.Navigation.init();
    RetailX.POS.init();
    RetailX.CameraScanner.init();

    // Hide loader after all modules are initialized
    setTimeout(() => {
        RetailX.Utils.hideLoader();
        console.log('✅ All modules initialized, loader hidden');
        
        // Check if jsQR is loaded
        if (typeof jsQR !== 'undefined') {
            console.log('✅ jsQR library loaded successfully');
        } else {
            console.error('❌ jsQR library not loaded');
        }
    }, 1000); // Give a little time for everything to initialize

    // Global Modal Closers
    $('.modal-close').on('click', function() {
        $(this).closest('.modal').removeClass('show');
    });

    // Handle Hardware Print
    $('#printActualReceiptBtn').on('click', function() {
        window.print();
    });

    // Drawer Simulation
    $('#openDrawerBtn').on('click', () => {
        RetailX.Utils.playBeep();
        RetailX.Utils.showToast('Drawer Opened', 'Cash drawer kicked open.', 'warning');
    });

    // Notifications button handler
    $('#notificationsBtn').on('click', () => {
        RetailX.Utils.showNotificationPopup();
    });

    // Logout
    $('#endShiftBtn').on('click', (e) => {
        e.preventDefault();
        $('#printZReportBtn').click(); // Reuse Z-report logic
    });

    // Fallback: Ensure loader is hidden even if something goes wrong
    window.addEventListener('load', function() {
        setTimeout(RetailX.Utils.hideLoader, 2000);
    });
});

// Additional safety: hide loader if page is already loaded
if (document.readyState === 'complete') {
    setTimeout(RetailX.Utils.hideLoader, 500);
}