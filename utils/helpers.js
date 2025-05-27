class Helpers {
    // Formatta la data in italiano
    static formatDate(dateString) {
        if (!dateString) return 'Non disponibile';
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Formatta solo la data (senza ora)
    static formatDateOnly(dateString) {
        if (!dateString) return 'Non disponibile';
        return new Date(dateString).toLocaleDateString('it-IT');
    }

    // Valida l'ID del canale
    static validateChannelId(channelId) {
        if (!channelId) {
            throw new Error('CHANNEL_ID non configurato');
        }

        // Deve iniziare con @ o essere un ID numerico
        if (!channelId.startsWith('@') && !channelId.startsWith('-')) {
            throw new Error('CHANNEL_ID deve iniziare con @ o essere un ID numerico');
        }

        return true;
    }

    // Genera link per il canale
    static getChannelLink(channelId) {
        if (channelId.startsWith('@')) {
            return `https://t.me/${channelId.replace('@', '')}`;
        }
        // Per ID numerici non possiamo generare link diretti
        return null;
    }

    // Sanifica il nome utente per il markdown
    static sanitizeMarkdown(text) {
        if (!text) return '';
        return text.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');
    }

    // Crea nome completo dell'utente
    static getFullName(user) {
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Utente';
    }

    // Verifica se un timestamp è scaduto
    static isExpired(timestamp, minutesExpiry = 10) {
        if (!timestamp) return true;
        const now = Date.now();
        const expiry = new Date(timestamp).getTime() + (minutesExpiry * 60 * 1000);
        return now > expiry;
    }

    // Debounce per limitare chiamate frequenti
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Ritardo asincrono
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Genera ID univoco semplice
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Logga con timestamp
    static log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const emoji = {
            'INFO': 'ℹ️',
            'ERROR': '❌',
            'SUCCESS': '✅',
            'WARNING': '⚠️'
        }[level] || 'ℹ️';

        console.log(`${emoji} [${timestamp}] ${message}`);
    }

    // Gestione errori con logging
    static handleError(error, context = '') {
        const errorMessage = error?.message || 'Errore sconosciuto';
        this.log(`${context}: ${errorMessage}`, 'ERROR');

        if (process.env.NODE_ENV === 'development') {
            console.error(error);
        }
    }

    // Valida variabili d'ambiente richieste
    static validateEnvironment() {
        const required = [
            'BOT_TOKEN',
            'SUPABASE_URL',
            'SUPABASE_KEY',
            'CHANNEL_ID'
        ];

        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Variabili d'ambiente mancanti: ${missing.join(', ')}`);
        }

        // Valida specificamente il channel ID
        this.validateChannelId(process.env.CHANNEL_ID);

        return true;
    }

    // Escape HTML per prevenire injection
    static escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Trunca testo lungo
    static truncate(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}

module.exports = Helpers;