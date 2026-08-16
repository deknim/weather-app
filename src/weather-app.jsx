import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, MapPin, Wind, Droplets, CloudRain, Loader2 } from "lucide-react";

// Color palette
const COLORS = {
  background: "#0d1330",        // page background
  panelBg: "#161f43",           // suggestions dropdown background
  textPrimary: "#eef1fb",       // main body text, headings, active toggle text
  textAccent: "#9db4ff",        // place name, icons, section labels
  textAccentSoft: "#8f9ad1",    // subtitles, muted labels, inactive toggle text
  textMuted: "#7a84b8",         // small secondary numbers (e.g. low temps)
  textFaint: "#6a75a8",         // very muted numbers
  textDim: "#5c6699",           // empty-state placeholder text
  textFooter: "#4c5688",        // footer credit text
  textDescription: "#c3caf0",   // weather description under temperature
  rain: "#7fa8ff",              // rain probability text
  error: "#ff9d9d",             // error messages
  activeToggleBg: "#3a4a8f",    // selected language button background
  border: "rgba(255,255,255,0.1)",
  surfaceLight: "rgba(255,255,255,0.1)",   // language toggle background
  surface: "rgba(255,255,255,0.08)",       // search bar / location button background
  surfaceSoft: "rgba(255,255,255,0.05)",   // forecast list background
};

const WEATHER_TEXT = {
  en: {
    0: "Clear sky",
    1: "Mostly sunny",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with hail",
  },
  pl: {
    0: "Bezchmurnie",
    1: "Przeważnie słonecznie",
    2: "Częściowe zachmurzenie",
    3: "Pochmurno",
    45: "Mgła",
    48: "Szadź",
    51: "Mżawka słaba",
    53: "Mżawka",
    55: "Mżawka silna",
    61: "Deszcz słaby",
    63: "Deszcz",
    65: "Deszcz silny",
    71: "Śnieg słaby",
    73: "Śnieg",
    75: "Śnieg silny",
    80: "Przelotne opady",
    81: "Przelotne opady",
    82: "Ulewa",
    95: "Burza",
    96: "Burza z gradem",
    99: "Burza z gradem",
  },
};

const WEATHER_ICON = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️", 61: "🌦️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️", 80: "🌦️", 81: "🌧️", 82: "⛈️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const weather = (c, lang) => ({
  label: WEATHER_TEXT[lang][c] || (lang === "pl" ? "Nieznana" : "Unknown"),
  icon: WEATHER_ICON[c] || "❔",
});

const DAY_NAMES = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  pl: ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"],
};

const UI = {
  en: {
    title: "Weather",
    subtitle: "Check current conditions and the 7-day forecast",
    searchPlaceholder: "Enter a city name…",
    useLocation: "Use my location",
    geoUnavailable: "Geolocation isn't available in this browser.",
    geoFailed: "Couldn't determine your location.",
    fetchFailed: "Couldn't load the weather. Please try again.",
    loading: "Loading…",
    emptyState: "Search for a city or use your location to see the weather.",
    yourLocation: "Your location",
    feelsLike: "feels like",
    wind: "Wind",
    humidity: "Humidity",
    cloudCover: "Cloud cover",
    forecast7: "7-day forecast",
    today: "Today",
    source: "Data: Open-Meteo.com",
  },
  pl: {
    title: "Pogoda",
    subtitle: "Sprawdź aktualne warunki i prognozę na 7 dni",
    searchPlaceholder: "Wpisz nazwę miasta…",
    useLocation: "Użyj mojej lokalizacji",
    geoUnavailable: "Geolokalizacja niedostępna w tej przeglądarce.",
    geoFailed: "Nie udało się ustalić lokalizacji.",
    fetchFailed: "Nie udało się pobrać pogody. Spróbuj ponownie.",
    loading: "Ładowanie…",
    emptyState: "Wyszukaj miasto lub użyj swojej lokalizacji, aby zobaczyć pogodę.",
    yourLocation: "Twoja lokalizacja",
    feelsLike: "odczuwalna",
    wind: "Wiatr",
    humidity: "Wilgotność",
    cloudCover: "Zachmurzenie",
    forecast7: "Prognoza 7-dniowa",
    today: "Dziś",
    source: "Dane: Open-Meteo.com",
  },
};

export default function WeatherApp() {
  const [lang, setLang] = useState("pl");
  const t = UI[lang];

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [place, setPlace] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const skipSearch = useRef(false);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            query
          )}&count=5&language=${lang}&format=json`
        );
        const json = await res.json();
        setSuggestions(json.results || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query, lang]);

  useEffect(() => {
    if (!place?.id) return;
    (async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/get?id=${place.id}&language=${lang}`
        );
        const json = await res.json();
        if (json?.name) {
          setPlace((p) => (p ? { ...p, name: json.name, country: json.country } : p));
        }
      } catch {
      }
    })();
  }, [lang]);

  const loadWeather = useCallback(async (lat, lon, label) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,cloud_cover` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
          `&timezone=auto&forecast_days=7`
      );
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
      setPlace((p) => label || p);
    } catch (e) {
      setError(t.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [t.fetchFailed]);

  const selectPlace = (p) => {
    const label = { id: p.id, name: p.name, country: p.country, lat: p.latitude, lon: p.longitude };
    setPlace(label);
    setSuggestions([]);
    skipSearch.current = true;
    setQuery(`${p.name}${p.admin1 ? ", " + p.admin1 : ""}`);
    loadWeather(p.latitude, p.longitude, label);
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError(t.geoUnavailable);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const label = { name: t.yourLocation, country: "", lat: latitude, lon: longitude };
        skipSearch.current = true;
        setQuery(t.yourLocation);
        loadWeather(latitude, longitude, label);
      },
      () => {
        setError(t.geoFailed);
        setLoading(false);
      }
    );
  };

  const current = data?.current;
  const daily = data?.daily;

return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: COLORS.background,
        color: COLORS.textPrimary,
        fontFamily: "Arial, sans-serif",
        padding: "32px 16px 60px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* lang button */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          display: "flex",
          background: COLORS.surfaceLight,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {["pl", "en"].map((code) => (
          <button
            key={code}
            onClick={() => {
              skipSearch.current = true;
              setLang(code);
            }}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: lang === code ? COLORS.activeToggleBg : "transparent",
              color: lang === code ? COLORS.textPrimary : COLORS.textAccentSoft,
            }}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      {/* header */}
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "1px",
              margin: "0 0 4px",
              color: COLORS.textPrimary,
            }}
          >
            {t.title}
          </h1>
          <p style={{ margin: "0 0 20px", color: COLORS.textAccentSoft, fontSize: 13 }}>
            {t.subtitle}
          </p>
        </div>

        {/* search bar */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              padding: "10px 14px",
            }}
          >
            <Search size={16} color={COLORS.textAccentSoft} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: COLORS.textPrimary,
                fontSize: 14,
                flex: 1,
              }}
            />
            {searching && <Loader2 size={14} className="animate-spin" color={COLORS.textAccentSoft} />}
            <button
              onClick={useDeviceLocation}
              title={t.useLocation}
              style={{
                background: COLORS.surface,
                border: "none",
                borderRadius: 8,
                padding: 6,
                cursor: "pointer",
                display: "flex",
              }}
            >
              <MapPin size={15} color={COLORS.textAccent} />
            </button>
          </div>

          {/* suggestions */}
          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: COLORS.panelBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                overflow: "hidden",
                zIndex: 10,
              }}
            >
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectPlace(s)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: COLORS.textPrimary,
                    fontSize: 13,
                    cursor: "pointer",
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  {s.name}
                  {s.admin1 ? `, ${s.admin1}` : ""}{" "}
                  <span style={{ color: COLORS.textAccentSoft }}>· {s.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 14, color: COLORS.error, fontSize: 13 }}>{error}</div>
        )}

        {loading && !data && (
          <div style={{ marginTop: 40, textAlign: "center", color: COLORS.textAccentSoft }}>
            <Loader2 size={22} className="animate-spin" style={{ margin: "0 auto" }} />
            <div style={{ marginTop: 8, fontSize: 13 }}>{t.loading}</div>
          </div>
        )}

        {!data && !loading && (
          <div style={{ marginTop: 60, textAlign: "center", color: COLORS.textDim, fontSize: 13 }}>
            {t.emptyState}
          </div>
        )}

        {current && (
          <div
            style={{
              marginTop: 28,
              textAlign: "center",
            }}
          >
            {/* weather today */}
            <div style={{ fontSize: 13, color: COLORS.textAccent, fontWeight: 600 }}>
              {place?.name}
              {place?.country ? `, ${place.country}` : ""}
            </div>
            <div style={{ fontSize: 56, lineHeight: 1.3, margin: "10px 0 4px" }}>{weather(current.weather_code, lang).icon}</div>
            <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: "1px", lineHeight: 1.2 }}>
              {Math.round(current.temperature_2m)}°C
            </div>
            <div style={{ color: COLORS.textDescription, fontSize: 14, marginTop: 6 }}>
              {weather(current.weather_code, lang).label} · {t.feelsLike} {Math.round(current.apparent_temperature)}°C
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 22,
                marginTop: 20,
                paddingTop: 18,
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              <Stat icon={<Wind size={15} color={COLORS.textAccent} />} label={t.wind} value={`${Math.round(current.wind_speed_10m)} km/h`} />
              <Stat icon={<Droplets size={15} color={COLORS.textAccent} />} label={t.humidity} value={`${current.relative_humidity_2m}%`} />
              <Stat icon={<CloudRain size={15} color={COLORS.textAccent} />} label={t.cloudCover} value={`${current.cloud_cover}%`} />
            </div>
          </div>
        )}

        {/* weather week */}
        {daily && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textAccent, margin: "0 0 10px 4px" }}>
              {t.forecast7}
            </div>
            <div
              style={{
                background: COLORS.surfaceSoft,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {daily.time.map((date, i) => {
                const d = new Date(date);
                const dayLabel = i === 0 ? t.today : DAY_NAMES[lang][d.getDay()];
                return (
                  <div
                    key={date}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom:
                        i < daily.time.length - 1 ? `1px solid ${COLORS.border}` : "none",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ width: 44, fontWeight: 600, color: COLORS.textPrimary }}>{dayLabel}</div>
                    <div style={{ fontSize: 20, width: 34 }}>{weather(daily.weather_code[i], lang).icon}</div>
                    <div style={{ flex: 1, color: COLORS.textAccentSoft }}>{weather(daily.weather_code[i], lang).label}</div>
                    <div style={{ color: COLORS.rain, fontSize: 12, marginRight: 10 }}>
                      💧{daily.precipitation_probability_max[i]}%
                    </div>
                    <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>
                      {Math.round(daily.temperature_2m_max[i])}°
                    </div>
                    <div style={{ color: COLORS.textFaint, marginLeft: 6 }}>
                      {Math.round(daily.temperature_2m_min[i])}°
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 28, textAlign: "center", fontSize: 11, color: COLORS.textFooter }}>
          {t.source}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {icon}
      <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 10, color: COLORS.textMuted }}>{label}</div>
    </div>
  );
}