const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
    throw new Error('Defina DATABASE_URL em .env ou .env.local para executar as migrations')
}

const database = new URL(databaseUrl)

export default {
    migrationPattern: 'src/database/migrations/*',
    driver: 'pg',
    host: database.hostname,
    port: Number(database.port || 5432),
    database: decodeURIComponent(database.pathname.slice(1)),
    username: decodeURIComponent(database.username),
    password: decodeURIComponent(database.password),
}
