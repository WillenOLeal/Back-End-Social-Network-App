import { graphqlCall } from '../../test-utils/graphqlCall';
import dbInit from '../../test-utils/dbConnInit';
import { getPostInput, getUserObj } from '../../test-utils/util-functions';
import { User } from '../../entity/User';
import { getAuthToken } from '../utils/auth';
import { Post } from '../../entity/Post';
import { PostUpdateInput } from '../types/InputTypes';

dbInit(); 

const createPostMutation = `
    mutation($data: PostInput!) {
        createPost(postInput: $data){
            id
            title
            text
            imgName
            user {
                id
                username
                email
            }
        }
    }
`

const updatePostMutation = `
    mutation($id: Int!, $data: PostUpdateInput!) {
        updatePost(id: $id, input: $data){
            title
            text
            imgName
            user {
                username
                email
            }
        }
    }
`


const getPostQuery = `
    query getPost($id: Int!) {
        getPost(id: $id){
            id
            title
            text
            createdAt
            updatedAt
            imgName
            user {
                username
                email
            }
        }
    }
`

const deletePostMutation = `
    mutation($id: Int!) {
        deletePost(id: $id)
    }
`

let user: User;
let authToken: string;
let post: Post;  

describe('Create Post', () => {

    beforeAll(async () => {
        user = await User.create(getUserObj()).save(); 
        authToken  = getAuthToken(user).authToken
    }); 

    it('creates a post', async () => {

        const postInput = getPostInput(); 

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
                    imgName: postInput.imgName,
                    user: {
                        username: user.username,
                        email: user.email
                    }
                }
            }
        });

        post = await Post.findOne({title: postInput.title, text: postInput.text, userId: user.id}); 
        expect(post).toBeDefined(); 
    });

    it('updates a post', async () => {
        
        const postUpdateInput = getPostInput(); 

         post = await Post.findOne({userId: user.id})

        const response = await graphqlCall({
            source: updatePostMutation, 
            variableValues: {
                id: post.id,
                data: postUpdateInput
            },
            authToken: `Bearer ${authToken}`   
        });


        expect(response).toMatchObject({
            data: {
                updatePost: {
                    title: postUpdateInput.title,
                    text: postUpdateInput.text,
                    imgName: postUpdateInput.imgName,
                    user: {
                        username: user.username,
                        email: user.email
                    }
                }
            }
        });
    }); 

    it('reads a post', async() => {

        post = await Post.findOne({userId: user.id})

        const response = await graphqlCall({
            source: getPostQuery, 
            variableValues: {
                id: post.id
            },
            authToken: `Bearer ${authToken}`   
        });

        expect(response).toMatchObject({
            data: {
                getPost: {
                    title: post.title,
                    text: post.text,
                    imgName: post.imgName,
                    user: {
                        username: user.username,
                        email: user.email
                    }
                }
            }
        });
    });

    it('deletes a post', async () => {
        post = await Post.findOne({userId: user.id})

        const response = await graphqlCall({
            source: deletePostMutation, 
            variableValues: {
                id: post.id
            },
            authToken: `Bearer ${authToken}`   
        });

        expect(response).toMatchObject({
            data: {
                deletePost: true
            }
        });

        const delPost = await Post.findOne({id: post.id})
        expect(delPost).not.toBeDefined(); 
    })
});




