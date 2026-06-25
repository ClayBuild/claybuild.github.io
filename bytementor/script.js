// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Close mobile menu when clicking a link
const navLinkItems = document.querySelectorAll('.nav-links a');
navLinkItems.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
  });
});

// Contact Form Handling
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  const successMessage = document.getElementById('successMessage');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      contactForm.style.display = 'none';
      successMessage.style.display = 'block';
      contactForm.reset();
    });
  }
});

// Intersection Observer for Fade-in Animations
document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);
  
  // Observe sections for fade-in
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    section.classList.add('fade-in');
    observer.observe(section);
  });
});
