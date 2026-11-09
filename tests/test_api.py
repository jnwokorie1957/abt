import io
from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch
import server


class InquiryTests(unittest.TestCase):
    def request(self, origin, host='abt-api.run.app', payload=None):
        body = json.dumps(payload or {'name': 'Test', 'email': 'test@example.test', 'instagram': '',
            'answers': [{'q': f'Question {i}', 'a': 'Answer'} for i in range(3)]}).encode()
        environ = {'REQUEST_METHOD': 'POST', 'HTTP_ORIGIN': origin, 'HTTP_HOST': host,
            'CONTENT_TYPE': 'application/json', 'CONTENT_LENGTH': str(len(body)), 'wsgi.input': io.BytesIO(body)}
        result = {}
        def start(status, headers):
            result['status'] = status
        with patch.object(server, 'save_submission') as save, patch.object(server, 'notify'):
            result['body'] = json.loads(b''.join(server.join(environ, start)))
            result['saved'] = save.call_count
        return result

    @patch.dict(os.environ, {'JOIN_ALLOWED_ORIGINS': 'https://abettertomorrow.web.app,https://abettertomorrow.firebaseapp.com'})
    def test_hosting_origin_survives_cloud_run_host(self):
        for origin in ['https://abettertomorrow.web.app', 'https://abettertomorrow.firebaseapp.com']:
            result = self.request(origin)
            self.assertTrue(result['status'].startswith('201'))
            self.assertEqual(result['saved'], 1)

    @patch.dict(os.environ, {'JOIN_ALLOWED_ORIGINS': 'https://abettertomorrow.web.app'})
    def test_unrelated_origin_denied(self):
        for origin in ['https://evil.example', 'https://abettertomorrow.web.app.evil.example', 'http://abettertomorrow.web.app']:
            result = self.request(origin)
            self.assertTrue(result['status'].startswith('403'))
            self.assertEqual(result['saved'], 0)

    @patch.dict(os.environ, {'JOIN_ALLOWED_ORIGINS': ''})
    def test_local_same_origin(self):
        self.assertTrue(self.request('http://127.0.0.1:8765', '127.0.0.1:8765')['status'].startswith('201'))

    def test_invalid_and_oversized_fields(self):
        valid = {'name': 'Test', 'email': 'test@example.test', 'instagram': '',
            'answers': [{'q': 'Question', 'a': 'Answer'} for _ in range(3)]}
        for changes in [{'email': 'bad'}, {'name': 'x' * 121}, {'answers': []}, {'answers': [{'q': 'Q', 'a': 'x' * 1001}] * 3}]:
            with self.assertRaises(ValueError):
                server.validate({**valid, **changes})

    def test_storage_failure_never_reports_success(self):
        with patch.object(server, 'save_submission', side_effect=RuntimeError()):
            body = json.dumps({'name': 'Test', 'email': 'test@example.test', 'instagram': '',
                'answers': [{'q': 'Q', 'a': 'A'}] * 3}).encode()
            environ = {'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': 'application/json', 'CONTENT_LENGTH': str(len(body)),
                'wsgi.input': io.BytesIO(body), 'HTTP_HOST': 'localhost'}
            statuses = []
            response = b''.join(server.join(environ, lambda status, headers: statuses.append(status)))
            self.assertTrue(statuses[0].startswith('503'))
            self.assertNotIn(b'"ok": true', response)


class CommunityTests(unittest.TestCase):
    def setUp(self):
        temp = self.enterContext(TemporaryDirectory())
        self.data = Path(temp)
        self.enterContext(patch.object(server, 'DATA', self.data))
        self.enterContext(patch.dict(os.environ, {'JOIN_STORAGE': 'sqlite', 'SMTP_HOST': ''}))

    def request(self, path, payload=None, query=''):
        body = json.dumps(payload).encode()
        environ = {'REQUEST_METHOD': 'GET' if payload is None else 'POST',
                   'PATH_INFO': path, 'QUERY_STRING': query, 'CONTENT_TYPE': 'application/json',
                   'CONTENT_LENGTH': str(len(body)), 'wsgi.input': io.BytesIO(body), 'HTTP_HOST': 'localhost'}
        statuses = []
        response = server.application(environ, lambda status, headers: statuses.append(status))
        return int(statuses[0].split()[0]), json.loads(b''.join(response))

    def test_submissions_extend_existing_database(self):
        with closing(sqlite3.connect(self.data / 'submissions.sqlite3')) as db:
            db.executescript('''CREATE TABLE submissions (
                id TEXT PRIMARY KEY, submitted_at TEXT NOT NULL, name TEXT NOT NULL,
                email TEXT NOT NULL, instagram TEXT NOT NULL, answers TEXT NOT NULL,
                notification_status TEXT NOT NULL, notified_at TEXT, notification_error TEXT);
                INSERT INTO submissions VALUES ('old', '2026-01-01', 'Test', 'test@example.test',
                '', '[]', 'not_configured', NULL, NULL);''')
        details = {'organization': 'Test organization', 'details': 'First line\nSecond line'}
        contact = {'name': 'Test', 'email': 'test@example.test'}
        submissions = {'cause': details, 'sponsor': {**details, **contact},
                       'venue': {**details, **contact, 'location': 'Houston'}}
        for kind, payload in submissions.items():
            with self.subTest(kind=kind):
                self.assertEqual(self.request(f'/api/inquiries/{kind}', payload)[0], 201)
        self.assertEqual(self.request('/api/inquiries/venue', {**details, **contact})[0], 400)
        rows = {row['kind']: dict(row) for row in server.saved_rows()}
        self.assertEqual(set(rows), {'join', 'cause', 'sponsor', 'venue'})
        self.assertEqual(rows['join']['id'], 'old')
        self.assertEqual(rows['cause']['email'], '')
        self.assertEqual(json.loads(rows['sponsor']['answers'])[-1]['a'], details['details'])

    def test_calendar_filters_month_and_returns_public_fields(self):
        items = [
            {'date': '2026-12-01', 'title': 'December event'},
            {'date': '2026-11-21', 'title': 'Service day', 'url': 'https://example.test/event',
             'internal_contact': 'private@example.test'},
            {'date': '2026-11-01', 'title': 'Soirée', 'url': 'javascript:alert(1)'},
            {'date': '2026-11-31', 'title': 'Invalid date'},
        ]
        (self.data / 'calendar_events.json').write_text(json.dumps(items), encoding='utf-8')
        status, body = self.request('/api/calendar', query='month=2026-11')
        self.assertEqual(status, 200)
        self.assertEqual(body['events'], [
            {'id': '2', 'date': '2026-11-01', 'title': 'Soirée'},
            {'id': '1', 'date': '2026-11-21', 'title': 'Service day', 'url': 'https://example.test/event'},
        ])
        self.assertEqual(self.request('/api/calendar', query='month=2026-10'), (200, {'events': []}))
        self.assertEqual(self.request('/api/calendar', query='month=2026-13')[0], 400)


if __name__ == '__main__':
    unittest.main()
