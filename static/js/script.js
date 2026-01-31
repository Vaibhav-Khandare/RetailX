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


    // 3. HORIZONTAL SCROLL TRIGGER (Sticky Timeline)
    const stickySection = document.querySelector('.steps-section');
    const track = document.querySelector('.timeline-track');

    if (stickySection && track) {
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
                
                // We move by the exact difference to ensure the last card hits center
                const moveAmount = (trackWidth - windowWidth) * percentage;

                track.style.transform = `translateX(-${moveAmount}px)`;
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
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xRotation = -1 * ((y - rect.height / 2) / 20);
            const yRotation = (x - rect.width / 2) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
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