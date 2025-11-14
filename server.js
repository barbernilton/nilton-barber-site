const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static('.'));

// Configuração do Service Account
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const CALENDAR_ID = process.env.CALENDAR_ID || 'primary';
const TARGET_EMAIL = process.env.TARGET_EMAIL || SERVICE_ACCOUNT_EMAIL;

console.log('🔧 Iniciando servidor Nilton Barber...');

// Health check - DEVE ser a primeira rota
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
        return res.status(500).json({ 
            success: false,
            error: 'Sistema em configuração',
            message: 'Serviço de agendamento temporariamente indisponível.' 
        });
    }
    
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
            message: 'Agendamento criado com sucesso no calendário!' 
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

// Função para criar evento no Google Calendar
async function createCalendarEvent(bookingData) {
    const { service, price, name, email, phone, date, time } = bookingData;
    
    try {
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar'],
            TARGET_EMAIL
        );
        
        const calendar = google.calendar({ version: 'v3', auth });
        
        // Converte data/hora para formato ISO
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);
        
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
            sendUpdates: 'all',
        });
        
        return response.data.id;
        
    } catch (error) {
        console.error('❌ Erro ao criar evento no Calendar:', error);
        throw new Error(`Falha ao criar evento: ${error.message}`);
    }
}

// Rota para servir o frontend (SEMPRE a última rota)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Nilton Barber rodando na porta ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    
    if (SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_PRIVATE_KEY) {
        console.log(`✅ Environment Variables configuradas`);
        console.log(`📅 Calendar ID: ${CALENDAR_ID}`);
    } else {
        console.log(`⚠️  Environment Variables não configuradas`);
        console.log(`💡 Configure no Vercel: SERVICE_ACCOUNT_EMAIL e SERVICE_ACCOUNT_PRIVATE_KEY`);
    }
});
