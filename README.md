# Nexus - Game Alt Tracker

Track your alt accounts across multiple games.

## Features
- Game library management
- Alt accounts with level, playtime, progress
- Dark/light theme
- Local SQLite storage

## Tech Stack
- **Backend**: Go + Wails v2 + SQLite
- **Frontend**: Vue 3 + TypeScript + Vite

## Development
```bash
# Prerequisites
# - Go 1.23+
# - Node 20+
# - Wails CLI: go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Install
cd frontend && npm install

# Dev
wails dev

# Build
wails build