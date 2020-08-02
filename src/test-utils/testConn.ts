import { createConnection } from 'typeorm';
import 'dotenv/config';

export const testConn = async (drop: boolean = false) => {
    return createConnection({
        "type": "postgres",
        "url": process.env.DATABASE_TEST_URL,
        "synchronize": drop,
        "dropSchema": drop, 
        "entities": [
           __dirname + "/../entity/**/*.ts"
         ]
    })
}