# lumenly.dev

<div align="center">
  <img src="public/android-chrome-192x192.png" alt="lumenly.dev logo" width="120" />
  
  <h3>Collaborative Cloud Coding with AI</h3>
  
  <p>A real-time collaborative code editor with integrated code execution and AI-powered reviews</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![GitHub Stars](https://img.shields.io/github/stars/takitajwar17/lumenly.dev?style=social)](https://github.com/takitajwar17/lumenly.dev/stargazers)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=social&logo=linkedin)](https://www.linkedin.com/in/takitajwar17/)
  
  <a href="https://www.lumenly.dev">🌐 Website</a> •
  <a href="#features">✨ Features</a> •
  <a href="#getting-started">🚀 Getting Started</a> •
  <a href="#usage">📖 Usage</a> •
  <a href="#architecture">🏗️ Architecture</a> •
  <a href="#contributing">👥 Contributing</a> •
  <a href="#roadmap">🗺️ Roadmap</a>
</div>

## ✨ Features

lumenly.dev is a cloud coding platform that makes collaboration effortless, with no setup required. It's like Google Docs for coding, but smarter and built specifically for developers.

### 🤝 Real-time Collaboration
- **Live Collaborative Editing:** Multiple users can edit code simultaneously, with real-time updates
- **Cursor and Selection Tracking:** See where your collaborators are working in real-time
- **Presence Indicators:** Know who's online and actively working
- **Activity Tracking:** View your coding activity with GitHub-style contribution graphs

### 🚀 Instant Code Execution
- **One-Click Execution:** Run your code directly in the browser with a single click
- **30+ Languages Support:** Code in JavaScript, TypeScript, Python, Java, C++, Rust, and many more
- **Real-time Output:** View execution results, errors, and compilation messages instantly
- **Performance Metrics:** Track execution time and resource usage

### 🧠 AI-Powered Features
- **Code Reviews:** Get AI-powered feedback on your code quality, performance, and best practices
- **Suggestions & Improvements:** Receive actionable suggestions for making your code better
- **Issue Detection:** Automatically identify potential bugs, security issues, and performance bottlenecks
- **Smart Code Analysis:** Benefit from deep code understanding across multiple languages

### 🛠️ Developer-Focused Experience
- **Syntax Highlighting:** Beautiful, language-specific code highlighting
- **Customizable Editor:** Light and dark themes with professional coding environments
- **Shareable Workspaces:** Easily share workspace links with collaborators
- **Persistent Storage:** Your code is automatically saved in real-time

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or yarn
- A Convex account for the backend
- API keys for AI services (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/takitajwar17/lumenly.dev.git
cd lumenly.dev
```

2. Install dependencies:
```bash
npm install
```

3. Create and configure a Convex project:
```bash
npx convex login
npx convex init
```

4. Create a `.env` file with your environment variables:
```
CONVEX_DEPLOYMENT=
CONVEX_NEBIUS_API_KEY=  # Optional, for AI code reviews
```

5. Run the development server:
```bash
npm run dev
```

The application will start at http://localhost:5173

## 📖 Usage

### Creating a Workspace
1. Visit the application and sign in
2. Click "Create a Workspace" to start a new coding space
3. Choose your preferred programming language
4. You'll receive a 6-character workspace code that you can share with collaborators

### Inviting Collaborators
1. Share your workspace code or URL with others
2. Collaborators can join by entering the 6-character code on the home screen
3. You'll see real-time presence indicators and cursor positions as people join

### Running Code
1. Write or paste your code in the editor
2. Click the "Run" button in the toolbar
3. View the execution results, including any output, errors, and execution time

### Getting AI Reviews
1. Write your code in the editor
2. Click the "AI Review" button to get feedback
3. Review the suggestions, issues, and improvements identified by the AI

## 🏗️ Architecture

lumenly.dev is built with modern web technologies and a focus on real-time collaboration.

### Tech Stack
- **Frontend:** React, TypeScript, TailwindCSS, Monaco Editor (VS Code's editor)
- **Backend:** Convex (real-time database and backend functions)
- **Code Execution:** Piston API (secure code execution environment)
- **AI Services:** OpenAI/Nebius for code analysis and reviews

### Key Components
- **Real-time Collaboration:** Built on Convex's real-time database for instant updates
- **Monaco Editor Integration:** Professional code editing with syntax highlighting
- **Presence System:** Track user activity and cursor positions in real-time
- **Code Execution Engine:** Secure, isolated environment for running code in 30+ languages

## 👥 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

## 🗺️ Roadmap

Our plans for future development include:

- **GitHub Integration:** Import projects directly from GitHub
- **Multifile Support:** Work with and execute complex projects with multiple files
- **Collaborative Code Reviews:** Request and provide reviews with inline comments
- **Advanced AI Features:** Code completion, refactoring suggestions, and more
- **Custom Themes:** Personalize your coding environment
- **Mobile Support:** Better experience on tablets and mobile devices

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Convex](https://convex.dev) for the powerful real-time backend
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editing experience
- [Piston API](https://github.com/engineer-man/piston) for secure code execution

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/takitajwar17">Taki Tajwaruzzaman Khan</a></p>
  <p>
    <a href="https://www.linkedin.com/in/takitajwar17/">LinkedIn</a> •
    <a href="https://github.com/takitajwar17">GitHub</a>
  </p>
</div>
