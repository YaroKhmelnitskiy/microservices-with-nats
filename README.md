# Nest-auth

## Перед запуском

1. Иметь pnpm для dev и test (prod можно запустить просто в контейнерах)

2. Ставим зависимости

```
pnpm i
```

## Для запуска

### prod

1. Заходим в /env/, смотрим .env.example
2. Создаем .env.prod с наполнением как в .env.example

По формату - s - секунды, m - минуты, и т.д. h, d, w

```
REFRESH_EXPIRED_IN=7d
ACCESS_EXPIRED_IN=1h
```

3. Запускаем

Если есть pnpm

```
pnpm docker:prod:build
pnpm docker:prod:run
```

Если pnpm нет  
Из корня проекта:

```
docker compose -f ./docker/compose.prod.yaml build
docker compose -f ./docker/compose.prod.yaml --env-file ./env/.env.prod up -d
```

Запустится docker compose приложуха на указанных в env портах

```
http://localhost:${APP_PORT}/api
http://localhost:${APP_PORT}/swagger - Swagger
```

### dev

1. В /env/ создаем .env.dev по примеру .env.example
2. Собираем докер образ Postgres'а

```
pnpm:dev:build
pnpm:dev:run
```

3. Генерируем prisma-client

```
pnpm prisma generate
```

4. Применяем миграции

```
pnpm migration:dev
```

5. Запускаем приложение в watch-режиме

```
pnpm start:dev
```

Endpoints:

```
http://localhost:${APP_PORT}/api
http://localhost:${APP_PORT}/swagger - Swagger
```

### test

1. В /env/ создаем .env.test по примеру .env.example
2. Собираем докер образ Postgres'а

```
pnpm:test:build
pnpm:test:run
```

3. Генерируем prisma-client

```
pnpm prisma generate
```

4. Применяем миграции

```
pnpm migration:test
```

5. Запускаем тесты

```
pnpm test # module tests
pnpm test:e2e # end-to-end tests
```
