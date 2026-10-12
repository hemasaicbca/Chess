# Chess Frontend

This is the frontend app for a full-stack chess platform built with React, TypeScript, and Vite. It provides the user interface for playing online chess matches, authenticating users, managing game sessions, and customizing the experience.

The project is part of a larger monorepo that includes:

- `apps/frontend` — React client for the game UI
- `apps/backend` — Express API and authentication layer
- `apps/ws` — WebSocket server for real-time game updates
- `packages/db` — shared MongoDB/Mongoose models and database connection logic

## Overview

The frontend connects to a backend API for user authentication and a WebSocket server for live multiplayer gameplay. Users can:

- sign in with Google or GitHub
- continue as a guest
- join a random online match
- play a live game with move tracking and game timers
- view the move history and current game state
- switch visual themes
- access a simple landing experience designed around quick play

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recoil and Zustand for state management
- Chess.js for chess rules and move validation
- Radix UI components for UI primitives
- Lucide icons and custom styling utilities

## Main Features

### Authentication

The app supports multiple sign-in flows:

- Google OAuth
- GitHub OAuth
- guest login with a generated username and JWT session cookie

The login screen is implemented in `src/screens/Login.tsx` and connects to the backend at `http://localhost:3000` by default.

### Real-time Chess Gameplay

The game screen (`src/screens/Game.tsx`) integrates with the WebSocket server and updates the board as moves are received. It includes:

- turn-based board updates
- move validation in the chess engine
- move history tracking
- game result handling
- timer display
- game exit and end-state handling

### Game Modes and Landing Screen

The landing page (`src/screens/Landing.tsx`) presents a minimal “Play Chess” interface. The current implementation focuses on online play and routes users into a random game session.

### Theme Support

The app includes light/dark theme support and theme configuration files under the frontend source tree, allowing users to switch the board and UI styling.

## Project Structure

```text
apps/frontend/
├── public/                 # Static assets (images, icons)
├── src/
│   ├── components/        # Reusable UI and chess board components
│   ├── screens/           # Route-level screens: Landing, Login, Game, Settings
│   ├── hooks/             # Custom hooks like socket access
│   ├── context/           # Theme context provider
│   ├── layout/            # Shared page layout
│   ├── lib/               # Utility helpers
│   ├── App.tsx            # Router and application entry
│   └── main.tsx           # App bootstrap
├── package.json           # Frontend scripts and dependencies
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Environment and Runtime Configuration

The frontend expects the backend to be running locally and uses the following default API URL:

```bash
VITE_APP_BACKEND_URL=http://localhost:3000
```

If this variable is not set, the app falls back to `http://localhost:3000`.

## Scripts

From the frontend app directory:

```bash
npm install
npm run dev
```

This starts the Vite development server on:

```text
http://localhost:5173
```

Production build:

```bash
npm run build
```

Linting:

```bash
npm run lint
```

## Running the Full Project

This frontend is designed to work with the monorepo services together:

1. Start Redis (required by the wider app environment)
2. Start the WebSocket server
3. Start the backend API server
4. Start the frontend app

Typical local ports:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- WebSocket server: `ws://localhost:8080`

## Notes

- The app is built as a monorepo and uses shared workspace packages.
- MongoDB is the primary data store for user and game records.
- Real-time board updates are delivered via WebSocket events rather than polling.
- The project is designed around quick online multiplayer chess play with a lightweight, responsive UI.

## Related Repositories / Services

- Backend API: `apps/backend`
- WebSocket game server: `apps/ws`
- Shared DB models: `packages/db`

## License

This project does not currently include a license file in the repository root, so usage and redistribution should follow the repository owner’s existing project policy unless otherwise specified.
