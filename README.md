# CozyDesk 🐰

A cozy, lightweight desktop companion for Windows. An original SVG bunny lives in the app, reacts to what you do, and helps you stay organised. Built with Electron. **All data stays on your own PC.**

## Features
- **Bunny** with 11 moods, blinking, breathing, random cooldown-based chatter
- **Tasks** (priority, deadline, XP), **Notes** (search, pin, auto-saved draft)
- **Timer / Pomodoro**, **Study tracker** (subjects, daily goal, streak)
- **Calendar** with countdowns, **Alarms**, **World clock**
- **Pet Room** with 8 themes and unlockable decorations
- **Carrot Catch** mini game, **XP / levels**
- **Faith & Reflection** (any religion or none, optional; prayer times calculated locally from your location)
- **Wellness** reminders, breathing break, optional private tracker
- **Sleepy / Focus / Quiet / Privacy** modes
- **Windows helper**: opens a fixed whitelist of settings pages, always asks first

## Run it
1. Install [Node.js LTS](https://nodejs.org).
2. Double-click **`CozyDesk.bat`** (first run installs what it needs).
   Or in a terminal: `npm install` then `npm start`.

`CozyDesk-NoWindow.vbs` starts the app without a terminal window (after the first run).

> PowerShell error "running scripts is disabled"? Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `CozyDesk.bat`, which avoids it.

## Build a Windows installer
```
npm run dist
```
The installer appears in `dist/`. 
## Privacy
Everything is stored locally. Nothing is uploaded. Prayer times and cycle estimates are calculated on your PC and are estimates only, not religious or medical advice.

## Roadmap
Weather, floating desktop pet, live wallpaper, walk/dance animations, more mini games.

## License
MIT
