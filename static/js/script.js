document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SEQUENCE MANAGER
    const loaderWrapper = document.querySelector('.loader-wrapper');
    const movingLogo = document.getElementById('moving-logo');
    const navbar = document.querySelector('.navbar');
    const navLogo = document.querySelector('.navbar .logo');
    const hero = document.querySelector('.hero');

    if(loaderWrapper && movingLogo) {
        setTimeout(() => {
            movingLogo.classList.add('move-to-nav');
            setTimeout(() => {
                loaderWrapper.style.opacity = '0'; 
                navbar.classList.add('visible');   
                hero.classList.add('visible');     
            }, 800);
            setTimeout(() => {
                loaderWrapper.style.display = 'none'; 
                navLogo.classList.add('visible');     
            }, 1200);
        }, 2200); 
    }

    // 2. DARK MODE
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
        }
    }

    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }
    if(toggleSwitch) toggleSwitch.addEventListener('change', switchTheme, false);

    // ===== FLOATING TROLLEY – PURELY DOWNWARD, ALWAYS VISIBLE =====
    const floatingTrolley = document.querySelector('.floating-trolley-scroll');
    const heroTrolley = document.querySelector('.scene-container');
    const heroSection = document.querySelector('.hero');
    const stepsSection = document.querySelector('.steps-section');
    const stickyWrapper = document.querySelector('.sticky-wrapper');

    if (floatingTrolley && heroTrolley && heroSection && stepsSection) {
        floatingTrolley.classList.remove('visible');

        function updateFloatingTrolley() {
            const scrollY = window.scrollY;
            const heroTop = heroSection.offsetTop;
            const heroHeight = heroSection.offsetHeight;
            const stepsTop = stepsSection.offsetTop;
            const stepsHeight = stepsSection.offsetHeight;
            const viewportHeight = window.innerHeight;

            // Start when 30% of hero is scrolled past
            const startScroll = heroTop + heroHeight * 0.3;
            // End when bottom of steps section reaches top of viewport
            const endScroll = stepsTop + stepsHeight - viewportHeight;

            if (scrollY >= startScroll && scrollY <= endScroll) {
                floatingTrolley.classList.add('visible');

                // Progress from 0 to 1
                const progress = (scrollY - startScroll) / (endScroll - startScroll);

                // Get starting position (center of hero trolley)
                const heroRect = heroTrolley.getBoundingClientRect();
                const startX = heroRect.left + heroRect.width / 2;
                const startY = heroRect.top + heroRect.height / 2;

                // Get target area (near the middle of sticky wrapper)
                const stickyRect = stickyWrapper.getBoundingClientRect();
                const targetX = stickyRect.left + stickyRect.width / 2;
                const targetY = stickyRect.top + stickyRect.height * 0.6;

                // Horizontal sweep limits (keep inside viewport)
                const leftBound = 50;
                const rightBound = window.innerWidth - 100;

                // Calculate Y – always increasing from startY to targetY, but clamp to stay inside viewport
                let desiredY = startY + (targetY - startY) * progress;
                // Clamp Y so trolley never goes above top or below bottom of viewport
                const minY = 40; // half height
                const maxY = window.innerHeight - 40;
                const currentY = Math.min(maxY, Math.max(minY, desiredY));

                // Calculate X with sweeping motion
                let currentX;
                if (progress < 0.25) {
                    // Phase 1: stay at startX
                    currentX = startX;
                } else if (progress < 0.5) {
                    // Phase 2: sweep to left bound
                    const p = (progress - 0.25) / 0.25;
                    currentX = startX + (leftBound - startX) * p;
                } else if (progress < 0.75) {
                    // Phase 3: sweep to right bound
                    const p = (progress - 0.5) / 0.25;
                    currentX = leftBound + (rightBound - leftBound) * p;
                } else {
                    // Phase 4: settle to targetX with diminishing oscillation
                    const p = (progress - 0.75) / 0.25;
                    const swing = Math.sin(p * Math.PI * 8) * 40 * (1 - p);
                    currentX = rightBound + (targetX - rightBound) * p + swing;
                }

                // Clamp X to keep trolley inside viewport
                const clampedX = Math.min(rightBound, Math.max(leftBound, currentX));

                // Apply position
                floatingTrolley.style.transform = `translate(${clampedX - 40}px, ${currentY - 40}px) rotate(${Math.sin(progress * 15) * 8}deg)`;
                
                // Dynamic glow
                const glowIntensity = 0.6 + Math.sin(progress * 20) * 0.3;
                floatingTrolley.style.filter = `drop-shadow(0 0 ${20 + glowIntensity * 15}px rgba(79, 70, 229, ${glowIntensity}))`;
            } else {
                floatingTrolley.classList.remove('visible');
            }
        }

        window.addEventListener('scroll', updateFloatingTrolley);
        window.addEventListener('resize', updateFloatingTrolley);
        updateFloatingTrolley();
    }

    // 3. HORIZONTAL SCROLL TRIGGER + CURVED LINE
    const stickySection = document.querySelector('.steps-section');
    const track = document.querySelector('.timeline-track');
    const svgPath = document.querySelector('.scroll-line path');

    if (stickySection && track && svgPath) {
        const pathLength = svgPath.getTotalLength();
        svgPath.style.strokeDasharray = pathLength;
        svgPath.style.strokeDashoffset = pathLength;

        window.addEventListener('scroll', () => {
            const sectionTop = stickySection.offsetTop;
            const sectionHeight = stickySection.offsetHeight;
            const viewportHeight = window.innerHeight;
            const scrolled = window.scrollY;

            const startScroll = sectionTop;
            const endScroll = sectionTop + sectionHeight - viewportHeight;

            if (scrolled >= startScroll && scrolled <= endScroll) {
                const scrollDistance = scrolled - startScroll;
                const maxScrollDistance = endScroll - startScroll;
                const percentage = scrollDistance / maxScrollDistance;

                const trackWidth = track.scrollWidth;
                const windowWidth = window.innerWidth;
                const moveAmount = (trackWidth - windowWidth) * percentage;
                track.style.transform = `translateX(-${moveAmount}px)`;

                svgPath.style.strokeDashoffset = pathLength * (1 - percentage);
            }
        });
    }

    // 4. 3D TILT EFFECT
    const trolleyObject = document.querySelector('.tilt-object');
    if(trolleyObject) {
        document.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth - e.pageX * 2) / 100;
            const y = (window.innerHeight - e.pageY * 2) / 100;
            trolleyObject.style.transform = `rotateX(${20 + y}deg) rotateY(${-20 + x}deg)`;
        });
    }

    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
        let isHovering = false;
        
        card.addEventListener('mouseenter', () => {
            isHovering = true;
        });
        
        card.addEventListener('mousemove', (e) => {
            if (!isHovering) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xRotation = -1 * ((y - rect.height / 2) / 25);
            const yRotation = (x - rect.width / 2) / 25;
            
            card.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            isHovering = false;
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });
    });

    // 5. MOBILE MENU
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if(hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if(navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'var(--bg-card)';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            }
        });
    }

    // 6. SMOOTH SCROLLING
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 7. SCROLL ANIMATIONS
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.feature-card-advanced, .login-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});