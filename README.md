## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Stelle sicher, dass PostgreSQL läuft (Postgres.app → „Running“) und `.env` die korrekte `DATABASE_URL` enthält. Optional kannst du hier auch `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET` hinterlegen, wenn du den Google-Login aktivieren möchtest.

3. Wende die aktuellen Prisma-Migrationen an (Auth, Moderation, Likes/Kommentare, Supporter-Warteliste):

   ```bash
   npx prisma migrate dev --name auth-and-moderation
   npx prisma migrate dev --name engagement-features
   npx prisma migrate dev --name supporter-waitlist
   ```

4. Dev-Server starten

   ```bash
   npm run dev
   ```

## Frontend

- Next.js 15 (App Router) mit Tailwind CSS und responsivem Grundlayout.
- Dark-/Light-Mode-Toggle speichert die Nutzerpräferenz via `localStorage` und folgt dem System-Theme, solange kein Override gesetzt ist.
- Startseite zeigt Cultivar- und Provider-Highlights inklusive „Beliebte Samen“-Sektion; Navigation reagiert auf den Login-Status.

## Accounts & Rollen

- Registriere dich über `/register`. Der erste Account wird automatisch **Owner**.
- Owner können im Dashboard (`/dashboard`) Rollen zuweisen (`USER`, `SUPPORTER`, `VERIFIED`, `MODERATOR`, `ADMIN`, `OWNER`) und Accounts verifizieren/sperren.
- Login erfolgt wahlweise mit E-Mail & Passwort oder – falls in `.env` bzw. auf Render hinterlegt – via Google OAuth über `/login` (NextAuth Credentials + Google Provider).

## Moderation & Datenpflege

- Neue Reports landen mit Status **PENDING** und erscheinen erst nach Freigabe im Dashboard.
- Aktionen im Dashboard (Freigeben, Ablehnen, Löschen) aktualisieren Provider-/Cultivar-Metriken automatisch.
- Dashboard beinhaltet außerdem Benutzerverwaltung (Rollen, Status, Verifizierung) sowie einen Link zurück zur Startseite.
- CLI-Helfer zum direkten Löschen inkl. Re-Aggregation:

  ```bash
  npm run delete-report -- --id=42
  npm run delete-report -- --ids=18,19
  ```

- Falls du über Prisma Studio löschst, danach aggregieren:

  ```bash
  npx tsx scripts/recalculateMetrics.ts
  ```

## Reports

- Formular erlaubt Cultivar-Auswahl mit Provider-Vorschlag, optionale Eingaben für Zeltgröße/Setup und Medium sowie Beleuchtung in Watt.
- Alias kann gesetzt werden; bei anonymer Einreichung wird kein Account verknüpft.
- Änderungen an Reports stoßen Kennzahlen-Aktualisierungen für Cultivar- und Provider-Statistiken an.

## Datenebene & Skripte

- Prisma 6.17 kommuniziert mit PostgreSQL (`phenohub`-Datenbank); Migrationen heißen `auth-and-moderation` und `engagement-features`.
- Supporter-Einträge werden in `SupporterWaitlist` gespeichert; Mailversand nutzt optional SMTP (`SUPPORT_MAIL_FROM`, `SUPPORT_NOTIFICATION_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- Bild-Uploads laufen standardmäßig über tmpfiles.org; alternativ kannst du `UPLOAD_PROVIDER=s3` setzen und S3-kompatible Daten (`UPLOAD_S3_*`) hinterlegen, damit Report-Bilder direkt in deinem Bucket landen.
- `npm run seed` – Demo-Daten (Flowery Field etc.).
- `npm run delete-report -- --id=<ID>` – Report löschen + Kennzahlen bereinigen.
- `npx tsx scripts/recalculateMetrics.ts` – Alle Aggregationen neu berechnen.

## Interaktion

- `Gefällt mir`-Buttons stehen sowohl auf der Startseite (Cards) als auch im Report-Detail zur Verfügung.
- Like-Toggle nutzt `/api/reports/[id]/like`, kombiniert Session-Status und Client-Cookie.
- Angemeldete Nutzer können Kommentare unter Reports hinterlassen; `/api/reports/[id]/comments` liefert Thread + Formular im Report-Detail.

## Profile & Anonymer Modus

- Im eingeloggten Zustand findest du unter `/settings` deine Profil-Einstellungen (Anzeigename & Nutzername).
- Beim Einreichen eines Reports kannst du entscheiden, ob du anonym posten möchtest. Anonyme Reports werden ohne Kontobezug gespeichert.
- Seite ist vorbereitet für spätere Profil-Erweiterungen.

## Hinweise

- Admin-APIs liegen unter `/api/admin/*` und sind über NextAuth + Middleware geschützt.
- Prisma Studio kann beim Start „Unable to run script“ ausgeben, funktioniert danach jedoch normal.
- Report-Seiten liefern 404, solange der Status nicht `PUBLISHED` ist.

## Offene Ideen

- Seed-/Import-Skripte für Likes & Kommentare.
- Erweiterte mobile Optimierung (Kommentare, Dashboard).
- Notifications für Moderation sowie automatische Provider-Statistiken.
- Medien-Uploads für Reports evaluieren.
