const UserController = require('./userController');
const { getWelcomeMessage } = require('../messages/templates');

class ChannelController {
    // Store per tenere traccia delle verifiche attive
    static activeVerifications = new Map();
    static bot = null;

    // Inizializza il controller con l'istanza del bot
    static initialize(botInstance) {
        this.bot = botInstance;
    }

    // Verifica se l'utente è nel canale
    static async checkChannelMembership(userId) {
        try {
            if (!this.bot) {
                throw new Error('Bot instance not initialized');
            }
            const member = await this.bot.telegram.getChatMember(process.env.CHANNEL_ID, userId);
            // Stati validi: 'member', 'administrator', 'creator'
            return ['member', 'administrator', 'creator'].includes(member.status);
        } catch (error) {
            console.error('Errore nella verifica del canale:', error);
            return false;
        }
    }

    // Avvia la verifica automatica
    static async startAutoVerification(userId) {
        // Se c'è già una verifica attiva per questo utente, ferma quella precedente
        if (this.activeVerifications.has(userId)) {
            clearInterval(this.activeVerifications.get(userId));
        }

        console.log(`🔄 Avviata verifica automatica per utente ${userId}`);

        // Controlla ogni 10 secondi se l'utente si è iscritto
        const verificationInterval = setInterval(async () => {
            try {
                const isMember = await this.checkChannelMembership(userId);

                if (isMember) {
                    console.log(`✅ Utente ${userId} ha fatto accesso al canale`);

                    // Ferma la verifica
                    clearInterval(verificationInterval);
                    this.activeVerifications.delete(userId);

                    // Aggiorna il database
                    await UserController.updateChannelStatus(userId, true);

                    // Invia messaggio di benvenuto
                    await this.sendWelcomeMessage(userId);
                }
            } catch (error) {
                console.error(`Errore nella verifica automatica per utente ${userId}:`, error);
            }
        }, 10000); // Controlla ogni 10 secondi

        // Salva l'interval per poterlo cancellare
        this.activeVerifications.set(userId, verificationInterval);

        // Ferma la verifica dopo 10 minuti per evitare loop infiniti
        setTimeout(() => {
            if (this.activeVerifications.has(userId)) {
                clearInterval(this.activeVerifications.get(userId));
                this.activeVerifications.delete(userId);
                console.log(`⏰ Timeout verifica automatica per utente ${userId}`);
            }
        }, 600000); // 10 minuti
    }

    // Invia il messaggio di benvenuto automatico
    static async sendWelcomeMessage(userId) {
        try {
            if (!this.bot) {
                throw new Error('Bot instance not initialized');
            }
            // Ottieni informazioni sull'utente
            const userData = await UserController.getUserInfo(userId);
            const firstName = userData?.first_name || 'Utente';

            const { message, keyboard } = getWelcomeMessage(firstName, 'auto');

            await this.bot.telegram.sendMessage(userId, message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
            });

            console.log(`📧 Messaggio di benvenuto inviato a utente ${userId}`);

        } catch (error) {
            console.error('Errore nell\'invio del messaggio di benvenuto:', error);
        }
    }

    // Ferma la verifica automatica per un utente
    static stopAutoVerification(userId) {
        if (this.activeVerifications.has(userId)) {
            clearInterval(this.activeVerifications.get(userId));
            this.activeVerifications.delete(userId);
            console.log(`🛑 Fermata verifica automatica per utente ${userId}`);
        }
    }

    // Pulisci tutte le verifiche attive (per shutdown)
    static cleanupAllVerifications() {
        this.activeVerifications.forEach((interval, userId) => {
            clearInterval(interval);
            console.log(`🧹 Fermata verifica per utente ${userId}`);
        });
        this.activeVerifications.clear();
    }

    // Verifica manuale dell'iscrizione
    static async verifyMembership(userId) {
        const isMember = await this.checkChannelMembership(userId);

        if (isMember) {
            // Ferma eventuale verifica automatica
            this.stopAutoVerification(userId);
            // Aggiorna il database
            await UserController.updateChannelStatus(userId, true);
        }

        return isMember;
    }
}

module.exports = ChannelController;