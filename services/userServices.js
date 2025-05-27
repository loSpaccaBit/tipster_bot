// src/services/userService.js - Servizi per gestione utenti
const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class UserService {
    // Salva o aggiorna utente nel database
    async saveUser(telegramUser) {
        try {
            const userData = {
                telegram_id: telegramUser.id,
                username: telegramUser.username || null,
                first_name: telegramUser.first_name || null,
                last_name: telegramUser.last_name || null,
            };

            const { data, error } = await supabase
                .from('users')
                .upsert(userData, {
                    onConflict: 'telegram_id'
                })
                .select()
                .single();

            if (error) throw error;

            logger.debug('👤 Utente salvato/aggiornato:', {
                id: telegramUser.id,
                username: telegramUser.username
            });

            return data;
        } catch (error) {
            logger.error('❌ Errore nel salvare utente:', error);
            throw error;
        }
    }

    // Ottieni utente per telegram_id
    async getUserByTelegramId(telegramId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('telegram_id', telegramId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            return data;
        } catch (error) {
            logger.error('❌ Errore nel recuperare utente:', error);
            throw error;
        }
    }

    // Aggiorna stato iscrizione canale
    async updateChannelStatus(telegramId, hasJoined) {
        try {
            const updateData = {
                has_joined_channel: hasJoined,
                joined_at: hasJoined ? new Date().toISOString() : null
            };

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('telegram_id', telegramId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`✅ Status canale aggiornato per utente ${telegramId}: ${hasJoined}`);

            return data;
        } catch (error) {
            logger.error('❌ Errore nell\'aggiornamento status canale:', error);
            throw error;
        }
    }

    // Ottieni statistiche utenti
    async getUserStats() {
        try {
            const { data: totalUsers, error: totalError } = await supabase
                .from('users')
                .select('count')
                .single();

            const { data: verifiedUsers, error: verifiedError } = await supabase
                .from('users')
                .select('count')
                .eq('has_joined_channel', true)
                .single();

            if (totalError) throw totalError;
            if (verifiedError) throw verifiedError;

            return {
                total: totalUsers.count || 0,
                verified: verifiedUsers.count || 0,
                pending: (totalUsers.count || 0) - (verifiedUsers.count || 0)
            };
        } catch (error) {
            logger.error('❌ Errore nel recuperare statistiche:', error);
            throw error;
        }
    }

    // Ottieni lista utenti con paginazione
    async getUsers(limit = 50, offset = 0) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data || [];
        } catch (error) {
            logger.error('❌ Errore nel recuperare lista utenti:', error);
            throw error;
        }
    }
}

module.exports = new UserService();