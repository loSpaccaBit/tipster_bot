// src/services/messageService.js - Servizi per gestione messaggi
const { Markup } = require('telegraf');
const { CHANNEL_NAME, CHANNEL_ID } = require('../utils/constants');
const logger = require('../utils/logger');
const userService = require('./userServices');
const messageTemplates = require('../messages/templates');

class MessageService {
    // Invia messaggio di benvenuto dopo verifica canale
    async sendWelcomeMessage(bot, userId) {
        try {
            // Ottieni informazioni sull'utente
            const userData = await userService.getUserByTelegramId(userId);
            const firstName = userData?.first_name || 'Utente';

            const welcomeMessage = messageTemplates.getWelcomeAfterVerification(firstName);

            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('📋 Comandi disponibili', 'show_commands')],
                [Markup.button.callback('ℹ️ Info account', 'show_info')]
            ]);

            await bot.telegram.sendMessage(userId, welcomeMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
            });

            logger.info(`📧 Messaggio di benvenuto inviato a utente ${userId}`);

        } catch (error) {
            logger.error(`❌ Errore nell'invio del messaggio di benvenuto a ${userId}:`, error);
            throw error;
        }
    }

    // Invia messaggio iniziale per utenti non verificati
    async sendInitialMessage(ctx) {
        const welcomeMessage = messageTemplates.getInitialWelcome(ctx.from.first_name);

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url(`📢 Unisciti a ${CHANNEL_NAME}`, this.getChannelUrl())]
        ]);

        return ctx.replyWithMarkdown(welcomeMessage, keyboard);
    }

    // Invia messaggio per utenti già verificati
    async sendAlreadyVerifiedMessage(ctx) {
        const welcomeMessage = messageTemplates.getAlreadyVerified(ctx.from.first_name);

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📋 Comandi disponibili', 'show_commands')],
            [Markup.button.callback('ℹ️ Info account', 'show_info')]
        ]);

        return ctx.replyWithMarkdown(welcomeMessage, keyboard);
    }

    // Invia messaggio di help
    async sendHelpMessage(ctx) {
        const helpMessage = messageTemplates.getHelpMessage();
        return ctx.replyWithMarkdown(helpMessage);
    }

    // Invia informazioni utente
    async sendUserInfo(ctx) {
        try {
            const userData = await userService.getUserByTelegramId(ctx.from.id);

            if (!userData) {
                return ctx.reply('❌ Utente non trovato nel database.');
            }

            const infoMessage = messageTemplates.getUserInfo(ctx.from, userData);
            return ctx.replyWithMarkdown(infoMessage);
        } catch (error) {
            logger.error('❌ Errore nel recuperare info utente:', error);
            return ctx.reply('❌ Errore nel recuperare le informazioni.');
        }
    }

    // Invia status utente
    async sendUserStatus(ctx) {
        try {
            const userData = await userService.getUserByTelegramId(ctx.from.id);

            if (!userData) {
                return ctx.reply('❌ Utente non trovato.');
            }

            const statusMessage = messageTemplates.getUserStatus(userData);
            return ctx.replyWithMarkdown(statusMessage);
        } catch (error) {
            logger.error('❌ Errore nel controllare status:', error);
            return ctx.reply('❌ Errore nel controllare lo status.');
        }
    }

    // Invia lista comandi
    async sendCommandsList(ctx) {
        const commandsMessage = messageTemplates.getCommandsList();
        return ctx.replyWithMarkdown(commandsMessage);
    }

    // Invia messaggio per utenti non autorizzati
    async sendUnauthorizedMessage(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url(`📢 Unisciti a ${CHANNEL_NAME}`, this.getChannelUrl())],
            [Markup.button.callback('✅ Verifica iscrizione', 'verify_membership')]
        ]);

        const message = messageTemplates.getUnauthorizedMessage();
        return ctx.replyWithMarkdown(message, keyboard);
    }

    // Utility per ottenere URL del canale
    getChannelUrl() {
        return `https://t.me/${CHANNEL_ID.replace('@', '')}`;
    }

    // Invia messaggio di verifica in corso
    async sendVerificationStartedMessage(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url(`📢 Unisciti a ${CHANNEL_NAME}`, this.getChannelUrl())]
        ]);

        const message = messageTemplates.getVerificationStarted();
        return ctx.replyWithMarkdown(message, keyboard);
    }

    // Aggiorna messaggio dopo verifica fallita
    async updateVerificationFailedMessage(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url(`📢 Unisciti a ${CHANNEL_NAME}`, this.getChannelUrl())]
        ]);

        const message = messageTemplates.getVerificationFailed();

        return ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
        });
    }

    // Aggiorna messaggio dopo verifica riuscita
    async updateVerificationSuccessMessage(ctx) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📋 Comandi disponibili', 'show_commands')],
            [Markup.button.callback('ℹ️ Info account', 'show_info')]
        ]);

        const message = messageTemplates.getVerificationSuccess(ctx.from.first_name);

        return ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
        });
    }
}

module.exports = new MessageService();