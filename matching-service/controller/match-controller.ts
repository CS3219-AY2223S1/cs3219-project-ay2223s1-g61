// This is a socket-io controller. It is similar to routes

import type { Socket } from 'socket.io';
import QuestionDifficulty from '../../common/QuestionDifficulty';
import { MatchClientToServerEvents, MatchInterServerEvents, MatchServerToClientEvents, MatchSocketData } from '../../socket-io-types/types';
import { createMatch, deleteMatch, findMatch } from '../service/match-service';
import sleep from '../../utils/sleep';
import { uuid } from 'uuidv4';

type SocketType = Socket<MatchClientToServerEvents, MatchServerToClientEvents, MatchInterServerEvents, MatchSocketData>;

export const matchEvent = (socket: SocketType) => async (username: string, difficulty: QuestionDifficulty, roomID: string) => {
  const { errMsg } = await createMatch(username, difficulty, roomID);
  if (errMsg) {
    socket.to(roomID).emit('errorEvent');
    return;
  }

  // try to find for roughly 30s
  for (let i = 0; i < 30; i++) {
    const { user, errMsg } = await findMatch(username, difficulty);
    if (errMsg) {
      socket.to(roomID).emit('errorEvent');
      break;
    }

    if (user) {
      const sessionID = uuid();
      socket.to(roomID).emit('matchSuccessEvent', sessionID);
      socket.to(user.roomID).emit('matchSuccessEvent', sessionID);
      break;
    }

    await sleep(1000);
  }

  socket.to(roomID).emit('matchFailureEvent');
};

export const deleteEvent = (socket: SocketType) => async (username: string, difficulty: QuestionDifficulty, roomID: string) => {
  const { errMsg } = await deleteMatch(username, difficulty);
  if (errMsg) {
    socket.to(roomID).emit('errorEvent');
    return;
  }

  console.log('successfully deleted');
};
