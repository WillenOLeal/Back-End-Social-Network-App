import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { Comment } from "../entity/Comment";

interface ArgList {
  id: number;
  userId: number;
}

const batchHasLikes = async (args: any) => {
  const ids: number[] = args.map((arg: any) => arg.id);
  const userId: number = args[0].userId;

  const comments = await getConnection()
    .getRepository(Comment)
    .createQueryBuilder("comment")
    .loadAllRelationIds({ relations: ["likes"] })
    .where("comment.id IN (:...ids)", { ids: ids })
    .getMany();

  const hasLikedMap: { [key: number]: boolean } = {};

  comments.forEach((comment) => {
    hasLikedMap[comment.id as number] = comment.likes.includes(userId as any);
  });

  const hasLikedArray = ids.map((id) => hasLikedMap[id]);

  return hasLikedArray;
};

export const hasLikedCommentLoader = () =>
  new DataLoader<ArgList, boolean>(batchHasLikes);
