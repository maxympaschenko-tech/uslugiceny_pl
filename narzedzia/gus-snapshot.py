"""Dopisuje miesięczny punkt do src/data/historia-cen.json z GUS BDL API.

NIEZWERYFIKOWANE. Napisane na podstawie dokumentacji API BDL
(https://api.stat.gov.pl/Home/BdlApi), bez możliwości wykonania
ani jednego realnego zapytania: sieć w sesji, w której ten plik
powstał, blokuje wszystkie połączenia z *.stat.gov.pl na poziomie
proxy (polityka organizacji, nie ograniczenie samego narzędzia).

Przed pierwszym użyciem, ktoś z dostępem do sieci musi ręcznie sprawdzić:
  1. czy SZUKANA_FRAZA w ogóle trafia w /variables — BDL to głównie baza
     regionalna (województwa, powiaty, gminy), a wskaźnik cen produkcji
     budowlano-montażowej bywa publikowany osobno, w comiesięcznych
     komunikatach na stat.gov.pl (jako PDF/XLSX), a nie w samym BDL.
     Jeśli wyszukiwanie nic nie zwróci, ten skrypt trzeba przepisać pod
     inne źródło (np. parsowanie strony komunikatu).
  2. czy nazwy pól w odpowiedzi JSON (id, n1, val, year) są poprawne —
     zgadnięte z dokumentacji PDF, nie z realnej odpowiedzi.
  3. czy /data/by-variable/{id} przy unit-level=0 (poziom kraju) w ogóle
     zwraca dane dla tego wskaźnika, czy wskaźnik jest dostępny tylko
     na poziomie województw.

Uruchomienie: python3 narzedzia/gus-snapshot.py
Zapisuje nowy punkt do src/data/historia-cen.json, jeśli okres jeszcze
tam nie istnieje. Nic nie robi, jeśli już jest zapisany.
"""

import json
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

API = "https://bdl.stat.gov.pl/api/v1"
SZUKANA_FRAZA = "produkcja budowlano-montażowa"
SCIEZKA_DANYCH = Path(__file__).resolve().parent.parent / "src" / "data" / "historia-cen.json"


def pobierz_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as odpowiedz:
        return json.load(odpowiedz)


def znajdz_id_wskaznika():
    url = f"{API}/variables?name={urllib.parse.quote(SZUKANA_FRAZA)}&format=json&page-size=20"
    dane = pobierz_json(url)
    for wynik in dane.get("results", []):
        nazwa = (wynik.get("n1") or wynik.get("name") or "").lower()
        if "budowlano" in nazwa and "montaż" in nazwa.replace("owej", "owa"):
            return wynik["id"]
    raise SystemExit(
        "Nie znaleziono wskaźnika przez wyszukiwanie po nazwie. "
        "Sprawdź ręcznie: " + f"{API}/variables?name={urllib.parse.quote(SZUKANA_FRAZA)}&format=json"
    )


def pobierz_najnowszy_punkt(id_wskaznika):
    rok = date.today().year
    url = f"{API}/data/by-variable/{id_wskaznika}?format=json&year={rok}&year={rok - 1}&unit-level=0"
    dane = pobierz_json(url)
    wyniki = dane.get("results", [])
    if not wyniki:
        raise SystemExit(f"Brak danych z API dla lat {rok - 1}-{rok}.")
    wartosci = sorted(wyniki[0].get("values", []), key=lambda p: (p.get("year"), p.get("id", "")))
    if not wartosci:
        raise SystemExit("API zwróciło wynik bez punktów danych (values).")
    ostatni = wartosci[-1]
    return {"okres": str(ostatni["year"]), "wartosc": ostatni["val"]}


def wczytaj_historie():
    if SCIEZKA_DANYCH.exists():
        with open(SCIEZKA_DANYCH, encoding="utf-8") as plik:
            return json.load(plik)
    return {
        "opis": "Wskaźnik cen produkcji budowlano-montażowej GUS: zmiana rok do roku, w punktach procentowych.",
        "zrodlo": "GUS, wskaźnik cen produkcji budowlano-montażowej",
        "punkty": [],
    }


def zapisz_historie(historia):
    with open(SCIEZKA_DANYCH, "w", encoding="utf-8") as plik:
        json.dump(historia, plik, ensure_ascii=False, indent=2)
        plik.write("\n")


def main():
    id_wskaznika = znajdz_id_wskaznika()
    punkt = pobierz_najnowszy_punkt(id_wskaznika)
    historia = wczytaj_historie()

    if historia["punkty"] and historia["punkty"][-1]["okres"] == punkt["okres"]:
        print(f"Okres {punkt['okres']} już zapisany, pomijam.")
        return

    historia["punkty"].append(punkt)
    zapisz_historie(historia)
    print(f"Dopisano punkt: {punkt['okres']} = {punkt['wartosc']}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Błąd: {e}", file=sys.stderr)
        sys.exit(1)
