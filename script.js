const CLIENT_ID = '170593652956-9v8ngp0kkhhvo5bn0b7fratc9urcrhoh.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCVB8b81cLglC9mokEpQbXvcpzrGESWKXo';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let isGoogleAuthorized = false;

const bookingData = {
    service: '',
    price: 0,
    name: '',
    email: '',
    phone: '',
    date: '',
    time: ''
};

window.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initCursor();
    initNavigation();
    initGallery();
    initServices();
    initBooking();
    initScrollAnimations();
    
    gapiLoaded();
    gisLoaded();
});

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function initCursor() {
    const cursorGlow = document.querySelector('.cursor-glow');
    
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
        cursorGlow.style.opacity = '0.6';
    });
    
    document.addEventListener('mouseleave', () => {
        cursorGlow.style.opacity = '0';
    });
}

function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

function initGallery() {
    const track = document.getElementById('gallery-track');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const items = document.querySelectorAll('.gallery-item');
    
    if (!track || !items.length) return;
    
    let currentIndex = 0;
    let itemWidth = 0;
    let visibleItems = 0;
    
    function calculateDimensions() {
        const computedStyle = window.getComputedStyle(track);
        let gapValue = computedStyle.columnGap || computedStyle.gap || '30px';
        const gapParts = gapValue.trim().split(/\s+/);
        const gap = parseFloat(gapParts[0]) || 30;
        
        const cardWidth = items[0].offsetWidth;
        itemWidth = cardWidth + gap;
        const containerWidth = track.parentElement.offsetWidth;
        visibleItems = Math.floor((containerWidth + gap) / itemWidth);
        visibleItems = Math.min(items.length, Math.max(1, visibleItems));
    }
    
    function updateCarousel() {
        calculateDimensions();
        const offset = -currentIndex * itemWidth;
        track.style.transform = `translateX(${offset}px)`;
        
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= items.length - visibleItems;
        
        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentIndex >= items.length - visibleItems ? '0.5' : '1';
    }
    
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentIndex < items.length - visibleItems) {
            currentIndex++;
            updateCarousel();
        }
    });
    
    let isDragging = false;
    let startPos = 0;
    let dragItemWidth = 0;
    let dragStartIndex = 0;
    let dragDelta = 0;
    
    function startDrag(clientX) {
        calculateDimensions();
        isDragging = true;
        startPos = clientX;
        dragStartIndex = currentIndex;
        dragItemWidth = itemWidth;
        dragDelta = 0;
        track.style.cursor = 'grabbing';
        track.style.transition = 'none';
    }
    
    function moveDrag(clientX) {
        if (!isDragging) return;
        dragDelta = clientX - startPos;
        const baseTranslate = -dragStartIndex * dragItemWidth;
        let newTranslate = baseTranslate + dragDelta;
        
        const maxTranslate = 0;
        const minTranslate = -(items.length - visibleItems) * dragItemWidth;
        newTranslate = Math.max(minTranslate, Math.min(maxTranslate, newTranslate));
        
        track.style.transform = `translateX(${newTranslate}px)`;
    }
    
    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        track.style.cursor = 'grab';
        track.style.transition = 'transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)';
        
        const movedBy = Math.round(-dragDelta / dragItemWidth);
        currentIndex = Math.max(0, Math.min(dragStartIndex + movedBy, items.length - visibleItems));
        updateCarousel();
    }
    
    track.addEventListener('mousedown', (e) => {
        startDrag(e.clientX);
    });
    
    track.addEventListener('mousemove', (e) => {
        moveDrag(e.clientX);
    });
    
    track.addEventListener('mouseup', endDrag);
    track.addEventListener('mouseleave', endDrag);
    
    track.addEventListener('touchstart', (e) => {
        startDrag(e.touches[0].clientX);
    });
    
    track.addEventListener('touchmove', (e) => {
        moveDrag(e.touches[0].clientX);
    });
    
    track.addEventListener('touchend', endDrag);
    
    window.addEventListener('resize', () => {
        calculateDimensions();
        currentIndex = Math.min(currentIndex, items.length - visibleItems);
        updateCarousel();
    });
    
    calculateDimensions();
    updateCarousel();
}

function initServices() {
    const serviceBtns = document.querySelectorAll('.service-btn');
    
    serviceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const service = btn.dataset.service;
            const price = btn.dataset.price;
            
            bookingData.service = service;
            bookingData.price = price;
            
            const agendamentoSection = document.getElementById('agendamento');
            agendamentoSection.scrollIntoView({ behavior: 'smooth' });
            
            const serviceCards = document.querySelectorAll('.service-selection-card');
            serviceCards.forEach(card => {
                if (card.dataset.service === service) {
                    card.click();
                }
            });
        });
    });
}

function initBooking() {
    const serviceCards = document.querySelectorAll('.service-selection-card');
    const customerForm = document.getElementById('customer-form');
    const nameInput = document.getElementById('customer-name');
    const emailInput = document.getElementById('customer-email');
    const phoneInput = document.getElementById('customer-phone');
    const dateInput = document.getElementById('booking-date');
    const timeSlotsContainer = document.getElementById('time-slots');
    
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            serviceCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            bookingData.service = card.dataset.service;
            bookingData.price = card.dataset.price;
            
            const nextBtn = document.querySelector('.step-1 .booking-next-btn');
            nextBtn.disabled = false;
        });
    });
    
    [nameInput, emailInput, phoneInput].forEach(input => {
        input.addEventListener('input', () => {
            const allFilled = nameInput.value && emailInput.value && phoneInput.value;
            const nextBtn = document.querySelector('.step-2 .booking-next-btn');
            nextBtn.disabled = !allFilled;
            
            if (allFilled) {
                bookingData.name = nameInput.value;
                bookingData.email = emailInput.value;
                bookingData.phone = phoneInput.value;
            }
        });
    });
    
    dateInput.addEventListener('change', () => {
        generateTimeSlots();
    });
    
    const today = new Date();
    today.setDate(today.getDate() + 1);
    dateInput.min = today.toISOString().split('T')[0];
    
    function generateTimeSlots() {
        const selectedDate = dateInput.value;
        if (!selectedDate) return;
        
        bookingData.date = selectedDate;
        timeSlotsContainer.innerHTML = '';
        
        const timeSlots = [
            '09:00', '10:00', '11:00',
            '14:00', '15:00', '16:00',
            '17:00', '18:00', '19:00'
        ];
        
        timeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            slot.dataset.time = time;
            
            slot.addEventListener('click', () => {
                if (slot.classList.contains('disabled')) return;
                
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                
                bookingData.time = time;
                
                const nextBtn = document.querySelector('.step-3 .booking-next-btn');
                nextBtn.disabled = false;
            });
            
            timeSlotsContainer.appendChild(slot);
        });
    }
    
    const nextBtns = document.querySelectorAll('.booking-next-btn');
    const backBtns = document.querySelectorAll('.booking-back-btn');
    const confirmBtn = document.querySelector('.booking-confirm-btn');
    
    nextBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const currentStep = index + 1;
            const nextStep = currentStep + 1;
            
            document.querySelector(`.step-${currentStep}`).classList.remove('active');
            document.querySelector(`.step-${nextStep}`).classList.add('active');
            
            document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
            document.querySelector(`[data-step="${nextStep}"]`).classList.add('active');
            
            if (nextStep === 4) {
                updateSummary();
            }
        });
    });
    
    backBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const currentStep = index + 2;
            const prevStep = currentStep - 1;
            
            document.querySelector(`.step-${currentStep}`).classList.remove('active');
            document.querySelector(`.step-${prevStep}`).classList.add('active');
            
            document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
            document.querySelector(`[data-step="${prevStep}"]`).classList.add('active');
        });
    });
    
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processando...';
        
        const success = await createCalendarEvent();
        
        document.querySelector('.booking-summary').style.display = 'none';
        document.querySelector('.booking-buttons').style.display = 'none';
        
        const confirmationMessage = document.getElementById('confirmation-message');
        confirmationMessage.classList.add('show');
        
        const calendarStatus = document.getElementById('calendar-status');
        if (success) {
            calendarStatus.textContent = '✓ Evento adicionado ao Google Calendar!';
            calendarStatus.style.color = 'var(--secondary-gold)';
        } else {
            calendarStatus.textContent = 'Confirmação enviada por email.';
            calendarStatus.style.color = 'rgba(255, 255, 255, 0.7)';
        }
        
        setTimeout(() => {
            resetBooking();
        }, 5000);
    });
    
    function updateSummary() {
        document.getElementById('summary-service').textContent = bookingData.service;
        document.getElementById('summary-price').textContent = `€${bookingData.price}`;
        document.getElementById('summary-name').textContent = bookingData.name;
        document.getElementById('summary-email').textContent = bookingData.email;
        document.getElementById('summary-phone').textContent = bookingData.phone;
        
        const date = new Date(bookingData.date);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        document.getElementById('summary-date').textContent = formattedDate;
        document.getElementById('summary-time').textContent = bookingData.time;
    }
    
    function resetBooking() {
        document.querySelector('.step-4').classList.remove('active');
        document.querySelector('.step-1').classList.add('active');
        
        document.querySelectorAll('.progress-step').forEach(step => step.classList.remove('active'));
        document.querySelector('[data-step="1"]').classList.add('active');
        
        serviceCards.forEach(c => c.classList.remove('selected'));
        customerForm.reset();
        dateInput.value = '';
        timeSlotsContainer.innerHTML = '';
        
        document.querySelector('.booking-summary').style.display = 'block';
        document.querySelector('.booking-buttons').style.display = 'flex';
        document.getElementById('confirmation-message').classList.remove('show');
        
        for (let key in bookingData) {
            bookingData[key] = '';
        }
        bookingData.price = 0;
        
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirmar Agendamento';
    }
}

function gapiLoaded() {
    gapi.load('client', async () => {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
}

const googleAuthBtn = document.getElementById('google-auth-btn');
if (googleAuthBtn) {
    googleAuthBtn.addEventListener('click', handleAuthClick);
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Auth error:', resp);
            document.getElementById('auth-status').textContent = 'Erro na autenticação. Tente novamente.';
            return;
        }
        
        isGoogleAuthorized = true;
        document.getElementById('auth-status').textContent = '✓ Conectado ao Google Calendar';
        document.getElementById('auth-status').style.color = 'var(--secondary-gold)';
        googleAuthBtn.textContent = 'Conectado ✓';
        googleAuthBtn.style.background = 'var(--secondary-gold)';
        googleAuthBtn.style.color = 'var(--primary-black)';
        googleAuthBtn.disabled = true;
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

async function createCalendarEvent() {
    if (!isGoogleAuthorized) {
        console.log('Google Calendar not authorized');
        return false;
    }
    
    try {
        const startDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);
        
        const event = {
            'summary': `NILTON BARBER - ${bookingData.service}`,
            'location': 'NILTON BARBER, Lisboa, Portugal',
            'description': `Agendamento de ${bookingData.service} - €${bookingData.price}\nCliente: ${bookingData.name}\nTelefone: ${bookingData.phone}`,
            'start': {
                'dateTime': startDateTime.toISOString(),
                'timeZone': 'Europe/Lisbon'
            },
            'end': {
                'dateTime': endDateTime.toISOString(),
                'timeZone': 'Europe/Lisbon'
            },
            'attendees': [
                {'email': bookingData.email}
            ],
            'reminders': {
                'useDefault': false,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 30}
                ]
            }
        };

        const request = await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
        });
        
        console.log('Event created:', request.result);
        return true;
    } catch (error) {
        console.error('Error creating event:', error);
        return false;
    }
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.service-card, .gallery-item, .section-header').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

const videoPlaceholder = document.querySelector('.video-placeholder');
if (videoPlaceholder) {
    videoPlaceholder.addEventListener('click', function() {
        const video = document.getElementById('ambiente-video');
        this.style.display = 'none';
        video.play();
    });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
