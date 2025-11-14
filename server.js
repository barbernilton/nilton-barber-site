const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configuração simplificada - usando API Key para teste
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CALENDAR_ID = process.env.CALENDAR_ID || 'primary';

console.log('🔧 Iniciando servidor Nilton Barber...');

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Nilton Barber API está funcionando',
        timestamp: new Date().toISOString()
    });
});

// API para criar agendamentos
app.post('/api/bookings', async (req, res) => {
    console.log('📅 Recebendo agendamento:', req.body);
    
    try {
        const { service, price, name, email, phone, date, time } = req.body;
        
        // Validação dos dados
        if (!service || !name || !email || !phone || !date || !time) {
            return res.status(400).json({ 
                success: false,
                error: 'Dados incompletos',
                message: 'Todos os campos são obrigatórios' 
            });
        }
        
        // Simula criação de evento (substitua por sua lógica real)
        const eventId = await simulateCalendarEvent({
            service,
            price,
            name,
            email,
            phone,
            date,
            time
        });
        
        console.log('✅ Agendamento simulado com ID:', eventId);
        
        // Envia email de confirmação (opcional)
        await sendConfirmationEmail({
            name,
            email,
            service,
            price,
            date,
            time
        });
        
        res.json({ 
            success: true,
            eventId,
            message: 'Agendamento criado com sucesso! Você receberá um email de confirmação.' 
        });
        
    } catch (error) {
        console.error('❌ Erro no agendamento:', error);
        
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor',
            message: 'Não foi possível criar o agendamento. Tente novamente.' 
        });
    }
});

// Função simulada para criar evento
async function simulateCalendarEvent(bookingData) {
    const { service, name, email, date, time } = bookingData;
    
    console.log('📝 Simulando criação de evento:', bookingData);
    
    // Simula um delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Gera um ID único para o evento
    const eventId = 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log('✅ Evento simulado criado:', eventId);
    
    return eventId;
}

// Função para enviar email de confirmação (simulada)
async function sendConfirmationEmail(bookingData) {
    const { name, email, service, price, date, time } = bookingData;
    
    console.log('📧 Enviando email de confirmação para:', email);
    console.log('📋 Detalhes do agendamento:');
    console.log('   👤 Nome:', name);
    console.log('   ✂️ Serviço:', service);
    console.log('   💰 Preço: €' + price);
    console.log('   📅 Data:', date);
    console.log('   ⏰ Hora:', time);
    
    // Em produção, você pode integrar com:
    // - SendGrid
    // - AWS SES
    // - Nodemailer
    // - Outro serviço de email
    
    return true;
}

// Rota para servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Nilton Barber rodando na porta ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
});
