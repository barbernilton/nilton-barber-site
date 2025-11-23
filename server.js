const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 🔥 SERVIR ARQUIVOS ESTÁTICOS CORRETAMENTE
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    // Configurar headers corretos para cada tipo de arquivo
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }
  }
}));

// 🔐 Credenciais do Google Calendar (mantenha igual)
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

// 🔥 SUAS ROTAS DA API (mantenha iguais)
async function createCalendarEvent(bookingData) {
    // ... (mantenha todo o código igual da função createCalendarEvent)
}

// Rota para verificar disponibilidade
app.get('/api/availability', async (req, res) => {
    // ... (mantenha todo o código igual)
});

// Rota de Agendamento
app.post('/api/bookings', async (req, res) => {
    // ... (mantenha todo o código igual)
});

// Rota de Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Rota de Debug
app.get('/api/debug', async (req, res) => {
    // ... (mantenha todo o código igual)
});

// 🔥 ROTA CATCH-ALL PARA O FRONTEND - DEVE SER A ÚLTIMA ROTA
app.get('*', (req, res) => {
  // Se for uma rota de API, não servir arquivo estático
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Servir o arquivo correspondente ou index.html para SPA
  const filePath = path.join(__dirname, req.path);
  
  // Verificar se o arquivo existe
  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    res.sendFile(filePath);
  } else {
    // Para rotas do frontend (SPA), servir index.html
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Nilton Barber rodando na porta ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🐛 Debug: http://localhost:${PORT}/api/debug`);
});

// Exportar para Vercel (sem vercel.json)
module.exports = app;
