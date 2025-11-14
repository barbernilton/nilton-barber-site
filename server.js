const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuração do Service Account
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const CALENDAR_ID = process.env.CALENDAR_ID || 'primary';

// Validação das variáveis de ambiente
if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
    console.error('❌ Variáveis de ambiente SERVICE_ACCOUNT_EMAIL e SERVICE_ACCOUNT_PRIVATE_KEY são obrigatórias');
    process.exit(1);
}

// Autenticação com Service Account
function getAuth() {
    try {
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar'],
            process.env.TARGET_EMAIL || SERVICE_ACCOUNT_EMAIL // Email do calendário de destino
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
        
        // Aqui você pode adicionar:
        // - Envio de email de confirmação
        // - Salvar no banco de dados
        // - Integração com WhatsApp, etc.
        
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
        endDateTime.setHours(endDateTime.getHours() + 1); // 1 hora de duração
        
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
            transparency: 'opaque', // Mostra como ocupado
            guestsCanInviteOthers: false,
            guestsCanModify: false,
            guestsCanSeeOtherGuests: false,
        };
        
        console.log('📝 Criando evento:', event);
        
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
            sendUpdates: 'all', // Envia notificações para os participantes
        });
        
        return response.data.id;
        
    } catch (error) {
        console.error('❌ Erro ao criar evento no Calendar:', error);
        throw new Error(`Falha ao criar evento: ${error.message}`);
    }
}

// Rota para verificar eventos existentes (opcional)
app.get('/api/availability/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const auth = getAuth();
        const calendar = google.calendar({ version: 'v3', auth });
        
        const startDate = new Date(`${date}T00:00:00`);
        const endDate = new Date(`${date}T23:59:59`);
        
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });
        
        const events = response.data.items || [];
        const busySlots = events.map(event => ({
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
        }));
        
        res.json({ busySlots });
        
    } catch (error) {
        console.error('❌ Erro ao buscar disponibilidade:', error);
        res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Nilton Barber API está funcionando',
        timestamp: new Date().toISOString()
    });
});

// Servir o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Nilton Barber rodando na porta ${PORT}`);
    console.log(`📅 Calendar ID: ${CALENDAR_ID}`);
    console.log(`🔐 Service Account: ${SERVICE_ACCOUNT_EMAIL}`);
});
