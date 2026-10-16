# SkyRoute

Fare intelligence that prices the bags you actually fly with. Search flights via Duffel and see the true total — fare, taxes, and checked-bag fees — in your own currency.

## Features

- **Flight search**: one-way / return, passengers (adults, children, infants), cabin class
- **Baggage-aware pricing**: add bags with weights; included allowance is free, extra pieces and overweight are charged
- **Airline filter**: dropdown with airline logos, applied server-side before pagination
- **Currency switcher**: footer dropdown; rates from exchangeratesapi, converted client-side
- **Airport autocomplete** with popular airports and major hubs
- Rendezvous and Sniper (alerts) pages are UI mocks for now

## Stack

| Layer    | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Client   | React 19, Vite, TypeScript, Tailwind v4, shadcn/Radix, axios |
| API      | Spring Boot 3.3, Java 21, Spring Data JPA, RestClient       |
| Data     | PostgreSQL (Supabase) for airports                          |
| Cache    | Redis — Duffel offers (5 min), FX rates (24 h), popular airports (24 h) |
| External | [Duffel](https://duffel.com) offers API, [exchangeratesapi.io](https://exchangeratesapi.io) |

## Project layout

```
client/        React app (Vite dev server proxies /api -> :8080)
skyroute-api/  Spring Boot API
```

## Getting started

### Prerequisites

- Java 21, Node 20+
- Redis on `localhost:6379` (e.g. `docker run -d -p 6379:6379 redis`)
- PostgreSQL with the airports table
- Duffel test token and exchangeratesapi key

### API

`skyroute-api/src/main/resources/application.properties` is gitignored. Create it with:

```properties
spring.application.name=skyroute-api

spring.datasource.url=jdbc:postgresql://<host>:5432/postgres?sslmode=require
spring.datasource.username=<user>
spring.datasource.password=<password>
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=none
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

duffel.api.token=<duffel_test_token>

spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.cache.type=redis

fx.api.base-url=https://api.exchangeratesapi.io/v1
fx.api.key=<exchangeratesapi_key>
```

Run:

```bash
cd skyroute-api
./mvnw spring-boot:run      # Windows: .\mvnw.cmd spring-boot:run
```

### Client

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

Set `VITE_API_URL` to point at a non-proxied API; otherwise requests go through the Vite proxy.

## API

| Method | Path                               | Description                                   |
| ------ | ---------------------------------- | --------------------------------------------- |
| POST   | `/api/v1/flights/search`           | Search offers; paginated, optional `airline` filter, returns `airlines` list |
| GET    | `/api/v1/airports`                 | All airports                                  |
| GET    | `/api/v1/airports/autocomplete?q=` | Airport autocomplete                          |
| GET    | `/api/v1/airports/popular?limit=`  | Popular airports (cached)                     |
| GET    | `/api/v1/airports/hubs`            | Major hubs                                    |
| GET    | `/api/v1/airports/{iata}`          | Airport by IATA code                          |
| GET    | `/api/v1/fx/rates`                 | Latest FX rates `{ base, date, rates }` (cached 24 h) |

## Notes

- After changing a cached DTO's shape or the Redis serializer, flush stale entries (`redis-cli FLUSHDB`) or reads will fail.
- exchangeratesapi's free plan only returns EUR-based rates; the client converts via cross-rate (`amount * rates[to] / rates[from]`).
- Currency conversion is display-only; Duffel prices and books in the offer's currency.
