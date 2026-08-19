# Berean AG

A React Native mobile application built with Expo, NativeWind, TypeScript, SQLite, and Firebase.

## Features

- **NativeWind**: Tailwind CSS styling for React Native
- **SQLite**: Local database for offline data storage
- **Firebase**: Backend services for authentication, cloud database, and storage
- **TypeScript**: Type-safe development experience

## Tech Stack

- **Framework**: React Native with Expo
- **Styling**: NativeWind (Tailwind CSS)
- **Language**: TypeScript
- **Local Database**: expo-sqlite
- **Backend**: Firebase (Auth, Firestore, Storage)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd berean-ag
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase config to `config/firebase.ts`

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your device:
   - **iOS**: Press `i` to open in iOS Simulator
   - **Android**: Press `a` to open in Android Emulator
   - **Web**: Press `w` to open in web browser

## Project Structure

```
berean-ag/
├── config/
│   └── firebase.ts          # Firebase configuration
├── src/
│   ├── components/          # Reusable UI components
│   ├── database/
│   │   └── index.ts         # SQLite database setup
│   ├── hooks/
│   │   ├── useAuth.ts       # Authentication hook
│   │   └── useDatabase.ts   # Database operations hook
│   ├── screens/
│   │   └── HomeScreen.tsx   # Home screen component
│   └── services/
│       ├── auth.ts          # Firebase Auth service
│       └── firestore.ts     # Firestore service
├── App.tsx                  # Main app component
├── global.css               # Tailwind CSS styles
├── metro.config.js          # Metro bundler config
├── tailwind.config.js       # Tailwind configuration
└── package.json
```

## Firebase Setup

1. Go to Firebase Console and create a new project
2. Enable the following services:
   - **Authentication**: Email/Password sign-in
   - **Firestore Database**: Create a database
   - **Storage**: For file uploads

3. Update `config/firebase.ts` with your Firebase config:
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id",
   };
   ```

## SQLite Database

The app uses SQLite for local data storage. The database is automatically initialized with the following tables:

- **users**: User profiles
- **notes**: User notes with categories
- **settings**: App settings

## Development

### Adding New Screens

Create new screen components in `src/screens/`:

```tsx
import React from "react";
import { View, Text } from "react-native";

export function NewScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-bold">New Screen</Text>
    </View>
  );
}
```

### Using NativeWind

Style components using Tailwind CSS classes:

```tsx
<View className="flex-1 bg-white p-4">
  <Text className="text-2xl font-bold text-blue-500">
    Hello World
  </Text>
</View>
```

### Database Operations

Use the `useDatabase` hook for SQLite operations:

```tsx
import { useDatabase } from "../hooks/useDatabase";

function MyComponent() {
  const { getAll, insert, update, remove } = useDatabase();

  // Get all notes
  const notes = await getAll("notes");

  // Insert a new note
  await insert("notes", {
    id: "1",
    title: "My Note",
    content: "Note content",
  });
}
```

## License

This project is licensed under the MIT License.
