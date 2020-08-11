module.exports = {
   "type": "postgres",
   "url": process.env.DATABASE_URL,
   "synchronize": true,
   "logging": true,
   "cache": {
      type: "redis", 
      duration: 10000,
      options: {
         host: process.env.REDIS_HOST,
         port: parseInt(process.env.REDIS_PORT)
      }
   },
   "entities": [
      "src/entity/**/*.ts"
   ],
   "migrations": [
      "src/migration/**/*.ts"
   ],
   "subscribers": [
      "src/subscriber/**/*.ts"
   ],
   "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
   }
}