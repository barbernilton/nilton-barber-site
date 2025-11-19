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
        console.error('🔍 Stack trace:', error.stack);
        
        res.status(500).json({ 
            success: false,
            error: 'Erro no agendamento',
            message: 'Não foi possível criar o agendamento. Tente novamente.',
            debug: error.message
        });
    }
});

// Função para criar evento no Google Calendar
async function createCalendarEvent(bookingData) {
    const { service, price, name, email, phone, date, time } = bookingData;
    
    try {
        console.log('🔑 Iniciando autenticação com Google Calendar API...');

        // Verifica se as chaves estão presentes
        if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
            throw new Error('Service Account email ou private key não configurados');
        }

        // Configuração da autenticação JWT
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar']
        );

        console.log('🔐 Autorizando acesso ao Google Calendar...');
        
        // CORREÇÃO PRINCIPAL: Autorizar antes de usar
        await auth.authorize();
        
        console.log('✅ Autenticação autorizada com sucesso!');

        const calendar = google.calendar({ version: 'v3', auth });
        
        // Converte data/hora
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);
        
        console.log('📅 Criando evento para:', {
            date: startDateTime.toISOString(),
            time: time,
            service: service
        });

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
        
        console.log('📝 Enviando requisição para criar evento...');
        
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
            sendUpdates: 'none',
        });
        
        console.log('✅ Evento criado com sucesso! ID:', response.data.id);
        console.log('🔗 Link do evento:', response.data.htmlLink);
        
        return response.data.id;
        
    } catch (error) {
        console.error('❌ Erro detalhado ao criar evento no Calendar:');
        console.error('📌 Mensagem:', error.message);
        console.error('📌 Código:', error.code);
        
        if (error.response) {
            console.error('📌 Status:', error.response.status);
            console.error('📌 Status Text:', error.response.statusText);
            console.error('📌 Data:', JSON.stringify(error.response.data, null, 2));
        }
        
        // Mensagem de ajuda específica
        if (error.message.includes('Calendar usage limits exceeded') || error.code === 403) {
            throw new Error('Limite de uso do calendário excedido. Aguarde alguns minutos e tente novamente.');
        }
        
        if (error.message.includes('Not Found') || error.code === 404) {
            throw new Error('Calendário não encontrado. Verifique se o calendário foi compartilhado com a service account.');
        }
        
        throw new Error(`Falha ao criar evento: ${error.message}`);
    }
}

// Rota de debug para testar a configuração
app.get('/api/debug', async (req, res) => {
    try {
        console.log('🔧 Testando configuração do Google Calendar...');
        
        if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Service Account não configurado',
                serviceAccount: !!SERVICE_ACCOUNT_EMAIL,
                privateKey: !!SERVICE_ACCOUNT_PRIVATE_KEY
            });
        }

        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar']
        );

        console.log('✅ Auth configurada, testando autenticação...');
        
        // Autorizar antes de usar
        await auth.authorize();
        
        const calendar = google.calendar({ version: 'v3', auth });
        
        // Testa listando calendários disponíveis
        console.log('📋 Listando calendários disponíveis...');
        const calendars = await calendar.calendarList.list();
        
        console.log('✅ Autenticação bem-sucedida! Calendários encontrados:', calendars.data.items.length);

        res.json({
            success: true,
            message: 'Conexão com Google Calendar OK',
            serviceAccount: SERVICE_ACCOUNT_EMAIL,
            calendarId: CALENDAR_ID,
            availableCalendars: calendars.data.items.map(cal => ({
                id: cal.id,
                summary: cal.summary,
                accessRole: cal.accessRole
            }))
        });
        
    } catch (error) {
        console.error('❌ Erro no teste de configuração:', error);
        
        let errorDetails = {
            message: error.message,
            code: error.code
        };
        
        if (error.response) {
            errorDetails.status = error.response.status;
            errorDetails.data = error.response.data;
        }
        
        res.status(500).json({
            success: false,
            message: 'Erro na configuração do Google Calendar',
            error: errorDetails,
            help: 'Verifique se o calendário foi compartilhado com: ' + SERVICE_ACCOUNT_EMAIL
        });
    }
});

// Rota de teste rápido
app.get('/api/test-event', async (req, res) => {
    try {
        console.log('🧪 Testando criação de evento...');
        
        const auth = new google.auth.JWT(
            SERVICE_ACCOUNT_EMAIL,
            null,
            SERVICE_ACCOUNT_PRIVATE_KEY,
            ['https://www.googleapis.com/auth/calendar']
        );

        // Autorizar antes de usar
        await auth.authorize();

        const calendar = google.calendar({ version: 'v3', auth });
        
        const startDateTime = new Date();
        startDateTime.setHours(startDateTime.getHours() + 1);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);

        const event = {
            summary: 'TESTE - Nilton Barber',
            description: 'Evento de teste do sistema de agendamento',
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'Europe/Lisbon',
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'Europe/Lisbon',
            },
        };

        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
            sendUpdates: 'none',
        });

        console.log('✅ Evento de teste criado:', response.data.id);

        // Deleta o evento de teste
        await calendar.events.delete({
            calendarId: CALENDAR_ID,
            eventId: response.data.id
        });

        console.log('🗑️ Evento de teste deletado');

        res.json({
            success: true,
            message: 'Teste de evento realizado com sucesso',
            eventId: response.data.id
        });
        
    } catch (error) {
        console.error('❌ Erro no teste de evento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no teste de evento',
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
    console.log(`🧪 Teste evento: http://localhost:${PORT}/api/test-event`);
    console.log(`\n⚠️  IMPORTANTE: Certifique-se de compartilhar o calendário ${CALENDAR_ID} com ${SERVICE_ACCOUNT_EMAIL}`);
});
