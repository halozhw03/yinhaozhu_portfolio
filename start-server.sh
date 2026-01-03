#!/bin/bash
# Simple server startup script for portfolio

echo "Starting local server..."
echo "Server will be available at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000
