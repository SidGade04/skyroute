# SkyRoute API

Spring Boot 3.3 / Java 21 service. Wraps Duffel offers with baggage-aware pricing, serves airports from PostgreSQL (Supabase), caches in Redis, validates Supabase JWTs, and polls Sniper alerts every 15 min (emails via Resend).

## Configuration

`src/main/resources/application.properties` is gitignored. Create it with:

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

# optional
supabase.url=https://<project>.supabase.co
sniper.mail.resend-key=<resend_key>
sniper.mail.from=SkyRoute <onboarding@resend.dev>
sniper.app-url=http://localhost:3000
```

If the `REDIS_URL` env var is set (e.g. on Render), it overrides `spring.data.redis.*`.

SQL for the `users`, `snipers` tables and the new-user trigger lives in `src/main/resources/db/`.

## Run / build

```bash
./mvnw spring-boot:run                  # http://localhost:8080   (Windows: .\mvnw.cmd)
./mvnw clean package -DskipTests        # target/skyroute-api-0.0.1-SNAPSHOT.jar
java -jar target/skyroute-api-0.0.1-SNAPSHOT.jar
./mvnw test
```

Docker (multi-stage, JRE 21 alpine, port 8080):

```bash
docker build -t skyroute-api .
docker run -p 8080:8080 skyroute-api
```

`.dockerignore` doesn't exclude `application.properties`, so a local copy gets baked into the image. Don't push that image to a public registry.

## Endpoints

🔒 = requires `Authorization: Bearer <supabase_jwt>`.

| Method | Path                                 | Description                                   |
| ------ | ------------------------------------ | --------------------------------------------- |
| GET    | `/api/v1/health`                     | Health check                                  |
| POST   | `/api/v1/flights/search`             | Search offers; paginated, optional `airline` filter |
| POST   | `/api/v1/flights/rendezvous` 🔒      | Rank mutual destinations for multiple origins |
| GET    | `/api/v1/airports`                   | All airports                                  |
| GET    | `/api/v1/airports/autocomplete?q=`   | Airport autocomplete                          |
| GET    | `/api/v1/airports/popular?limit=`    | Popular airports (cached 24 h)                |
| GET    | `/api/v1/airports/hubs`              | Major hubs                                    |
| GET    | `/api/v1/airports/{iata}`            | Airport by IATA code                          |
| GET    | `/api/v1/fx/rates`                   | Latest FX rates (cached 24 h)                 |
| GET    | `/api/v1/users/phone-taken`          | Phone number availability                     |
| POST   | `/api/v1/users/sync` 🔒              | Upsert user from JWT                          |
| GET    | `/api/v1/users/me` 🔒                | Current user                                  |
| PATCH  | `/api/v1/users/me` 🔒                | Update current user                           |
| POST   | `/api/v1/snipers/quote` 🔒           | Quote a sniper before arming                  |
| POST   | `/api/v1/snipers` 🔒                 | Create sniper                                 |
| GET    | `/api/v1/snipers` 🔒                 | List snipers                                  |
| GET    | `/api/v1/snipers/{id}` 🔒            | Get sniper                                    |
| POST   | `/api/v1/snipers/{id}/disarm` 🔒     | Disarm                                        |
| POST   | `/api/v1/snipers/{id}/rearm` 🔒      | Rearm                                         |
| DELETE | `/api/v1/snipers/{id}` 🔒            | Delete                                        |

## Layout

```
io.skyroute.api
  config/      Duffel, FX, Redis cache, security, schema init
  controller/  REST controllers
  service/     search, Duffel client, FX, rendezvous ranking, sniper poller/evaluator/mailer
  model/       dto (request/response) and JPA entities
  repository/  Spring Data JPA
  mapper/, exception/, security/, util/
```

## Notes

- After changing a cached DTO's shape or the Redis serializer, run `redis-cli FLUSHDB` or cached reads will fail.
- exchangeratesapi free plan is EUR-based only; the client converts via cross-rate.
