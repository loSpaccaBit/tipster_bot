const { Markup } = require('telegraf');
const UserController = require('../controllers/userController');
const ChannelController = require('../controllers/channelController');
const AdminController = require('../controllers/adminController');
const {
    getWelcomeMessage,
    getHelpMessage,
    getInfoMessage,
    getStatusMessage,
    getNotMemberMessage
} = require('../messages/templates');

class CommandHandlers {
    // Comando /start
    static async handleStart(ctx) {
        try {
            await UserController.saveUser(ctx);

            // Controlla subito se è già iscritto
            const isMember = await ChannelController.checkChannelMembership(ctx.from.id);

            if (isMember) {
                // Utente già iscritto - invia benvenuto diretto
                await UserController.updateChannelStatus(ctx.from.id, true);
                const { message, keyboard } = getWelcomeMessage(ctx.from.first_name, 'existing');
                await ctx.replyWithMarkdown(message, keyboard);
            } else {
                // Utente non iscritto - avvia verifica automatica
                const { message, keyboard } = getWelcomeMessage(ctx.from.first_name, 'new');
                await ctx.replyWithMarkdown(message, keyboard);

                // Avvia verifica automatica per questo utente
                ChannelController.startAutoVerification(ctx.from.id);
            }
        } catch (error) {
            console.error('Errore nel comando /start:', error);
            await ctx.reply('❌ Si è verificato un errore. Riprova più tardi.');
        }
    }

    // Comando /help
    static async handleHelp(ctx) {
        try {
            const { message } = getHelpMessage();
            await ctx.replyWithMarkdown(message);
        } catch (error) {
            console.error('Errore nel comando /help:', error);
            await ctx.reply('❌ Errore nel mostrare l\'aiuto.');
        }
    }

    // Comando /verify
    static async handleVerify(ctx) {
        try {
            const userId = ctx.from.id;
            const isMember = await ChannelController.verifyMembership(userId);

            if (isMember) {
                await ctx.replyWithMarkdown('✅ *Verificato!* Sei correttamente iscritto al canale.');
            } else {
                const { message, keyboard } = getNotMemberMessage('verify');
                await ctx.replyWithMarkdown(message, keyboard);

                // Avvia verifica automatica
                ChannelController.startAutoVerification(userId);
            }
        } catch (error) {
            console.error('Errore nel comando /verify:', error);
            await ctx.reply('❌ Errore nella verifica.');
        }
    }

    // Comando /status
    static async handleStatus(ctx) {
        try {
            const data = await UserController.getChannelStatus(ctx.from.id);
            const { message } = getStatusMessage(data);
            await ctx.replyWithMarkdown(message);
        } catch (error) {
            console.error('Errore nel comando /status:', error);
            await ctx.reply('❌ Errore nel controllare lo status.');
        }
    }

    // Comando /info
    static async handleInfo(ctx) {
        try {
            const data = await UserController.getUserInfo(ctx.from.id);
            const { message } = getInfoMessage(ctx.from, data);
            await ctx.replyWithMarkdown(message);
        } catch (error) {
            console.error('Errore nel comando /info:', error);
            await ctx.reply('❌ Errore nel recuperare le informazioni.');
        }
    }

    // Comando /admin
    static async handleAdmin(ctx) {
        try {
            // Verifica se l'utente è admin
            if (!AdminController.isAdmin(ctx.from.id)) {
                console.log(`Tentativo di accesso admin fallito per l'utente ${ctx.from.id}`);
                await ctx.reply('❌ Non hai i permessi per accedere al pannello admin.');
                return;
            }

            console.log(`Utente ${ctx.from.id} autorizzato come admin`);

            // Crea il pulsante per aprire la WebApp
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.webApp('🔐 Apri Pannello Admin', process.env.ADMIN_WEBAPP_URL)]
            ]);

            await ctx.reply('👨‍💼 *Pannello Admin*\n\nClicca il pulsante qui sotto per aprire il pannello di amministrazione.', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } catch (error) {
            console.error('Errore nel comando /admin:', error);
            await ctx.reply('❌ Errore nell\'accesso al pannello admin.');
        }
    }

    // Gestione comando di verifica
    static async handleVerifyCommand(ctx) {
        try {
            const command = ctx.message.text;
            const verificationId = command.split('_')[1];

            if (!verificationId) {
                return;
            }

            const result = await AdminController.verifyAdmin(ctx.from.id, verificationId);

            if (result.success) {
                await ctx.reply('✅ Verifica completata con successo! Puoi tornare alla WebApp.');
            } else {
                await ctx.reply('❌ Verifica fallita: ' + result.message);
            }
        } catch (error) {
            console.error('Errore nella verifica:', error);
            await ctx.reply('❌ Errore durante la verifica.');
        }
    }

    // Metodo per registrare tutti i comandi
    static registerCommands(bot) {
        bot.command('start', this.handleStart);
        bot.command('help', this.handleHelp);
        bot.command('verify', this.handleVerify);
        bot.command('status', this.handleStatus);
        bot.command('info', this.handleInfo);
        bot.command('admin', this.handleAdmin);
        bot.command('verify_', this.handleVerifyCommand); // Gestisce i comandi di verifica
    }
}

module.exports = CommandHandlers;