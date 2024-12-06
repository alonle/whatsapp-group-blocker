#!/bin/bash

# Create logs directory if it doesn't exist
LOGS_DIR="/tmp/whatsapp-bot-logs"
mkdir -p "$LOGS_DIR"

# Generate timestamp for log files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_LOG="$LOGS_DIR/bot_output_$TIMESTAMP.log"
ERROR_LOG="$LOGS_DIR/bot_error_$TIMESTAMP.log"

# Function to cleanup old logs (keep last 5 days)
cleanup_old_logs() {
    find "$LOGS_DIR" -name "bot_*.log" -type f -mtime +5 -delete
}

# Function to check if bot is already running
is_bot_running() {
    pgrep -f "node bot.js" > /dev/null
    return $?
}

# Kill existing bot process if running
kill_existing_bot() {
    pkill -f "node bot.js"
    sleep 2
}

# Start the bot
start_bot() {
    echo "Starting WhatsApp Bot..."
    echo "Logs will be written to:"
    echo "Output: $OUTPUT_LOG"
    echo "Errors: $ERROR_LOG"
    
    # Run the bot in the background
    node bot.js >> "$OUTPUT_LOG" 2>> "$ERROR_LOG" &
    
    # Save the PID
    echo $! > "$LOGS_DIR/bot.pid"
}

# Cleanup old logs
cleanup_old_logs

# Check if bot is already running
if is_bot_running; then
    echo "Bot is already running. Restarting..."
    kill_existing_bot
fi

# Start the bot
start_bot

# Create symbolic links to latest logs
ln -sf "$OUTPUT_LOG" "$LOGS_DIR/latest_output.log"
ln -sf "$ERROR_LOG" "$LOGS_DIR/latest_error.log"

echo "Bot started successfully!"
echo "To view logs in real-time, use:"
echo "tail -f $OUTPUT_LOG"
echo "tail -f $ERROR_LOG"
