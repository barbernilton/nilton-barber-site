const bookingData = {
    service: '',
    price: 0,
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
});

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
            throw new Error(`Erro HTTP: ${response.status}`);
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
        // SEMPRE reativa o botão, mesmo em caso de erro
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
    for (let key in bookingData) {
        bookingData[key] = '';
    }
    bookingData.price = 0;
    
    // Reseta botões de próximo passo
    const nextBtns = document.querySelectorAll('.booking-next-btn');
    nextBtns.forEach(btn => {
        btn.disabled = true;
    });
    
    console.log('✅ Formulário reiniciado');
}

// ... (mantenha todas as outras funções como initParticles, initCursor, etc. inalteradas)

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
    
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            serviceCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            bookingData.service = card.dataset.service;
            bookingData.price = card.dataset.price;
            
            const nextBtn = document.querySelector('.step-1 .booking-next-btn');
            if (nextBtn) nextBtn.disabled = false;
        });
    });
    
    [nameInput, emailInput, phoneInput].forEach(input => {
        input.addEventListener('input', () => {
            const allFilled = nameInput.value && emailInput.value && phoneInput.value;
            const nextBtn = document.querySelector('.step-2 .booking-next-btn');
            if (nextBtn) nextBtn.disabled = !allFilled;
            
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
                if (nextBtn) nextBtn.disabled = false;
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
        confirmBtn.addEventListener('click', confirmBooking);
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
        
        if (elements.service) elements.service.textContent = bookingData.service;
        if (elements.price) elements.price.textContent = `€${bookingData.price}`;
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
    }
}

// ... (mantenha o resto do código inalterado)
