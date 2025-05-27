// src/utils/logger.js - Sistema di Logging
const { LOG_LEVEL } = require('./constants');

// Livelli di log
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const currentLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

// Colori per i log
const colors = {
    error: '\x1b[31m', // Rosso
    warn: '\x1b[33m',  // Giallo
    info: '\x1b[36m',  // Ciano
    debug: '\x1b[35m', // Magenta
    reset: '\x1b[0m'   // Reset
};

function formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const color = colors[level] || colors.reset;
    const levelStr = level.toUpperCase().padEnd(5);

    let formatted = `${color}[${timestamp}] ${levelStr}${colors.reset} ${message}`;

    if (data) {
        formatted += `\n${JSON.stringify(data, null, 2)}`;
    }

    return formatted;
}

function log(level, message, data = null) {
    if (LOG_LEVELS[level] <= currentLevel) {
        console.log(formatMessage(level, message, data));
    }
}

const logger = {
    error: (message, data = null) => log('error', message, data),
    warn: (message, data = null) => log('warn', message, data),
    info: (message, data = null) => log('info', message, data),
    debug: (message, data = null) => log('debug', message, data)
};

module.exports = logger;