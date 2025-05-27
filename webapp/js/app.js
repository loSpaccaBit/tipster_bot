// Configurazione
const API_BASE_URL = '/api/admin';

// Inizializzazione Telegram WebApp
let tg = window.Telegram.WebApp;

// Verifica che l'app sia aperta in Telegram
function checkTelegramContext() {
    if (!tg.isVersionAtLeast('6.0')) {
        showToast('Errore', 'Questa app deve essere aperta in Telegram', 'error');
        return false;
    }
    return true;
}

// Disabilita la condivisione e altre funzionalità
function disableTelegramFeatures() {
    tg.disableClosingConfirmation();
    tg.enableClosingConfirmation();
    tg.expand();
}

// Funzioni di utilità
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
}

// Utility functions
const showLoading = () => {
    document.getElementById('loading').style.display = 'block';
};

const hideLoading = () => {
    document.getElementById('loading').style.display = 'none';
};

const showToast = (title, message, type = 'success') => {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');

    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toast.className = `toast ${type === 'error' ? 'bg-danger' : 'bg-success'} text-white`;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
};

// Funzioni per il dashboard
async function loadStats() {
    try {
        showLoading();
        console.log('📊 Richiesta statistiche...');
        const response = await fetch(`${API_BASE_URL}/stats`);
        console.log('📊 Risposta ricevuta:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Errore nella risposta:', errorText);
            throw new Error(`Errore nel recupero delle statistiche: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Dati ricevuti:', data);

        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('activeUsers').textContent = data.activeUsers;
        document.getElementById('totalMessages').textContent = data.totalMessages;
    } catch (error) {
        console.error('❌ Errore completo:', error);
        showToast('Errore', 'Impossibile caricare le statistiche', 'error');
    } finally {
        hideLoading();
    }
}

async function loadRecentUsers() {
    try {
        showLoading();
        console.log('👥 Richiesta utenti recenti...');
        const response = await fetch(`${API_BASE_URL}/recent-users`);
        console.log('👥 Risposta ricevuta:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Errore nella risposta:', errorText);
            throw new Error(`Errore nel recupero degli utenti: ${response.status} ${response.statusText}`);
        }
        
        const users = await response.json();
        console.log('👥 Dati utenti ricevuti:', users);

        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';

        if (!users || users.length === 0) {
            console.log('ℹ️ Nessun utente trovato');
            usersList.innerHTML = '<tr><td colspan="7" class="text-center">Nessun utente trovato</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username || 'Anonimo'}</td>
                <td>${user.firstName || ''}</td>
                <td>${user.lastName || ''}</td>
                <td>
                    <span class="badge ${user.hasJoinedChannel ? 'bg-success' : 'bg-warning'}">
                        ${user.hasJoinedChannel ? 'Attivo' : 'Inattivo'}
                    </span>
                </td>
                <td>${new Date(user.lastActive).toLocaleString()}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline" onclick="sendDirectMessage(${user.id})" title="Invia messaggio">
                            <i class="bi bi-chat"></i>
                        </button>
                        <button class="btn btn-outline" onclick="toggleUserStatus(${user.id})" title="Cambia stato">
                            <i class="bi bi-toggle-on"></i>
                        </button>
                        <button class="btn btn-outline text-danger" onclick="deleteUser(${user.id})" title="Elimina">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            usersList.appendChild(row);
        });
    } catch (error) {
        console.error('❌ Errore completo:', error);
        showToast('Errore', 'Impossibile caricare gli utenti', 'error');
    } finally {
        hideLoading();
    }
}

async function sendBroadcast(message, type = 'all', parseMode = false) {
    try {
        showLoading();
        console.log('📢 Invio broadcast...');
        const response = await fetch(`${API_BASE_URL}/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message,
                type,
                parseMode
            })
        });
        console.log('📢 Risposta ricevuta:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Errore nella risposta:', errorText);
            throw new Error(`Errore nell'invio del broadcast: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📢 Risultato broadcast:', result);
        
        // Aggiungi il broadcast alla cronologia
        addToBroadcastHistory(message, result.stats);
        
        showToast('Successo', `Broadcast inviato a ${result.stats.success} utenti`);
    } catch (error) {
        console.error('❌ Errore completo:', error);
        showToast('Errore', 'Impossibile inviare il broadcast', 'error');
    } finally {
        hideLoading();
    }
}

async function sendDirectMessage(userId) {
    const message = prompt('Inserisci il messaggio da inviare:');
    if (!message) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                userId,
                message
            })
        });

        if (!response.ok) {
            throw new Error('Errore nell\'invio del messaggio');
        }

        showToast('Successo', 'Messaggio inviato con successo');
    } catch (error) {
        console.error('Errore:', error);
        showToast('Errore', 'Impossibile inviare il messaggio', 'error');
    } finally {
        hideLoading();
    }
}

async function toggleUserStatus(userId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/toggle-user-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error('Errore nel cambio di stato');
        }

        showToast('Successo', 'Stato utente aggiornato');
        loadRecentUsers(); // Ricarica la lista utenti
    } catch (error) {
        console.error('Errore:', error);
        showToast('Errore', 'Impossibile aggiornare lo stato', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteUser(userId) {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/delete-user`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error('Errore nell\'eliminazione dell\'utente');
        }

        showToast('Successo', 'Utente eliminato con successo');
        loadRecentUsers(); // Ricarica la lista utenti
    } catch (error) {
        console.error('Errore:', error);
        showToast('Errore', 'Impossibile eliminare l\'utente', 'error');
    } finally {
        hideLoading();
    }
}

async function exportUsers() {
    try {
        showLoading();
        console.log('📥 Richiesta esportazione utenti...');
        const response = await fetch(`${API_BASE_URL}/export-users`);
        console.log('📥 Risposta ricevuta:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Errore nella risposta:', errorText);
            throw new Error(`Errore nell'esportazione degli utenti: ${response.status} ${response.statusText}`);
        }
        
        const users = await response.json();
        console.log('📥 Dati utenti ricevuti:', users);
        
        // Converti i dati in CSV
        const headers = ['ID', 'Username', 'Nome', 'Cognome', 'Stato', 'Data Join', 'Data Creazione'];
        const csvContent = [
            headers.join(','),
            ...users.map(user => [
                user.id,
                user.username,
                user.firstName,
                user.lastName,
                user.hasJoinedChannel ? 'Attivo' : 'Inattivo',
                user.joinedAt,
                user.createdAt
            ].join(','))
        ].join('\n');

        // Crea e scarica il file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showToast('Successo', 'Esportazione completata');
    } catch (error) {
        console.error('❌ Errore completo:', error);
        showToast('Errore', 'Impossibile esportare gli utenti', 'error');
    } finally {
        hideLoading();
    }
}

function addToBroadcastHistory(message, stats) {
    const history = document.getElementById('broadcastHistory');
    const item = document.createElement('div');
    item.className = 'mb-3 p-3 border-bottom';
    item.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="small text-muted">${new Date().toLocaleString()}</div>
            <div class="badge bg-success">${stats.success} inviati</div>
        </div>
        <div class="mt-2">${message}</div>
    `;
    history.insertBefore(item, history.firstChild);
}

async function loadBotSettings() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/bot-settings`);
        if (!response.ok) throw new Error('Errore nel caricamento delle impostazioni');

        const settings = await response.json();
        document.getElementById('welcomeMessage').value = settings.welcomeMessage || '';
        document.getElementById('mainChannel').value = settings.mainChannel || '';
        document.getElementById('supportGroup').value = settings.supportGroup || '';
        document.getElementById('botToken').value = settings.botToken || '';
        document.getElementById('webhookUrl').value = settings.webhookUrl || '';
    } catch (error) {
        console.error('Errore:', error);
        showToast('Errore', 'Impossibile caricare le impostazioni', 'error');
    } finally {
        hideLoading();
    }
}

async function saveBotSettings(event) {
    event.preventDefault();
    try {
        showLoading();
        const settings = {
            welcomeMessage: document.getElementById('welcomeMessage').value,
            mainChannel: document.getElementById('mainChannel').value,
            supportGroup: document.getElementById('supportGroup').value
        };

        const response = await fetch(`${API_BASE_URL}/bot-settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (!response.ok) throw new Error('Errore nel salvataggio delle impostazioni');

        showToast('Successo', 'Impostazioni salvate con successo');
    } catch (error) {
        console.error('Errore:', error);
        showToast('Errore', 'Impossibile salvare le impostazioni', 'error');
    } finally {
        hideLoading();
    }
}

// Inizializzazione
function init() {
    // Verifica il contesto Telegram
    if (!checkTelegramContext()) {
        return;
    }

    // Disabilita le funzionalità di condivisione
    disableTelegramFeatures();

    // Event listeners per il form di broadcast
    document.getElementById('broadcastForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = document.getElementById('broadcastMessage').value;
        const type = document.querySelector('input[name="broadcastType"]:checked').id;
        const parseMode = document.getElementById('parseMode').checked;
        
        if (message.trim()) {
            await sendBroadcast(message, type, parseMode);
            document.getElementById('broadcastMessage').value = '';
        }
    });

    // Event listeners per le impostazioni
    document.getElementById('botSettingsForm').addEventListener('submit', saveBotSettings);
    document.getElementById('showToken').addEventListener('click', () => {
        const tokenInput = document.getElementById('botToken');
        tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
    });

    // Event listeners per gli utenti
    document.getElementById('refreshUsers').addEventListener('click', loadRecentUsers);
    document.getElementById('exportUsers').addEventListener('click', exportUsers);
    document.getElementById('userSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#usersList tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    // Carica i dati iniziali
    loadStats();
    loadRecentUsers();
    loadBotSettings();
}

// Inizializza l'app quando il DOM è caricato
document.addEventListener('DOMContentLoaded', init); 