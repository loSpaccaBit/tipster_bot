require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Verifica che il file .env esista
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ File .env non trovato in:', envPath);
    process.exit(1);
}

// Verifica le variabili d'ambiente richieste
const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'BOT_TOKEN'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variabili d\'ambiente mancanti:', missingVars.join(', '));
    console.error('Assicurati di avere queste variabili nel file .env:');
    console.error(`
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Telegram Bot Configuration
BOT_TOKEN=your-bot-token-here

# Server Configuration
PORT=3000
    `);
    process.exit(1);
}

// Verifica i valori delle variabili
console.log('🔍 Verifica variabili d\'ambiente:');
console.log('✅ SUPABASE_URL:', process.env.SUPABASE_URL ? 'Presente' : 'Mancante');
console.log('✅ SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Presente' : 'Mancante');
console.log('✅ BOT_TOKEN:', process.env.BOT_TOKEN ? 'Presente' : 'Mancante');
console.log('✅ PORT:', process.env.PORT || '3000 (default)');

console.log('\n✅ Tutte le variabili d\'ambiente sono configurate correttamente!'); 