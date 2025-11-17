# Firebase & Google OAuth Setup Guide

## Krok 1: Utwórz Firebase Project

1. Idź na [Firebase Console](https://console.firebase.google.com/)
2. Kliknij "Add project" / "Dodaj projekt"
3. Nazwij projekt (np. "upsizer")
4. Wyłącz Google Analytics (opcjonalnie)
5. Kliknij "Create project"

## Krok 2: Dodaj Web App

1. W Firebase Console, kliknij ikony "Web" (</>)
2. Zarejestruj aplikację (nickname: "Upsizer Web")
3. Skopiuj Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

4. Wklej te wartości do `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

## Krok 3: Włącz Authentication

1. W Firebase Console → Build → Authentication
2. Kliknij "Get started"
3. Zakładka "Sign-in method"
4. Włącz **Google** provider
5. Ustaw publiczną nazwę projektu
6. Dodaj autoryzowany email
7. Save

## Krok 4: Utwórz Firestore Database

1. W Firebase Console → Build → Firestore Database
2. Kliknij "Create database"
3. Wybierz lokalizację (np. europe-west3)
4. Start in **test mode** (na razie)
5. Kliknij "Enable"

## Krok 5: Utwórz Firebase Storage

1. W Firebase Console → Build → Storage
2. Kliknij "Get started"
3. Start in **test mode**
4. Wybierz lokalizację (ta sama co Firestore)
5. Kliknij "Done"

## Krok 6: Pobierz Service Account Key (Admin SDK)

1. W Firebase Console → Project Settings (⚙️)
2. Zakładka "Service accounts"
3. Kliknij "Generate new private key"
4. Pobierz plik JSON

5. Otwórz pobrany plik i znajdź:
   - `project_id`
   - `client_email`
   - `private_key`

6. Wklej do `.env.local`:
```env
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

⚠️ **UWAGA**: W `FIREBASE_ADMIN_PRIVATE_KEY` zachowaj `\n` (new lines)

## Krok 7: Konfiguracja Google OAuth

1. Idź na [Google Cloud Console](https://console.cloud.google.com/)
2. Wybierz swój Firebase projekt
3. Idź do "APIs & Services" → "Credentials"
4. Kliknij "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: **Web application**
6. Nazwa: "Upsizer OAuth"
7. Authorized redirect URIs:
   ```
   http://localhost:3001/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google (produkcja)
   ```
8. Kliknij "Create"
9. Skopiuj:
   - **Client ID** → `GOOGLE_CLIENT_ID` w `.env.local`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET` w `.env.local`

## Krok 8: Wygeneruj NextAuth Secret

W terminalu uruchom:
```bash
openssl rand -base64 32
```

Wklej wynik do `.env.local` jako `NEXTAUTH_SECRET`

## Krok 9: Zaktualizuj Firestore Security Rules

W Firebase Console → Firestore → Rules, ustaw:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Blog posts (public read, admin write)
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Image history
    match /images/{imageId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

## Krok 10: Zaktualizuj Storage Security Rules

W Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /blog/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Finalna weryfikacja .env.local

Twój plik `.env.local` powinien wyglądać tak:

```env
# Replicate
REPLICATE_API_TOKEN=r8_xxxxx

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:xxxxx

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your-project
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# Google OAuth
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# NextAuth
NEXTAUTH_SECRET=wygenerowany_secret_tutaj
NEXTAUTH_URL=http://localhost:3001
```

## Testowanie

Po konfiguracji, uruchom:
```bash
npm run dev
```

Przejdź do http://localhost:3001 i sprawdź czy działa!
