"""Wyślij wyłącznie pliki z manifestu, bez porównywania całego drzewa FTP.

Wymaga lftp i zmiennych FTP_SERVER, FTP_USER, FTP_PASSWORD, FTP_DIR.
Hasło trafia do lftp przez środowisko, nigdy przez polecenia lub argumenty.
"""
import argparse
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
from urllib.parse import urlsplit


def pliki_manifestu(manifest, katalog):
    katalog = Path(katalog).resolve()
    if not katalog.is_dir():
        raise ValueError('Brak katalogu wynikowego. Uruchom najpierw node build.mjs.')
    pliki = []
    for nazwa in Path(manifest).read_text(encoding='utf-8').splitlines():
        if not nazwa:
            continue
        sciezka = PurePosixPath(nazwa)
        if (not re.fullmatch(r'[A-Za-z0-9_./-]+', nazwa)
                or sciezka.is_absolute() or sciezka.as_posix() != nazwa
                or not sciezka.parts or '..' in sciezka.parts):
            raise ValueError('Manifest zawiera niepoprawną ścieżkę względną.')
        plik = (katalog / nazwa).resolve()
        if not plik.is_relative_to(katalog) or not plik.is_file():
            raise ValueError(f'Brak pliku manifestu w katalogu wynikowym: {nazwa}')
        if nazwa not in pliki:
            pliki.append(nazwa)
    return pliki


def cytuj(value):
    value = str(value)
    if any(ord(char) < 32 or ord(char) == 127 for char in value):
        raise ValueError('Polecenie lftp nie może zawierać znaków sterujących.')
    # Parser lftp nie rozwija $ ani backticków w cytowanym argumencie.
    return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'


def adres_serwera(value):
    if not value or any(char.isspace() or ord(char) < 32 for char in value):
        raise ValueError('FTP_SERVER musi wskazywać jeden serwer FTP.')
    adres = value if '://' in value else 'ftp://' + value
    try:
        parsed = urlsplit(adres)
        port = parsed.port
    except ValueError as error:
        raise ValueError('FTP_SERVER ma niepoprawny adres lub port.') from error
    if (parsed.scheme not in ('ftp', 'ftps') or not parsed.hostname
            or parsed.username is not None or parsed.password is not None
            or parsed.path not in ('', '/') or parsed.query or parsed.fragment
            or not re.fullmatch(r'[A-Za-z0-9:.-]+', parsed.hostname)
            or (port is not None and not 1 <= port <= 65535)):
        raise ValueError('FTP_SERVER nie może zawierać danych logowania, ścieżki ani zapytania.')
    return adres


def polecenia(pliki, katalog, cel, rownolegle=4, ca_file=None):
    if not 1 <= rownolegle <= 4:
        raise ValueError('Liczba równoległych transferów musi mieścić się w zakresie 1–4.')
    lines = [
        'set cmd:fail-exit true',
        'set cmd:parallel 1',
        'set cmd:move-background false',
        'set cmd:save-cwd-history false',
        'set cmd:save-rl-history false',
        'set ftp:ssl-allow true',
        'set ssl:verify-certificate yes',
        'set ftp:passive-mode true',
        'set net:max-retries 5',
        'set net:reconnect-interval-base 5',
        'set net:timeout 30',
        f'set net:connection-limit {rownolegle}',
    ]
    if ca_file is not None:
        if not Path(ca_file).is_file():
            raise ValueError('Nie znaleziono wskazanego pliku zaufanych certyfikatów CA.')
        lines.append('set ssl:ca-file ' + cytuj(Path(ca_file).resolve()))
    lines += ['lcd ' + cytuj(Path(katalog).resolve()), 'cd ' + cytuj(cel)]
    # Foreground mput propaguje błędy. Krótkie partie nie przekraczają limitów
    # długości poleceń; -d tworzy katalogi, a -P ogranicza transfery do czterech.
    for offset in range(0, len(pliki), 100):
        lines.append(f'mput -d -P {rownolegle} -- ' + ' '.join(cytuj(plik) for plik in pliki[offset:offset + 100]))
    lines += ['wait all', 'bye']
    return '\n'.join(lines) + '\n'


def wyslij(katalog, manifest, env, ca_file=None, executable='lftp'):
    pliki = pliki_manifestu(manifest, katalog)
    if not pliki:
        print('Manifest nie zawiera plików do wysłania.')
        return 0
    for name in ('FTP_SERVER', 'FTP_USER', 'FTP_PASSWORD', 'FTP_DIR'):
        if not env.get(name) or any(ord(char) < 32 or ord(char) == 127 for char in env[name]):
            raise ValueError(f'Brak poprawnej zmiennej {name}.')
    host = adres_serwera(env['FTP_SERVER'])
    script = polecenia(pliki, katalog, env['FTP_DIR'], ca_file=ca_file)
    child_env = dict(env)
    child_env['LFTP_PASSWORD'] = child_env.pop('FTP_PASSWORD')
    print(f'Wysyłanie {len(pliki)} plików z manifestu, maksymalnie 4 transfery naraz.', flush=True)
    # -f nie łączy się z opcjami open. Polecenia przekazujemy przez stdin,
    # a --user chroni nazwę użytkownika zawierającą przecinek lub dwukropek.
    result = subprocess.run([executable, '--env-password', '--user', env['FTP_USER'], host],
                            input=script, text=True, env=child_env, check=False)
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', default='dist', help='katalog plików wynikowych')
    parser.add_argument('--manifest', default='zmienione.txt', help='lista zmienionych plików')
    parser.add_argument('--ca-file', help='opcjonalny plik zaufanych certyfikatów CA')
    args = parser.parse_args()
    try:
        return wyslij(args.dist, args.manifest, os.environ, ca_file=args.ca_file)
    except (OSError, ValueError) as error:
        print(f'Wysyłka FTP: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
