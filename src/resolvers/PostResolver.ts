import {
  Resolver,
  Mutation,
  Query,
  Arg,
  FieldResolver,
  Root,
  UseMiddleware,
  Ctx,
  Int,
} from "type-graphql";
import { v4 as uuidv4 } from "uuid";
import { getConnection, In } from "typeorm";
import { GraphQLUpload, FileUpload } from "graphql-upload";
import { Post } from "../entity/Post";
import { User } from "../entity/User";
import { PostInput, PostUpdateInput } from "./types/InputTypes";
import { isAuth } from "./middlewares/isAuth";
import { MyContext } from "./types/MyContext";
import { uploadResponse, getPostsResponse } from "./types/OutputTypes";
import { PaginationInput } from "./types/InputTypes";
import { Friendship } from "../entity/Friendship";
import { uploadToS3FromStream, deleteImgFromS3 } from "./utils/aws-utils";

const getPostImgAndDelete = async (postId: number, userId: number) => {
  const post = await getConnection()
    .getRepository(Post)
    .createQueryBuilder("post")
    .select(["post.imgName"])
    .where("post.id = :id AND post.userId = :userId", {
      id: postId,
      userId: userId,
    })
    .getOne();

  if (post) deleteImgFromS3(post.imgName, "posts");
};

const getFriendIds = async (userId: number) => {
  const STATUS: number = 1;

  const friends = await getConnection()
    .getRepository(Friendship)
    .createQueryBuilder("friendship")
    .select(["friendship.senderId", "friendship.receiverId"])
    .where("friendship.senderId = :id AND friendship.status = :status", {
      id: userId,
      status: STATUS,
    })
    .orWhere("friendship.receiverId = :id AND friendship.status = :status", {
      id: userId,
      status: STATUS,
    })
    .cache(`${userId}-getFriendsQuery`)
    .getMany();

  let ids: number[] = [];

  if (friends) {
    friends.forEach((friend) => {
      if (friend.senderId != userId) ids.push(friend.senderId);
      if (friend.receiverId != userId) ids.push(friend.receiverId);
    });
  }

  return [...new Set(ids)];
};

@Resolver(Post)
export class PostResolver {
  @FieldResolver()
  createdAt(@Root() post: Post) {
    return post.createdAt.toISOString();
  }

  @FieldResolver()
  updatedAt(@Root() post: Post) {
    return post.createdAt.toISOString();
  }

  @FieldResolver()
  async likesCount(@Root() post: Post, @Ctx() { likesPostLoader }: MyContext) {
    return likesPostLoader.load(post.id);
  }

  @FieldResolver()
  async commentsCount(
    @Root() post: Post,
    @Ctx() { commentsPostLoader }: MyContext
  ) {
    return commentsPostLoader.load(post.id);
  }

  @FieldResolver()
  async hasLiked(
    @Root() post: Post,
    @Ctx() { hasLikedPostLoader, payload }: MyContext
  ) {
    return hasLikedPostLoader.load({
      id: post.id,
      userId: payload.userId,
    });
  }

  @Mutation(() => uploadResponse)
  @UseMiddleware(isAuth)
  async postImageUpload(
    @Arg("file", () => GraphQLUpload)
    { createReadStream, filename, mimetype }: FileUpload
  ): Promise<uploadResponse> {
    const fileUniqueName = `${uuidv4()}_${filename}`;
    const { writeSream, promise } = uploadToS3FromStream(
      fileUniqueName,
      mimetype,
      "posts"
    );
    return new Promise(async (resolve, reject) =>
      createReadStream()
        .pipe(writeSream)
        .on("finish", async () => {
          try {
            await promise;
            return resolve({
              imgName: fileUniqueName,
              uploaded: true,
            });
          } catch (err) {
            return reject({
              imgName: "",
              uploaded: false,
            });
          }
        })
    );
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("postInput", () => PostInput) postInput: PostInput,
    @Ctx() { payload }: MyContext
  ) {
    const postPromise = Post.create({
      ...postInput,
      userId: payload.userId,
    }).save();
    const userPromise = User.findOne({ where: { id: payload.userId } });
    const values = await Promise.all([postPromise, userPromise]);
    const post = values[0];
    post.user = values[1];
    return post;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { payload }: MyContext
  ) {
    getPostImgAndDelete(id, payload.userId);
    const result = await Post.delete({ id: id, userId: payload.userId });
    if (result.affected > 0) return true;
    else return false;
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("input") input: PostUpdateInput,
    @Ctx() { payload }: MyContext
  ) {
    if (input.imgName) getPostImgAndDelete(id, payload.userId);

    const result = await Post.update({ id: id, userId: payload.userId }, input);
    if (result.affected > 0) {
      let postPromise = Post.findOne({ id: id });
      let userPromise = User.findOne({ id: payload.userId });
      const response = await Promise.all([postPromise, userPromise]);
      const post = response[0];
      post.user = response[1];
      return post;
    } else return null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async likePostToggle(
    @Arg("id", () => Int) id: number,
    @Ctx() { payload }: MyContext
  ) {
    const post = await getConnection()
      .getRepository(Post)
      .createQueryBuilder("post")
      .select(["post.id", "user.id"])
      .leftJoin("post.likes", "user")
      .where("post.id = :id", { id: id })
      .getOne();

    if (!post) return false;

    const user = await User.findOne({ where: { id: payload.userId } });

    let hasLiked = false;

    for (let userObj of post.likes) {
      if (userObj.id == payload.userId) {
        hasLiked = true;
        const likes = post.likes.filter((user) => user.id !== payload.userId);
        post.likes = [...likes];
        await post.save();
        return true;
      }
    }

    if (!hasLiked) {
      post.likes.push(user);
      await post.save();
      return true;
    }
  }

  @Query(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async getPost(
    @Arg("id", () => Int) id: number,
    @Ctx() { payload }: MyContext
  ) {
    const posts = await Post.find({
      where: { id: id, userId: payload.userId },
      relations: ["user"],
      take: 1,
    });
    if (!posts) return null;
    return posts[0];
  }

  @Query(() => getPostsResponse)
  @UseMiddleware(isAuth)
  async getPosts(
    @Arg("paginationInput") { page, limit }: PaginationInput,
    @Ctx() { payload }: MyContext
  ) {
    const take = limit || 10;
    let skip = (page - 1) * take;
    if (page < 0) {
      skip = 0;
    }

    const [result, total] = await Post.findAndCount({
      relations: ["user"],
      where: { userId: payload.userId },
      order: { createdAt: "DESC" },
      take: take,
      skip: skip,
    });

    return {
      posts: result,
      total: total,
    };
  }

  @Query(() => getPostsResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async getAllPosts(
    @Arg("paginationInput") { page, limit }: PaginationInput,
    @Ctx() { payload }: MyContext
  ) {
    const take = limit || 10;
    let skip = (page - 1) * take;
    if (page < 0) {
      skip = 0;
    }

    const ids: number[] = await getFriendIds(payload.userId);
    if (ids.length === 0) return null;

    const [result, total] = await Post.findAndCount({
      relations: ["user"],
      order: { createdAt: "DESC" },
      where: { userId: In(ids) },
      take: take,
      skip: skip,
    });

    return {
      posts: result,
      total: total,
    };
  }

  @Query(() => Boolean)
  async bye() {
    await getConnection().queryResultCache.remove(["users_admins"]);
    return true;
  }
}
