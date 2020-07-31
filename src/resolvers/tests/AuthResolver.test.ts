import { Connection } from 'typeorm';
import {testConn} from '../../test-utils/testConn';
import { graphqlCall } from '../../test-utils/graphqlCall';
import * as faker from 'faker';
import { User } from '../../entity/User';

let conn: Connection; 

beforeAll(async () => {
    conn = await testConn(); 
})
afterAll(async () => {
    await conn.close();
})

const registerMutation = `
mutation Regiter($data: UserInput!) {
    register(userInput: $data){
      id
      email
      username
    }
  }
`

describe('Register', () => {
    it('create-user', async () => {
        const user = {
            username: faker.internet.userName(),
            email: faker.internet.email(),
            password: faker.internet.password()
        }
        const response = await graphqlCall({
            source: registerMutation, 
            variableValues: {
                data: user
            }
        });

        expect(response).toMatchObject({
            data: {
                register: {
                    email: user.email.toLowerCase(),
                    username: user.username 
                }
            }
        })

        const newUser = await User.findOne({where: {email: user.email.toLowerCase()}}); 

        expect(newUser).toBeDefined(); 
        expect(newUser!.email).toBe(user.email.toLowerCase()); 
        expect(newUser!.username).toBe(user.username); 

    })
})


