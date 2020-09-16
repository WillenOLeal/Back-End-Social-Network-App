import { graphqlCall } from "../../test-utils/graphqlCall";
import dbInit from "../../test-utils/dbConnInit";
import { getPostInput, getUserObj } from "../../test-utils/util-functions";
import { User } from "../../entity/User";
import { Friendship } from "../../entity/Friendship";
import { getAuthToken } from "../utils/auth";
import { Post } from "../../entity/Post";

dbInit();

const addFriendMutation = `
    mutation($id: Int!){
        addFriend(useerId: $id)
    }
`;

const confirmUserRequestMutation = `
    mutation($id: Int!) {
        confirmFriendRequest(userId: $id)
    }
`;

const unfriendMutation = `
    mutation($id: Int!){
        unfriend(userId: $id)
    }
`;

let user1: User;
let user2: User;
let authToken1: string;
let authToken2: string;

describe("Test User Resolver", () => {
  beforeAll(async () => {
    const user1Promise = User.create(getUserObj()).save();
    const user2Promise = User.create(getUserObj()).save();
    const users = await Promise.all([user1Promise, user2Promise]);
    user1 = users[0];
    user2 = users[1];
    authToken1 = getAuthToken(user1).authToken;
    authToken2 = getAuthToken(user2).authToken;
  });

  it("sends a friend request", async () => {
    const response = await graphqlCall({
      source: addFriendMutation,
      variableValues: {
        id: user2.id,
      },
      authToken: `Bearer ${authToken1}`,
    });

    expect(response).toMatchObject({
      data: {
        addFriend: true,
      },
    });

    const friendship = await Friendship.findOne({ senderId: user1.id });

    expect(friendship.receiverId).toBe(user2.id);
    expect(friendship.status).toBe(0);
  });

  it("accepts friend request", async () => {
    const response = await graphqlCall({
      source: confirmUserRequestMutation,
      variableValues: {
        id: user1.id,
      },
      authToken: `Bearer ${authToken2}`,
    });

    expect(response).toMatchObject({
      data: {
        confirmFriendRequest: true,
      },
    });

    const friendship = await Friendship.findOne({ senderId: user1.id });
    expect(friendship.receiverId).toBe(user2.id);
    expect(friendship.status).toBe(1);
  });
  it("unfriend", async () => {
    const response = await graphqlCall({
      source: unfriendMutation,
      variableValues: {
        id: user1.id,
      },
      authToken: `Bearer ${authToken2}`,
    });

    expect(response).toMatchObject({
      data: {
        unfriend: true,
      },
    });

    const friendship = await Friendship.findOne({ senderId: user1.id });
    expect(friendship).toBeUndefined();
  });
});
