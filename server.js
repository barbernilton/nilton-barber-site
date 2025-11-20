const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch'); // Adicione esta linha

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 🔐 Credenciais do Google Calendar
const SERVICE_ACCOUNT_EMAIL = 'nilton-barber-agenda@nilton-barber-478712.iam.gserviceaccount.com';
const SERVICE_ACCOUNT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCrjBoE5Cf1tWZ5
zpbOv5Hf6/HXIzFLRYZh3UL/Ra7/+plbmJGq9/cWU7hPEY7d/aRqGgfQ5GBagWOz
hojr1yQDqlH9ODi//gcRSk639Tgml9T57MalT+7RE0HpN/nmysIwlYza1WVgyO9W
gqReDXWvEAOeEA5u9nXZpNRf1DjeDlylTVdVhEFGI+QH9FHbHuV0Bt8b+1FctsBQ
Q8xGUxwegRiWKt2XjNQBMm8hWmPLB9RMcsk6Ptz0oHkgJH5kL+hHCEmHL+5AdFju
KndV6Zek03yEBdOd1Zye1uOysBs1fuA1j5XbcbzZhwc5oDM5qe0sTOQBBjNhOqcC
LwD8yzrFAgMBAAECggEAJEKtNkb2xlpVYp5fJKz8G+GO4Tt0XjWAMfv3vyce1kdF
dsXBVqrqzMqd/QKYWQaV5AKED+zSDBdo+GfR1c4INAkiovxpDHYYztgO2xYHjCrQ
TxK0K3nBoGpqZm5ZUaYelW/rEc+FCgf3BSmArku4iiw/o3+/2UcZwoszg90DNzZn
1XFWSWNHlPQayPTRjUjRVg8EtPWnaJS09BAoI4OrgndbKoscoU80NySGXs3aHiro
9FTUHvrJuQ2JUQsTyf9L6zKxHq48djCB9hAo89QEK3pFHPeyagJIHxe0nDqwBVxi
O0YL2mRTxP2NZLCeRJjYxx6Mv7CheMq34IcWbpUQYQKBgQDVoVCU/8An0mktf00H
FNedbHbTCOcohxs7C5F4dKTFGzjDOgpuzu1qKvkMXRwHISliwQGHiH8usETG3XMq
iblYAC9OTFF+Km0JWbub9VWa0XKZ+8M+zIWtT/TgiI60mrti0e5/gvY/jAgPmIoF
9nvtcE2itgP++4gUwk7TSO49JQKBgQDNkhrzixf8V3S72H/YoDGCdOTAFuW/zGqI
qxaM6P4YSfUeqlC+59H16y91By8AeH1XoGTCpbS++wdvJgu/xDYnHa0xCX4mO1TH
/Xi6ybBSfYCrQQJOHkYIHFj/TH94E5ogAtIgYHjAXZ5W4o6GRupH78psRMTpmI5L
33Aib5MlIQKBgQC4mkU//CDYSIKKxk6Rp/kKGAg2JKNb6iQlycFTDbi0eul6ClWp
mzadX7UGcg8eOhHBPHdN3y3H8pn8HrC+OXToDoDScDCbjZ3bTqdIBaCLwCH/3gbB
5Yo+UbGRtW9bsbnrku09UrXoA+GTWIUs0eoVK85qpE6fsEvPZHkpKwRz4QKBgE2r
CwXDIr/TZyZlyP/Wnn4Uniy5Ofq6R/H0+iMpEH+qybLZVIKcYaaRQi/sE+UQoQLP
deJY6y5Q9+EVtdCxWGh0/O+PD5twRTr+WHPyKe0wv8F0YWOUao877qAejfaXKV84
0Z0r9dNwS5e2J3UyK+gcABXh8af0XKbr95j7INQhAoGBANJ7fXOvhfZgkh6OjE5u
iSrBitV2un33XqFslLrpKUAGImN1KS84QSX+0pqCR/7H0VHvKG99mik2NWqdQA1s
vsWZELN8fPG1JLczFqvqCD6gxuat8vbaJMQo2qgMGX2779Of6TWj+dGNSSWAj7V0
6CyxPL+k9tvstisBfQWWtanp
-----END PRIVATE KEY-----`;
const CALENDAR_ID = 'u8887532977@gmail.com';
const TIME_ZONE = 'Europe/Lisbon';

// ===================================
// NOVAS ROTAS PARA IMAGENS
// ===================================

// Rota proxy para imagens do Google Drive
app.get('/proxy-image', async (req, res) => {
    try {
        const imageId = req.query.id;
        if (!imageId) {
            return res.status(400).send('ID da imagem não fornecido');
        }

        const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar imagem: ${response.status}`);
        }

        const buffer = await response.buffer();
        
        // Define headers para cache e tipo de conteúdo
        res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('Access-Control-Allow-Origin', '*');
        res.send(buffer);

    } catch (error) {
        console.error('❌ Erro no proxy de imagem:', error);
        res.status(500).send('Erro ao carregar imagem');
    }
});

// Rota para servir imagens locais (fallback)
app.get('/assets/images/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, 'assets', 'images', imageName);
    
    res.sendFile(imagePath, (err) => {
        if (err) {
            console.log(`❌ Imagem não encontrada: ${imageName}`);
            res.status(404).send('Imagem não encontrada');
        }
    });
});

// ===================================
// ROTAS EXISTENTES DA API
// ===================================

async function createCalendarEvent(bookingData) {
    try {
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar']
        );
        
        await auth.authorize();
        
        const calendar = google.calendar({ version: 'v3', auth });

        const { services, totalPrice, name, email, phone, date, time } = bookingData;

        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);

        const servicesList = services.map(s => `${s.name} - €${s.price}`).join('\n');
        const description = `Cliente: ${name}\nEmail: ${email}\nTelefone: ${phone}\n\nServiços:\n${servicesList}\n\nPreço Total: €${totalPrice}`;

        const event = {
            summary: `${services.map(s => s.name).join(', ')} - ${name}`,
            description: description,
            location: 'NILTON BARBER - Portimão',
            
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: TIME_ZONE,
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: TIME_ZONE,
            },
            
            colorId: '4', 
            reminders: {
                useDefault: false,
                reminders: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
            sendUpdates: 'none',
        });

        return response.data.id;

    } catch (error) {
        console.error('❌ Erro no agendamento: Falha ao criar evento:', error.message);
        
        if (error.code === 403) {
             throw new Error('Falha de permissão no calendário. Confirme que a Service Account tem acesso de escrita.');
        } else if (error.message.includes('Calendar usage limits exceeded')) {
            throw new Error('Limite de uso do calendário excedido. Aguarde alguns minutos e tente novamente.');
        }
        
        throw new Error('Falha desconhecida ao criar o agendamento.');
    }
}

// Rota para verificar disponibilidade
app.get('/api/availability', async (req, res) => {
    console.log('🔍 Verificando disponibilidade para:', req.query.date);
    
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ 
                success: false,
                error: 'Data não fornecida' 
            });
        }
        
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar.readonly']
        );
        
        await auth.authorize();
        const calendar = google.calendar({ version: 'v3', auth });
        
        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);
        
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        });
        
        const events = response.data.items || [];
        const busyTimes = events.map(event => {
            if (event.start.dateTime) {
                const startTime = new Date(event.start.dateTime);
                const hours = String(startTime.getHours()).padStart(2, '0');
                const minutes = String(startTime.getMinutes()).padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            return null;
        }).filter(Boolean);
        
        console.log('✅ Horários ocupados:', busyTimes);
        
        res.json({ 
            success: true,
            busyTimes 
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar disponibilidade:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao verificar disponibilidade',
            busyTimes: []
        });
    }
});

// Rota de Agendamento
app.post('/api/bookings', async (req, res) => {
    console.log('📅 Recebendo agendamento:', JSON.stringify(req.body, null, 2));
    
    try {
        const { services, totalPrice, name, email, phone, date, time } = req.body;
        
        if (!services || services.length === 0 || !name || !email || !phone || !date || !time) {
            console.error('❌ Dados incompletos:', { services, name, email, phone, date, time });
            return res.status(400).json({ 
                success: false,
                error: 'Dados incompletos',
                message: 'Todos os campos são obrigatórios. Por favor, preencha todos os dados.' 
            });
        }

        console.log('✅ Dados validados, criando evento no calendário...');
        
        const eventId = await createCalendarEvent({
            services,
            totalPrice,
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
        console.error('❌ Erro no agendamento:', error.message);
        
        res.status(500).json({ 
            success: false,
            error: 'Erro no agendamento',
            message: error.message || 'Não foi possível criar o agendamento. Tente novamente.',
            debug: error.message
        });
    }
});

// Rota de Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Rota de Debug
app.get('/api/debug', async (req, res) => {
    console.log('🐛 Executando teste de autenticação...');
    try {
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar.readonly']
        );

        await auth.authorize();
        
        res.json({ 
            success: true, 
            message: 'Autenticação da Service Account bem-sucedida! As chaves estão corretas.' 
        });
    } catch (error) {
        console.error('❌ Erro no debug:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Falha na autenticação da Service Account.',
            error: error.message 
        });
    }
});

// Rota para servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor localmente
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor Nilton Barber rodando na porta ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🐛 Debug: http://localhost:${PORT}/api/debug`);
        console.log(`🖼️  Proxy de imagens: http://localhost:${PORT}/proxy-image?id=SEU_ID`);
        console.log(`\n⚠️ IMPORTANTE: Certifique-se de compartilhar o calendário ${CALENDAR_ID} com ${SERVICE_ACCOUNT_EMAIL}`);
    });
}

module.exports = app;
