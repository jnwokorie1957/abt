import io
import json
import os
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


if __name__ == '__main__':
    unittest.main()
