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
    availableCameras: [] // List of available cameras
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
        { sku: '40001', barcode: '012345678906', name: 'Water Bottle 1L', category: 'Accessories', price: 9.99, stock: 85 },
        // Products with QR codes (can be scanned)
        { sku: '50001', barcode: 'QR-COFFEE-001', name: 'Special Edition Coffee', category: 'Grocery', price: 34.99, stock: 20 },
        { sku: '50002', barcode: 'QR-PHONE-001', name: 'Smartphone Case', category: 'Electronics', price: 19.99, stock: 45 },
        { sku: '50003', barcode: 'QR-TSHIRT-001', name: 'Limited Edition T-Shirt', category: 'Apparel', price: 29.99, stock: 15 }
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
                                   label.toLowerCase().includes('ipad');
                
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
    
    // Hide Preloader
    setTimeout(() => {
        $('#global-loader').addClass('fade-out');
    }, 800);

    // Init Modules
    RetailX.Navigation.init();
    RetailX.POS.init();
    RetailX.CameraScanner.init();

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

    // Notifications button handler
    $('#notificationsBtn').on('click', () => {
        RetailX.Utils.showNotificationPopup();
    });

    // Logout
    $('#endShiftBtn').on('click', (e) => {
        e.preventDefault();
        $('#printZReportBtn').click(); // Reuse Z-report logic
    });
});