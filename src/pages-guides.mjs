// Poradniki krok po kroku. Inny typ zapytania niż cennik: użytkownik nie liczy
// jeszcze pieniędzy, tylko próbuje zrozumieć kolejność prac. Każdy etap ma
// przypiętą pozycję z cennika, więc poradnik prowadzi wprost do kalkulatora.
import { layout, money } from './templates.mjs';
import { SITE } from './config.mjs';

const R = SITE.root;
const YEAR = new Date().getFullYear();

export const PORADNIKI = [
  {
    slug: 'remont-lazienki-krok-po-kroku',
    h1: 'Remont łazienki krok po kroku',
    title: `Remont łazienki krok po kroku ${YEAR}: kolejność prac i koszty etapów`,
    desc: 'Kolejność prac przy remoncie łazienki: od demontażu przez hydroizolację po biały montaż. Co po czym, ile trwa i ile kosztuje każdy etap.',
    lede: 'Łazienka jest najbardziej nieprzebaczalnym pomieszczeniem w mieszkaniu. Pomyłka w kolejności prac oznacza tu nie poprawkę, tylko skuwanie tego, co zrobiono dzień wcześniej.',
    czas: 'P14D',
    wstep: 'Poniższa kolejność zakłada pełny remont łazienki w bloku, od starych płytek po gotowe pomieszczenie. Przy każdym etapie podajemy średnią stawkę dla Polski, żeby było widać, gdzie naprawdę uciekają pieniądze.',
    kroki: [
      { t: 'Projekt i zakupy przed rozpoczęciem', w: null, txt: 'Płytki, wanna, kabina, stelaż i armatura muszą być na miejscu przed pierwszym uderzeniem młota. Powód jest prozaiczny: rozmieszczenie punktów wodnych i elektrycznych zależy od konkretnych modeli, a nie od ogólnego zamysłu. Zamówienie płytek potrafi trwać kilka tygodni, a ekipa nie będzie czekać.' },
      { t: 'Demontaż i wywóz gruzu', w: 'skuwanie_plytek', txt: 'Skuwanie starych płytek razem z klejem, demontaż starej armatury i wanny. Gruz z łazienki jest wyjątkowo ciężki, więc worki napełnia się do połowy. To najbardziej uciążliwy etap dla sąsiadów, warto ich uprzedzić.' },
      { t: 'Przeróbki instalacji wodno-kanalizacyjnych', w: 'punkt_wod_kan', txt: 'Nowe podejścia do umywalki, wanny, WC i pralki, kucie bruzd i próba szczelności pod ciśnieniem. Ten etap przesądza o układzie pomieszczenia na kolejne kilkanaście lat, bo po ułożeniu płytek przesunięcie odpływu oznacza kolejne skuwanie.' },
      { t: 'Instalacja elektryczna', w: 'punkt_elektryczny', txt: 'Punkty na oświetlenie, gniazda przy umywalce, zasilanie pralki, grzejnika i ewentualnie ogrzewania podłogowego. W łazience obowiązują strefy ochronne, w których nie wolno umieszczać gniazd, i to nie jest zalecenie, tylko przepis.' },
      { t: 'Zabudowa stelaża i pionu', w: 'zabudowa_rury', txt: 'Stelaż WC obudowuje się płytą wodoodporną, pion kanalizacyjny również, zostawiając rewizję do zaworów. Konstrukcja musi udźwignąć obłożenie płytkami i ciężar użytkownika opierającego się o ściankę.' },
      { t: 'Wyrównanie podłoża i spadki', w: 'samopoziomujaca', txt: 'Wylanie masy samopoziomującej, a przy prysznicu bez brodzika wyrobienie spadków w kierunku odpływu. Bez prawidłowego spadku woda zbiera się w rogu i po roku fuga zaczyna czernieć.' },
      { t: 'Hydroizolacja podpłytkowa', w: 'hydroizolacja', txt: 'Dwuskładnikowa masa na podłodze i ścianach w strefie mokrej, z taśmami w narożnikach i mankietami wokół przejść instalacyjnych. To najtańszy etap całego remontu i jednocześnie ten, którego pominięcie kosztuje najwięcej: przeciek do sąsiada poniżej to koszt dwóch remontów zamiast jednego.' },
      { t: 'Układanie płytek', w: 'plytki_sciana', txt: 'Najpierw ściany, potem podłoga, choć część ekip robi odwrotnie i obie kolejności są poprawne. Płytki układa się od najbardziej widocznej ściany, żeby docinki wypadły w narożnikach zasłoniętych przez wyposażenie. Fugowanie po pełnym związaniu kleju.' },
      { t: 'Biały montaż', w: 'montaz_wc', txt: 'Wanna albo kabina, WC, umywalka, baterie, grzejnik drabinkowy i podłączenie pralki. Dopiero na tym etapie widać, czy punkty wodne wypadły dokładnie tam, gdzie powinny.' },
      { t: 'Silikonowanie i wykończenie', w: 'silikonowanie', txt: 'Silikon sanitarny w narożnikach, na styku wanny ze ścianą i wokół brodzika. Fuga cementowa w tych miejscach pęknie, bo materiały pracują względem siebie. Na koniec montaż lustra, oświetlenia i akcesoriów.' },
    ],
    faq: [
      ['Ile trwa remont łazienki?', 'Przy sprawnej ekipie i materiałach na miejscu od dziesięciu dni do trzech tygodni. Najdłuższe przestoje to schnięcie wylewki i wiązanie hydroizolacji, których nie da się przyspieszyć.'],
      ['Czy hydroizolacja jest naprawdę konieczna?', 'W strefie prysznica i wokół wanny bezwzględnie. Płytki i fuga nie są szczelne, przepuszczają wilgoć do podłoża, a w bloku oznacza to zalanie mieszkania poniżej i koszt wielokrotnie wyższy niż sama izolacja.'],
      ['Co zrobić najpierw: płytki czy biały montaż?', 'Najpierw płytki, potem biały montaż. Płytki muszą wchodzić pod wannę i za stelaż, inaczej po latach przy wymianie armatury zostanie nieobłożony fragment ściany.'],
    ],
  },
  {
    slug: 'kolejnosc-prac-remontowych',
    h1: 'Kolejność prac przy remoncie mieszkania',
    title: `Kolejność prac remontowych ${YEAR}: co po czym w remoncie mieszkania`,
    desc: 'W jakiej kolejności prowadzić remont mieszkania: od demontażu i instalacji po malowanie i podłogi. Etapy, czasy schnięcia i koszty.',
    lede: 'Remont ma jedną żelazną zasadę: zawsze od góry do dołu i od brudnego do czystego. Kto ją złamie, będzie malował dwa razy.',
    czas: 'P56D',
    wstep: 'Kolejność poniżej dotyczy pełnego remontu mieszkania z wymianą instalacji. Przy każdym etapie podajemy średnią stawkę dla Polski i zaznaczamy, gdzie trzeba przewidzieć czas na schnięcie, bo to on, a nie praca ekipy, wyznacza termin zakończenia.',
    kroki: [
      { t: 'Demontaże i wyburzenia', w: 'skucie_tynkow', txt: 'Zdjęcie starych podłóg, skucie tynków tam, gdzie odparzone, wyburzenie ścianek działowych i wywóz gruzu. Wszystko, co brudne i głośne, robi się na początku i zamyka jednym kontenerem.' },
      { t: 'Instalacje: elektryka i hydraulika', w: 'punkt_elektryczny', txt: 'Bruzdowanie, nowe obwody, rozdzielnica, punkty wodno-kanalizacyjne. Etap wykonywany na surowych ścianach, bo później każde przesunięcie gniazda oznacza kucie w gotowej powierzchni. Warto tu przewidzieć więcej punktów, niż wydaje się potrzebne.' },
      { t: 'Ścianki działowe i zabudowy', w: 'scianka_gk', txt: 'Nowe ścianki z płyt gipsowo-kartonowych, zabudowy pionów i sufity podwieszane. Robi się je po instalacjach, żeby przewody schowały się w konstrukcji.' },
      { t: 'Tynki i wyrównanie ścian', w: 'tynk_gipsowy', txt: 'Tynk gipsowy maszynowy na ścianach wymagających wyrównania. Etap mokry, po którym mieszkanie musi być intensywnie wietrzone. Wilgoć z tynków potrafi zniszczyć wcześniej ułożone podłogi, dlatego kolejność jest tu nienegocjowalna.' },
      { t: 'Wylewka podłogowa', w: 'wylewka_cem', txt: 'Izolacja, dylatacje i nowa wylewka. Najdłuższy przestój całego remontu: wylewka cementowa potrzebuje mniej więcej tygodnia na każdy centymetr grubości, zanim można na niej układać okładziny. Tego terminu nie da się skrócić nagrzewnicą.' },
      { t: 'Hydroizolacja i płytki w strefach mokrych', w: 'plytki_podloga', txt: 'Łazienka i kuchnia. Płytki układa się przed gładziami w pozostałych pomieszczeniach, bo cięcie gresu produkuje pył, który osiada na wszystkim w promieniu kilku metrów.' },
      { t: 'Gładzie i gruntowanie', w: 'gladz', txt: 'Dwuwarstwowa gładź ze szlifowaniem i gruntowanie przed malowaniem. Drugi najbardziej pylący etap remontu, po którym mieszkanie trzeba dokładnie odkurzyć.' },
      { t: 'Pierwsze malowanie', w: 'malowanie', txt: 'Pierwsza warstwa farby przed montażem podłóg. Łatwiej pomalować ściany, gdy na podłodze jest jeszcze surowa wylewka, niż zabezpieczać świeże panele folią.' },
      { t: 'Podłogi i listwy', w: 'panele', txt: 'Panele albo deska, po sprawdzeniu wilgotności wylewki miernikiem, a nie na oko. Ułożenie okładziny na niewyschniętym podkładzie kończy się falowaniem po kilku miesiącach.' },
      { t: 'Drzwi, biały montaż i poprawki', w: 'montaz_drzwi', txt: 'Ościeżnice i skrzydła, armatura, oprawy oświetleniowe, gniazdka i włączniki. Na koniec druga warstwa farby maskująca ślady po montażu.' },
      { t: 'Sprzątanie po remoncie', w: 'sprzatanie', txt: 'Usunięcie pyłu budowlanego z każdej powierzchni, w tym z wnętrza szafek i kanałów wentylacyjnych. Pył gipsowy potrafi wracać tygodniami, jeśli sprzątanie było pobieżne.' },
    ],
    faq: [
      ['Od czego zacząć remont mieszkania?', 'Od demontaży i instalacji, czyli od prac najbrudniejszych i wymagających kucia. Zasada jest jedna: od góry do dołu i od brudnego do czystego.'],
      ['Kiedy układać podłogi?', 'Na samym końcu, po malowaniu, kiedy wszystkie prace mokre są zakończone, a wilgotność wylewki sprawdzona miernikiem. Panele ułożone za wcześnie zaczynają falować.'],
      ['Ile trwa remont mieszkania 50 m²?', 'Od sześciu do dziesięciu tygodni przy pełnym zakresie. O terminie decyduje nie tempo pracy ekipy, tylko schnięcie tynków i wylewki.'],
    ],
  },
];

export function poradnikPage({ p, byId, units, unitPrice, catSlug, slugify }) {
  const kroki = p.kroki.map((k) => {
    if (!k.w) return { ...k, cena: null };
    const w = byId[k.w];
    const pr = unitPrice(k.w, 1, 1, w.perCm ? 5 : 1);
    return {
      ...k,
      cena: Math.round(pr.labour + pr.material),
      nazwa: w.name,
      jedn: units[w.unit].name,
      link: `${R}${catSlug(w.cat)}/${slugify(w.name)}/`,
    };
  });

  return layout({
    title: p.title,
    description: p.desc,
    path: `/poradnik/${p.slug}/`,
    breadcrumb: `<a href="${R}">Cennik</a> · <a href="${R}poradnik/">Poradniki</a> · ${p.h1}`,
    body: `
<section><div class="wrap">
  <p class="eyebrow">Poradnik · aktualizacja ${SITE.updated}</p>
  <h1>${p.h1}</h1>
  <p class="lede">${p.lede}</p>
  <p class="section-note">${p.wstep}</p>

  <ol class="kroki">
    ${kroki.map((k, i) => `
    <li>
      <span class="krok-nr">${String(i + 1).padStart(2, '0')}</span>
      <div class="krok-tresc">
        <h2>${k.t}</h2>
        <p>${k.txt}</p>
        ${k.cena ? `<p class="krok-cena"><a href="${k.link}">${k.nazwa}</a> <b>${money(k.cena)} zł</b> za ${k.jedn}</p>` : '<p class="krok-cena">Etap bez robocizny: koszt zależy od tego, co kupisz.</p>'}
      </div>
    </li>`).join('')}
  </ol>

  <h2 style="margin-top:2.5rem">Częste pytania</h2>
  ${p.faq.map(([q, a]) => `<h3 style="margin:1.2rem 0 .3rem">${q}</h3><p class="section-note">${a}</p>`).join('')}

  <p class="receipt-foot" style="margin-top:1.6rem">Policz swój zakres: <a href="${R}kalkulator/lazienka/">kalkulator łazienki</a>, <a href="${R}kalkulator/remont-mieszkania/">kalkulator remontu mieszkania</a>.</p>
</div></section>`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: p.h1,
        description: p.desc,
        inLanguage: 'pl',
        totalTime: p.czas,
        step: kroki.map((k, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: k.t,
          text: k.txt,
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: 'pl',
        mainEntity: p.faq.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  });
}

export function poradnikiIndex(list) {
  return layout({
    title: `Poradniki remontowe ${YEAR}`,
    description: 'Kolejność prac przy remoncie mieszkania i łazienki: co po czym, ile trwa każdy etap i ile kosztuje.',
    path: '/poradnik/',
    breadcrumb: `<a href="${R}">Cennik</a> · Poradniki`,
    body: `
<section><div class="wrap">
  <h1>Poradniki</h1>
  <p class="lede">Kolejność prac decyduje o kosztach bardziej niż wybór ekipy. Etap zrobiony nie w porę trzeba powtórzyć.</p>
  <div class="cards" style="margin-top:1.4rem">
    ${list.map((p) => `<div class="card"><h3><a href="${R}poradnik/${p.slug}/">${p.h1}</a></h3><p>${p.lede}</p></div>`).join('')}
  </div>
</div></section>`,
  });
}
