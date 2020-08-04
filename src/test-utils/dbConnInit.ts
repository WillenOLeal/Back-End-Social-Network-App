import { Connection } from "typeorm";
import { testConn } from './testConn';

export default () => {

    let conn:Connection; 

    beforeAll(async () => {
        conn = await testConn(); 
    })
    afterAll(async () => {
        await conn.close();
    })

    return conn; 
}