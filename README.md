Here's the English translation of the provided text:

# Nest-auth

## Prerequisites

1.  Have `pnpm` installed for development and testing (production can be run simply in containers).
2.  Install dependencies:

<!-- end list -->

```
pnpm i
```

## To Run

### Production (prod)

1.  Navigate to the `/env/` directory and examine `.env.example`.

2.  Create an `.env.prod` file with content similar to `.env.example`.

    The format for time durations is as follows: `s` for seconds, `m` for minutes, `h` for hours, `d` for days, `w` for weeks.

    ```
    REFRESH_EXPIRED_IN=7d
    ACCESS_EXPIRED_IN=1h
    ```

3.  Launch the application:

    If you have `pnpm`:

    ```
    pnpm docker:prod:build
    pnpm docker:prod:run
    ```

    If you don't have `pnpm`:  
    From the project root:

    ```
    docker compose -f ./docker/compose.prod.yaml build
    docker compose -f ./docker/compose.prod.yaml --env-file ./env/.env.prod up -d
    ```

    This will start the Docker Compose application on the ports specified in your environment variables.

    ```
    http://localhost:${APP_PORT}/api
    http://localhost:${APP_PORT}/swagger - Swagger
    ```

### Development (dev)

1.  In the `/env/` directory, create an `.env.dev` file based on the `.env.example` template.
2.  Build the Postgres Docker image:
    ```
    pnpm docker:dev:build
    pnpm docker:dev:run
    ```
3.  Generate the Prisma client:
    ```
    pnpm prisma generate
    ```
4.  Apply migrations:
    ```
    pnpm migration:dev
    ```
5.  Start the application in watch mode:
    ```
    pnpm start:dev
    ```

Endpoints:

```
http://localhost:${APP_PORT}/api
http://localhost:${APP_PORT}/swagger - Swagger
```

### Test

1.  In the `/env/` directory, create an `.env.test` file based on the `.env.example` template.
2.  Build the Postgres Docker image:
    ```
    pnpm docker:test:build
    pnpm docker:test:run
    ```
3.  Generate the Prisma client:
    ```
    pnpm prisma generate
    ```
4.  Apply migrations:
    ```
    pnpm migration:test
    ```
5.  Run tests:
    ```
    pnpm test # module tests
    pnpm test:e2e # end-to-end tests
    ```
