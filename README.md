# Tipster Bot 🤖

Un bot Telegram avanzato per la gestione di suggerimenti e statistiche, con un pannello di amministrazione web integrato.

## Caratteristiche Principali 🌟

- 🤖 Bot Telegram con comandi personalizzati
- 📊 Pannello di amministrazione web integrato
- 👥 Gestione utenti avanzata
- 📢 Sistema di broadcast messaggi
- 📈 Statistiche in tempo reale
- 🔒 Sicurezza e autenticazione
- 🌙 Tema scuro moderno
- 📱 Design responsive

## Requisiti di Sistema 🛠️

- Node.js >= 14.x
- PostgreSQL >= 12.x
- Account Telegram Bot (ottenuto tramite [@BotFather](https://t.me/BotFather))
- Account Supabase

## Installazione 📥

1. Clona il repository:
```bash
git clone https://github.com/yourusername/tipster_bot.git
cd tipster_bot
```

2. Installa le dipendenze:
```bash
npm install
```

3. Crea un file `.env` nella root del progetto con le seguenti variabili:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
BOT_TOKEN=your_telegram_bot_token
PORT=8000
```

4. Inizializza il database:
```bash
npm run init-db
```

5. Avvia il server:
```bash
npm start
```

## Configurazione del Bot 🤖

1. Crea un nuovo bot su Telegram usando [@BotFather](https://t.me/BotFather)
2. Ottieni il token del bot
3. Configura il WebApp URL nel BotFather:
   - Usa il comando `/mybots`
   - Seleziona il tuo bot
   - Vai su "Bot Settings" > "Menu Button"
   - Imposta l'URL del tuo pannello di amministrazione

## Struttura del Progetto 📁

```
tipster_bot/
├── src/
│   ├── bot/           # Logica del bot Telegram
│   ├── config/        # Configurazioni
│   ├── database/      # Query e funzioni database
│   ├── utils/         # Utility functions
│   └── webapp/        # Pannello di amministrazione web
├── .env              # Variabili d'ambiente
├── package.json      # Dipendenze e script
└── README.md         # Questo file
```

## Funzionalità del Pannello Admin 🎛️

### Gestione Utenti
- Visualizzazione lista utenti
- Ricerca utenti
- Gestione stato utenti
- Esportazione dati
- Invio messaggi diretti

### Broadcast
- Invio messaggi a tutti gli utenti
- Invio selettivo (attivi/inattivi)
- Supporto formattazione Markdown
- Cronologia broadcast

### Impostazioni
- Configurazione messaggio di benvenuto
- Gestione canali e gruppi
- Sicurezza e token
- Configurazione webhook

## Sicurezza 🔒

- Autenticazione tramite Telegram
- Protezione contro condivisione non autorizzata
- Crittografia dei dati sensibili
- Rate limiting e protezione DDoS
- Validazione input

## Sviluppo 🛠️

### Script Disponibili

```bash
npm start          # Avvia il server
npm run dev        # Avvia in modalità sviluppo
npm run init-db    # Inizializza il database
npm run lint       # Esegue il linting
npm test          # Esegue i test
```

### Best Practices

- Seguire le convenzioni di codice
- Documentare le nuove funzionalità
- Testare prima del deploy
- Mantenere aggiornate le dipendenze

## Contribuire 🤝

1. Fork il repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza 📄

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## Supporto 💬

Per supporto, contatta:
- Email: your.email@example.com
- Telegram: [@yourusername](https://t.me/yourusername)

## Ringraziamenti 🙏

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Supabase](https://supabase.io)
- [Bootstrap](https://getbootstrap.com)
- [Node.js](https://nodejs.org) 
