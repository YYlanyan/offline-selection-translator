#!/usr/bin/env python3
"""Download ECDICT on explicit request, or convert a locally supplied CSV."""
import argparse
import pathlib
import subprocess
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL = 'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv'

parser = argparse.ArgumentParser(description='Prepare the local ECDICT data for this Chrome extension.')
group = parser.add_mutually_exclusive_group(required=True)
group.add_argument('--csv', type=pathlib.Path, help='Path to a CSV you obtained yourself')
group.add_argument('--download', action='store_true', help='Download the current ECDICT CSV from its official repository')
args = parser.parse_args()

if args.download:
    cache = ROOT / '.cache'
    cache.mkdir(exist_ok=True)
    path = cache / 'ecdict.csv'
    print(f'Downloading {URL}', flush=True)
    try:
        with urllib.request.urlopen(URL, timeout=60) as response, path.open('wb') as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
    except Exception:
        path.unlink(missing_ok=True)
        raise
else:
    path = args.csv.expanduser().resolve()
    if not path.is_file():
        parser.error(f'CSV file not found: {path}')

subprocess.run([sys.executable, str(ROOT / 'tools' / 'build_dictionary.py'), str(path)], check=True)
print(f'Complete: {ROOT / "data"}. The data directory is excluded from Git.')
