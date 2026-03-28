---
id: PRD-001
name: "Personalised Daily Weather + Transport"
version: 1.0
difficulty: medium
estimated_features: 15
estimated_impl_time: 90min
---

# PRD: Personalised Daily Weather + Transport

## Purpose

A single-page web application that gives a user a personalised at-a-glance view of today's weather and local public transport departures for a configurable location in NSW, Australia. The app should be genuinely useful for a daily commuter: open it, see the weather, see your next bus/train/ferry, close it.

## Tech Stack (Constrained)

| Component | Choice |
|-----------|--------|
| Build tool | Vite |
| Framework | React |
| Language | TypeScript |
| Styling | Tailwind CSS |

No other frameworks or UI libraries. No backend — all API calls are made directly from the browser.

## Data Sources

### Weather: Open-Meteo

- Base URL: `https://api.open-meteo.com/v1/forecast`
- No API key required
- Use the **BOM ACCESS-G** model for Australian accuracy: `&models=bom_access_global`
- Required parameters:
  - `latitude`, `longitude` — from user's configured location
  - `current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m`
  - `daily=weather_code,temperature_2m_max,temperature_2m_min`
  - `timezone=Australia%2FSydney`
  - `forecast_days=5`
- Weather codes follow the WMO standard (0 = clear sky, 1-3 = partly cloudy, 45/48 = fog, 51-67 = rain/drizzle, 71-77 = snow, 80-82 = showers, 95-99 = thunderstorm)

### Transport: TfNSW Open Data Hub

- Base URL: `https://api.transport.nsw.gov.au/v1/tp/`
- **Requires API key** via `Authorization: apikey YOUR_KEY` header
- Key endpoints:
  - `departure_mon` — next departures from a stop. Required params: `outputFormat=rapidJSON`, `coordOutputFormat=EPSG%3A4326`, `mode=direct`, `type_dm=stop`, `name_dm=<stop_id>`, `departureMonitorMacro=true`, `TfNSWDM=true`, `version=10.2.1.42`
  - `stop_finder` — search for stops by name. Required params: `outputFormat=rapidJSON`, `type_sf=stop`, `name_sf=<query>`, `coordOutputFormat=EPSG%3A4326`, `TfNSWTR=true`, `version=10.2.1.42`
- Stop IDs are strings (e.g., `"200060"` for Wynyard Station)
- The `departure_mon` response contains `stopEvents[]`, each with `departureTimePlanned`, `departureTimeEstimated`, `transportation.product.name`, `transportation.number`, `transportation.destination.name`

## Requirements

### Weather Display

**R01**: Display the current temperature in Celsius for the user's configured location, sourced from the Open-Meteo API's `current.temperature_2m` field. Show the value prominently with a `°C` unit label.

**R02**: Display a 5-day weather forecast showing, for each day: the day label (e.g. "Mon", "Tue"), the high and low temperature in Celsius, and a weather condition icon derived from the WMO weather code. Days should be displayed in a horizontal row.

**R03**: Display the "feels like" temperature (`current.apparent_temperature`) alongside the actual current temperature, labelled clearly as "Feels like X°C".

**R04**: Display the current wind speed (`current.wind_speed_10m`) in km/h with an appropriate label.

### Transport Departures

**R05**: Display the next 5 upcoming departures from the user's saved transport stop, sourced from the TfNSW `departure_mon` endpoint. For each departure show: transport mode, route/line identifier, destination name, and scheduled departure time in HH:MM format (AEST/AEDT).

**R06**: For each departure, show the real-time delay status: if `departureTimeEstimated` differs from `departureTimePlanned` by more than 1 minute, display the delay prominently (e.g., "+3 min late") in amber/red. If on time, show a green "On time" indicator.

**R07**: Display a transport mode icon for each departure that reflects the actual mode: bus, train, ferry, light rail, or coach. Use the `transportation.product.name` field to determine the mode.

### Personalisation

**R08**: Persist the user's preferred location (suburb name + coordinates) in `localStorage`. The app must load this saved location on startup without prompting the user to configure it again.

**R09**: Persist the user's preferred transport stop (stop ID + display name) in `localStorage`. The app must load this saved stop on startup without prompting.

**R10**: Display a time-of-day greeting in the header that changes based on the current local time: "Good morning" (5am–11:59am), "Good afternoon" (12pm–5:59pm), "Good evening" (6pm–9:59pm), "Good night" (10pm–4:59am).

### Settings

**R11**: Provide a settings panel (accessible via a gear/settings icon) with a location search field. Searching by suburb name or postcode should query a static list of NSW suburbs with coordinates (at minimum: Sydney CBD, Parramatta, Chatswood, Bondi Beach, Newtown, Manly, Penrith, Wollongong, Newcastle, Canberra). Selecting a result saves it via R08 and immediately refreshes weather data.

**R12**: Within the settings panel, provide a transport stop search field. Entering a stop name queries the TfNSW `stop_finder` endpoint and displays matching results. Selecting a result saves it via R09 and immediately refreshes departure data.

### UI & Behaviour

**R13**: The layout must be responsive and mobile-first. On screens narrower than 640px (Tailwind `sm` breakpoint), the weather summary and transport departures stack vertically. On wider screens they appear side by side.

**R14**: Automatically refresh both weather and transport data every 5 minutes without requiring a page reload. A manual refresh button must also be present.

**R15**: Display a "Last updated" timestamp below the departure list, showing the exact time the data was last fetched (formatted as HH:MM:SS AEST/AEDT). This timestamp must update each time data is refreshed.

---

<!--
REVIEW ONLY: Do not include in spec generator prompts.

## Implied Requirements (Review Reference Only)

These requirements are NOT shown to spec generators. A high-quality spec should discover and address these independently. They are used during LLM-as-judge review to assess spec depth.

- **IR01: Loading states** — Both the weather panel and transport panel should display a loading skeleton or spinner while their respective API calls are in flight. The two panels load independently (one can show data while the other loads).

- **IR02: Weather API error state** — If the Open-Meteo request fails (network error, non-2xx response), the weather panel should display a user-friendly error message (e.g. "Weather unavailable — tap to retry") rather than a blank panel or silent failure.

- **IR03: Transport API auth failure** — If the TfNSW API returns 401 or 403 (missing or invalid API key), the transport panel should display a specific message indicating the API key needs to be configured, distinguishable from a general network failure.

- **IR04: Empty state** — When the app first loads with no saved location or stop configured, it must display a clear onboarding prompt guiding the user to open settings and configure both. The main panels should not show empty or broken UI.

- **IR05: TfNSW rate limiting** — TfNSW enforces approximately 5 requests/second. The app should not fire concurrent requests to TfNSW in a way that could trigger rate limiting (e.g., debounce stop search input by at least 300ms, serialise refresh calls).

- **IR06: Data staleness indicator** — If the last successful data refresh was more than 10 minutes ago (e.g., due to a background tab or network loss), display a visible warning banner indicating the data may be stale.

- **IR07: Timezone-aware display** — All times displayed in the UI (departure times, last-updated timestamp, forecast days) must be rendered in AEST (UTC+10) or AEDT (UTC+11) as appropriate for the current date, NOT in the user's browser timezone. Use the `Australia/Sydney` timezone for all display formatting.

- **IR08: Accessible colour contrast** — Weather condition indicators and delay status colours (green/amber/red) must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text) to remain readable on both light and dark backgrounds.
-->
