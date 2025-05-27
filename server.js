const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Telegraf } = require('telegraf');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Inizializza Supabase con la service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Usa la service role key invece della anon key

console.log('🔧 Configurazione Supabase:', {
    url: supabaseUrl ? '✅ URL presente' : '❌ URL mancante',
    serviceKey: supabaseServiceKey ? '✅ Service Key presente' : '❌ Service Key mancante'
});

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Inizializza il bot
const botToken = process.env.BOT_TOKEN;
console.log('🤖 Configurazione Bot:', {
    token: botToken ? '✅ Token presente' : '❌ Token mancante'
});

const bot = new Telegraf(botToken);

console.log('🚀 Inizializzazione server...');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'webapp')));

console.log('✅ Middleware configurati');

// Middleware per il logging delle richieste
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// Route per le statistiche
app.get('/api/admin/stats', async (req, res) => {
    console.log('📊 Richiesta statistiche');
    try {
        console.log('🔍 Query per il conteggio totale degli utenti...');
        const { count: totalUsers, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .throwOnError();

        if (countError) {
            console.error('❌ Errore nel conteggio utenti:', {
                message: countError.message,
                details: countError.details,
                hint: countError.hint,
                code: countError.code
            });
            throw countError;
        }

        console.log('✅ Conteggio totale utenti:', totalUsers);

        console.log('🔍 Query per il conteggio utenti attivi...');
        const { count: activeUsers, error: activeError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('has_joined_channel', true)
            .throwOnError();

        if (activeError) {
            console.error('❌ Errore nel conteggio utenti attivi:', {
                message: activeError.message,
                details: activeError.details,
                hint: activeError.hint,
                code: activeError.code
            });
            throw activeError;
        }

        console.log('✅ Conteggio utenti attivi:', activeUsers);

        const stats = {
            totalUsers: totalUsers || 0,
            activeUsers: activeUsers || 0,
            totalMessages: 0
        };

        console.log('📊 Statistiche finali:', stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ Errore nel recuperare le statistiche:', {
            message: error.message,
            stack: error.stack,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        res.status(500).json({ 
            error: 'Errore interno del server',
            details: error.message
        });
    }
});

// Route per gli utenti recenti
app.get('/api/admin/recent-users', async (req, res) => {
    console.log('👥 Richiesta utenti recenti');
    try {
        console.log('🔍 Query per recuperare gli utenti recenti...');
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)
            .throwOnError();

        if (error) {
            console.error('❌ Errore nel recupero utenti:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        console.log('✅ Dati utenti recuperati:', {
            count: users?.length || 0,
            firstUser: users?.[0] ? 'Presente' : 'Nessun utente'
        });

        if (!users) {
            console.log('ℹ️ Nessun utente trovato');
            return res.json([]);
        }

        // Formatta i dati per la WebApp
        const formattedUsers = users.map(user => ({
            id: user.telegram_id,
            username: user.username || 'Anonimo',
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            lastActive: user.joined_at || user.created_at,
            hasJoinedChannel: user.has_joined_channel
        }));

        console.log('✅ Utenti formattati:', {
            count: formattedUsers.length,
            sample: formattedUsers[0]
        });

        res.json(formattedUsers);
    } catch (error) {
        console.error('❌ Errore nel recuperare gli utenti recenti:', {
            message: error.message,
            stack: error.stack,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        res.status(500).json({ 
            error: 'Errore interno del server',
            details: error.message
        });
    }
});

// Route per il broadcast
app.post('/api/admin/broadcast', async (req, res) => {
    console.log('📢 Tentativo di invio broadcast');
    try {
        const { message } = req.body;
        console.log('📝 Messaggio ricevuto:', message ? 'Presente' : 'Mancante');

        if (!message) {
            throw new Error('Messaggio mancante');
        }

        console.log('🔍 Query per recuperare gli utenti per il broadcast...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('telegram_id')
            .eq('has_joined_channel', true)
            .throwOnError();

        if (usersError) {
            console.error('❌ Errore nel recupero utenti per broadcast:', {
                message: usersError.message,
                details: usersError.details,
                hint: usersError.hint,
                code: usersError.code
            });
            throw usersError;
        }

        console.log('✅ Utenti trovati per il broadcast:', {
            count: users?.length || 0
        });

        if (!users || users.length === 0) {
            console.log('ℹ️ Nessun utente trovato per il broadcast');
            return res.json({ success: true, message: 'Nessun utente da notificare' });
        }

        // Invia il messaggio a tutti gli utenti
        let successCount = 0;
        let failCount = 0;

        console.log('📤 Inizio invio messaggi...');
        for (const user of users) {
            try {
                console.log(`📨 Invio messaggio a ${user.telegram_id}...`);
                await bot.telegram.sendMessage(user.telegram_id, message);
                successCount++;
                console.log(`✅ Messaggio inviato a ${user.telegram_id}`);
            } catch (error) {
                console.error(`❌ Errore nell'invio del messaggio a ${user.telegram_id}:`, {
                    message: error.message,
                    code: error.code
                });
                failCount++;
            }
        }

        console.log(`📊 Riepilogo broadcast: ${successCount} inviati, ${failCount} falliti`);
        res.json({ 
            success: true, 
            stats: {
                total: users.length,
                success: successCount,
                failed: failCount
            }
        });
    } catch (error) {
        console.error('❌ Errore nell\'invio del broadcast:', {
            message: error.message,
            stack: error.stack,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        res.status(500).json({ 
            error: 'Errore interno del server',
            details: error.message
        });
    }
});

// Route per l'esportazione utenti
app.get('/api/admin/export-users', async (req, res) => {
    console.log('📥 Richiesta esportazione utenti');
    try {
        console.log('🔍 Query per recuperare tutti gli utenti...');
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .throwOnError();

        if (error) {
            console.error('❌ Errore nel recupero utenti per esportazione:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        console.log('✅ Dati utenti recuperati:', {
            count: users?.length || 0,
            firstUser: users?.[0] ? 'Presente' : 'Nessun utente'
        });

        if (!users) {
            console.log('ℹ️ Nessun utente da esportare');
            return res.json([]);
        }

        // Formatta i dati per l'esportazione
        const formattedUsers = users.map(user => ({
            id: user.telegram_id,
            username: user.username || 'Anonimo',
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            hasJoinedChannel: user.has_joined_channel,
            joinedAt: user.joined_at,
            createdAt: user.created_at
        }));

        console.log('✅ Utenti formattati per esportazione:', {
            count: formattedUsers.length,
            sample: formattedUsers[0]
        });

        res.json(formattedUsers);
    } catch (error) {
        console.error('❌ Errore nell\'esportazione degli utenti:', {
            message: error.message,
            stack: error.stack,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        res.status(500).json({ 
            error: 'Errore interno del server',
            details: error.message
        });
    }
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`
    🚀 Server avviato con successo!
    📍 Porta: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📁 WebApp: http://localhost:${PORT}/index.html
    `);
}); 