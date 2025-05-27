const { Markup } = require('telegraf');
const UserController = require('../controllers/userController');
const ChannelController = require('../controllers/channelController');
const {
    getWelcomeMessage,
    getCommandsMessage,
    getInfoMessage,
    getNotMemberMessage
} = require('../messages/templates');

class CallbackHandlers {
    // Gestione del callback per la verifica dell'iscrizione
    static async handleVerifyMembership(ctx) {
        try {
            await ctx.answerCbQuery('🔄 Verificando la tua iscrizione...');

            const userId = ctx.from.id;
            const isMember = await ChannelController.verifyMembership(userId);

            if (isMember) {
                // Utente è nel canale
                const { message, keyboard } = getWelcomeMessage(ctx.from.first_name, 'verified');

                await ctx.editMessageText(message, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard.reply_markup
                });
            } else {
                // Utente non è nel canale - avvia verifica automatica
                const { message, keyboard } = getNotMemberMessage('callback');

                await ctx.editMessageText(message, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard.reply_markup
                });

                // Avvia verifica automatica
                ChannelController.startAutoVerification(userId);
            }
        } catch (error) {
            console.error('Errore nella verifica callback:', error);
            await ctx.answerCbQuery('❌ Errore nella verifica');
        }
    }

    // Callback per mostrare i comandi
    static async handleShowCommands(ctx) {
        try {
            await ctx.answerCbQuery();
            const { message } = getCommandsMessage();
            await ctx.replyWithMarkdown(message);
        } catch (error) {
            console.error('Errore nel mostrare comandi:', error);
            await ctx.answerCbQuery('❌ Errore');
        }
    }

    // Callback per mostrare info account
    static async handleShowInfo(ctx) {
        try {
            await ctx.answerCbQuery();
            const data = await UserController.getUserInfo(ctx.from.id);
            const { message } = getInfoMessage(ctx.from, data);
            await ctx.replyWithMarkdown(message);
        } catch (error) {
            console.error('Errore nel mostrare info:', error);
            await ctx.answerCbQuery('❌ Errore nel recuperare le informazioni');
        }
    }

    // Metodo per registrare tutti i callback
    static registerCallbacks(bot) {
        bot.action('verify_membership', this.handleVerifyMembership);
        bot.action('show_commands', this.handleShowCommands);
        bot.action('show_info', this.handleShowInfo);
    }
}

module.exports = CallbackHandlers;