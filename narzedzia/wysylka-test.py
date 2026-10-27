"""Testy planu wysyłki i przekazywania uwierzytelnienia, bez dostępu do hostingu."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
spec = spec_from_file_location('wysylka', Path(__file__).with_name('wyslij-ftp.py'))
wysylka = module_from_spec(spec)
spec.loader.exec_module(wysylka)


class WysylkaTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.dist = self.root / 'dist'
        self.dist.mkdir()
        self.manifest = self.root / 'zmienione.txt'

    def pliki(self, names):
        for name in names:
            target = self.dist / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text('treść pliku')
        self.manifest.write_text('\n'.join(names) + '\n')

    def test_manifest_zachowuje_sciezki_i_usuwanie_powtorzen(self):
        self.pliki(['index.html', '.htaccess', 'miasto/robota/index.html'])
        self.manifest.write_text(self.manifest.read_text() + 'index.html\n\n')
        self.assertEqual(wysylka.pliki_manifestu(self.manifest, self.dist),
                         ['index.html', '.htaccess', 'miasto/robota/index.html'])

    def test_niepoprawne_sciezki_i_brak_pliku_sa_bledem(self):
        for name in ['../sekret', '/plik', 'foo//bar', './index.html', 'a/../index.html',
                     'plik;bye', 'plik*.html', 'plik ze spacją', 'brak.html']:
            with self.subTest(name=name):
                self.manifest.write_text(name + '\n')
                with self.assertRaises(ValueError):
                    wysylka.pliki_manifestu(self.manifest, self.dist)
        outside = self.root / 'outside.html'
        outside.write_text('poza katalogiem')
        (self.dist / 'link.html').symlink_to(outside)
        self.manifest.write_text('link.html\n')
        with self.assertRaises(ValueError):
            wysylka.pliki_manifestu(self.manifest, self.dist)

    def test_krotkie_partie_maja_stale_limity_i_nie_wykonuja_mirror(self):
        names = [f'miasto-{index}/index.html' for index in range(205)]
        self.pliki(names)
        script = wysylka.polecenia(names, self.dist, "folder's \"cytat\"; $HOME \\ dane")
        uploads = [line for line in script.splitlines() if line.startswith('mput ')]
        self.assertEqual(len(uploads), 3)
        self.assertTrue(all(line.startswith('mput -d -P 4 -- ') for line in uploads))
        self.assertNotIn('mirror ', script)
        self.assertIn('set ssl:verify-certificate yes', script)
        self.assertIn('set cmd:fail-exit true', script)
        self.assertIn('set net:connection-limit 4', script)
        for name in names:
            self.assertEqual(script.count('"' + name + '"'), 1)

    def test_haslo_nie_trafia_do_argumentow_ani_polecen(self):
        self.pliki(['index.html'])
        secret = "hasło ' \" ; $(polecenie) `inne` \\ dane"
        env = {'FTP_SERVER': 'ftp.example.com', 'FTP_USER': "użytkownik:,'\"", 'FTP_PASSWORD': secret,
               'FTP_DIR': "folder's \"cytat\"; $HOME \\ dane", 'PATH': '/usr/bin'}
        with patch.object(wysylka.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)) as run:
            self.assertEqual(wysylka.wyslij(self.dist, self.manifest, env), 0)
        args, kwargs = run.call_args
        self.assertEqual(args[0], ['lftp', '--env-password', '--user', env['FTP_USER'], 'ftp://ftp.example.com'])
        self.assertNotIn(secret, str(args))
        self.assertNotIn(secret, kwargs['input'])
        self.assertEqual(kwargs['env']['LFTP_PASSWORD'], secret)
        self.assertNotIn('FTP_PASSWORD', kwargs['env'])
        self.assertNotIn('LFTP_PASSWORD', env)
        self.assertEqual(wysylka.cytuj(env['FTP_DIR']), '"folder\'s \\"cytat\\"; $HOME \\\\ dane"')

    def test_blad_lftp_jest_zwracany_wywolujacemu(self):
        self.pliki(['index.html'])
        env = {'FTP_SERVER': 'ftp.example.com', 'FTP_USER': 'u', 'FTP_PASSWORD': 'p', 'FTP_DIR': './'}
        with patch.object(wysylka.subprocess, 'run', return_value=subprocess.CompletedProcess([], 7)):
            self.assertEqual(wysylka.wyslij(self.dist, self.manifest, env), 7)

    def test_brak_wymaganej_konfiguracji_nie_uruchamia_transferu(self):
        self.pliki(['index.html'])
        with patch.object(wysylka.subprocess, 'run') as run:
            with self.assertRaises(ValueError):
                wysylka.wyslij(self.dist, self.manifest, {})
            run.assert_not_called()

    def test_pusty_manifest_nie_wymaga_hasla_i_nie_laczy_z_serwerem(self):
        self.manifest.write_text('\n')
        with patch.object(wysylka.subprocess, 'run') as run:
            self.assertEqual(wysylka.wyslij(self.dist, self.manifest, {}), 0)
            run.assert_not_called()

    def test_brak_manifestu_jest_bledem_przed_polaczeniem(self):
        with patch.object(wysylka.subprocess, 'run') as run:
            with self.assertRaises(FileNotFoundError):
                wysylka.wyslij(self.dist, self.manifest, {})
            run.assert_not_called()

    def test_host_nie_przenosi_danych_logowania_lub_sciezki(self):
        for host in ['https://example.com', 'ftp://u:p@example.com', 'example.com/target',
                     'example.com?x=1', 'example.com\nbye', 'ftp://example.com:0']:
            with self.subTest(host=host):
                with self.assertRaises(ValueError):
                    wysylka.adres_serwera(host)
        self.assertEqual(wysylka.adres_serwera('127.0.0.1:2121'), 'ftp://127.0.0.1:2121')


if __name__ == '__main__':
    unittest.main()
