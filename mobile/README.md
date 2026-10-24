# ABT Social — Expo companion

An original React Native companion to A Better Tomorrow Social. Uses Expo SDK 57
(the Expo Go version available when this app was prepared), Expo Router, Firebase
JS Authentication, and the club's existing content and photography.

## Run

```sh
cd mobile
pnpm install --frozen-lockfile
pnpm start --go --tunnel
```

Scan the terminal QR with Expo Go. The development server and computer must stay
online. The tunnel address changes when restarted. `pnpm web` opens a browser
preview. This is an Expo Go preview, not an App Store or Play Store release.

## Screens

- Home: editorial collage, impact, and three club pillars.
- Socials: filterable archive and event detail galleries, including service video.
- Saved: device-local bookmarks with loading and storage error states.
- The club: mission, benefits, partner testimonial, and colored FAQ notes.
- You: Firebase email/password signup, sign-in, sign-out, email confirmation,
  password recovery, and an account profile. Public browsing needs no account.
- Join: three-question native quiz and contact form connected to the live Cloud
  Run API. The browser preview opens the website's secure form, because the API
  allows only the production website's browser origin. Native requests work
  without browser CORS. An inquiry or account does not confer club membership.

Native sessions use Firebase's documented AsyncStorage persistence. No direct
Firestore client access is needed: inquiries remain private behind the server.
Firebase web configuration is public identification, not an admin credential.
Google sign-in is enabled in the Firebase project; this Expo Go app uses
email/password. Native Google sign-in requires its own OAuth/development build
setup and is not exposed as a nonfunctional button.

## Development

```sh
pnpm lint
pnpm typecheck
pnpm export --platform all
```

The committed `src/content.json` is synced from the website's `src/content.json`.
After editing site content, run `node scripts/sync-content.mjs` from the repo root.
CI checks the copies match. Fonts are bundled static TTFs; photos and videos load
from Firebase Hosting with Expo Image caching. The visual system supports safe
areas, font scaling, keyboard scrolling, and the OS reduced-motion preference.

The implementation takes architectural inspiration from
[TheBibleDept](https://github.com/yadasa/TheBibleDept)'s retained screens and
floating frosted navigation, and
[Obytes](https://github.com/obytes/react-native-template-obytes)'s modular
TypeScript structure. ABT's palette, copy, media, layouts, and interactions are
specific to this project. No source from those projects was copied.

Lint, TypeScript, native/web production bundling and browser interactions were
verified. Physical iOS/Android testing and store distribution remain separate
release checks.
