"""ABT self-hosted static site and replacement join endpoint (Python 3.11+).

Run locally: python server.py
Production: gunicorn --config gunicorn.conf.py server:application
The original frontend files in public/ are deliberately unchanged.
"""
from contextlib import closing
from datetime import datetime, timezone
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
PUBLIC = (BASE / 'public').resolve()
DATA = Path(os.environ.get('DATA_DIR', str(BASE / 'data'))).resolve()
MAX_BODY = 16384
LOG = logging.getLogger('abt')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('image/webp', '.webp')


def storage_backend():
    value = os.environ.get('JOIN_STORAGE', 'sqlite')
    if value not in ('sqlite', 'firestore'):
        raise ValueError('JOIN_STORAGE must be sqlite or firestore.')
    return value


@lru_cache(maxsize=1)
def firestore_collection():
    # Optional dependency. Local preview does not need Google libraries or credentials.
    from google.cloud import firestore
    project = os.environ.get('FIRESTORE_PROJECT_ID')
    if not project:
        raise ValueError('FIRESTORE_PROJECT_ID is required for Firestore storage.')
    client = firestore.Client(project=project, database=os.environ.get('FIRESTORE_DATABASE_ID', '(default)'))
    return client.collection(os.environ.get('FIRESTORE_COLLECTION', 'join_submissions'))


def save_submission(row):
    if storage_backend() == 'firestore':
        document = dict(row)
        document['answers'] = json.loads(row['answers'])
        firestore_collection().document(row['id']).create(document, timeout=10)
        return
    with closing(database()) as db, db:
        db.execute('''INSERT INTO submissions
            (id, submitted_at, name, email, instagram, answers, notification_status)
            VALUES (:id, :submitted_at, :name, :email, :instagram, :answers, :notification_status)''', row)


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
        id TEXT PRIMARY KEY, submitted_at TEXT NOT NULL,
        name TEXT NOT NULL, email TEXT NOT NULL, instagram TEXT NOT NULL,
        answers TEXT NOT NULL, notification_status TEXT NOT NULL,
        notified_at TEXT, notification_error TEXT)''')
    db.commit()
    return db


def smtp_configured():
    return all(os.environ.get(k) for k in ('SMTP_HOST', 'MAIL_FROM', 'JOIN_TO_EMAIL'))


def notify(row):
    """Called only when the operator configures their own mail destination."""
    if not smtp_configured():
        return False
    message = EmailMessage()
    message['Subject'] = 'New ABT Social join inquiry'
    message['From'] = os.environ['MAIL_FROM']
    message['To'] = os.environ['JOIN_TO_EMAIL']
    message['Reply-To'] = row['email']
    answers = json.loads(row['answers'])
    message.set_content('\n'.join([
        'A Better Tomorrow Social - new join inquiry',
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


def validate(payload):
    if not isinstance(payload, dict):
        raise ValueError('Expected an object.')
    def text(key, limit, required=True):
        value = payload.get(key, '')
        if not isinstance(value, str):
            raise ValueError(f'Invalid {key}.')
        value = value.strip()
        if len(value) > limit or (required and not value) or any(ord(c) < 32 for c in value):
            raise ValueError(f'Invalid {key}.')
        return value
    name, email, instagram = text('name', 120), text('email', 254), text('instagram', 100, False)
    if not re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+', email) or parseaddr(email)[1] != email:
        raise ValueError('Invalid email.')
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


def join(environ, start):
    if environ['REQUEST_METHOD'] != 'POST':
        return json_response(start, 405, {'error': 'Method not allowed.'}, [('Allow', 'POST')])
    # Browsers provide Origin for a JSON POST. Non-browser clients may omit it.
    origin = environ.get('HTTP_ORIGIN', '')
    if origin and urlsplit(origin).netloc.lower() != environ.get('HTTP_HOST', '').lower():
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
        name, email, instagram, answers = validate(payload)
    except (ValueError, UnicodeError):
        return json_response(start, 400, {'error': 'Please check your details and answers.'})
    row = {
        'id': str(uuid.uuid4()), 'submitted_at': datetime.now(timezone.utc).isoformat(),
        'name': name, 'email': email, 'instagram': instagram,
        'answers': json.dumps(answers, ensure_ascii=False),
        'notification_status': 'pending' if smtp_configured() else 'not_configured',
    }
    try:
        save_submission(row)
    except Exception as error:
        LOG.error('Unable to save join submission (%s).', type(error).__name__)
        return json_response(start, 503, {'error': 'Unable to save your inquiry. Please try again.'})
    notify(row)
    # The original frontend checks response.ok; success follows durable storage.
    return json_response(start, 201, {'ok': True, 'id': row['id']})


def static(environ, start):
    method = environ['REQUEST_METHOD']
    if method not in ('GET', 'HEAD'):
        return json_response(start, 405, {'error': 'Method not allowed.'}, [('Allow', 'GET, HEAD')])
    request_path = environ.get('PATH_INFO', '/')
    try:
        file = (PUBLIC / (request_path.lstrip('/') or 'index.html')).resolve()
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
            fields = ['id', 'submitted_at', 'name', 'email', 'instagram', 'answers', 'notification_status', 'notified_at', 'notification_error']
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
