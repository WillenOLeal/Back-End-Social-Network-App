import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { Post } from "../entity/Post";

type batchComment = (ids: number[]) => Promise<number[]>;

const batchComments: batchComment = async (ids) => {
  const posts = await getConnection()
    .getRepository(Post)
    .createQueryBuilder("post")
    .select(["post.id"])
    .leftJoin("post.comments", "comments")
    .loadRelationCountAndMap("post.comments", "post.comments")
    .where("post.id IN (:...ids)", { ids: ids })
    .getMany();

  const commentsMap: { [key: number]: number } = {};

  posts.forEach((post) => {
    commentsMap[post.id as number] = post.comments as any;
  });

  const comments = ids.map((id) => commentsMap[id]);
  return comments;
};

export const commentsPostLoader = () =>
  new DataLoader<number, number>(batchComments);
