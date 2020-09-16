import { graphqlCall } from "../../test-utils/graphqlCall";
import dbInit from "../../test-utils/dbConnInit";
import { getPostInput, getUserObj } from "../../test-utils/util-functions";
import { User } from "../../entity/User";
import { getAuthToken } from "../utils/auth";
import { Post } from "../../entity/Post";

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
`;

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
`;

const getPostQuery = `
    query getPost($id: Int!) {
        getPost(id: $id){
            id
            title
            text
            imgName
            user {
                username
                email
            }
        }
    }
`;

const getPostsQuery = `
    query getPosts($pagination: PaginationInput!){
        getPosts(paginationInput: $pagination){
            posts {
                id
                title
                text 
                imgName
                createdAt
                updatedAt
                userId
            }
        }
    }
`;

const deletePostMutation = `
    mutation($id: Int!) {
        deletePost(id: $id)
    }
`;

const likeDislikePostMutation = `
    mutation($id: Int!) {
        likePostToggle(id: $id)
    }
`;

let user: User;
let authToken: string;
let post: Post;

describe("Post CRUD + Like Post", () => {
  beforeAll(async () => {
    user = await User.create(getUserObj()).save();
    authToken = getAuthToken(user).authToken;
  });

  it("creates a post", async () => {
    const postInput = getPostInput();

    const response = await graphqlCall({
      source: createPostMutation,
      variableValues: {
        data: postInput,
      },
      authToken: `Bearer ${authToken}`,
    });

    expect(response).toMatchObject({
      data: {
        createPost: {
          title: postInput.title,
          text: postInput.text,
          imgName: postInput.imgName,
          user: {
            username: user.username,
            email: user.email,
          },
        },
      },
    });

    post = await Post.findOne({
      title: postInput.title,
      text: postInput.text,
      userId: user.id,
    });
    expect(post).toBeDefined();
  });

  it("updates a post", async () => {
    const postUpdateInput = getPostInput();

    post = await Post.findOne({ userId: user.id });

    const response = await graphqlCall({
      source: updatePostMutation,
      variableValues: {
        id: post.id,
        data: postUpdateInput,
      },
      authToken: `Bearer ${authToken}`,
    });

    expect(response).toMatchObject({
      data: {
        updatePost: {
          title: postUpdateInput.title,
          text: postUpdateInput.text,
          imgName: postUpdateInput.imgName,
          user: {
            username: user.username,
            email: user.email,
          },
        },
      },
    });
  });

  it("reads a post", async () => {
    post = await Post.findOne({ userId: user.id });

    const response = await graphqlCall({
      source: getPostQuery,
      variableValues: {
        id: post.id,
      },
      authToken: `Bearer ${authToken}`,
    });

    expect(response).toMatchObject({
      data: {
        getPost: {
          title: post.title,
          text: post.text,
          imgName: post.imgName,

          user: {
            username: user.username,
            email: user.email,
          },
        },
      },
    });
  });

  it("reads posts", async () => {
    const post1Promise = Post.create({
      ...getPostInput(),
      userId: user.id,
    }).save();
    const post2Promise = Post.create({
      ...getPostInput(),
      userId: user.id,
    }).save();
    const post3Promise = Post.create({
      ...getPostInput(),
      userId: user.id,
    }).save();

    const posts = await Promise.all([post1Promise, post2Promise, post3Promise]);

    const updatedPosts = posts.map((post) => {
      return {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    });

    const response = await graphqlCall({
      source: getPostsQuery,
      variableValues: {
        pagination: {
          page: 1,
          limit: 5,
        },
      },
      authToken: `Bearer ${authToken}`,
    });

    expect(response.data.getPosts.posts[2]).toMatchObject(updatedPosts[0]);
    expect(response.data.getPosts.posts[1]).toMatchObject(updatedPosts[1]);
    expect(response.data.getPosts.posts[0]).toMatchObject(updatedPosts[2]);
  });

  it("likes and dislikes a post", async () => {
    post = await Post.findOne({ userId: user.id });

    let response = await graphqlCall({
      source: likeDislikePostMutation,
      variableValues: {
        id: post.id,
      },
      authToken: `Bearer ${authToken}`,
    });

    expect(response).toMatchObject({
      data: {
        likePostToggle: true,
      },
    });

    let posts = await Post.find({
      where: { id: post.id },
      relations: ["likes"],
    });

    expect(posts[0].likes.length).toBe(1);

    response = await graphqlCall({
      source: likeDislikePostMutation,
      variableValues: {
        id: post.id,
      },
      authToken: `Bearer ${authToken}`,
    });

    expect(response).toMatchObject({
      data: {
        likePostToggle: true,
      },
    });

    posts = await Post.find({
      where: { id: post.id },
      relations: ["likes"],
    });

    expect(posts[0].likes.length).toBe(0);
  });

  it("deletes a post", async () => {
    post = await Post.findOne({ userId: user.id });

    const response = await graphqlCall({
      source: deletePostMutation,
      variableValues: {
        id: post.id,
      },
      authToken: `Bearer ${authToken}`,
    });

    expect(response).toMatchObject({
      data: {
        deletePost: true,
      },
    });

    const delPost = await Post.findOne({ id: post.id });
    expect(delPost).not.toBeDefined();
  });
});
