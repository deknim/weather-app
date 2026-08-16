Aplikacja pogodowa

Prosta aplikacja webowa (React) do sprawdzania aktualnej pogody (prognozy na 7 dni), wykorzystująca darmowe, publiczne API Open-Meteo.

Funkcjonalności

- wyszukiwanie miasta z podpowiedziami (autouzupełnianie)
- wykrywanie lokalizacji urządzenia (geolokacja API przeglądarki)
- aktualna pogoda: temperatura, temperatura odczuwalna, zachmurzenie, wiatr, wilgotność
- prognoza na 7 dni: temp. min/max, opis pogody, prawdopodobieństwo opadów

Technologie

- React 18+
- Vite
- lucide-react - ikony interfejsu
- Open-Meteo API - dane pogodowe i geokodowanie

Wymagania

- Node.js w wersji LTS (18+)
- npm

Instalacja i uruchomienie

terminal

1. Sklonuj repozytorium
git clone https://github.com/deknim/weather-app.git
cd weather-app

2. Zainstaluj zależności
npm install

3. Uruchom serwer deweloperski
npm run dev

Aplikacja będzie dostępna pod adresem wyświetlonym w terminalu, domyślnie: http://localhost:5173/
