import { changeRoomText, exitRoom, joinRoom, deleteRoom, fetchRoom, createRoom } from '../service/collab-service';
import type { Server, Socket } from 'socket.io';
import {
  CollabClientToServerEvents,
  CollabInterServerEvents,
  CollabServerToClientEvents,
  CollabSocketData,
} from '../../common/collaboration-service/socket-io-types';
import { RequestHandler } from 'express';
import { HttpStatusCode } from '../../common/HttpStatusCodes';
import sleep from '../../common/utils/sleep';

type IOType = Server<CollabClientToServerEvents, CollabServerToClientEvents, CollabInterServerEvents, CollabSocketData>;
type SocketType = Socket<CollabClientToServerEvents, CollabServerToClientEvents, CollabInterServerEvents, CollabSocketData>;

export const createRoomRequest: RequestHandler = async (req, res) => {
  const { data } = await createRoom(req.body.roomId, req.body.users, req.body.difficulty);
  if (data) {
    res.status(HttpStatusCode.OK).send(data);
  } else {
    res.status(HttpStatusCode.BAD_REQUEST).send();
  }
};

export const fetchRoomEvent = (io: IOType, socket: SocketType) => async (roomId: string) => {
  const { errMsg, data } = await fetchRoom(roomId);
  if (!data) {
    io.to(socket.id).emit('errorEvent', errMsg);
    return;
  }

  io.to(socket.id).emit('roomUsersChangeEvent', data.users);
  io.to(socket.id).emit('remoteTextChangeEvent', data.text);
  io.to(socket.id).emit('roomQuestionEvent', data.data);
};

export const joinRoomEvent = (io: IOType, socket: SocketType) => async (roomId: string, username: string) => {
  const { data } = await joinRoom(roomId, username);
  if (!data) {
    io.to(socket.id).emit('joinRoomFailure');
    return;
  }
  socket.join(roomId);

  io.to(socket.id).emit('joinRoomSuccess');
  io.to(roomId).emit('roomUsersChangeEvent', data.users);
};

export const exitRoomEvent = (io: IOType, socket: SocketType) => async (roomId: string, username: string) => {
  console.log('called exitRoomEvent');
  const { errMsg, data } = await exitRoom(roomId, username);
  if (!data) {
    io.to(socket.id).emit('errorEvent', errMsg);
    return;
  }
  socket.leave(roomId);
  io.to(roomId).emit('roomUsersChangeEvent', data.users);

  await handleRoomDelete(roomId);
};

// think we can delete this? @lingshan
export const textChangeEvent = (io: IOType) => async (roomId: string, text: string) => {
  const { errMsg } = await changeRoomText(roomId, text);
  if (errMsg) {
    return;
  }
};

// we dont nid to wait as we want instant. I think we can afford to give up some correctness in terms of the code save for speed
export const codeInsertEvent = (socket: SocketType) => (roomId: string, index: number, text: string) => {
  socket.to(roomId).emit('codeInsertEvent', roomId, index, text);
};

export const codeReplaceEvent = (socket: SocketType) => (roomId: string, index: number, length: number, text: string) => {
  socket.to(roomId).emit('codeReplaceEvent', roomId, index, length, text);
};

export const codeDeleteEvent = (socket: SocketType) => (roomId: string, index: number, length: number) => {
  socket.to(roomId).emit('codeDeleteEvent', roomId, index, length);
};

// we can afford to wait since we want to do a full sync into the db as well
export const codeSyncEvent = (socket: SocketType) => async (roomId: string, code: string) => {
  const { errMsg } = await changeRoomText(roomId, code);
  if (errMsg) {
    console.log(`error change text of room ${roomId}`);
    return;
  }
  socket.to(roomId).emit('codeSyncEvent', roomId, code);
};

export const cursorChangeEvent = (socket: SocketType) => (roomId: string, userId: string, cursor: any, from: any, to: any) => {
  socket.to(roomId).emit('cursorChangeEvent', roomId, userId, cursor, from, to);
};

// Delete room when users are disconnected after a period of time
const handleRoomDelete = async (roomId: string) => {
  const { data } = await fetchRoom(roomId);
  if (!data || data.users.some((u) => u.connected)) {
    return;
  }
  await sleep(5000); // If after Xs and room still has no one, delete from store

  const { data: room } = await fetchRoom(roomId);
  if (!room || room.users.some((u) => u.connected)) {
    return;
  }
  const { errMsg } = await deleteRoom(roomId);
  if (errMsg) {
    console.log(errMsg);
  } else {
    console.log(`Room ${roomId} deleted`);
  }
};
