"""Publish a validated snapshot of the latest complete stable GitHub release."""
import json
import os
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = 'TagMyAudio/TagMyAudio'
SUFFIXES = {
    'macarm': '-macOS-arm64-community.zip',
    'macintel': '-macOS-x86_64-community.zip',
    'setup': '-Windows-x64-Setup.exe',
    'portable': '-Windows-x64-Portable.exe',
    'mackit': '-Build-macOS.zip',
    'winkit': '-Build-Win.zip',
    'sources': '-Sources.zip',
}

def request_json(url):
    headers = {'User-Agent': 'TagMyAudio-Website', 'Accept': 'application/vnd.github+json',
               'X-GitHub-Api-Version': '2022-11-28'}
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        headers['Authorization'] = 'Bearer ' + token
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as response:
        return json.load(response)

def normalize(release):
    tag = release.get('tag_name', '')
    if release.get('draft') or release.get('prerelease') or not re.fullmatch(r'v?\d+\.\d+\.\d+', tag):
        raise ValueError('Not a stable version')
    version = tag.removeprefix('v')
    prefix = f'https://github.com/{REPO}/releases/download/{tag}/'
    indexed = {a['name']: a for a in release['assets'] if a.get('state') == 'uploaded'}
    assets = {}
    for key, suffix in SUFFIXES.items():
        name = 'TagMyAudio-' + version + suffix
        asset = indexed.get(name, {})
        digest = asset.get('digest') or ''
        if not re.fullmatch(r'sha256:[0-9a-fA-F]{64}', digest):
            raise ValueError('Missing file or SHA-256: ' + name)
        if asset.get('browser_download_url') != prefix + name or asset.get('size', 0) <= 0:
            raise ValueError('Invalid release asset: ' + name)
        count = asset.get('download_count')
        if not isinstance(count, int) or count < 0:
            raise ValueError('Invalid download count')
        assets[key] = {'url': prefix + name, 'sha256': digest[7:].lower(), 'downloads': count}
    sums = indexed.get('SHA256SUMS.txt', {})
    if sums.get('browser_download_url') != prefix + 'SHA256SUMS.txt':
        raise ValueError('Missing checksum manifest')
    return {'schema': 1, 'version': version, 'release_url': f'https://github.com/{REPO}/releases/tag/{tag}',
            'checksums_url': prefix + 'SHA256SUMS.txt', 'assets': assets}

def main():
    # Use the release explicitly designated Latest on GitHub, never a draft/prerelease.
    release = request_json(f'https://api.github.com/repos/{REPO}/releases/latest')
    snapshot = normalize(release)
    target = ROOT / 'release-data.json'
    previous = json.loads(target.read_text()) if target.exists() else {}
    if previous and tuple(map(int, snapshot['version'].split('.'))) < tuple(map(int, previous['version'].split('.'))):
        raise ValueError('Refusing an automatic version downgrade')
    comparable = {k: v for k, v in previous.items() if k != 'updated_at'}
    if snapshot == comparable:
        print('Release data unchanged')
        return
    snapshot['updated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + '\n')
    temporary.replace(target)
    print('Updated release snapshot: ' + snapshot['version'])

if __name__ == '__main__':
    main()
