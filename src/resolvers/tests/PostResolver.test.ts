import { graphqlCall } from '../../test-utils/graphqlCall';
import dbInit from '../../test-utils/dbConnInit';
import { getPostInput, getUserObj } from '../../test-utils/util-functions';
import { User } from '../../entity/User';
import { getAuthToken } from '../utils/auth';
import { Post } from '../../entity/Post';

dbInit(); 

const createPostMutation = `
    mutation($data: PostInput!) {
        createPost(postInput: $data){
            id
            title
            text
            user {
                id
                username
                email
            }
        }
    }
`

describe('Create Post', () => {
    it('creates a post', async () => {

        const postInput = getPostInput(); 

        const user = await User.create(getUserObj()).save()

        const {authToken} = getAuthToken(user); 

        const response = await graphqlCall({
            source: createPostMutation, 
            variableValues: {
                data: postInput
            },
            authToken: `Bearer ${authToken}`   
            
        });


        expect(response).toMatchObject({
            data: {
                createPost: {
                    title: postInput.title,
                    text: postInput.text,
                    user: {
                        username: user.username,
                        email: user.email
                    }
                }
            }
        });

        const post = await Post.findOne({title: postInput.title, text: postInput.text, userId: user.id}); 
        expect(post).toBeDefined(); 
    });
});




