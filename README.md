# Mr. White

Mr. White is a social deduction party game built with Next.js, Zustand, PartyKit, and Capacitor.

The project supports:
- Online multiplayer rooms (host/join with room code)
- Offline pass-and-play on a single device
- Progressive Web App (PWA) behavior for browser installability
- Android packaging through Capacitor

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Zustand (shared game state)
- PartyKit + PartySocket (real-time room sync)
- Tailwind CSS
- Capacitor (Android wrapper)

## Core Gameplay Flow

1. Setup (create/join room, configure rules)
2. Reveal (private role/word reveal)
3. Clue phase
4. Discussion
5. Voting
6. Elimination
7. Result and replay

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run the web app

```bash
npm run dev
```

Open http://localhost:3000.

### Run PartyKit locally (for online mode in development)

In a second terminal:

```bash
npm run party
```

By default, the app expects local PartyKit at `127.0.0.1:1999` during localhost development.

## Environment Variables

Create `.env.local` for local development.

### Required for online multiplayer outside localhost

- `NEXT_PUBLIC_PARTYKIT_HOST`
	- Example: `mrwhite-game.your-account.partykit.dev`
	- Use host only (no `https://` prefix)

### Firebase (only if Firebase-backed features are enabled)

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build production web app
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run party` - Start PartyKit local server on port 1999

## Deployment (GitHub -> Vercel)

This project deploys best as two services:

1. Frontend on Vercel
2. Realtime backend on PartyKit

### 1) Deploy PartyKit

```bash
npx partykit login
npx partykit deploy party/index.ts --name mrwhite-game
```

Save the resulting host domain.

### 2) Deploy frontend to Vercel

1. Push repository to GitHub.
2. Import repository in Vercel.
3. Framework preset: Next.js.
4. Build command: `npm run build`.
5. If prompted for output directory, use `out`.
6. Add environment variable `NEXT_PUBLIC_PARTYKIT_HOST` with your PartyKit host.
7. Add Firebase `NEXT_PUBLIC_*` variables if used.
8. Deploy.

## Android (Capacitor) Notes

- Android project lives under `android/`.
- If Gradle cache issues occur on Windows, use a path without spaces for Gradle home, for example `C:\GradleHome`.

## Project Structure

- `src/app` - App shell and route pages
- `src/components/game` - UI for each game phase
- `src/components/ui` - Shared UI primitives
- `src/lib/engine` - Game rules and winner logic
- `src/lib/store` - Zustand state + socket synchronization
- `src/lib/data` - Word and category source data
- `src/lib/types` - Shared TypeScript game types
- `party` - PartyKit room server code
- `android` - Capacitor Android project

## Troubleshooting

- Online mode tries to connect to localhost in production:
	- Ensure `NEXT_PUBLIC_PARTYKIT_HOST` is set in Vercel.
- Room sync issues:
	- Confirm PartyKit deployment is active and host domain is correct.
- PWA behavior not showing in dev:
	- PWA is intentionally disabled in development mode.

## License

No license file is currently included. Add one if you plan to open-source or distribute this project.
