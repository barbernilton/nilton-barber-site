const bookingData = {
    services: [],
    totalPrice: 0,
    name: '',
    email: '',
    phone: '',
    date: '',
    time: ''
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing app');
    initParticles();
    initCursor();
    initNavigation();
    initGallery();
    initServices();
    initBooking();
    initScrollAnimations();
    initVideo();
    initSmoothScrolling();
});

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) {
        console.log('Canvas de partículas não encontrado');
        return;
    }
    
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
            const price = parseFloat(btn.dataset.price);
            
            const agendamentoSection = document.getElementById('agendamento');
            if (agendamentoSection) {
                agendamentoSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            const serviceCards = document.querySelectorAll('.service-selection-card');
            serviceCards.forEach(card => {
                if (card.dataset.service === service) {
                    card.click();
                }
            });
        });
    });
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

function initVideo() {
    const videoPlaceholder = document.querySelector('.video-placeholder');
    if (videoPlaceholder) {
        videoPlaceholder.addEventListener('click', function() {
            const video = document.getElementById('ambiente-video');
            if (video) {
                this.style.display = 'none';
                video.play().catch(error => {
                    console.error('Erro ao reproduzir vídeo:', error);
                });
            }
        });
    }
}

function initSmoothScrolling() {
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
}

// Loading spinner CSS
if (!document.querySelector('style[data-loading-spinner]')) {
    const style = document.createElement('style');
    style.setAttribute('data-loading-spinner', 'true');
    style.textContent = `
        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

async function confirmBooking() {
    console.log('Confirming booking...');
    
    const confirmBtn = document.querySelector('.booking-confirm-btn');
    if (!confirmBtn) {
        console.error('Botão de confirmação não encontrado');
        return;
    }
    
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="loading-spinner"></span>Processando...';
    
    try {
        console.log('Enviando dados:', bookingData);
        
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });
        
        console.log('Resposta recebida:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `Erro HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Resultado:', result);
        
        if (result.success) {
            showSuccessMessage(result.message);
        } else {
            throw new Error(result.message || 'Erro no agendamento');
        }
        
    } catch (error) {
        console.error('Error in booking confirmation:', error);
        showErrorMessage(error.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

function showSuccessMessage(message) {
    const bookingSummary = document.querySelector('.booking-summary');
    const bookingButtons = document.querySelector('.booking-buttons');
    const confirmationMessage = document.getElementById('confirmation-message');
    const calendarStatus = document.getElementById('calendar-status');
    
    if (bookingSummary) bookingSummary.style.display = 'none';
    if (bookingButtons) bookingButtons.style.display = 'none';
    if (confirmationMessage) confirmationMessage.classList.add('show');
    if (calendarStatus) {
        calendarStatus.textContent = message || '✓ Agendamento confirmado com sucesso!';
        calendarStatus.style.color = 'var(--secondary-gold)';
    }
    
    setTimeout(() => {
        resetBooking();
    }, 5000);
}

function showErrorMessage(message) {
    // Remove qualquer mensagem de erro existente
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Cria e mostra mensagem de erro
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 10px;
        margin: 20px 0;
        text-align: center;
        font-weight: bold;
    `;
    errorDiv.textContent = '❌ ' + message;
    
    const bookingContainer = document.querySelector('.booking-container');
    if (bookingContainer) {
        bookingContainer.insertBefore(errorDiv, bookingContainer.firstChild);
        
        // Remove a mensagem após 5 segundos
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    } else {
        alert('❌ Erro: ' + message);
    }
}

function resetBooking() {
    console.log('🔄 Reiniciando formulário de agendamento...');
    
    // Remove mensagens de erro
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    
    // Volta para o passo 1
    const steps = document.querySelectorAll('.booking-step');
    steps.forEach(step => step.classList.remove('active'));
    document.querySelector('.step-1').classList.add('active');
    
    // Reseta progresso
    document.querySelectorAll('.progress-step').forEach(step => step.classList.remove('active'));
    document.querySelector('[data-step="1"]').classList.add('active');
    
    // Limpa seleções
    document.querySelectorAll('.service-selection-card').forEach(c => c.classList.remove('selected'));
    
    // Limpa formulário
    const customerForm = document.getElementById('customer-form');
    if (customerForm) customerForm.reset();
    
    const dateInput = document.getElementById('booking-date');
    if (dateInput) dateInput.value = '';
    
    const timeSlots = document.getElementById('time-slots');
    if (timeSlots) timeSlots.innerHTML = '';
    
    // Mostra elementos novamente
    const bookingSummary = document.querySelector('.booking-summary');
    const bookingButtons = document.querySelector('.booking-buttons');
    const confirmationMessage = document.getElementById('confirmation-message');
    
    if (bookingSummary) bookingSummary.style.display = 'block';
    if (bookingButtons) bookingButtons.style.display = 'flex';
    if (confirmationMessage) confirmationMessage.classList.remove('show');
    
    // Limpa dados
    bookingData.services = [];
    bookingData.totalPrice = 0;
    bookingData.name = '';
    bookingData.email = '';
    bookingData.phone = '';
    bookingData.date = '';
    bookingData.time = '';
    
    // Reseta botões de próximo passo
    const nextBtns = document.querySelectorAll('.booking-next-btn');
    nextBtns.forEach(btn => {
        btn.disabled = true;
    });
    
    console.log('✅ Formulário reiniciado');
}

function initBooking() {
    const serviceCards = document.querySelectorAll('.service-selection-card');
    const customerForm = document.getElementById('customer-form');
    const nameInput = document.getElementById('customer-name');
    const emailInput = document.getElementById('customer-email');
    const phoneInput = document.getElementById('customer-phone');
    const dateInput = document.getElementById('booking-date');
    const timeSlotsContainer = document.getElementById('time-slots');
    
    if (!serviceCards.length || !customerForm || !nameInput || !emailInput || !phoneInput || !dateInput || !timeSlotsContainer) {
        console.error('❌ Elementos do formulário não encontrados');
        return;
    }
    
    // Seleção de serviço (múltipla)
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            const service = card.dataset.service;
            const price = parseFloat(card.dataset.price);
            
            if (card.classList.contains('selected')) {
                card.classList.remove('selected');
                bookingData.services = bookingData.services.filter(s => s.name !== service);
            } else {
                card.classList.add('selected');
                bookingData.services.push({ name: service, price: price });
            }
            
            bookingData.totalPrice = bookingData.services.reduce((sum, s) => sum + s.price, 0);
            
            console.log('✅ Serviços selecionados:', bookingData.services, 'Preço total:', bookingData.totalPrice);
            
            const nextBtn = document.querySelector('.step-1 .booking-next-btn');
            if (nextBtn) nextBtn.disabled = bookingData.services.length === 0;
        });
    });
    
    // Dados do cliente - ATUALIZA EM TEMPO REAL
    nameInput.addEventListener('input', () => {
        bookingData.name = nameInput.value;
        console.log('Nome atualizado:', bookingData.name);
        updateStep2Button();
    });
    
    emailInput.addEventListener('input', () => {
        bookingData.email = emailInput.value;
        console.log('Email atualizado:', bookingData.email);
        updateStep2Button();
    });
    
    phoneInput.addEventListener('input', () => {
        bookingData.phone = phoneInput.value;
        console.log('Telefone atualizado:', bookingData.phone);
        updateStep2Button();
    });
    
    function updateStep2Button() {
        const allFilled = bookingData.name && bookingData.email && bookingData.phone;
        const nextBtn = document.querySelector('.step-2 .booking-next-btn');
        if (nextBtn) {
            nextBtn.disabled = !allFilled;
            console.log('Botão step 2:', allFilled ? 'habilitado' : 'desabilitado');
        }
    }
    
    // Data e hora
    dateInput.addEventListener('change', () => {
        bookingData.date = dateInput.value;
        console.log('Data selecionada:', bookingData.date);
        generateTimeSlots();
        updateStep3Button();
    });
    
    const today = new Date();
    today.setDate(today.getDate() + 1);
    dateInput.min = today.toISOString().split('T')[0];
    
    async function generateTimeSlots() {
        const selectedDate = dateInput.value;
        if (!selectedDate) return;
        
        timeSlotsContainer.innerHTML = '<p style="text-align: center; color: var(--secondary-gold);">Verificando disponibilidade...</p>';
        
        const timeSlots = [
            '10:00', '11:00', '12:00',
            '15:00', '16:00', '17:00',
            '18:00', '19:00'
        ];
        
        try {
            const response = await fetch(`/api/availability?date=${selectedDate}`);
            const data = await response.json();
            const busyTimes = data.busyTimes || [];
            
            timeSlotsContainer.innerHTML = '';
            
            timeSlots.forEach(time => {
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                slot.textContent = time;
                slot.dataset.time = time;
                
                const isBusy = busyTimes.includes(time);
                
                if (isBusy) {
                    slot.classList.add('busy');
                    slot.setAttribute('disabled', 'true');
                    slot.style.opacity = '0.4';
                    slot.style.cursor = 'not-allowed';
                    slot.style.backgroundColor = 'rgba(100, 100, 100, 0.5)';
                } else {
                    slot.addEventListener('click', () => {
                        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                        slot.classList.add('selected');
                        
                        bookingData.time = time;
                        console.log('Horário selecionado:', bookingData.time);
                        updateStep3Button();
                    });
                }
                
                timeSlotsContainer.appendChild(slot);
            });
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            timeSlotsContainer.innerHTML = '';
            
            timeSlots.forEach(time => {
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                slot.textContent = time;
                slot.dataset.time = time;
                
                slot.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    slot.classList.add('selected');
                    
                    bookingData.time = time;
                    console.log('Horário selecionado:', bookingData.time);
                    updateStep3Button();
                });
                
                timeSlotsContainer.appendChild(slot);
            });
        }
    }
    
    function updateStep3Button() {
        const allFilled = bookingData.date && bookingData.time;
        const nextBtn = document.querySelector('.step-3 .booking-next-btn');
        if (nextBtn) {
            nextBtn.disabled = !allFilled;
            console.log('Botão step 3:', allFilled ? 'habilitado' : 'desabilitado');
        }
    }
    
    // Navegação entre steps
    const nextBtns = document.querySelectorAll('.booking-next-btn');
    const backBtns = document.querySelectorAll('.booking-back-btn');
    const confirmBtn = document.querySelector('.booking-confirm-btn');
    
    nextBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const currentStep = index + 1;
            const nextStep = currentStep + 1;
            
            const currentStepEl = document.querySelector(`.step-${currentStep}`);
            const nextStepEl = document.querySelector(`.step-${nextStep}`);
            const currentProgress = document.querySelector(`[data-step="${currentStep}"]`);
            const nextProgress = document.querySelector(`[data-step="${nextStep}"]`);
            
            if (currentStepEl && nextStepEl && currentProgress && nextProgress) {
                currentStepEl.classList.remove('active');
                nextStepEl.classList.add('active');
                
                currentProgress.classList.remove('active');
                nextProgress.classList.add('active');
                
                if (nextStep === 4) {
                    updateSummary();
                }
            }
        });
    });
    
    backBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const currentStep = index + 2;
            const prevStep = currentStep - 1;
            
            const currentStepEl = document.querySelector(`.step-${currentStep}`);
            const prevStepEl = document.querySelector(`.step-${prevStep}`);
            const currentProgress = document.querySelector(`[data-step="${currentStep}"]`);
            const prevProgress = document.querySelector(`[data-step="${prevStep}"]`);
            
            if (currentStepEl && prevStepEl && currentProgress && prevProgress) {
                currentStepEl.classList.remove('active');
                prevStepEl.classList.add('active');
                
                currentProgress.classList.remove('active');
                prevProgress.classList.add('active');
            }
        });
    });
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            console.log('📤 Dados finais enviados:', bookingData);
            confirmBooking();
        });
    }
    
    function updateSummary() {
        const elements = {
            service: document.getElementById('summary-service'),
            price: document.getElementById('summary-price'),
            name: document.getElementById('summary-name'),
            email: document.getElementById('summary-email'),
            phone: document.getElementById('summary-phone'),
            date: document.getElementById('summary-date'),
            time: document.getElementById('summary-time')
        };
        
        if (elements.service) {
            const serviceNames = bookingData.services.map(s => s.name).join(', ');
            elements.service.textContent = serviceNames;
        }
        if (elements.price) elements.price.textContent = `€${bookingData.totalPrice}`;
        if (elements.name) elements.name.textContent = bookingData.name;
        if (elements.email) elements.email.textContent = bookingData.email;
        if (elements.phone) elements.phone.textContent = bookingData.phone;
        
        if (elements.date && bookingData.date) {
            const date = new Date(bookingData.date);
            const formattedDate = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            elements.date.textContent = formattedDate;
        }
        
        if (elements.time) elements.time.textContent = bookingData.time;
        
        console.log('📋 Resumo atualizado:', bookingData);
    }
}

console.log('✅ script.js carregado com sucesso!');
