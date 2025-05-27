// src/utils/constants.js - Configurazioni e Costanti
require('dotenv').config();

// Configurazioni Bot
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'il nostro canale';

// Configurazioni Database
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Configurazioni Verifica
const VERIFICATION_INTERVAL = 10000; // 10 secondi
const VERIFICATION_TIMEOUT = 600000; // 10 minuti

// Stati membri del canale
const VALID_MEMBER_STATUSES = ['member', 'administrator', 'creator'];

// Comandi protetti (richiedono iscrizione al canale)
const PROTECTED_COMMANDS = ['/premium', '/special', '/vip'];

// Configurazioni logging
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Configurazione
const config = {
    // Supabase
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY,
    
    // Telegram
    botToken: process.env.BOT_TOKEN,
    
    // Server
    port: process.env.PORT || 3000
};

// Funzione per validare la configurazione
function validateConfig() {
    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_KEY',
        'BOT_TOKEN'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(`❌ Variabili d'ambiente mancanti: ${missingVars.join(', ')}`);
    }
}

// Valida la configurazione all'avvio
validateConfig();

module.exports = config;