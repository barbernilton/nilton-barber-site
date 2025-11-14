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

// Configuração do Service Account via Environment Variables
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const CALENDAR_ID = process.env.CALENDAR_ID || 'primary';
const TARGET_EMAIL = process.env.TARGET_EMAIL || SERVICE_ACCOUNT_EMAIL;

// Validação das variáveis de ambiente
if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
    console.error('❌ Environment Variables SERVICE_ACCOUNT_EMAIL e SERVICE_ACCOUNT_PRIVATE_KEY são obrigatórias');
    console.log('💡 Configure-as no painel do Vercel: Settings → Environment Variables');
    // Não encerra o processo para permitir deploy mesmo sem variáveis
}

// Autenticação com Service Account
function getAuth() {
    try {
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar'],
            TARGET_EMAIL
        );
        
        return auth;
    } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        throw error;
    }
}

// API para criar agendamentos
app.post('/api/bookings', async (req, res) => {
    console.log('📅 Recebendo agendamento:', req.body);
    
    // Verifica se as variáveis de ambiente estão configuradas
    if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
        return res.status(500).json({ 
            error: 'Sistema em configuração',
            message: 'Serviço de agendamento temporariamente indisponível. Tente novamente em alguns minutos.' 
        });
    }
    
    try {
        const { service, price, name, email, phone, date, time } = req.body;
        
        // Validação dos dados
        if (!service || !name || !email || !phone || !date || !time) {
            return res.status(400).json({ 
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
            message: 'Agendamento criado com sucesso no calendário' 
        });
        
    } catch (error) {
        console.error('❌ Erro no agendamento:', error);
        
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Não foi possível criar o agendamento. Tente novamente.' 
        });
    }
});

// Função para criar evento no Google Calendar
async function createCalendarEvent(bookingData) {
    const { service, price, name, email, phone, date, time } = bookingData;
    
    try {
        const auth = getAuth();
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

// Rota para servir o frontend (fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Nilton Barber rodando na porta ${PORT}`);
    if (SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_PRIVATE_KEY) {
        console.log(`✅ Environment Variables configuradas`);
        console.log(`📅 Calendar ID: ${CALENDAR_ID}`);
        console.log(`🔐 Service Account: ${SERVICE_ACCOUNT_EMAIL}`);
    } else {
        console.log(`⚠️  Environment Variables não configuradas - Configure no Vercel`);
    }
});
