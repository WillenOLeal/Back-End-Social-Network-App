import { Connection } from 'typeorm';
import {testConn} from '../../test-utils/testConn';
import { graphqlCall } from '../../test-utils/graphqlCall';
import faker from 'faker';
import { User } from '../../entity/User';
import { Profile } from '../../entity/Profile';

let conn: Connection; 

beforeAll(async () => {
    conn = await testConn(); 
})
afterAll(async () => {
    await conn.close();
})


const getUserObj = () => {
    return {
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password()
    }
}

const registerMutation = `
    mutation Regiter($data: UserInput!) {
        register(userInput: $data){
            id
            email
            username
        }
    }
`

const loginMutation = `
    mutation Login($email: String!, $password: String!){
        login(email: $email, password: $password) {
            authToken
        }
    }
`

const revokeTokenMutation = `
    mutation ($userId: Int!){
        revokeRefreshToken(userId: $userId)
  }
`

describe('Register', () => {
    it('create user and its associated profile', async () => {

        const user = getUserObj()

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
        });

        const newUser = await User.findOne({where: {email: user.email.toLowerCase()}}); 

        expect(newUser).toBeDefined(); 
        expect(newUser!.email).toBe(user.email.toLowerCase()); 
        expect(newUser!.username).toBe(user.username); 

        const newProfile = await Profile.findOne({where: {userId: newUser.id}}); 

        expect(newProfile).toBeDefined(); 
        expect(newProfile!.userId).toBe(newUser.id); 

    });
    
});

describe('Login', () => {
    it('Tries to log user in', async () => {
        
        const user = getUserObj()

        await graphqlCall({
            source: registerMutation, 
            variableValues: {
                data: user
            }
        });

        const response = await graphqlCall({
            source: loginMutation, 
            variableValues: {
                email: user.email.toLowerCase(), 
                password: user.password, 
            },
        });

        expect(response).toMatchObject({
            data: {
                login: {
                    authToken: response.data.login.authToken
                }
            }
        }); 
    });
}); 


describe('Revoke Refresh Token', () => {
    it('Updates TokenVersion field in the User table', async () => {
        
        const user = getUserObj()

        const newUser = await User.create(user).save(); 

        const response = await graphqlCall({
            source: revokeTokenMutation, 
            variableValues: {
                userId: newUser.id
            },
        });

        expect(response).toEqual({
            data: {
                revokeRefreshToken: true
            }
        })

        const updatedUser = await User.findOne({where: {id: newUser.id}}); 

        expect(updatedUser.tokenVersion).toBe(1); 
    });
}); 







