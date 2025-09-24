# 🎵 ASSiT ME - Music Creator & Organizer App

[![GitHub](https://img.shields.io/github/license/beatprohalo/ASSiT_ME_APP)](https://github.com/beatprohalo/ASSiT_ME_APP/blob/main/LICENSE)
[![Electron](https://img.shields.io/badge/Electron-38.1.2-blue)](https://electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.19.0-green)](https://nodejs.org/)

A dual-purpose music studio companion that combines creative idea generation with comprehensive music library organization and task management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the application
npm start

# Package for distribution
npm run make
```

## ✨ Features

### 🎨 Creative Engine
- One-click music idea generation
- Voice commands for hands-free operation
- AI-powered creative suggestions
- MIDI and audio file analysis

### 📚 Library Management
- Automatic music file scanning (.wav, .mp3, .aiff, .mid, project files)
- Advanced metadata tagging and filtering
- Smart organization with custom tags
- Progress tracking for each track

### ✅ Task Management
- Track-specific task checklists
- Priority-based task organization
- Due date management
- Progress visualization

### 🎛️ Professional Interface
- Clean, modern design inspired by Notion and Ableton
- Dark/light mode toggle
- Responsive layout
- Intuitive navigation

## 🛠️ Development

This project uses **Electron Forge** for modern Electron development:

```bash
# Development
npm start

# Package the app
npm run package

# Make distributables
npm run make

# Publish (if configured)
npm run publish
```

## 📁 Project Structure

```
ASSiT_ME_APP/
├── src/
│   ├── index.js               # Electron main process
│   ├── preload.js            # Preload script for security
│   ├── index.html            # Main UI
│   ├── database/             # Database operations
│   ├── scanner/              # File scanning
│   └── renderer/             # Frontend components
├── data/                     # SQLite database
└── package.json
```

## 🔧 Tech Stack

- **Electron Forge** - Modern Electron development
- **Node.js** - Backend logic and file system operations
- **SQLite** - Local database for tracks, tags, and tasks
- **HTML/CSS/JS** - Frontend interface
- **music-metadata** - Audio file analysis

## 🎯 Current Status

✅ **Phase 1 Complete**: Basic Electron app with UI
✅ **Phase 2 Complete**: File scanning and database
✅ **Phase 3 Complete**: Creative engine and AI features
⚠️ **Known Issue**: Electron initialization problem in main directory

### 🚨 Current Issue
The app has a critical Electron initialization issue where the `app` object is undefined, preventing startup. The test-electron-app works perfectly, but the main app fails to start due to this runtime issue.

**Workaround**: Use the test-electron-app directory for now:
```bash
cd test-electron-app && npm start
```

## 🚀 Next Steps

1. **Voice Assistant**: Speech recognition and TTS
2. **Creative Engine**: AI-powered idea generation
3. **MIDI Analysis**: Upload and learn from MIDI files
4. **Screen Info Mode**: Context-aware suggestions
5. **Advanced AI**: Smart matching and recommendations

## 📱 Usage

1. **Launch the app** - Clean, professional interface
2. **Scan your music** - Automatic file detection and metadata
3. **Organize tracks** - Tags, filters, and smart search
4. **Generate ideas** - AI-powered creative suggestions
5. **Manage tasks** - Track progress and deadlines

## 🔒 Privacy

- All data stored locally on your computer
- No cloud sync unless explicitly enabled
- No data collection or tracking
- Your music stays completely private

## 🔧 Troubleshooting

### Electron App Won't Start
If you encounter the error `Cannot read properties of undefined (reading 'whenReady')`:

1. **Use the working test app**:
   ```bash
   cd test-electron-app && npm start
   ```

2. **Fresh installation**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run rebuild
   ```

3. **Check Electron version**:
   ```bash
   npx electron --version
   ```

### Database Issues
- Ensure SQLite is properly installed: `npm run rebuild`
- Check database file permissions in `data/music.db`

### AI Provider Setup
1. Get API keys from your preferred provider
2. Add keys in Settings → API Keys
3. Select provider in Settings → AI Provider

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

**ASSiT ME** - Your intelligent music studio companion 🎵

[GitHub Repository](https://github.com/beatprohalo/ASSiT_ME_APP)
