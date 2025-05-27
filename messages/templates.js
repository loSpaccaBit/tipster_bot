const { Markup } = require('telegraf');
const Helpers = require('../utils/helpers');

class MessageTemplates {
    // Messaggio di benvenuto (varie versioni)
    static getWelcomeMessage(firstName, type = 'new') {
        const name = Helpers.sanitizeMarkdown(firstName);
        const channelName = process.env.CHANNEL_NAME || 'il nostro canale';
        const channelId = process.env.CHANNEL_ID;

        const messages = {
            new: `
🎉 *Benvenuto ${name}!*

Per accedere a tutte le funzionalità del bot, devi prima unirti al nostro canale ufficiale.

👇 Clicca sul pulsante qui sotto per unirti:

⏳ *La verifica sarà automatica* - non appena ti iscrivi riceverai il messaggio di benvenuto!
            `,
            existing: `
🎊 *Benvenuto ${name}!*

✅ Perfetto! Sei già iscritto al nostro canale.

🎁 Hai accesso completo a tutte le funzionalità del bot:

• Usa /help per vedere tutti i comandi disponibili
• Usa /info per le informazioni sul tuo account
• Usa /status per controllare il tuo stato

Grazie per far parte della nostra community! 🚀
            `,
            verified: `
🎊 *Perfetto, ${name}!*

✅ Hai fatto accesso al canale con successo!

🎁 Ora hai accesso completo al bot. Ecco cosa puoi fare:

• Usa /help per vedere tutti i comandi disponibili
• Usa /info per le informazioni sul tuo account
• Usa /status per controllare il tuo stato

Grazie per esserti unito alla nostra community! 🚀
            `,
            auto: `
🎊 *Fantastico, ${name}!*

✅ **Verifica completata automaticamente!**

Hai fatto accesso al canale con successo e ora hai accesso completo al bot.

🎁 **Cosa puoi fare ora:**

• Usa /help per vedere tutti i comandi disponibili
• Usa /info per le informazioni sul tuo account  
• Usa /status per controllare il tuo stato
• Accedi a tutte le funzionalità premium

Benvenuto nella nostra community! 🚀
            `
        };

        const keyboards = {
            new: Markup.inlineKeyboard([
                [Markup.button.url(`📢 Unisciti a ${channelName}`, `https://t.me/${channelId.replace('@', '')}`)]
            ]),
            existing: Markup.inlineKeyboard([
                [Markup.button.callback('📋 Comandi disponibili', 'show_commands')],
                [Markup.button.callback('ℹ️ Info account', 'show_info')]
            ]),
            verified: Markup.inlineKeyboard([
                [Markup.button.callback('📋 Comandi disponibili', 'show_commands')],
                [Markup.button.callback('ℹ️ Info account', 'show_info')]
            ]),
            auto: Markup.inlineKeyboard([
                [Markup.button.callback('📋 Comandi disponibili', 'show_commands')],
                [Markup.button.callback('ℹ️ Info account', 'show_info')]
            ])
        };

        return {
            message: messages[type] || messages.new,
            keyboard: keyboards[type] || keyboards.new
        };
    }

    // Messaggio per utente non iscritto
    static getNotMemberMessage(context = 'default') {
        const channelName = process.env.CHANNEL_NAME || 'il nostro canale';
        const channelId = process.env.CHANNEL_ID;

        const messages = {
            verify: `❌ *Non sei iscritto al canale.*\n\n⏳ **Verifica automatica attivata** - riceverai un messaggio non appena ti iscrivi!`,
            callback: `
❌ *Non sei ancora nel canale!*

Per procedere devi prima unirti al nostro canale ufficiale.

⏳ **Verifica automatica attivata** - riceverai un messaggio non appena ti iscrivi!
            `
        };

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url(`📢 Unisciti a ${channelName}`, `https://t.me/${channelId.replace('@', '')}`)]
        ]);

        return {
            message: messages[context] || messages.default,
            keyboard
        };
    }

    // Messaggio di aiuto
    static getHelpMessage() {
        const message = `
🤖 *Aiuto Bot*

Questo bot richiede che tu sia membro del nostro canale ufficiale per accedere a tutte le funzionalità.

📋 **Comandi disponibili:**
/start - Inizia l'interazione
/verify - Verifica l'iscrizione al canale
/info - Mostra le tue informazioni
/status - Controlla il tuo stato

❓ **Come funziona:**
1. Fai /start per iniziare
2. Unisciti al canale cliccando il link
3. La verifica è automatica!
4. Ricevi il messaggio di benvenuto

📞 **Supporto:** Contatta @admin se hai problemi
        `;

        return { message };
    }

    // Lista comandi
    static getCommandsMessage() {
        const message = `
📋 *Comandi Disponibili:*

/start - Inizia l'interazione con il bot
/help - Mostra questo messaggio di aiuto
/info - Mostra le tue informazioni
/status - Controlla il tuo stato di iscrizione
/verify - Verifica nuovamente l'iscrizione al canale
        `;

        return { message };
    }

    // Informazioni utente
    static getInfoMessage(user, userData) {
        const fullName = Helpers.getFullName(user);
        const username = user.username ? `@${user.username}` : 'Non impostato';
        const registeredDate = Helpers.formatDateOnly(userData?.created_at);
        const joinedDate = userData?.joined_at ? Helpers.formatDateOnly(userData.joined_at) : null;
        const channelStatus = userData?.has_joined_channel ? '✅ Sì' : '❌ No';

        const message = `
ℹ️ *Le tue informazioni:*

👤 **Nome:** ${Helpers.sanitizeMarkdown(fullName)}
🆔 **Username:** ${Helpers.sanitizeMarkdown(username)}
📅 **Registrato il:** ${registeredDate}
✅ **Canale verificato:** ${channelStatus}
${joinedDate ? `🎉 **Entrato nel canale:** ${joinedDate}` : ''}
        `;

        return { message };
    }

    // Messaggio di stato
    static getStatusMessage(userData) {
        const message = userData?.has_joined_channel
            ? `✅ *Status: Verificato*\n🎉 Hai accesso completo al bot!\n📅 Entrato il: ${Helpers.formatDateOnly(userData.joined_at)}`
            : `❌ *Status: Non verificato*\n🔄 Devi ancora unirti al canale ufficiale.`;

        return { message };
    }

    // Messaggio di errore generico
    static getErrorMessage(context = '') {
        const message = `❌ Si è verificato un errore${context ? ` in ${context}` : ''}. Riprova più tardi.`;
        return { message };
    }

    // Messaggio di accesso limitato
    static getAccessDeniedMessage() {
        const channelName = process.env.CHANNEL_NAME || 'il nostro canale';
        const channelId = process.env.CHANNEL_ID;

        const message = '🔒 *Accesso limitato*\n\nQuesto comando richiede l\'iscrizione al canale ufficiale.';

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url(`📢 Unisciti a ${channelName}`, `https://t.me/${channelId.replace('@', '')}`)],
            [Markup.button.callback('✅ Verifica iscrizione', 'verify_membership')]
        ]);

        return { message, keyboard };
    }
}

module.exports = MessageTemplates;