const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch'); // Necessário para o proxy

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* ============================
   🔐 Credenciais Google
   (Mantidas as do seu código original)
============================ */

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'nilton-barber-agenda@nilton-barber-478712.iam.gserviceaccount.com';
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCrjBoE5Cf1tWZ5
zpbOv5Hf6/HXIzFLRYZh3UL/Ra7/+plbmJGq9/cWU7hPEY7d/aRqGgfQ5GBagWOz
hojr1yQDqlH9ODi//gcRSk639Tgml9T57MalT+7RE0HpN/nmysIwlYza1WVgyO9W
gqReDXWvEAOeEA5u9nXZpNRf1DjeDlylTVdVhEFGI+QH9FHbHuV0Bt8b+1FctsBQ
Q8xGUxwegRiWKt2XjNQBMm8hWmPLB9RMcsk6Ptz0oHkgJH5kL+hHCEmHL+5AdFju
KndV6Zek03yEBdOd1Zye1uOysBs1fuA1j5XbcbzZhwc5oDM5qe0sTOQBBjNhOqcC
LwD8yzrFAgMBAAECggIAJEKtNkb2xlpVYp5fJKz8GGeGO4Tt0XjWAMfv3vyce1kdF
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

/* ============================
   🖼️ PROXY PARA IMAGENS GOOGLE DRIVE (CORRIGIDO)
============================ */

app.get('/proxy-image', async (req, res) => {
    try {
        const imageId = req.query.id;
        if (!imageId) {
            return res.status(400).send('ID da imagem não fornecido.');
        }

        // 💡 CORREÇÃO: Usar 'export=download' para obter o arquivo binário direto.
        const driveUrl = `https://drive.google.com/uc?export=download&id=${imageId}`;
        const response = await fetch(driveUrl);

        if (!response.ok) {
            console.error(`Falha ao buscar imagem do Drive. Status: ${response.status}`);
            // Tenta logar a mensagem de erro do Drive, se houver
            const textResponse = await response.text();
            console.error(`Corpo da Resposta do Drive: ${textResponse.substring(0, 200)}...`);
            return res.status(500).send(`Erro ao buscar imagem: ${response.status} ${response.statusText}`);
        }
        
        // 💡 OTIMIZAÇÃO: Transmitir o stream diretamente (mais eficiente em memória)
        // Setar cabeçalhos para cache e Content-Type
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache por 1 ano
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Conecta o stream de resposta do fetch ao stream de resposta HTTP
        response.body.pipe(res);

    } catch (error) {
        console.error('❌ Erro no proxy de imagem:', error.message);
        res.status(500).send('Erro interno do servidor ao carregar a imagem.');
    }
});

/* ============================
   🗂️ IMAGENS LOCAIS (fallback)
   (Mantida a do seu código original)
============================ */

app.get('/assets/images/:imageName', (req, res) => {
    const imagePath = path.join(__dirname, 'assets', 'images', req.params.imageName);
    res.sendFile(imagePath, err => {
        if (err) res.status(404).send('Imagem não encontrada');
    });
});

/* ============================
   📅 FUNÇÃO PARA CRIAR EVENTO
   (Mantida a do seu código original)
============================ */

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

        const start = new Date(`${date}T${time}:00`);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);

        const serviceList = services.map(s => `${s.name} - €${s.price}`).join('\n');

        const event = {
            summary: `${services.map(s => s.name).join(', ')} - ${name}`,
            description:
                `Cliente: ${name}\nEmail: ${email}\nTelefone: ${phone}\n\nServiços:\n${serviceList}\n\nPreço Total: €${totalPrice}`,
            location: 'NILTON BARBER - Portimão',

            start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
            end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },

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
        console.error('❌ Erro no agendamento:', error);
        throw new Error('Falha ao criar o agendamento.');
    }
}

/* ============================
   💬 API — DISPONIBILIDADE
   (Mantida a do seu código original)
============================ */

app.get('/api/availability', async (req, res) => {
    try {
        const date = req.query.date;
        if (!date) return res.status(400).json({ success: false, error: 'Data não fornecida' });

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

        const events = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        });

        const busyTimes = (events.data.items || []).map(e => {
            if (!e.start.dateTime) return null;
            const d = new Date(e.start.dateTime);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }).filter(Boolean);

        res.json({ success: true, busyTimes });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message, busyTimes: [] });
    }
});

/* ============================
   📅 API — AGENDAMENTO
   (Mantida a do seu código original)
============================ */

app.post('/api/bookings', async (req, res) => {
    try {
        const { services, name, email, phone, date, time } = req.body;

        if (!services || !services.length || !name || !email || !phone || !date || !time)
            return res.status(400).json({ success: false, error: 'Dados incompletos' });

        const eventId = await createCalendarEvent(req.body);

        res.json({ success: true, eventId });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/* ============================
   🔧 HEALTH CHECK
   (Mantida a do seu código original)
============================ */

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

/* ============================
   🐛 DEBUG
   (Mantida a do seu código original)
============================ */

app.get('/api/debug', async (req, res) => {
    try {
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar.readonly']
        );

        await auth.authorize();

        res.json({ success: true, message: 'Autenticação OK' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/* ============================
   🌐 FRONTEND (index.html)
   (Mantida a do seu código original)
============================ */

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* ============================
   🚀 EXPORT PARA VERCEL
   (Mantida a do seu código original)
============================ */

module.exports = (req, res) => app(req, res);

/* ============================
   🔧 RODAR LOCALMENTE
   (Mantida a do seu código original)
============================ */

if (!process.env.VERCEL) {
    app.listen(PORT, () =>
        console.log(`🚀 Servidor local rodando na porta ${PORT}`)
    );
}
