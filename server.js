const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

// Permitir CORS desde localhost o cualquier origen
app.use(cors({
    origin: ['http://localhost'], // o '*' para permitir todos los orígenes
    methods: ['GET','POST','OPTIONS'],
    allowedHeaders: ['Content-Type','x-api-key-authorization','x-client-id']
}));

app.use(bodyParser.json());

// Variables de entorno
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_KEY = process.env.API_KEY || 'a8B3dE4F9gH2JkL5mN';
const CLIENT_ID = process.env.CLIENT_ID || 'user1';

// Middleware de autorización
app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key-authorization'];
    const clientId = req.headers['x-client-id'];
    if (apiKey !== API_KEY || clientId !== CLIENT_ID) {
        return res.status(401).send('No autorizado');
    }
    next();
});

// Endpoint para enviar mensaje a Telegram
app.post('/send-message', async (req, res) => {
    const { mensaje, teclado } = req.body;

    try {
        const reply_markup = teclado ? JSON.stringify({ inline_keyboard: teclado }) : undefined;

        const response = await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: TELEGRAM_CHAT_ID,
                text: mensaje,
                reply_markup
            }
        );

        res.send(response.data.result.text);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).send(error.response?.data || 'Error al enviar mensaje');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
