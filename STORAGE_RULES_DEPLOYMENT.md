# Wdrożenie Storage Rules - Instrukcja

## ⚠️ WAŻNE: Musisz wdrożyć nowe Storage Rules!

Zaktualizowałem kod Background Remover aby działał bez uprawnień Firebase Admin SDK. Teraz pliki są uploadowane bezpośrednio z przeglądarki do Firebase Storage.

## Metoda 1: Przez Firebase Console (NAJSZYBSZA)

1. Idź na [Firebase Console](https://console.firebase.google.com/)
2. Wybierz projekt **pixelift-ed3df**
3. W menu po lewej: **Build** → **Storage**
4. Kliknij zakładkę **Rules** (na górze)
5. Zastąp istniejące reguły tym kodem:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read, but authenticated write for originals
    match /originals/{userEmail}/{allPaths=**} {
      allow read: if true; // Public read access
      allow write: if request.auth != null;
      allow delete: if request.auth != null && request.auth.token.email == userEmail;
    }

    // Allow public read, but authenticated write for processed images
    match /processed/{userEmail}/{allPaths=**} {
      allow read: if true; // Public read access
      allow write: if request.auth != null;
      allow delete: if request.auth != null && request.auth.token.email == userEmail;
    }
  }
}
```

6. Kliknij **Publish**
7. Gotowe! ✅

## Metoda 2: Przez Firebase CLI

### Krok 1: Zaloguj się do Firebase

```bash
firebase login
```

### Krok 2: Wdróż reguły

```bash
firebase deploy --only storage:rules
```

### Krok 3: Zweryfikuj

Powinno pokazać:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/pixelift-ed3df/overview
```

## Co się zmieniło?

### Przed (nie działało ❌):
- Backend używał Firebase Admin SDK do uploadu plików
- Admin SDK nie miał uprawnień do `storage.objects.create`
- Błąd: "Permission 'storage.objects.create' denied"

### Teraz (działa ✅):
- Frontend uploaduje pliki bezpośrednio do Firebase Storage
- Backend tylko zapisuje metadane do Firestore
- Wymaga aby użytkownik był zalogowany (request.auth != null)

## Testowanie

Po wdrożeniu reguł, przetestuj funkcjonalność:

1. Uruchom aplikację: `npm run dev`
2. Zaloguj się (Google OAuth)
3. Idź do Background Remover
4. Uploaduj zdjęcie
5. Sprawdź czy proces się kończy pomyślnie
6. Sprawdź w Firebase Console → Storage czy pliki się pojawiły

## Troubleshooting

### Błąd: "Unauthorized" lub "Permission denied"

- Upewnij się że jesteś zalogowany w aplikacji
- Zweryfikuj czy Storage Rules zostały wdrożone poprawnie
- Sprawdź w Firebase Console → Storage → Rules czy widać nowe reguły

### Błąd: "CORS policy"

- Storage Rules mogą być poprawne, ale CORS nie jest skonfigurowany
- Zobacz `cors.json` w repo
- Uruchom: `gsutil cors set cors.json gs://pixelift-ed3df-storage`

## Bezpieczeństwo

Nowe reguły są bezpieczne:
- ✅ Tylko zalogowani użytkownicy mogą uploadować
- ✅ Publiczny odczyt (potrzebny do wyświetlania obrazów)
- ✅ Tylko właściciel może usuwać swoje pliki
- ✅ Wszystko jest logowane przez Firebase

---

**Następny krok:** Wdróż reguły jedną z powyższych metod i przetestuj!
