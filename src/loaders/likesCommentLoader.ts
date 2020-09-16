import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { Comment } from "../entity/Comment";

type batchLike = (ids: number[]) => Promise<number[]>;

const batchLikes: batchLike = async (ids) => {
  const comments = await getConnection()
    .getRepository(Comment)
    .createQueryBuilder("comment")
    .select(["comment.id"])
    .leftJoin("comment.likes", "likes")
    .loadRelationCountAndMap("comment.likes", "comment.likes")
    .where("comment.id IN (:...ids)", { ids: ids })
    .getMany();

  const likesMap: { [key: number]: number } = {};

  comments.forEach((comment) => {
    likesMap[comment.id as number] = comment.likes as any;
  });

  const likes = ids.map((id) => likesMap[id]);

  return likes;
};

export const likesCommentLoader = () =>
  new DataLoader<number, number>(batchLikes);
