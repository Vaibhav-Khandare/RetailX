// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }
    });
});

// Navbar Background on Scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

// Animate Chart Bars on Scroll
const animateBars = () => {
    const chartBars = document.querySelectorAll('.chart-bar');
    chartBars.forEach(bar => {
        const barHeight = bar.style.height;
        bar.style.height = '0%';
        
        setTimeout(() => {
            bar.style.height = barHeight;
            bar.style.transition = 'height 1s ease-in-out';
        }, 300);
    });
};

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.classList.contains('chart-container')) {
                animateBars();
            }
            
            if (entry.target.classList.contains('login-card')) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    entry.target.style.transition = 'all 0.5s ease';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);
            }
            
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .step, .testimonial-card, .chart-container, .login-card').forEach(el => {
    observer.observe(el);
});

// Add some interactive elements to the dashboard preview
const chartBars = document.querySelectorAll('.chart-bar');
chartBars.forEach(bar => {
    bar.addEventListener('mouseover', function() {
        this.style.opacity = '0.8';
    });
    
    bar.addEventListener('mouseout', function() {
        this.style.opacity = '1';
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Add any initialization code here
    
    // Animate hero elements on load
    setTimeout(() => {
        document.querySelector('.hero-text').classList.add('animate-in');
    }, 300);
    
    setTimeout(() => {
        document.querySelector('.hero-image').classList.add('animate-in');
    }, 600);
});