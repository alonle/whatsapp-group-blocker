# WhatsApp Group Message Blocker

> Ever been in those WhatsApp groups where some people's messages spark joy, while others just make your blood pressure rise? 😤 Tired of seeing certain messages that ruin your day before you even had your morning coffee? ☕
>
> Well, say hello to your new peace of mind! This bot automatically deletes messages from those "special" people in your groups, letting you enjoy your WhatsApp experience without the drama. Think of it as your personal WhatsApp bouncer - some messages get VIP treatment, others get shown the door before you even know they existed! 🚫✨

A Node.js bot that automatically deletes messages from specific users in specific WhatsApp groups. The bot uses the WhatsApp Web API and supports configurable message logging.

Created by [alonle](https://github.com/alonle) -  😌

## Features

- 🚫 Automatically delete messages from specific users in specific groups
- ⏱️ Random delay before deletion to avoid detection
- 📱 Support for international phone numbers
- 📝 Optional message logging
- 🔄 Hot-reload configuration
- 🤖 Command system for bot management

## Prerequisites

- Node.js (v12 or higher)
- A WhatsApp account
- Internet connection for WhatsApp Web

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:
```bash
npm install
```

## Configuration

Create or modify `config.json` with your settings:

```json
{
    "targetGroups": [
        "Group Name 1",
        "Group Name 2"
    ],
    "targetUsers": [
        "972501234567",    // Without +
        "+1234567890"      // With +
    ],
    "saveDeletedMessages": true,
    "logFile": "deleted_messages.log"
}
```

### Configuration Options

- `targetGroups`: Array of group names to monitor
- `targetUsers`: Array of phone numbers to block (international format)
- `saveDeletedMessages`: Boolean to enable/disable message logging
- `logFile`: Path to the log file

## Usage

1. Start the bot:
```bash
# Regular mode
npm start

# Daemon mode (runs in background)
npm run start:daemon
```

2. Scan the QR code with WhatsApp on your phone to log in

3. The bot will automatically start monitoring messages

### Daemon Mode

When running in daemon mode:
- The bot runs in the background
- Logs are written to `/tmp/whatsapp-bot-logs/`
- View output logs: `npm run logs:output`
- View error logs: `npm run logs:error`
- Stop the bot: `npm run stop`

### Available Commands

- `!chatinfo`: Shows current chat information (group name and user ID)
- `!listblocked`: Shows currently blocked groups and users

## Logs

If logging is enabled (`saveDeletedMessages: true`), deleted messages will be saved to the specified log file in JSON format:

```json
{
    "timestamp": "2024-01-01T12:00:00.000Z",
    "groupName": "Group Name",
    "userPhone": "+1234567890",
    "messageId": "XXXXX",
    "message": "Message content",
    "hasMedia": false
}
```

## Security Notes

- The bot uses local authentication
- Messages are deleted locally
- Random delays (1-5 seconds) are added before message deletion
- Logs are stored locally in the specified log file

## Contributing

Feel free to submit issues and enhancement requests!

## License

[Your chosen license]

## Disclaimer

This bot is for educational purposes only. Use responsibly and in accordance with WhatsApp's terms of service.
