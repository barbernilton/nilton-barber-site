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

// 🔐 CHAVES DIRETAMENTE NO CÓDIGO (SUBSTITUA COM SUAS CHAVES)
const SERVICE_ACCOUNT_EMAIL = 'nilton-barber-agenda@nilton-barber1.iam.gserviceaccount.com';
const SERVICE_ACCOUNT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDMFBHLxFakxG44
IPLRKKNuNMi73boU3ovhA7kC5bceVhZfHrlTQRxF+h5dsYOoSbFdsPuszjcLZP8S
/+C4oTBjR32zxp7U4Rw8yEF3S5JNZvxdTyRCR4CBvdgv9fqEmmfpgbRCDFQ+RxUe
YmiGsUHGNmB/PMQjT+cWqQiN3JEzON8Zz716C4ceWjVe1Ilxads/BBbG9bRBpwAz
gp/ksUdJcykh33cQOeOJbYlJNl70QavrSYam691RQ/h7ysKr//MyO4OJHYBEo2ev
j1Q/npL8os958WNfq5BNgmYLn8X4cylA1ZinNWsBtVbtjIZt/xKuj7bpllTrXyng
ubav8R1JAgMBAAECgf9e0z2iZL0arcmtoExX78cM2/PXiArWaqpjghpdDYSzh65L
LyASUkcaDBH3p9lsuldOPbFeUR4d/IahilwdtymgHHNYUl/EKTbE7wsCY3Banzak
JLQ6eWBhYpgdmI+qk+OcU2tWUXBx+YlES+NR75170bARDZjw5+aRAnPSgyRidwUx
poWCil2lMJ/O6mCofYldX1h7uTe+dr499HFByvdHzC64TAU/nDGsDUXxjF/Unmor
pmhajeNn8//FUpqUaKFBQ0buigVJP+ckQ3Fj+95VJkxUPVCaX3yhvgfwQUptV61C
sjm0uVwamyib66E3e0oS+GoYHGStVS96lVV4J+kCgYEA7cCgwl6t3kQuEAdnbEv1
oJqI/GLS9lXs6JIOTO4E1y1WM9bTEgX6iqAaQZa+HyX19PRBonzSlxsUa61Kri7S
26MDmIo1L8Cs7M3guqX7qz8Y0+X2XlHtAL/82iAVB6GXkjCRE2/eWZ1jN0dcLRRC
5idpUTz14XcNuIZRrgOMcOMCgYEA273P4AOPHk6F9HYi7UhGTtX4cm0bmL0QxL2s
CTumbJH2wsh6tijDG/EzHbB/JhZa+BWi1F/HYfeaYvkoXnxuiWxmh5RP0jlJZBu9
H8a7dLB8H1bE2xFJIMJr7zHYCLU2k05jjSoGEXRhpfMwCj8oVKHZ60Y+dDfUGH8u
vVaWLOMCgYEAthwhRyCsfx6sRbzWHF7Gg0E7gk7UFrnUYIRXjdeXP5bLe6OmQxzv
PrXJxsmHUWaLUhiyGZsQ14t3hc7T8D2PZ4si2vmqKaylCDHeXDl9XztSciSoJLEO
H8/vBskiMpk091ZaGZBLuUrTz2jKkwD9CTvQ8NgH4q6FhPzlnau8LE8CgYBGXIQI
jfsw0CHygjVy1za0Ha2dLjSs9rU82iMRHcmPcDmca0dntquq8dPVSOOd1YCxeXQX
HsggJYGI+ZEkmCFo3Y4DEclxXiiS5pLrbt4tYimMe2MzZliNJdQb1lD/kM714h7c
X71rr2FpGvKiBVErsFuwC2EKI6pFYcwcknIp0wKBgQDHz34EKm9ksYlNuQYe0Iag
rQecIq9MmT9zRlywFOrrEvQ+zBSD+QhJ/kk6bIGvFjqnJx3dk7tbYc3La5iDShYD
RsCxHFf1tkAqQGnaZH10vAnUpvTBr9DjKOX9/jpg9CcxtVHNLuK1K0iOAdpsRGYq
bBkJrATX9C/PxPiSYM9GqA==
-----END PRIVATE KEY-----`;
const CALENDAR_ID = '5a2e76f0624721de6c42793d0e912fad4fc814b8cccd260cee329780715bbc1b@group.calendar.google.com'; // ou 'primary'

console.log('🔧 Iniciando servidor Nilton Barber...');
console.log('📧 Service Account:', SERVICE_ACCOUNT_EMAIL);
console.log('🔑 Private Key configurada:', !!SERVICE_ACCOUNT_PRIVATE_KEY);
console.log('📅 Calendar ID:', CALENDAR_ID);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Nilton Barber API está funcionando',
        environment: 'Production',
        timestamp: new Date().toISOString()
    });
});

// API para criar agendamentos
app.post('/api/bookings', async (req, res) => {
    console.log('📅 Recebendo agendamento:', JSON.stringify(req.body, null, 2));
    
    try {
        const { service, price, name, email, phone, date, time } = req.body;
        
        // Validação dos dados
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
        
        let errorMessage = 'Não foi possível criar o agendamento. Tente novamente.';
        
        if (error.message.includes('invalid_grant')) {
            errorMessage = 'Erro de autenticação. Verifique as credenciais do Service Account.';
        } else if (error.message.includes('quota')) {
            errorMessage = 'Limite de agendamentos atingido. Tente novamente mais tarde.';
        } else if (error.message.includes('calendar') || error.message.includes('notFound')) {
            errorMessage = 'Calendário não encontrado. Verifique o Calendar ID.';
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Erro no agendamento',
            message: errorMessage
        });
    }
});

// Função para criar evento no Google Calendar
async function createCalendarEvent(bookingData) {
    const { service, price, name, email, phone, date, time } = bookingData;
    
    try {
        console.log('🔑 Autenticando com Google Calendar API...');

        const auth = new google.auth.JWT({
            email: SERVICE_ACCOUNT_EMAIL,
            key: SERVICE_ACCOUNT_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        const calendar = google.calendar({ version: 'v3', auth });
        
        // Converte data/hora
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
            sendUpdates: 'none',
        });
        
        console.log('✅ Evento criado com sucesso:', response.data.id);
        return response.data.id;
        
    } catch (error) {
        console.error('❌ Erro ao criar evento no Calendar:', error);
        throw new Error(`Falha ao criar evento: ${error.message}`);
    }
}

// Rota para testar a configuração
app.get('/api/debug', async (req, res) => {
    try {
        console.log('🔧 Testando configuração do Google Calendar...');
        
        const auth = new google.auth.JWT({
            email: SERVICE_ACCOUNT_EMAIL,
            key: SERVICE_ACCOUNT_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        const calendar = google.calendar({ version: 'v3', auth });
        
        // Tenta listar calendários
        const calendars = await calendar.calendarList.list();
        
        res.json({
            success: true,
            message: 'Conexão com Google Calendar OK',
            serviceAccount: SERVICE_ACCOUNT_EMAIL,
            calendarId: CALENDAR_ID,
            availableCalendars: calendars.data.items.map(cal => ({
                id: cal.id,
                summary: cal.summary
            }))
        });
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na configuração',
            error: error.message
        });
    }
});

// Rota para servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Nilton Barber rodando na porta ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🐛 Debug: http://localhost:${PORT}/api/debug`);
});
