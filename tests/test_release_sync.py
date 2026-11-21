import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('sync_release', ROOT / 'scripts/sync_release.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

class ReleaseValidation(unittest.TestCase):
    def setUp(self):
        data = json.loads((ROOT / 'release-data.json').read_text())
        self.release = {'tag_name': 'v' + data['version'], 'draft': False, 'prerelease': False,
                        'assets': [{'name': a['url'].split('/')[-1], 'state':'uploaded', 'size':10,
                                    'browser_download_url':a['url'], 'digest':'sha256:' + a['sha256'],
                                    'download_count':a['downloads']} for a in data['assets'].values()]}
        self.release['assets'].append({'name':'SHA256SUMS.txt','state':'uploaded',
                                      'browser_download_url':data['checksums_url']})

    def test_complete_release(self):
        result = sync.normalize(self.release)
        self.assertEqual(len(result['assets']), 7)

    def test_partial_release_rejected(self):
        self.release['assets'].pop(0)
        with self.assertRaises(ValueError): sync.normalize(self.release)

    def test_missing_digest_rejected(self):
        self.release['assets'][0]['digest'] = None
        with self.assertRaises(ValueError): sync.normalize(self.release)

    def test_foreign_download_url_rejected(self):
        self.release['assets'][0]['browser_download_url'] = 'https://example.com/wrong.exe'
        with self.assertRaises(ValueError): sync.normalize(self.release)

    def test_prerelease_rejected(self):
        self.release['prerelease'] = True
        with self.assertRaises(ValueError): sync.normalize(self.release)

if __name__ == '__main__': unittest.main()
