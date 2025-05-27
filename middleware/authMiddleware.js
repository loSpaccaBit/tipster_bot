const { Markup } = require('telegraf');
const ChannelController = require('../controllers/channelController');

class AuthMiddleware {
    // Middleware per verificare l'iscrizione al canale per comandi protetti
    static async requireChannelMembership(ctx, next) {
        // Lista dei comandi che richiedono l'iscrizione al canale
        const protectedCommands = ['/premium', '/special'];

        if (ctx.message && protectedCommands.some(cmd => ctx.message.text?.startsWith(cmd))) {
            const isMember = await ChannelController.checkChannelMembership(ctx.from.id);

            if (!isMember) {
                const keyboard = Markup.inlineKeyboard([
                    [Markup.button.url(
                        `📢 Unisciti a ${process.env.CHANNEL_NAME || 'il nostro canale'}`,
                        `https://t.me/${process.env.CHANNEL_ID.replace('@', '')}`
                    )],
                    [Markup.button.callback('✅ Verifica iscrizione', 'verify_membership')]
                ]);

                return ctx.replyWithMarkdown(
                    '🔒 *Accesso limitato*\n\nQuesto comando richiede l\'iscrizione al canale ufficiale.',
                    keyboard
                );
            }
        }

        return next();
    }

    // Middleware per salvare automaticamente l'utente
    static async saveUserMiddleware(ctx, next) {
        try {
            // Salva automaticamente l'utente se non è un callback query
            if (ctx.from && !ctx.callbackQuery) {
                const UserController = require('../controllers/userController');
                await UserController.saveUser(ctx);
            }
        } catch (error) {
            console.error('Errore nel salvare utente automaticamente:', error);
        }

        return next();
    }

    // Middleware per logging delle interazioni
    static async logInteractions(ctx, next) {
        const userId = ctx.from?.id;
        const username = ctx.from?.username;
        const messageType = ctx.updateType;

        let action = '';
        if (ctx.message?.text) {
            action = ctx.message.text.split(' ')[0];
        } else if (ctx.callbackQuery) {
            action = `callback: ${ctx.callbackQuery.data}`;
        }

        console.log(`📊 [${new Date().toISOString()}] User: ${userId}${username ? ` (@${username})` : ''} | Type: ${messageType} | Action: ${action}`);

        return next();
    }
}

module.exports = AuthMiddleware;