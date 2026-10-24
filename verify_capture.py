"""Verify that every captured public file still matches its original bytes."""
from pathlib import Path
import hashlib
import json
import sys

base = Path(__file__).resolve().parent
manifest = json.loads((base / 'capture-manifest.json').read_text(encoding='utf-8'))
failures = []
for entry in manifest['files']:
    file = base / entry['path']
    if not file.is_file():
        failures.append(f"Missing: {entry['path']}")
    elif hashlib.sha256(file.read_bytes()).hexdigest() != entry['sha256']:
        failures.append(f"Changed: {entry['path']}")
if failures:
    print('\n'.join(failures))
    sys.exit(1)
print(f"Verified {len(manifest['files'])} original files; all SHA-256 hashes match.")
