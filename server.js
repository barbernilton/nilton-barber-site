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

// Configuração do Service Account
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const CALENDAR_ID = process.env.CALENDAR_ID || 'primary';

console.log('🔧 Iniciando servidor Nilton Barber...');
console.log('📧 Service Account:', SERVICE_ACCOUNT_EMAIL ? 'Configurado' : 'Não configurado');

// Health check
app.get('/api/health', (req, res) => {
    const hasEnvVars = !!(SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_PRIVATE_KEY);
    
    res.json({ 
        status: hasEnvVars ? 'OK' : 'CONFIGURING',
        message: hasEnvVars 
            ? 'Nilton Barber API está funcionando' 
            : 'Aguardando configuração das Environment Variables',
        environment: 'Production',
        timestamp: new Date().toISOString()
    });
});

// API para criar agendamentos
app.post('/api/bookings', async (req, res) => {
    console.log('📅 Recebendo agendamento:', req.body);
    
    // Verifica se as variáveis de ambiente estão configuradas
    if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
        console.error('❌ Variáveis de ambiente não configuradas');
        return res.status(503).json({ 
            success: false,
            error: 'Sistema em configuração',
            message: 'Serviço de agendamento temporariamente indisponível. Por favor, entre em contato diretamente conosco.' 
        });
    }
    
    try {
        const { service, price, name, email, phone, date, time } = req.body;
        
        // Validação robusta dos dados
        if (!service || !name || !email || !phone || !date || !time) {
            console.error('❌ Dados incompletos:', { service, name, email, phone, date, time });
            return res.status(400).json({ 
                success: false,
                error: 'Dados incompletos',
                message: 'Todos os campos são obrigatórios. Por favor, preencha todos os dados.' 
            });
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido',
                message: 'Por favor, insira um email válido.'
            });
        }

        // Validação de data
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                error: 'Data inválida',
                message: 'Não é possível agendar para datas passadas.'
            });
        }
        
        console.log('✅ Dados validados, criando evento no calendário...');
        
        // Cria evento no Google Calendar
        const eventId = await createCalendarEvent({
            service,
            price,
            name,
            email,
            phone,
            date,
            time
        });
        
        console.log('✅ Evento criado com ID:', eventId);
        
        res.json({ 
            success: true,
            eventId,
            message: 'Agendamento criado com sucesso! Você receberá uma confirmação por email.' 
        });
        
    } catch (error) {
        console.error('❌ Erro no agendamento:', error);
        
        // Mensagem de erro mais específica
        let errorMessage = 'Não foi possível criar o agendamento. Tente novamente.';
        
        if (error.message.includes('invalid_grant')) {
            errorMessage = 'Erro de autenticação com o calendário. Entre em contato com o administrador.';
        } else if (error.message.includes('quota')) {
            errorMessage = 'Limite de agendamentos atingido. Tente novamente mais tarde.';
        } else if (error.message.includes('calendar')) {
            errorMessage = 'Erro ao acessar o calendário. Entre em contato conosco.';
        } else if (error.message.includes('notFound')) {
            errorMessage = 'Calendário não encontrado. Verifique as configurações.';
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor',
            message: errorMessage
        });
    }
});

// Função melhorada para criar evento no Google Calendar
async function createCalendarEvent(bookingData) {
    const { service, price, name, email, phone, date, time } = bookingData;
    
    try {
        console.log('🔑 Autenticando com Google Calendar API...');
        
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar']
        );
        
        const calendar = google.calendar({ version: 'v3', auth });
        
        // Converte data/hora para formato ISO
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);
        
        // Verifica se a data é válida
        if (isNaN(startDateTime.getTime())) {
            throw new Error('Data/hora inválida');
        }
        
        const event = {
            summary: `NILTON BARBER - ${service}`,
            location: 'NILTON BARBER, Lisboa, Portugal',
            description: `
Agendamento: ${service}
Valor: €${price}
Cliente: ${name}
Email: ${email}
Telefone: ${phone}

Agendado via Site Nilton Barber
            `.trim(),
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'Europe/Lisbon',
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'Europe/Lisbon',
            },
            attendees: [
                { email: email, displayName: name }
            ],
            reminders: {
                useDefault: true,
            },
        };
        
        console.log('📝 Criando evento no calendário...');
        
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
            sendUpdates: 'none',
        });
        
        console.log('✅ Evento criado com sucesso:', response.data.id);
        return response.data.id;
        
    } catch (error) {
        console.error('❌ Erro ao criar evento no Calendar:', error);
        
        // Log mais detalhado para debugging
        if (error.response) {
            console.error('Detalhes do erro:', {
                status: error.response.status,
                data: error.response.data
            });
        }
        
        throw new Error(`Falha ao criar evento no calendário: ${error.message}`);
    }
}

// Rota para servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling global
app.use((error, req, res, next) => {
    console.error('💥 Erro global:', error);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Algo deu errado. Tente novamente.'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Nilton Barber rodando na porta ${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
