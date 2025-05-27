const UserController = require('./userController');
const ChannelController = require('./channelController');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Telegraf } = require('telegraf');

class AdminController {
    // Lista degli admin autorizzati (da configurare nel .env)
    static ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id)) : [];
    static ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    static JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    static VERIFICATION_TIMEOUT = 5 * 60 * 1000; // 5 minuti

    // Store per le verifiche in corso
    static activeVerifications = new Map();

    // Configurazione
    static bot = new Telegraf(process.env.BOT_TOKEN);

    // Verifica se l'utente è admin
    static isAdmin(userId) {
        return this.ADMIN_IDS.includes(userId);
    }

    // Ottieni lista degli admin
    static async getAdmins() {
        try {
            const admins = [];
            for (const adminId of this.ADMIN_IDS) {
                try {
                    const userInfo = await UserController.getUserInfo(adminId);
                    if (userInfo) {
                        admins.push({
                            id: adminId,
                            username: userInfo.username,
                            first_name: userInfo.first_name,
                            last_name: userInfo.last_name,
                            last_active: userInfo.last_active
                        });
                    }
                } catch (error) {
                    console.error(`Errore nel recuperare info per admin ${adminId}:`, error);
                }
            }
            return admins;
        } catch (error) {
            console.error('Errore nel recuperare la lista degli admin:', error);
            return [];
        }
    }

    // Aggiungi un nuovo admin
    static async addAdmin(userId) {
        try {
            if (!this.ADMIN_IDS.includes(userId)) {
                this.ADMIN_IDS.push(userId);
                // Aggiorna la variabile d'ambiente
                process.env.ADMIN_IDS = this.ADMIN_IDS.join(',');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Errore nell\'aggiungere admin:', error);
            return false;
        }
    }

    // Rimuovi un admin
    static async removeAdmin(userId) {
        try {
            const index = this.ADMIN_IDS.indexOf(userId);
            if (index > -1) {
                this.ADMIN_IDS.splice(index, 1);
                // Aggiorna la variabile d'ambiente
                process.env.ADMIN_IDS = this.ADMIN_IDS.join(',');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Errore nel rimuovere admin:', error);
            return false;
        }
    }

    // Verifica password admin
    static async verifyPassword(password) {
        try {
            // Verifica che la password non sia vuota
            if (!password || !this.ADMIN_PASSWORD) {
                console.error('Password mancante');
                return false;
            }

            // Confronta le password
            return password === this.ADMIN_PASSWORD;
        } catch (error) {
            console.error('Errore nella verifica della password:', error);
            return false;
        }
    }

    // Genera ID verifica
    static generateVerificationId() {
        const verificationId = crypto.randomBytes(16).toString('hex');
        this.activeVerifications.set(verificationId, {
            timestamp: Date.now(),
            verified: false
        });
        return verificationId;
    }

    // Verifica l'ID di verifica
    static async verifyAdmin(userId, verificationId) {
        const verification = this.activeVerifications.get(verificationId);
        
        if (!verification) {
            return { success: false, message: 'ID verifica non valido' };
        }

        // Controlla timeout
        if (Date.now() - verification.timestamp > this.VERIFICATION_TIMEOUT) {
            this.activeVerifications.delete(verificationId);
            return { success: false, message: 'Verifica scaduta' };
        }

        // Verifica che l'utente sia admin
        if (!this.isAdmin(userId)) {
            return { success: false, message: 'Utente non autorizzato' };
        }

        // Marca come verificato
        verification.verified = true;
        this.activeVerifications.set(verificationId, verification);

        // Genera token JWT
        const token = jwt.sign(
            { userId, role: 'admin' },
            this.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { success: true, token };
    }

    // Verifica token JWT
    static verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET);
            return this.isAdmin(decoded.userId);
        } catch (error) {
            return false;
        }
    }

    // Ottieni statistiche
    static async getStats() {
        try {
            const chat = await this.bot.telegram.getChat(process.env.ADMIN_CHAT_ID);
            const memberCount = await this.bot.telegram.getChatMemberCount(process.env.ADMIN_CHAT_ID);
            
            // TODO: Implementare il conteggio dei messaggi totali
            const totalMessages = 0;

            return {
                totalUsers: memberCount,
                activeUsers: memberCount, // TODO: Implementare il conteggio degli utenti attivi
                totalMessages
            };
        } catch (error) {
            console.error('Errore nel recupero delle statistiche:', error);
            throw error;
        }
    }

    // Ottieni utenti recenti
    static async getRecentUsers() {
        try {
            const chat = await this.bot.telegram.getChat(process.env.ADMIN_CHAT_ID);
            const members = await this.bot.telegram.getChatAdministrators(process.env.ADMIN_CHAT_ID);
            
            return members.map(member => ({
                id: member.user.id,
                username: member.user.username,
                firstName: member.user.first_name,
                lastName: member.user.last_name,
                lastActive: new Date().toISOString() // TODO: Implementare il tracking dell'ultima attività
            }));
        } catch (error) {
            console.error('Errore nel recupero degli utenti recenti:', error);
            throw error;
        }
    }

    // Invia broadcast a tutti gli utenti
    static async sendBroadcast(message) {
        try {
            const chat = await this.bot.telegram.getChat(process.env.ADMIN_CHAT_ID);
            await this.bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, message);
            return { success: true };
        } catch (error) {
            console.error('Errore nell\'invio del broadcast:', error);
            throw error;
        }
    }

    // Esporta tutti gli utenti
    static async exportUsers() {
        try {
            const users = await this.getRecentUsers();
            return users;
        } catch (error) {
            console.error('Errore nell\'esportazione degli utenti:', error);
            throw error;
        }
    }
}

module.exports = AdminController; 