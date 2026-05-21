const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.site-nav');
const themeToggle = document.getElementById('themeToggle');
const toastContainer = document.querySelector('.toast-container');
const showAuthBtn = document.getElementById('showAuth');
const whatsappButton = document.querySelector('.whatsapp-float');

const createToast = (message) => {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? 'Light' : 'Dark';
  }
  localStorage.setItem('ghor-theme', theme);
};

const initTheme = () => {
  const savedTheme = localStorage.getItem('ghor-theme');
  const preferred = savedTheme || 'dark';
  setTheme(preferred);
};

const initNav = () => {
  if (!navToggle || !navMenu) return;
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
};

const initShowAuth = () => {
  if (!showAuthBtn) return;
  showAuthBtn.addEventListener('click', () => {
    document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' });
  });
};

const initWhatsApp = () => {
  if (!whatsappButton) return;
  whatsappButton.addEventListener('click', () => {
    window.open('https://wa.me/233538868627', '_blank');
  });
};

const animateCounters = () => {
  const counters = document.querySelectorAll('[data-value]');
  if (!counters.length) return;
  counters.forEach((counter) => {
    const target = Number(counter.dataset.value) || 0;
    let value = 0;
    const step = Math.max(1, Math.floor(target / 80));
    const interval = setInterval(() => {
      value += step;
      if (value >= target) {
        counter.textContent = target;
        clearInterval(interval);
      } else {
        counter.textContent = value;
      }
    }, 20);
  });
};

const initTestimonials = () => {
  const carousel = document.getElementById('testimonialCarousel');
  if (!carousel) return;

  const cards = Array.from(carousel.querySelectorAll('.testimonial-card'));
  let activeIndex = 0;

  const showCard = (index) => {
    cards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });
  };

  showCard(activeIndex);
  setInterval(() => {
    activeIndex = (activeIndex + 1) % cards.length;
    showCard(activeIndex);
  }, 5000);
};

const calculateLoanValues = (amount, term, rate) => {
  const monthlyRate = rate / 100 / 12;
  const monthly = monthlyRate === 0 ? amount / term : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
  const total = monthly * term;
  const interest = total - amount;
  return { monthly, total, interest };
};

const initHomeCalculator = () => {
  const amountInput = document.getElementById('homeAmount');
  const termInput = document.getElementById('homeTerm');
  const rateInput = document.getElementById('homeRate');
  const resultMonthly = document.getElementById('homeMonthly');
  const resultTotal = document.getElementById('homeTotal');
  const resultInterest = document.getElementById('homeInterest');
  const button = document.getElementById('homeCalculate');

  if (!button || !amountInput || !termInput || !rateInput) return;

  button.addEventListener('click', () => {
    const amount = Number(amountInput.value) || 0;
    const term = Number(termInput.value) || 1;
    const rate = Number(rateInput.value) || 0;
    const { monthly, total, interest } = calculateLoanValues(amount, term, rate);
    resultMonthly.textContent = `GH₵ ${monthly.toFixed(2)}`;
    resultTotal.textContent = `GH₵ ${total.toFixed(2)}`;
    resultInterest.textContent = `GH₵ ${interest.toFixed(2)}`;
  });
};

const initLoanInquiry = () => {
  const amountInput = document.getElementById('loanAmount');
  const termInput = document.getElementById('loanTerm');
  const rateInput = document.getElementById('loanRate');
  const resultMonthly = document.getElementById('monthlyRepayment');
  const resultTotal = document.getElementById('totalRepayment');
  const resultInterest = document.getElementById('interestTotal');
  const calculateButton = document.getElementById('calculateLoan');

  if (!calculateButton) return;
  calculateButton.addEventListener('click', () => {
    const amount = Number(amountInput.value) || 0;
    const term = Number(termInput.value) || 1;
    const rate = Number(rateInput.value) || 0;
    const { monthly, total, interest } = calculateLoanValues(amount, term, rate);
    resultMonthly.textContent = `GH₵ ${monthly.toFixed(2)}`;
    resultTotal.textContent = `GH₵ ${total.toFixed(2)}`;
    resultInterest.textContent = `GH₵ ${interest.toFixed(2)}`;
  });
};

const initEligibilityCheck = () => {
  const status = document.getElementById('employmentStatus');
  const income = document.getElementById('monthlyIncome');
  const result = document.getElementById('eligibilityResult');
  const button = document.getElementById('checkEligibility');

  if (!button) return;
  button.addEventListener('click', () => {
    const incomeValue = Number(income.value) || 0;
    const statusValue = status.value;
    let text = 'We recommend a quick assessment by our team.';

    if (incomeValue >= 2000 && (statusValue === 'employed' || statusValue === 'self-employed')) {
      text = 'You are likely eligible for a loan. Please submit an inquiry.';
    } else if (incomeValue >= 1000) {
      text = 'You may be eligible for smaller loans. Speak to our officer for details.';
    } else {
      text = 'Your income level suggests a cautious loan amount. Contact us for guidance.';
    }

    result.textContent = text;
  });
};

const initBlogSearch = () => {
  const search = document.getElementById('blogSearch');
  const tags = Array.from(document.querySelectorAll('.tag-btn'));
  const cards = Array.from(document.querySelectorAll('.blog-card'));

  if (!search) return;

  const filter = (value) => {
    const query = value.trim().toLowerCase();
    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? 'grid' : 'none';
    });
  };

  search.addEventListener('input', () => filter(search.value));
  tags.forEach((tag) => {
    tag.addEventListener('click', () => {
      const label = tag.textContent.toLowerCase();
      filter(label);
    });
  });
};

const initFaqSearch = () => {
  const search = document.getElementById('faqSearch');
  const items = Array.from(document.querySelectorAll('#faqList details'));

  if (!search) return;

  search.addEventListener('input', () => {
    const value = search.value.trim().toLowerCase();
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(value) ? 'block' : 'none';
    });
  });
};

const initContactForm = () => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    createToast('Message sent. Our team will contact you soon.');
    form.reset();
  });
};

const initAuthForm = () => {
  const form = document.getElementById('authForm');
  if (!form) return;

  const setLoading = (loading) => {
    const button = form.querySelector('.auth-submit');
    if (!button) return;
    button.disabled = loading;
    button.textContent = loading ? 'Processing...' : 'Sign Up / Login';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      return createToast('Please enter email and password.');
    }

    setLoading(true);
    try {
      if (name && phone) {
        createToast('Signup flow not live in demo.');
      } else {
        createToast('Login flow not live in demo.');
      }
    } finally {
      setLoading(false);
    }
  });
};

const initApplicationWizard = () => {
  const form = document.getElementById('applicationForm');
  if (!form) return;
  const steps = Array.from(form.querySelectorAll('.form-step'));
  const progressSteps = Array.from(document.querySelectorAll('.wizard-progress .step'));
  const prevButton = document.getElementById('prevStep');
  const nextButton = document.getElementById('nextStep');
  let currentStep = 0;

  const updateSteps = () => {
    steps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
    progressSteps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
    if (prevButton) prevButton.disabled = currentStep === 0;
    if (nextButton) nextButton.textContent = currentStep === steps.length - 1 ? 'Submit' : 'Next';
  };

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep -= 1;
        updateSteps();
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep += 1;
        updateSteps();
      } else {
        createToast('Application submitted. Our team will review your details.');
        form.reset();
        currentStep = 0;
        updateSteps();
      }
    });
  }

  updateSteps();
};

const initThemeToggle = () => {
  if (!themeToggle) return;
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
};

const initPage = () => {
  initTheme();
  initThemeToggle();
  initNav();
  initShowAuth();
  initWhatsApp();
  animateCounters();
  initTestimonials();
  initHomeCalculator();
  initLoanInquiry();
  initEligibilityCheck();
  initBlogSearch();
  initFaqSearch();
  initContactForm();
  initAuthForm();
  initApplicationWizard();
};

document.addEventListener('DOMContentLoaded', initPage);
