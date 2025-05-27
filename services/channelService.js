// src/services/channelService.js - Servizi per verifica canale
const {
    CHANNEL_ID,
    VALID_MEMBER_STATUSES,
    VERIFICATION_INTERVAL,
    VERIFICATION_TIMEOUT
} = require('../utils/constants');
const logger = require('../utils/logger');
const userService = require('./userServices');
const messageService = require('./messageService');

class ChannelService {
    constructor() {
        // Store per tenere traccia delle verifiche attive
        this.activeVerifications = new Map();
    }

    // Verifica se l'utente è membro del canale
    async checkChannelMembership(bot, userId) {
        try {
            const member = await bot.telegram.getChatMember(CHANNEL_ID, userId);
            const isMember = VALID_MEMBER_STATUSES.includes(member.status);

            logger.debug(`🔍 Verifica membership utente ${userId}: ${isMember ? 'SI' : 'NO'}`, {
                status: member.status,
                userId
            });

            return isMember;
        } catch (error) {
            logger.error(`❌ Errore nella verifica del canale per utente ${userId}:`, error.message);
            return false;
        }
    }

    // Avvia verifica automatica per un utente
    async startAutoVerification(bot, userId) {
        // Se c'è già una verifica attiva per questo utente, ferma quella precedente
        if (this.activeVerifications.has(userId)) {
            clearInterval(this.activeVerifications.get(userId));
        }

        logger.info(`🔄 Avviata verifica automatica per utente ${userId}`);

        // Controlla immediatamente
        const isAlreadyMember = await this.checkChannelMembership(bot, userId);
        if (isAlreadyMember) {
            await this.handleSuccessfulVerification(bot, userId);
            return;
        }

        // Avvia controllo periodico
        const verificationInterval = setInterval(async () => {
            try {
                const isMember = await this.checkChannelMembership(bot, userId);

                if (isMember) {
                    logger.info(`✅ Utente ${userId} ha fatto accesso al canale`);
                    await this.handleSuccessfulVerification(bot, userId);
                }
            } catch (error) {
                logger.error(`❌ Errore nella verifica automatica per utente ${userId}:`, error);
            }
        }, VERIFICATION_INTERVAL);

        // Salva l'interval per poterlo cancellare
        this.activeVerifications.set(userId, verificationInterval);

        // Ferma la verifica dopo il timeout per evitare loop infiniti
        setTimeout(() => {
            if (this.activeVerifications.has(userId)) {
                clearInterval(this.activeVerifications.get(userId));
                this.activeVerifications.delete(userId);
                logger.info(`⏰ Timeout verifica automatica per utente ${userId}`);
            }
        }, VERIFICATION_TIMEOUT);
    }

    // Gestisce il successo della verifica
    async handleSuccessfulVerification(bot, userId) {
        try {
            // Ferma la verifica
            if (this.activeVerifications.has(userId)) {
                clearInterval(this.activeVerifications.get(userId));
                this.activeVerifications.delete(userId);
            }

            // Aggiorna il database
            await userService.updateChannelStatus(userId, true);

            // Invia messaggio di benvenuto
            await messageService.sendWelcomeMessage(bot, userId);

            logger.info(`🎉 Verifica completata per utente ${userId}`);
        } catch (error) {
            logger.error(`❌ Errore nella gestione verifica per utente ${userId}:`, error);
        }
    }

    // Ferma verifica per un utente specifico
    stopVerification(userId) {
        if (this.activeVerifications.has(userId)) {
            clearInterval(this.activeVerifications.get(userId));
            this.activeVerifications.delete(userId);
            logger.info(`🛑 Fermata verifica per utente ${userId}`);
            return true;
        }
        return false;
    }

    // Ottieni stato verifiche attive
    getActiveVerifications() {
        return {
            count: this.activeVerifications.size,
            userIds: Array.from(this.activeVerifications.keys())
        };
    }

    // Pulizia di tutte le verifiche attive
    cleanup() {
        logger.info(`🧹 Pulizia ${this.activeVerifications.size} verifiche attive...`);

        this.activeVerifications.forEach((interval, userId) => {
            clearInterval(interval);
            logger.debug(`🧹 Fermata verifica per utente ${userId}`);
        });

        this.activeVerifications.clear();
        logger.info('✅ Pulizia completata');
    }

    // Verifica manuale immediata
    async performManualVerification(bot, userId) {
        try {
            const isMember = await this.checkChannelMembership(bot, userId);

            if (isMember) {
                // Ferma eventuale verifica automatica
                this.stopVerification(userId);

                // Aggiorna database
                await userService.updateChannelStatus(userId, true);

                return { success: true, message: '✅ Verificato! Sei correttamente iscritto al canale.' };
            } else {
                // Avvia verifica automatica
                await this.startAutoVerification(bot, userId);

                return {
                    success: false,
                    message: '❌ Non sei iscritto al canale.\n\n⏳ **Verifica automatica attivata** - riceverai un messaggio non appena ti iscrivi!'
                };
            }
        } catch (error) {
            logger.error(`❌ Errore nella verifica manuale per utente ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = new ChannelService();