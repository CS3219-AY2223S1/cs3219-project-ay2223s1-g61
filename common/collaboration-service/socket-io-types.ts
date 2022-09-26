import type { QuestionType } from '../QuestionType';

// technically, we should download the codeMirror extension into the collaobration service
// but since we put here as common so will just leave as any instead of CodeMirror.Position
export interface CollabClientToServerEvents {
  joinRoomEvent: (roomId: string, username: string) => void;
  exitRoomEvent: (roomId: string, username: string, code?: string) => void;
  fetchRoomTextEvent: (roomId: string) => void;
  cursorChangeEvent: (roomId: string, userId: string, cursor: any, from: any, to: any) => void;
  codeInsertEvent: (roomId: string, index: number, text: string) => void;
  codeReplaceEvent: (roomId: string, index: number, length: number, text: string) => void;
  codeDeleteEvent: (roomId: string, index: number, length: number) => void;
  codeSyncEvent: (roomId: string, code: string) => void;
}

export interface CollabServerToClientEvents {
  joinRoomFailure: () => void;
  joinRoomSuccess: () => void;
  roomUsersChangeEvent: (users: TUserData[]) => void;
  errorEvent: (msg?: string) => void;
  cursorChangeEvent: (roomId: string, userId: string, cursor: any, from: any, to: any) => void;
  codeInsertEvent: (roomId: string, index: number, text: string) => void;
  codeReplaceEvent: (roomId: string, index: number, length: number, text: string) => void;
  codeDeleteEvent: (roomId: string, index: number, length: number) => void;
  codeSyncEvent: (roomId: string, code: string) => void;
  roomQuestionEvent: (question: QuestionType) => void;
}

export interface CollabInterServerEvents {}
export interface CollabSocketData {}

export type TRoomData = {
  users: TUserData[];
  text: string;
  data: QuestionType;
};

export type TUserData = {
  username: string;
  connected: boolean;
};
