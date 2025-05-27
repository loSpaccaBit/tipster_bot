const { supabase } = require('../config/database');

class UserController {
    // Salva/aggiorna utente nel database
    static async saveUser(ctx) {
        const user = ctx.from;
        try {
            const { data, error } = await supabase
                .from('users')
                .upsert({
                    telegram_id: user.id,
                    username: user.username || null,
                    first_name: user.first_name || null,
                    last_name: user.last_name || null,
                }, {
                    onConflict: 'telegram_id'
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore nel salvare utente:', error);
            throw error;
        }
    }

    // Aggiorna lo stato di iscrizione al canale
    static async updateChannelStatus(telegramId, hasJoined) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    has_joined_channel: hasJoined,
                    joined_at: hasJoined ? new Date().toISOString() : null
                })
                .eq('telegram_id', telegramId);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore nell\'aggiornamento stato canale:', error);
            throw error;
        }
    }

    // Ottieni informazioni utente
    static async getUserInfo(telegramId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('telegram_id', telegramId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore nel recuperare informazioni utente:', error);
            throw error;
        }
    }

    // Ottieni stato iscrizione canale
    static async getChannelStatus(telegramId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('has_joined_channel, joined_at')
                .eq('telegram_id', telegramId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore nel controllare status canale:', error);
            throw error;
        }
    }
}

module.exports = UserController;