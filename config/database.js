// src/config/database.js - Configurazione Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Verifica che le variabili d'ambiente siano presenti
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('❌ Variabili d\'ambiente Supabase mancanti. Assicurati di avere SUPABASE_URL e SUPABASE_SERVICE_KEY nel file .env');
}

// Inizializza il client Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Test connessione database
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error) throw error;

        logger.info('✅ Connessione database stabilita');
        return true;
    } catch (error) {
        logger.error('❌ Errore connessione database:', error.message);
        return false;
    }
}

// Esegui test connessione all'import
testConnection();

module.exports = {
    supabase,
    testConnection
};