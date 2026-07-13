# Diagrama de Arquitectura — Módulo Weather

## Flujo de datos

```mermaid
flowchart TD
    subgraph UI["UI Layer"]
        W["Weather.tsx\n(pantalla principal)"]
        WW["WeatherWidget\n(Dashboard)"]
    end

    subgraph Hooks["Hooks"]
        UAR["useAutoRefresh\n(debounce 500ms\n+ interval 30min)"]
    end

    subgraph Service["weatherService.ts"]
        GCW["getCurrentWeather(lat, lon)"]
        GF["getForecast(lat, lon)"]
        GCC["getCachedData()\nTTL: 30 min"]
        GCF["getCachedForecast()\nTTL: 7 días"]
        SCC["setCachedData()"]
        SCF["setCachedForecast()"]
        CWC["clearWeatherCache()"]
    end

    subgraph Cache["localStorage Cache"]
        CC["weather_cache_{lat}_{lon}\n(30 min TTL)"]
        FC["weather_forecast_cache_{lat}_{lon}\n(7 días TTL)"]
    end

    subgraph External["APIs Externas"]
        OWM["OpenWeatherMap API\n/weather + /forecast"]
    end

    subgraph Store["Zustand Store / Supabase"]
        WS["weatherData\n(erp_weather_data)"]
    end

    W --> UAR
    WW --> GCW
    UAR --> GCW
    UAR --> GF

    GCW --> GCC
    GCC -->|"hit"| CC
    GCC -->|"miss"| OWM
    OWM -->|"response"| SCC
    SCC --> CC

    GF --> GCF
    GCF -->|"hit"| FC
    GCF -->|"miss"| OWM
    OWM -->|"response"| SCF
    SCF --> FC

    GCW --> WS
    GF --> WS
    WS --> W
    WS --> WW

    CWC -.->|"limpia"| CC
    CWC -.->|"limpia"| FC
```

## Estrategia de caché

| Tipo de dato | Clave localStorage | TTL | Estrategia |
|---|---|---|---|
| Clima actual | `weather_cache_{lat}_{lon}` | 30 minutos | Cache-first → API si expirado |
| Pronóstico 7 días | `weather_forecast_cache_{lat}_{lon}` | 7 días | Cache-first → API si expirado |

## Auto-refresh

```mermaid
sequenceDiagram
    participant C as Componente
    participant D as Debounce (500ms)
    participant I as Interval (30min)
    participant S as weatherService

    C->>D: mount / weather cambia
    D->>S: refreshWeather() (una sola vez)
    S-->>C: datos actualizados

    loop cada 30 minutos
        I->>S: refreshWeather()
        S-->>C: datos actualizados
    end

    C->>C: unmount → clearTimeout + clearInterval
```

## Persistencia Supabase

```mermaid
erDiagram
    erp_weather_data {
        uuid id PK
        uuid proyecto_id FK
        text ciudad
        float temperatura
        text descripcion
        float humedad
        float viento
        jsonb forecast_data
        timestamptz fetched_at
        timestamptz created_at
    }

    erp_proyectos ||--o{ erp_weather_data : "tiene"
```

## Archivos del módulo

| Archivo | Responsabilidad |
|---|---|
| `src/erp/screens/Weather.tsx` | Pantalla principal, UI, auto-refresh |
| `src/erp/services/weatherService.ts` | Lógica de fetch, caché, normalización |
| `src/erp/components/WeatherWidget.tsx` | Widget compacto para Dashboard |
| `supabase/migrations/*_weather*.sql` | Schema de persistencia |

*Última actualización: 2026-07-12*
