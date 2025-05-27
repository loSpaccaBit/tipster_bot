// src/bot.js - Entry Point Principale
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const config = require('./utils/constants');
const logger = require('./utils/logger');

// Import handlers
const commandHandlers = require('./handlers/commandHandlers');
const callbackHandlers = require('./handlers/callbackHandlers');
const authMiddleware = require('./middleware/authMiddleware');

// Import controllers
const ChannelController = require('./controllers/channelController');

// Import services
const channelService = require('./services/channelService');

// Inizializza il bot
const bot = new Telegraf(config.botToken);

// Inizializza Supabase
const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Inizializza ChannelController con l'istanza del bot
ChannelController.initialize(bot);

// Middleware globali
bot.use(authMiddleware.saveUserMiddleware);

// Registra command handlers
commandHandlers.registerCommands(bot);

// Registra callback handlers  
callbackHandlers.registerCallbacks(bot);

// Middleware di protezione per comandi premium
bot.use(authMiddleware.protectedCommandsMiddleware);

// Gestione errori globale
bot.catch((err, ctx) => {
    logger.error('Errore nel bot:', err);
    ctx.reply('❌ Si è verificato un errore. Riprova più tardi.');
});

// Gestione del comando /start
bot.command('start', async (ctx) => {
    try {
        const user = ctx.from;
        
        // Salva o aggiorna l'utente nel database
        const { error } = await supabase
            .from('users')
            .upsert({
                telegram_id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        await ctx.reply('👋 Benvenuto! Sono il bot di verifica per il canale.');
    } catch (error) {
        console.error('Errore nel comando start:', error);
        await ctx.reply('❌ Si è verificato un errore. Riprova più tardi.');
    }
});

// Avvia il bot
bot.launch()
    .then(() => {
        console.log('🤖 Bot avviato con successo!');
    })
    .catch((error) => {
        console.error('❌ Errore nell\'avvio del bot:', error);
    });

// Gestione della chiusura
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { bot };