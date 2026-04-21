# Mr. White

Mr. White is a social deduction game built with Next.js, Zustand, PartyKit, and Capacitor. It supports both online rooms and offline pass-and-play on a single device.

## Features

- Online room flow with register, create room, and join room steps
- Offline pass-and-play mode
- Role reveal, clue, voting, elimination, and result phases
- Custom game settings and preset word categories
- Android packaging through Capacitor

## Getting Started

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - start the Next.js development server
- `npm run build` - build the production app
- `npm run start` - run the production server
- `npm run lint` - run ESLint
- `npm run party` - start the PartyKit dev server

## Android Notes

If you open the project in Android Studio through Capacitor on Windows, make sure Gradle uses a path without spaces for the user home directory if you run into cache access issues. A dedicated folder such as `C:\GradleHome` is usually the simplest fix.

## Project Structure

- `src/app` - app shell and routes
- `src/components/game` - phase UI for the game flow
- `src/lib/engine` - game rules and role assignment
- `src/lib/store` - shared Zustand store
- `src/lib/data` - preset words and categories

## Learn More

For framework reference, see the [Next.js documentation](https://nextjs.org/docs).
