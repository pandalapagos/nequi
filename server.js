const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

/* -------------------------------
   🔑 Variables de configuración
-------------------------------- */
const TELEGRAM_BOT_TOKEN = '7964659026:AAF-4LsmmIPO-PlhKSrv2mgK6gtvFHrG2Mc';
const TELEGRAM_CHAT_ID = '7877749452';

const API_KEY = 'a8B3dE4F9gH2JkL5mN';
const CLIENT_ID = 'user1';

/* -------------------------------
   🌍 Middleware CORS
-------------------------------- */
app.use(cors({
  origin: '*', // ⚠️ Cambiar a 'http://localhost' o dominio específico para más seguridad
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key-authorization', 'x-client-id']
}));

// Responder preflight requests (CORS OPTIONS)
app.options('*', (req, res) => {
  res.sendStatus(200);
});

/* -------------------------------
   🔒 Middleware de autorización
-------------------------------- */
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key-authorization'];
  const clientId = req.headers['x-client-id'];

  if (apiKey !== API_KEY || clientId !== CLIENT_ID) {
    return res.status(401).send('No autorizado');
  }

  next();
});

/* -------------------------------
   📩 Endpoint para enviar mensajes
-------------------------------- */
app.post('/send-message', async (req, res) => {
  const { mensaje, teclado } = req.body;

  console.log("Mensaje recibido:", mensaje);
  console.log("Teclado recibido:", teclado);

  try {
    const reply_markup = teclado
      ? JSON.stringify({ inline_keyboard: teclado })
      : undefined;

    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: mensaje,
        reply_markup
      }
    );

    console.log("Respuesta de Telegram:", response.data);

    res.send(response.data.result?.text || 'Mensaje enviado');
  } catch (error) {
    console.error("Error Telegram:", error.response?.data || error.message);
    res.status(500).send(error.response?.data || 'Error al enviar mensaje');
  }
});

/* -------------------------------
   🚀 Iniciar servidor
-------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
