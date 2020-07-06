console.log(process.env.DATABASE_URL, 'llllldklajdklfjskl')
module.exports = {
   "type": "postgres",
   "url": process.env.DATABASE_URL, 
   "synchronize": true,
   "logging": true,
   "entities": [
      "server/entity/**/*.ts"
   ],
   "migrations": [
      "server/migration/**/*.ts"
   ],
   "subscribers": [
      "server/subscriber/**/*.ts"
   ],
   "cli": {
      "entitiesDir": "server/entity",
      "migrationsDir": "server/migration",
      "subscribersDir": "server/subscriber"
   }
}