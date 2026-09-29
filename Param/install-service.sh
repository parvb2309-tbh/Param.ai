#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/param-ui.service"

if [ ! -f "$SERVICE_FILE" ]; then
  echo "Error: param-ui.service not found in $SCRIPT_DIR"
  exit 1
fi

echo "Installing Param UI service..."
echo "Make sure you've edited param-ui.service with your username and paths first!"
echo ""

sudo cp "$SERVICE_FILE" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable param-ui
sudo systemctl start param-ui
sudo systemctl status param-ui
