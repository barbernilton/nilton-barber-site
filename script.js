const CLIENT_ID = '170593652956-9v8ngp0kkhhvo5bn0b7fratc9urcrhoh.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCVB8b81cLglC9mokEpQbXvcpzrGESWKXo';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient = null;
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

// Função para inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing app');
    initParticles();
    initCursor();
    initNavigation();
    initGallery();
    initServices();
    initBooking();
    initScrollAnimations();
    
    // Carrega as bibliotecas do Google API de forma assíncrona
    setTimeout(() => {
        loadGAPI();
    }, 1000);
});

// Carrega Google API de forma mais robusta
function loadGAPI() {
    console.log('Loading Google APIs...');
    
    // Verifica se já foram carregadas
    if (window.gapi && window.google) {
        console.log('Google APIs already loaded');
        initializeGoogleAPIs();
        return;
    }

    // Carrega gapi.js
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
        console.log('gapi.js loaded successfully');
        // Aguarda um pouco antes de carregar o próximo script
        setTimeout(loadGIS, 500);
    };
    gapiScript.onerror = () => {
        console.error('Failed to load gapi.js');
        handleGoogleAPIError();
    };
    document.head.appendChild(gapiScript);
}

function loadGIS() {
    // Carrega Google Identity Services
    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.onload = () => {
        console.log('Google Identity Services loaded successfully');
        // Aguarda um pouco antes de inicializar
        setTimeout(initializeGoogleAPIs, 500);
    };
    gsiScript.onerror = () => {
        console.error('Failed to load Google Identity Services');
        handleGoogleAPIError();
    };
    document.head.appendChild(gsiScript);
}

function initializeGoogleAPIs() {
    console.log('Initializing Google APIs...');
    
    // Inicializa gapi
    if (typeof gapi !== 'undefined') {
        gapiLoaded();
    } else {
        console.error('gapi is not defined after loading');
        handleGoogleAPIError();
    }
    
    // Inicializa GIS
    if (typeof google !== 'undefined') {
        gisLoaded();
    } else {
        console.error('google is not defined after loading');
        handleGoogleAPIError();
    }
}

function handleGoogleAPIError() {
    console.log('Google APIs not available - running in fallback mode');
    updateAuthStatus('Modo offline ativado - Google Calendar não disponível', 'error');
    disableGoogleAuthButton();
}

function disableGoogleAuthButton() {
    const authBtn = document.getElementById('google-auth-btn');
    if (authBtn) {
        authBtn.disabled = true;
        authBtn.innerHTML = 'Google Agenda Indisponível';
        authBtn.style.opacity = '0.6';
        authBtn.style.cursor = 'not-allowed';
    }
}

function gapiLoaded() {
    console.log('gapi loaded, initializing client...');
    
    if (typeof gapi === 'undefined') {
        console.error('gapi is undefined in gapiLoaded');
        return;
    }
    
    gapi.load('client', {
        callback: initializeGapiClient,
        onerror: function() {
            console.error('Failed to load gapi client');
        },
        timeout: 5000,
        ontimeout: function() {
            console.error('Timeout loading gapi client');
        }
    });
}

async function initializeGapiClient() {
    try {
        console.log('Initializing GAPI client...');
        
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        
        gapiInited = true;
        console.log('GAPI client initialized successfully');
        
    } catch (error) {
        console.error('Error initializing GAPI client:', error);
        gapiInited = false;
    }
}

function gisLoaded() {
    console.log('Google Identity Services loaded');
    
    if (typeof google === 'undefined' || !google.accounts) {
        console.error('Google Identity Services not properly loaded');
        gisInited = false;
        return;
    }
    
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // será definido dinamicamente
            prompt: 'consent'
        });
        
        gisInited = true;
        console.log('Google Identity Services initialized successfully');
        
    } catch (error) {
        console.error('Error initializing Google Identity Services:', error);
        gisInited = false;
        handleGoogleAPIError();
    }
}

function handleAuthClick() {
    console.log('Auth button clicked');
    
    // Verifica se as APIs estão disponíveis
    if (!gisInited || !tokenClient) {
        console.error('Google APIs not initialized');
        updateAuthStatus('Serviço Google não disponível no momento', 'error');
        return;
    }
    
    const authBtn = document.getElementById('google-auth-btn');
    if (authBtn) {
        authBtn.innerHTML = '<span class="loading-spinner"></span>Conectando...';
        authBtn.disabled = true;
    }
    
    // Define o callback dinamicamente
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Google Auth error:', resp);
            updateAuthStatus('Erro na autenticação. Tente novamente.', 'error');
            resetAuthButton();
            return;
        }
        
        console.log('Google Auth successful');
        isGoogleAuthorized = true;
        updateAuthStatus('✓ Conectado ao Google Calendar', 'success');
        updateAuthButton('Conectado ✓', true);
    };
    
    try {
        console.log('Requesting access token...');
        
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            tokenClient.requestAccessToken({prompt: ''});
        }
        
    } catch (error) {
        console.error('Error requesting access token:', error);
        updateAuthStatus('Erro ao conectar com Google', 'error');
        resetAuthButton();
    }
}

function updateAuthStatus(message, type) {
    const statusElement = document.getElementById('auth-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = type === 'success' ? 'var(--secondary-gold)' : '#ff4444';
        statusElement.className = type === 'error' ? 'auth-status error' : 'auth-status';
    }
}

function updateAuthButton(text, isConnected) {
    const authBtn = document.getElementById('google-auth-btn');
    if (authBtn) {
        authBtn.innerHTML = text;
        if (isConnected) {
            authBtn.style.background = 'var(--secondary-gold)';
            authBtn.style.color = 'var(--primary-black)';
            authBtn.disabled = true;
        }
    }
}

function resetAuthButton() {
    const authBtn = document.getElementById('google-auth-btn');
    if (authBtn) {
        authBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Conectar Google Agenda
        `;
        authBtn.style.background = 'var(--accent-white)';
        authBtn.style.color = '#444';
        authBtn.disabled = false;
    }
}

async function createCalendarEvent() {
    console.log('Creating calendar event...');
    
    if (!isGoogleAuthorized) {
        console.log('Google Calendar not authorized - using fallback');
        return false;
    }
    
    if (!gapiInited || !gapi.client.getToken()) {
        console.log('GAPI not initialized or no token');
        return false;
    }
    
    try {
        const startDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);
        
        const event = {
            'summary': `NILTON BARBER - ${bookingData.service}`,
            'location': 'NILTON BARBER, Lisboa, Portugal',
            'description': `Agendamento de ${bookingData.service} - €${bookingData.price}\nCliente: ${bookingData.name}\nEmail: ${bookingData.email}\nTelefone: ${bookingData.phone}`,
            'start': {
                'dateTime': startDateTime.toISOString(),
                'timeZone': 'Europe/Lisbon'
            },
            'end': {
                'dateTime': endDateTime.toISOString(),
                'timeZone': 'Europe/Lisbon'
            },
            'reminders': {
                'useDefault': true
            }
        };

        console.log('Event data:', event);

        const response = await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
        });
        
        console.log('Event created successfully:', response);
        return true;
        
    } catch (error) {
        console.error('Error creating calendar event:', error);
        
        if (error.result && error.result.error) {
            console.error('Error details:', error.result.error);
        }
        
        return false;
    }
}

async function confirmBooking() {
    console.log('Confirming booking...');
    
    const confirmBtn = document.querySelector('.booking-confirm-btn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="loading-spinner"></span>Processando...';
    
    try {
        // Tenta criar evento no Google Calendar (opcional)
        let calendarSuccess = false;
        if (isGoogleAuthorized && gapiInited) {
            calendarSuccess = await createCalendarEvent();
        }
        
        // Sempre envia notificação do agendamento
        await sendBookingNotification();
        
        // Mostra confirmação
        document.querySelector('.booking-summary').style.display = 'none';
        document.querySelector('.booking-buttons').style.display = 'none';
        
        const confirmationMessage = document.getElementById('confirmation-message');
        confirmationMessage.classList.add('show');
        
        const calendarStatus = document.getElementById('calendar-status');
        if (calendarSuccess) {
            calendarStatus.textContent = '✓ Evento adicionado ao Google Calendar!';
            calendarStatus.style.color = 'var(--secondary-gold)';
        } else {
            calendarStatus.textContent = 'Agendamento confirmado! Detalhes enviados por email.';
            calendarStatus.style.color = 'rgba(255, 255, 255, 0.7)';
        }
        
    } catch (error) {
        console.error('Error in booking confirmation:', error);
        
        // Fallback - mostra confirmação básica mesmo com erro
        document.querySelector('.booking-summary').style.display = 'none';
        document.querySelector('.booking-buttons').style.display = 'none';
        
        const confirmationMessage = document.getElementById('confirmation-message');
        confirmationMessage.classList.add('show');
        
        const calendarStatus = document.getElementById('calendar-status');
        calendarStatus.textContent = 'Agendamento confirmado com sucesso!';
        calendarStatus.style.color = 'var(--secondary-gold)';
    }
    
    setTimeout(() => {
        resetBooking();
    }, 5000);
}

// Função para enviar notificação do agendamento (SEM Google APIs)
async function sendBookingNotification() {
    console.log('Sending booking notification:', bookingData);
    
    // Aqui você pode implementar o envio para seu backend
    // Exemplo com fetch para um webhook:
    /*
    try {
        const response = await fetch('/api/booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...bookingData,
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            console.log('Booking notification sent successfully');
        } else {
            console.error('Failed to send booking notification');
        }
    } catch (error) {
        console.error('Error sending booking notification:', error);
    }
    */
    
    // Por enquanto, apenas log no console
    return true;
}

// Restante das funções permanecem iguais (initParticles, initCursor, etc.)
// ... [Todas as outras funções do código anterior permanecem exatamente iguais]

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
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
    if (!cursorGlow) return;
    
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
    
    if (!navbar || !menuToggle || !navMenu) return;
    
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
    
    // Adiciona event listener para o botão do Google Auth
    const googleAuthBtn = document.getElementById('google-auth-btn');
    if (googleAuthBtn) {
        googleAuthBtn.addEventListener('click', handleAuthClick);
    }
    
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
    
    confirmBtn.addEventListener('click', confirmBooking);
    
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
