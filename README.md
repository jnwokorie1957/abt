# A Better Tomorrow Social

A website for **A Better Tomorrow Social**, a Houston social club for women
centered on connection, empowerment, and giving back. The experience introduces
the club, celebrates its gatherings, and helps visitors find events and express
interest in joining.

The live website is [abettertomorrow.web.app](https://abettertomorrow.web.app).
The Expo companion app lives in [`mobile/`](mobile/README.md).

## Original capture screenshots

### Desktop

![A Better Tomorrow Social homepage on desktop](verification/desktop.jpg)

### Mobile

<img src="verification/mobile.jpg" alt="A Better Tomorrow Social homepage on mobile" width="320" />

### Event gallery

<img src="verification/mobile-gallery-video.jpg" alt="The Day of Service event gallery on mobile" width="320" />

## Features

- Animated introduction, typography, and image cards.
- Smooth section navigation and scroll-driven transitions.
- Responsive layouts for desktop and mobile.
- Event galleries with photo controls and video highlights.
- Three club pillars: socials and soirées, days of service, and wellness and mindfulness.
- Expandable frequently asked questions.
- A three-question membership and partnership inquiry quiz.
- Links to the club's Instagram and event tickets.
- Local fonts, images, icons, and video assets.
- Cream, rose, sky, and navy sections with blended gradient boundaries.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 19 with editable JSX components and Vite |
| Animation | CSS transitions and IntersectionObserver, with reduced-motion support |
| API | Python WSGI application |
| Inquiry storage | SQLite for local development; optional Google Cloud Firestore |
| Production hosting | Firebase Hosting and Cloud Run (Gunicorn) |
| Deployment | GitHub Actions with Workload Identity Federation |

## Run locally

Use **Python 3.11 or later**. From the repository root:

```sh
pnpm install
pnpm dev
```

Run the API in a second terminal:

```sh
python server.py --port 8765
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). Vite proxies API requests to Python.
Use Node.js 24 and pnpm 11.25.0. `pnpm build` produces `dist/`, which can also be
served directly by `python server.py`.

The local server serves the frontend and the inquiry endpoint. SQLite is the
default storage backend, with data saved under `data/`. This mode requires no
extra Python packages or cloud credentials. The built-in server is intended
for development; use the production configuration for a public deployment.

## Project structure

```text
src/App.jsx                   Editable React components and interactions
src/content.json              Club copy and event data
src/styles.css                Responsive design and motion system
public/media/                 Original photography and event videos
public/fonts/                 Locally hosted fonts
index.html                    Vite entry and metadata
firebase.json                 Hosting headers and Cloud Run API rewrites
firestore.rules               Deny all direct client access to private inquiries
.github/workflows/firebase.yml Tests and automatic deployment on main pushes
mobile/                       Expo Router / React Native companion app
.github/workflows/mobile.yml   Mobile lint, types and platform exports
server.py                     Static server and inquiry API
requirements.txt              Production Python dependencies
gunicorn.conf.py              Python worker configuration
nginx.conf                    Static hosting and API proxy
Dockerfile                    API container
compose.yaml                  Web and API services
compose.firestore.yaml        Optional Firestore credential configuration
.env.example                  Environment variable template
verification/                 Screenshots and verification report
```

## Inquiry API

The quiz submits JSON to `POST /api/join`:

```json
{
  "name": "First name",
  "email": "person@example.com",
  "instagram": "@optional",
  "answers": [
    {"q": "What brings you to ABT?", "a": "A bit of everything"},
    {"q": "You are…", "a": "Interested in membership"},
    {"q": "Your perfect social?", "a": "Surprise me"}
  ]
}
```

The endpoint validates the input and returns success after saving the inquiry.
The interface then displays a confirmation. A failed request offers the club's
Instagram contact option.

### Firestore

To use Firestore, install the client library and configure these environment
variables on the API server:

```sh
python -m pip install google-cloud-firestore==2.34.1
```

```text
JOIN_STORAGE=firestore
FIRESTORE_PROJECT_ID=your-project-id
FIRESTORE_DATABASE_ID=(default)
FIRESTORE_COLLECTION=join_submissions
```

The server uses Application Default Credentials. Configure an appropriate
server identity with Firestore access, or point `GOOGLE_APPLICATION_CREDENTIALS`
to a private ADC configuration file. Keep credentials outside `public/` and
out of Git. Firestore requires a configured project, database, and permissions
before inquiries can be saved there.

### Optional email notifications

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`,
and `JOIN_TO_EMAIL` to send inquiry notifications. Storage works without email.
The inquiry is saved before notification delivery is attempted.

## Docker

With Docker and Docker Compose installed:

1. Copy `.env.example` to `.env` and configure the required settings.
2. Build the frontend, then run the services:

   ```sh
   pnpm install --frozen-lockfile
   pnpm build
   docker compose up -d --build
   ```

3. Open [http://127.0.0.1:8080/](http://127.0.0.1:8080/).

For Firestore with an existing ADC file, set `FIRESTORE_PROJECT_ID` and
`GOOGLE_CREDENTIALS_FILE` in `.env`, then use the optional overlay:

```sh
docker compose -f compose.yaml -f compose.firestore.yaml up -d --build
```

The default web port binds to loopback. Configure your HTTPS reverse proxy
and domain for a public deployment, preserving the visitor's Host header.
Nginx serves the static assets and videos and proxies the inquiry endpoint
to Gunicorn. Inquiry requests are rate-limited in the Nginx configuration.

## Inquiry management

Export inquiries to a private CSV or retry pending email notifications using
the configured storage backend:

```sh
python server.py --export-csv /private/path/inquiries.csv
python server.py --retry-notifications
```

The repository excludes runtime databases, CSV exports, and `.env` files.

## Firebase production

- Website: https://abettertomorrow.web.app
- Firebase project: `a-better-tomorrow-71ed0`
- Hosting site ID: `abettertomorrow`
- API: Cloud Run `abt-api`, region `us-central1`, zero minimum and two maximum instances.
- Firestore: Standard `(default)` database in `us-central1`, collection `join_submissions`.
- On every push to `main`, GitHub Actions tests the app and rules, builds React and
  the Python container, deploys the API, then publishes the website and rules.
- Workload Identity Federation is restricted to this repository's numeric ID,
  owner ID, and `refs/heads/main`. No service-account JSON keys are stored in GitHub.
- `scripts/bootstrap-cloud.sh` records the one-time cloud IAM setup. It is not run
  on ordinary deployments. The runtime uses `roles/datastore.user`; the deployer
  can publish Hosting/rules and manage Cloud Run, and can act as only the runtime account.
- Inquiries stay server-only: even signed-in Firebase users cannot read or write
  them directly. Server SDKs bypass Firestore Security Rules; Python validates
  inquiries and runtime IAM controls its access. Firebase Authentication setup
  does not turn the public inquiry form into a membership login system.
- Billing has a $10 alert budget. This is an alert, not a spending cap.
- Unlike the optional Nginx deployment, the direct Cloud Run path has no Nginx
  per-IP rate limiter. Consider App Check or edge abuse protection as traffic grows.
- Notifications remain optional and disabled until SMTP is configured.

## Verification

```sh
pnpm build
python -m unittest discover -s tests -v
python verify_capture.py
npx -y firebase-tools@15.34.1 emulators:exec --only firestore --project demo-abt "node tests/firestore.mjs"
```

The asset verification checks the 37 preserved photos, videos, icons, and fonts.
The historical screenshots and capture manifest document the original frontend;
the compiled Next.js runtime was replaced by the editable React app.
The Firestore tests use an isolated demo emulator project and perform 28 denial
checks without touching production data.
