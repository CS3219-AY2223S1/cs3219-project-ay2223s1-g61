import QuestionDifficulty from '../../common/QuestionDifficulty';
import RedisClient from '../db';

type TPoolData = {
  username: string;
  roomID: string;
};

const getFromRedis = async (key: string): Promise<Record<string, TPoolData>> => {
  const data = await RedisClient.get(key);
  return JSON.parse(data ?? '{}');
};

export const createMatch = async (username: string, difficulty: QuestionDifficulty, roomID: string) => {
  try {
    const key = difficulty.toString();
    const pool = await getFromRedis(key);
    pool[username] = { username, roomID };
    await RedisClient.set(key, JSON.stringify(pool));
    return { errMsg: null };
  } catch {
    return { errMsg: 'Something went wrong with creating a match' };
  }
};

export const deleteMatch = async (username: string, difficulty: QuestionDifficulty) => {
  try {
    const key = difficulty.toString();
    const pool = await getFromRedis(key);
    delete pool[username];
    await RedisClient.set(key, JSON.stringify(pool));
    return { errMsg: null };
  } catch {
    return { errMsg: 'Something went wrong with deleting a match' };
  }
};

export const findMatch = async (username: string, difficulty: QuestionDifficulty) => {
  try {
    const key = difficulty.toString();
    const pool = await getFromRedis(key);
    const possibleMatches = Object.entries(pool);
    for (const [possibleUsername, data] of possibleMatches) {
      if (possibleUsername === username) continue;
      return { user: data, errMsg: null };
    }
    return { user: null, errMsg: null };
  } catch {
    return { user: null, errMsg: 'Something went wrong with finding a match' };
  }
};
