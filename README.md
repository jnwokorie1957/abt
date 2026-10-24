# A Better Tomorrow Social — self-hosting package

Captured from https://abt-social-website.vercel.app/ on October 22, 2026.

The 46 files in `public/` are the original deployed HTML, JavaScript, CSS,
fonts, images, icons and two videos. Their bytes are unchanged. The original
Next.js browser runtime, GSAP animations, Lenis smooth scrolling, intro,
galleries, navigation, accordions, video controls, responsive layout and quiz
remain in place. Nothing in the page loads its assets from Vercel.

This is a working capture of the deployed frontend. It is not a recovered
editable Next.js repository. The private server code and earlier form
submissions cannot be recovered from the public deployment.

## Preview immediately

From this directory, using Python 3.11 or later:

```sh
python server.py --port 8765
```

Open http://127.0.0.1:8765/ in a browser. Use HTTP rather than double-clicking
`index.html`, because the original assets use paths from the domain root.
This preview uses SQLite in `data/`; no credentials or Python packages are
needed. The local preview server is for development.

## Host the frontend with your own backend

Upload the **contents** of `public/` to your web server's document root.
Keep the directory names, including `_next/`, exactly as supplied. There is
no frontend build or npm install step. Serve the site at the domain root.

The original page uses section anchors rather than additional page routes:
`#top`, `#story`, `#socials`, `#pillars`, `#faq` and `#join`.

Route `POST /api/join` to your Firestore implementation. The existing quiz
already sends the following JSON, so you can keep every frontend file intact:

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

Return a 2xx response only after saving the inquiry. The quiz checks
`response.ok`: success displays **You're on the list!**; a non-2xx response
or connection failure uses its original Instagram fallback. No change to
the compiled quiz JavaScript is necessary.

## Included Firestore adapter

`server.py` includes a server-side Firestore implementation of `/api/join`.
It validates the request and creates one document per inquiry with its ID,
submission time, name, email, Instagram and an array of the three answers.
The default collection is `join_submissions`. It does not put Google
credentials or privileged database access into the browser.

Install the optional Firestore dependency for a non-Docker Python setup:

```sh
python -m pip install google-cloud-firestore==2.34.1
```

Set these environment variables in your host's normal configuration:

```text
JOIN_STORAGE=firestore
FIRESTORE_PROJECT_ID=your-project-id
FIRESTORE_DATABASE_ID=(default)
FIRESTORE_COLLECTION=join_submissions
```

Provide Application Default Credentials to the server and grant its identity
the required Firestore write permissions. On Google Cloud, an attached service
identity can supply ADC. On another host, use your existing ADC credential
configuration, optionally referenced through `GOOGLE_APPLICATION_CREDENTIALS`.
Keep credential files outside `public/` and outside this package.

The project, database, permissions and credentials are not configured in this
download. Live Firestore writes have not been tested against your account.
The adapter's payload and failure handling were tested with a mock client.

Reference: [Firestore server library setup](https://docs.cloud.google.com/firestore/native/docs/create-database-server-client-library),
[Application Default Credentials](https://docs.cloud.google.com/docs/authentication/application-default-credentials).

## Docker deployment option

The package includes Nginx for static files/video byte ranges and Gunicorn
for the Python endpoint. With Docker Compose installed:

1. Copy `.env.example` to `.env` and set the desired values.
2. For a credential-free local trial, leave `JOIN_STORAGE=sqlite`.
3. Run `docker compose up -d --build`.
4. Open http://127.0.0.1:8080/.

For an external host using an existing ADC file, set `FIRESTORE_PROJECT_ID`
and `GOOGLE_CREDENTIALS_FILE` in `.env`, then run:

```sh
docker compose -f compose.yaml -f compose.firestore.yaml up -d --build
```

The overlay selects Firestore and mounts the credential file into the API
container. If your host supplies an attached identity, use the base compose
file with `JOIN_STORAGE=firestore` and the host's identity configuration.

The default port binds to loopback. Put your existing HTTPS reverse proxy
in front of it and preserve the visitor's Host header. If the proxy connects
to the host from another machine, set `HTTP_BIND` to the appropriate private
interface. The included Nginx configuration rate-limits join requests.

Docker/Nginx/Gunicorn deployment could not be run on this computer because
Docker and Nginx were unavailable. The Python endpoint and actual browser
experience were tested locally. Review your host's deployment settings.

## Optional notifications and exports

Storage works without email. To notify an inbox, configure `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` and `JOIN_TO_EMAIL`.
The server saves the inquiry first. A failed email remains available for retry.
These settings are optional if you will handle notifications from Firestore.

```sh
python server.py --export-csv /private/path/inquiries.csv
python server.py --retry-notifications
```

Both commands use the selected storage backend. Store exports privately.
SQLite data lives in `data/` locally and a named Docker volume in Compose.
Back up the selected database. No test inquiries are included in this package.

## Cutover

1. Deploy the static files and your configured `/api/join` endpoint to the new host.
2. Configure HTTPS for the client's existing custom domain.
3. Verify that the quiz creates a real Firestore document and that your planned
   notification workflow works.
4. Test both desktop and mobile, video playback, menus, gallery controls and links.
5. Point the existing custom domain's DNS to the new host when those checks pass.
6. Keep the old deployment available during DNS propagation; then stop Vercel billing.

The `vercel.app` address itself cannot move to your own server. Keep the
client's custom domain for a familiar URL. Existing Open Graph images refer
to `https://abettertomorrowsocial.com/media/gal-group-b.webp`; preserve that
domain or update the metadata when you rebuild. Instagram and Eventbrite
links intentionally continue to their original destinations.

## Verification

`capture-manifest.json` records each original URL, size and SHA-256 hash.
`verification/` includes desktop/mobile screenshots and a verification report.
All 46 captured files matched their recorded hashes, all discovered local
asset references resolved, and 16 automated server checks passed.
Run `python verify_capture.py` to repeat the original-file integrity check.

The site's original theme is randomized on each load (sky, pink or navy),
so two visits can have different accent colors even on the same host.
