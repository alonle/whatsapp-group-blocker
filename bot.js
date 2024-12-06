const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Load configuration
let config = {
    targetGroups: [],
    targetUsers: [],
    saveDeletedMessages: true,
    logFile: "deleted_messages.log"
};

// Utility function for random delay
function getRandomDelay() {
    return Math.floor(Math.random() * (5000 - 1000 + 1) + 1000); // Random between 1000ms and 5000ms
}

// Promise-based delay function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Convert phone number to WhatsApp ID format
function formatPhoneNumber(phone) {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If number starts with '+', remove it
    if (phone.startsWith('+')) {
        cleaned = cleaned;
    }
    
    return `${cleaned}@c.us`;
}

// Get user-friendly phone number from WhatsApp ID
function getUserFriendlyPhone(waId) {
    if (!waId) return 'Unknown';
    // Remove the @c.us suffix
    const phone = waId.replace('@c.us', '');
    
    // Add + for international format if it's not an internal format
    return phone.length > 10 ? `+${phone}` : phone;
}

function loadConfig() {
    try {
        const configPath = path.join(__dirname, 'config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const rawConfig = JSON.parse(configData);
        
        // Format phone numbers in the config
        config = {
            ...rawConfig,
            targetUsers: rawConfig.targetUsers.map(formatPhoneNumber)
        };
        
        console.log('Configuration loaded successfully');
        console.log(`Monitoring ${config.targetGroups.length} groups and ${config.targetUsers.length} users`);
        console.log('Target Groups:', config.targetGroups);
        console.log('Target Users:', config.targetUsers);
        console.log(`Message logging is ${config.saveDeletedMessages ? 'enabled' : 'disabled'}`);
    } catch (error) {
        console.error('Error loading configuration:', error);
    }
}

async function logDeletedMessage(message, chat) {
    if (!config.saveDeletedMessages) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        groupName: chat.name,
        userPhone: getUserFriendlyPhone(message.author),
        messageId: message.id._serialized,
        message: message.body,
        hasMedia: message.hasMedia
    };

    const logPath = path.join(__dirname, config.logFile);
    const logLine = JSON.stringify(logEntry) + '\n';

    try {
        fs.appendFileSync(logPath, logLine);
        console.log('Message logged successfully');
    } catch (error) {
        console.error('Error logging message:', error);
    }
}

async function handleChatInfo(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();
    console.log('Chat Info Request:', {
        groupName: chat.name,
        user: contact.pushname,
        phone: getUserFriendlyPhone(message.author)
    });
    await message.reply(`
Chat Info:
Group Name: ${chat.name}
From: ${contact.pushname || 'Unknown'} (${getUserFriendlyPhone(message.author || 'You')})
`);
}

async function handleListBlocked(message) {
    const friendlyPhones = config.targetUsers.map(getUserFriendlyPhone);
    console.log('List Blocked Request');
    await message.reply(`
Currently Blocking:
Groups: ${config.targetGroups.join('\n')}
Users: ${friendlyPhones.join('\n')}
Logging: ${config.saveDeletedMessages ? 'Enabled' : 'Disabled'}
Log File: ${config.logFile}
`);
}

async function shouldDeleteMessage(chat, message) {
    // Log chat details first
    console.log('Chat Details:', {
        isGroup: chat.isGroup,
        isGroupByID: chat.id._serialized.endsWith('@g.us'),
        name: chat.name,
        id: chat.id._serialized,
        participants: chat.participants ? chat.participants.length : 0
    });

    // Check if it's a group chat using multiple indicators
    const isGroupChat = chat.isGroup || chat.id._serialized.endsWith('@g.us');
    if (!isGroupChat) {
        console.log('Skipping - Not a group message');
        return false;
    }

    const isTargetGroup = config.targetGroups.includes(chat.name);
    const isTargetUser = config.targetUsers.includes(message.author);
    
    console.log('Message Check:', {
        groupName: chat.name,
        author: getUserFriendlyPhone(message.author),
        isTargetGroup,
        isTargetUser,
        configGroups: config.targetGroups,
        configUsers: config.targetUsers
    });
    
    return isTargetGroup && isTargetUser;
}

async function handleMessage(message) {
    try {
        // Fetch chat first and log its details
        const chat = await message.getChat();
        console.log('Raw Chat Object Keys:', Object.keys(chat));
        
        const contact = await message.getContact();

        // Log every message for debugging
        console.log('Received Message:', {
            from: contact.pushname || 'Unknown',
            phone: getUserFriendlyPhone(message.author),
            isGroup: chat.isGroup,
            chatName: chat.name,
            chatId: chat.id._serialized,
            message: message.body,
            timestamp: new Date().toISOString()
        });

        // Handle command messages
        if (message.body === '!chatinfo') {
            await handleChatInfo(message);
            return;
        }
        if (message.body === '!listblocked') {
            await handleListBlocked(message);
            return;
        }

        // Handle message deletion
        if (await shouldDeleteMessage(chat, message)) {
            console.log(`Detected message from blocked user: ${contact.pushname || 'Unknown'} (${getUserFriendlyPhone(message.author)}) in group: ${chat.name}`);
            await logDeletedMessage(message, chat);
            
            // Random delay before deletion
            const delayMs = getRandomDelay();
            console.log(`Waiting ${delayMs}ms before deleting message...`);
            await delay(delayMs);
            
            await message.delete();
            console.log('Message deleted locally');
        }
    } catch (error) {
        console.error('Error processing message:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    }
}

// Load initial configuration
loadConfig();

// Watch for config changes
fs.watch(path.join(__dirname, 'config.json'), (eventType) => {
    if (eventType === 'change') {
        console.log('Configuration file changed, reloading...');
        loadConfig();
    }
});

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Please scan with WhatsApp.');
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
    console.log('Monitoring messages...');
});

// Main message handler
client.on('message', handleMessage);

// Handle errors
client.on('error', error => {
    console.error('Client error:', error);
    console.error('Error details:', {
        message: error.message,
        stack: error.stack
    });
});

client.initialize();
