"""ABT React site and inquiry endpoint (Python 3.11+).

Run locally: python server.py
Production: gunicorn --config gunicorn.conf.py server:application
Run the Vite development server separately, or build the React app first.
"""
from contextlib import closing
from datetime import date, datetime, timezone
from email.message import EmailMessage
from email.utils import formatdate, parseaddr
from functools import lru_cache
from http import HTTPStatus
from pathlib import Path
from socketserver import ThreadingMixIn
from urllib.parse import urlsplit
from wsgiref.simple_server import WSGIServer, make_server
import argparse
import csv
import json
import logging
import mimetypes
import os
import re
import smtplib
import sqlite3
import ssl
import sys
import uuid

BASE = Path(__file__).resolve().parent
PUBLIC = (BASE / 'dist').resolve()
DATA = Path(os.environ.get('DATA_DIR', str(BASE / 'data'))).resolve()
MAX_BODY = 16384
LOG = logging.getLogger('abt')
INQUIRY_FIELDS = {
    'sponsor': (('organization', 'Business or organization', 160, True),
                ('details', 'Sponsorship idea', 1000, True)),
    'venue': (('organization', 'Venue or business', 160, True),
              ('location', 'Venue address or neighborhood', 200, True),
              ('capacity', 'Guest capacity', 60, False),
              ('details', 'Hosting details', 1000, True)),
    'cause': (('organization', 'Cause or organization', 160, True),
              ('details', 'Why ABT should support it', 1000, True)),
}
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('image/webp', '.webp')


def storage_backend():
    value = os.environ.get('JOIN_STORAGE', 'sqlite')
    if value not in ('sqlite', 'firestore'):
        raise ValueError('JOIN_STORAGE must be sqlite or firestore.')
    return value


@lru_cache(maxsize=1)
def firestore_client():
    # Optional dependency. Local preview does not need Google libraries or credentials.
    from google.cloud import firestore
    project = os.environ.get('FIRESTORE_PROJECT_ID')
    if not project:
        raise ValueError('FIRESTORE_PROJECT_ID is required for Firestore storage.')
    return firestore.Client(project=project, database=os.environ.get('FIRESTORE_DATABASE_ID', '(default)'))


def firestore_collection():
    return firestore_client().collection(os.environ.get('FIRESTORE_COLLECTION', 'join_submissions'))


def save_submission(row):
    if storage_backend() == 'firestore':
        document = dict(row)
        document['answers'] = json.loads(row['answers'])
        firestore_collection().document(row['id']).create(document, timeout=10)
        return
    with closing(database()) as db, db:
        db.execute('''INSERT INTO submissions
            (id, submitted_at, kind, name, email, instagram, answers, notification_status)
            VALUES (:id, :submitted_at, :kind, :name, :email, :instagram, :answers, :notification_status)''', row)


def update_notification(reference, status, error=None):
    values = {'notification_status': status, 'notification_error': error,
              'notified_at': datetime.now(timezone.utc).isoformat() if status == 'sent' else None}
    if storage_backend() == 'firestore':
        firestore_collection().document(reference).update(values, timeout=10)
    else:
        with closing(database()) as db, db:
            db.execute('''UPDATE submissions SET notification_status=:notification_status,
                notified_at=:notified_at, notification_error=:notification_error WHERE id=:id''',
                       {**values, 'id': reference})


def saved_rows():
    if storage_backend() == 'firestore':
        rows = [document.to_dict() for document in firestore_collection().order_by('submitted_at').stream(timeout=30)]
        for row in rows:
            row['answers'] = json.dumps(row['answers'], ensure_ascii=False)
            row.setdefault('kind', 'join')
            row.setdefault('notified_at', None)
            row.setdefault('notification_error', None)
        return rows
    with closing(database()) as db:
        return db.execute('SELECT * FROM submissions ORDER BY submitted_at').fetchall()


def database():
    DATA.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DATA / 'submissions.sqlite3', timeout=10)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('''CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY, submitted_at TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'join',
        name TEXT NOT NULL, email TEXT NOT NULL, instagram TEXT NOT NULL,
        answers TEXT NOT NULL, notification_status TEXT NOT NULL,
        notified_at TEXT, notification_error TEXT)''')
    if not any(column['name'] == 'kind' for column in db.execute('PRAGMA table_info(submissions)')):
        with db:
            db.execute('BEGIN IMMEDIATE')
            if not any(column['name'] == 'kind' for column in db.execute('PRAGMA table_info(submissions)')):
                db.execute("ALTER TABLE submissions ADD COLUMN kind TEXT NOT NULL DEFAULT 'join'")
    return db


def smtp_configured():
    return all(os.environ.get(k) for k in ('SMTP_HOST', 'MAIL_FROM', 'JOIN_TO_EMAIL'))


def notify(row):
    """Called only when the operator configures their own mail destination."""
    if not smtp_configured():
        return False
    message = EmailMessage()
    message['Subject'] = 'New ABT Social ' + {
        'sponsor': 'sponsor inquiry', 'venue': 'venue inquiry', 'cause': 'cause suggestion',
    }.get(row['kind'], 'join inquiry')
    message['From'] = os.environ['MAIL_FROM']
    message['To'] = os.environ['JOIN_TO_EMAIL']
    if row['email']:
        message['Reply-To'] = row['email']
    answers = json.loads(row['answers'])
    message.set_content('\n'.join([
        message['Subject'],
        f"Reference: {row['id']}", f"Received: {row['submitted_at']}",
        f"Name: {row['name']}", f"Email: {row['email']}",
        f"Instagram: {row['instagram']}", '',
        *[f"{a['q']}\n{a['a']}\n" for a in answers],
    ]))
    port = int(os.environ.get('SMTP_PORT', '587'))
    tls = ssl.create_default_context()
    transport = smtplib.SMTP_SSL if port == 465 else smtplib.SMTP
    options = {'host': os.environ['SMTP_HOST'], 'port': port, 'timeout': 8}
    if port == 465:
        options['context'] = tls
    try:
        with transport(**options) as mail:
            if port != 465:
                mail.starttls(context=tls)
            if os.environ.get('SMTP_USER'):
                mail.login(os.environ['SMTP_USER'], os.environ.get('SMTP_PASSWORD', ''))
            mail.send_message(message)
        update_notification(row['id'], 'sent')
        return True
    except Exception as error:
        # Keep the saved submission for retry; do not put contact details in logs.
        try:
            update_notification(row['id'], 'failed', type(error).__name__)
        except Exception:
            LOG.warning('Unable to update notification status for %s', row['id'])
        LOG.warning('Mail notification failed for submission %s (%s)', row['id'], type(error).__name__)
        return False


def validate(payload, kind='join'):
    if not isinstance(payload, dict):
        raise ValueError('Expected an object.')
    def text(key, limit, required=True, multiline=False):
        value = payload.get(key, '')
        if not isinstance(value, str):
            raise ValueError(f'Invalid {key}.')
        value = value.strip()
        if len(value) > limit or (required and not value) or any(
                ord(c) < 32 and not (multiline and c in '\r\n\t') for c in value):
            raise ValueError(f'Invalid {key}.')
        return value
    name, email = text('name', 120, kind != 'cause'), text('email', 254, kind != 'cause')
    if email and (not re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+', email) or parseaddr(email)[1] != email):
        raise ValueError('Invalid email.')
    if kind != 'join':
        answers = []
        for key, label, limit, required in INQUIRY_FIELDS[kind]:
            answer = text(key, limit, required, multiline=key == 'details')
            if answer:
                answers.append({'q': label, 'a': answer})
        return name, email, '', answers
    instagram = text('instagram', 100, False)
    answers = payload.get('answers')
    if not isinstance(answers, list) or len(answers) != 3:
        raise ValueError('Please answer all three questions.')
    cleaned = []
    for answer in answers:
        if not isinstance(answer, dict):
            raise ValueError('Invalid answer.')
        if any(not isinstance(answer.get(k), str) or not answer[k].strip() or
               len(answer[k]) > 1000 or any(ord(c) < 32 for c in answer[k]) for k in ('q', 'a')):
            raise ValueError('Invalid answer.')
        cleaned.append({k: answer[k].strip() for k in ('q', 'a')})
    return name, email, instagram, cleaned


def json_response(start, code, value, extra=()):
    body = json.dumps(value).encode('utf-8')
    start(f'{code} {HTTPStatus(code).phrase}', [
        ('Content-Type', 'application/json; charset=utf-8'),
        ('Content-Length', str(len(body))), ('Cache-Control', 'no-store'),
        ('X-Content-Type-Options', 'nosniff'), *extra,
    ])
    return [body]


def join(environ, start, kind='join'):
    if environ['REQUEST_METHOD'] != 'POST':
        return json_response(start, 405, {'error': 'Method not allowed.'}, [('Allow', 'POST')])
    # Browsers provide Origin for a JSON POST. Non-browser clients may omit it.
    origin = environ.get('HTTP_ORIGIN', '')
    allowed_origins = {value.strip().rstrip('/') for value in os.environ.get('JOIN_ALLOWED_ORIGINS', '').split(',') if value.strip()}
    same_host = urlsplit(origin).netloc.lower() == environ.get('HTTP_HOST', '').lower()
    if origin and not same_host and origin.rstrip('/') not in allowed_origins:
        return json_response(start, 403, {'error': 'Origin not allowed.'})
    if environ.get('CONTENT_TYPE', '').split(';')[0].strip().lower() != 'application/json':
        return json_response(start, 415, {'error': 'Expected application/json.'})
    try:
        length = int(environ.get('CONTENT_LENGTH') or '0')
    except ValueError:
        return json_response(start, 400, {'error': 'Invalid request length.'})
    if length <= 0 or length > MAX_BODY:
        return json_response(start, 413, {'error': 'Request body is missing or too large.'})
    try:
        payload = json.loads(environ['wsgi.input'].read(length).decode('utf-8'))
        name, email, instagram, answers = validate(payload, kind)
    except (ValueError, UnicodeError):
        return json_response(start, 400, {'error': 'Please check your details and answers.'})
    row = {
        'id': str(uuid.uuid4()), 'submitted_at': datetime.now(timezone.utc).isoformat(),
        'kind': kind, 'name': name, 'email': email, 'instagram': instagram,
        'answers': json.dumps(answers, ensure_ascii=False),
        'notification_status': 'pending' if smtp_configured() else 'not_configured',
    }
    try:
        save_submission(row)
    except Exception as error:
        LOG.error('Unable to save %s submission (%s).', kind, type(error).__name__)
        return json_response(start, 503, {'error': 'Unable to save your inquiry. Please try again.'})
    notify(row)
    # The original frontend checks response.ok; success follows durable storage.
    return json_response(start, 201, {'ok': True, 'id': row['id']})


def month_events(month):
    first, last = f'{month}-01', f'{month}-31'
    if storage_backend() == 'firestore':
        from google.cloud.firestore_v1.base_query import FieldFilter
        documents = firestore_client().collection('calendar_events').where(
            filter=FieldFilter('date', '>=', first)).where(
            filter=FieldFilter('date', '<=', last)).stream(timeout=10)
        rows = ((doc.id, doc.to_dict()) for doc in documents)
    else:
        try:
            items = json.loads((DATA / 'calendar_events.json').read_text(encoding='utf-8'))
        except FileNotFoundError:
            items = []
        rows = enumerate(items)
    events = []
    for reference, row in rows:
        day, title = row.get('date'), row.get('title')
        if not isinstance(day, str) or not first <= day <= last or not isinstance(title, str) or not title.strip():
            continue
        try:
            if date.fromisoformat(day).isoformat() != day:
                continue
        except ValueError:
            continue
        event = {'id': str(reference), 'date': day, 'title': title.strip()}
        for key in ('time', 'location', 'description'):
            if isinstance(row.get(key), str) and row[key].strip():
                event[key] = row[key].strip()
        link = row.get('url')
        if isinstance(link, str):
            try:
                parsed = urlsplit(link)
                if parsed.scheme == 'https' and parsed.hostname and not parsed.username:
                    event['url'] = link
            except ValueError:
                pass
        events.append(event)
    return sorted(events, key=lambda event: (event['date'], event['title'], event['id']))


def calendar_events(environ, start):
    if environ['REQUEST_METHOD'] != 'GET':
        return json_response(start, 405, {'error': 'Method not allowed.'}, [('Allow', 'GET')])
    query = environ.get('QUERY_STRING', '')
    if not re.fullmatch(r'month=[0-9]{4}-(0[1-9]|1[0-2])', query) or query.startswith('month=0000'):
        return json_response(start, 400, {'error': 'Use month=YYYY-MM.'})
    try:
        events = month_events(query.removeprefix('month='))
    except Exception as error:
        LOG.error('Unable to load calendar events (%s).', type(error).__name__)
        return json_response(start, 503, {'error': 'Unable to load calendar events.'})
    return json_response(start, 200, {'events': events})


def static(environ, start):
    method = environ['REQUEST_METHOD']
    if method not in ('GET', 'HEAD'):
        return json_response(start, 405, {'error': 'Method not allowed.'}, [('Allow', 'GET, HEAD')])
    request_path = environ.get('PATH_INFO', '/')
    try:
        relative_path = 'index.html' if request_path in ('/', '/calendar', '/calendar/') else request_path.lstrip('/')
        file = (PUBLIC / relative_path).resolve()
        if not file.is_relative_to(PUBLIC) or not file.is_file() or any(p.startswith('.') for p in file.relative_to(PUBLIC).parts):
            return json_response(start, 404, {'error': 'Not found.'})
        info = file.stat()
    except (ValueError, OSError):
        return json_response(start, 404, {'error': 'Not found.'})
    etag = f'"{info.st_mtime_ns:x}-{info.st_size:x}"'
    cache = 'public, max-age=31536000, immutable' if '/_next/static/' in request_path else ('no-cache' if file.suffix == '.html' else 'public, max-age=86400')
    headers = [('Content-Type', mimetypes.guess_type(file.name)[0] or 'application/octet-stream'),
               ('Accept-Ranges', 'bytes'), ('ETag', etag), ('Last-Modified', formatdate(info.st_mtime, usegmt=True)),
               ('Cache-Control', cache), ('X-Content-Type-Options', 'nosniff')]
    if environ.get('HTTP_IF_NONE_MATCH') == etag:
        start('304 Not Modified', headers)
        return []
    first, last, code = 0, info.st_size - 1, 200
    range_header = environ.get('HTTP_RANGE', '')
    if range_header and (not environ.get('HTTP_IF_RANGE') or environ.get('HTTP_IF_RANGE') == etag):
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', range_header)
        if match and any(match.groups()):
            a, b = match.groups()
            if a:
                first = int(a)
                last = min(int(b), last) if b else last
            else:
                first = max(0, info.st_size - int(b))
            if first > last or first >= info.st_size:
                start('416 Range Not Satisfiable', [('Content-Range', f'bytes */{info.st_size}'), ('Content-Length', '0')])
                return []
            code = 206
            headers.append(('Content-Range', f'bytes {first}-{last}/{info.st_size}'))
    size = max(0, last - first + 1)
    headers.append(('Content-Length', str(size)))
    start(f'{code} {HTTPStatus(code).phrase}', headers)
    if method == 'HEAD':
        return []
    def chunks():
        with file.open('rb') as stream:
            stream.seek(first)
            remaining = size
            while remaining:
                block = stream.read(min(65536, remaining))
                if not block: break
                remaining -= len(block)
                yield block
    return chunks()


def application(environ, start_response):
    path = environ.get('PATH_INFO', '/')
    if path == '/api/join':
        return join(environ, start_response)
    kind = path.removeprefix('/api/inquiries/')
    if path.startswith('/api/inquiries/') and kind in INQUIRY_FIELDS:
        return join(environ, start_response, kind)
    if path == '/api/calendar':
        return calendar_events(environ, start_response)
    if path == '/healthz' and environ['REQUEST_METHOD'] in ('GET', 'HEAD'):
        if environ['REQUEST_METHOD'] == 'HEAD':
            start_response('200 OK', [('Content-Length', '0')])
            return []
        return json_response(start_response, 200, {'ok': True})
    if path.startswith('/api/'):
        return json_response(start_response, 404, {'error': 'Not found.'})
    return static(environ, start_response)


class ThreadedServer(ThreadingMixIn, WSGIServer):
    daemon_threads = True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8080)
    parser.add_argument('--export-csv', metavar='FILE', help='Export saved inquiries to a private CSV.')
    parser.add_argument('--retry-notifications', action='store_true', help='Email saved inquiries that have not been notified.')
    args = parser.parse_args()
    if args.export_csv:
        with open(args.export_csv, 'w', newline='', encoding='utf-8-sig') as output:
            rows = saved_rows()
            fields = ['id', 'submitted_at', 'kind', 'name', 'email', 'instagram', 'answers', 'notification_status', 'notified_at', 'notification_error']
            writer = csv.DictWriter(output, fieldnames=fields)
            writer.writeheader()
            for row in rows:
                # Do not let an inquiry become a spreadsheet formula.
                safe = {k: ("'" + row[k] if isinstance(row[k], str) and row[k].startswith(('=', '+', '-', '@', '\t', '\r')) else row[k]) for k in fields}
                writer.writerow(safe)
        print(f'Exported {len(rows)} inquiries to {args.export_csv}')
        return
    if args.retry_notifications:
        if not smtp_configured():
            parser.error('Set SMTP_HOST, MAIL_FROM, and JOIN_TO_EMAIL first.')
        rows = [row for row in saved_rows() if row['notification_status'] != 'sent']
        sent = sum(notify(row) for row in rows)
        print(f'Notified {sent} of {len(rows)} inquiries.')
        sys.exit(0 if sent == len(rows) else 1)
    print(f'ABT Social local preview: http://{args.host}:{args.port}', flush=True)
    print('Local preview server. Use the included Nginx/Gunicorn setup for production.', flush=True)
    with make_server(args.host, args.port, application, server_class=ThreadedServer) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    main()
