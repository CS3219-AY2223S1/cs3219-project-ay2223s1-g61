import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import { CollabClientToServerEvents, CollabServerToClientEvents, QuestionType, TUserData } from 'src/types';
// import { useNavigate } from 'react-router-dom';
// import { RoutePath } from 'src/services/RoutingService';
import { COLORS, sourceUser, partnerUser, TCodeEditorUser } from './constants';
import { getMode, languages, getSnippet } from './utils';
import { throttle } from 'throttle-typescript';
import parse from 'html-react-parser';

import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

// Reference page: https://github.com/convergencelabs/codemirror-collab-ext
// code mirror related. Ignore the types lolol
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-palenight.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/keymap/sublime';
import 'codemirror/addon/comment/comment';
import '@convergencelabs/codemirror-collab-ext/css/codemirror-collab-ext.css';
import * as CodeMirrorCollabExt from '@convergencelabs/codemirror-collab-ext';

import './index.scss';
import './tailwindProse.scss';

type CollabPageProps = {
  roomId: string;
  username: string;
};

type TSocket = Socket<CollabServerToClientEvents, CollabClientToServerEvents>;

let errorInTransmit = false;

export default function CollabPage({ roomId, username }: CollabPageProps) {
  const [roomUsers, setRoomUsers] = useState<TUserData[]>([]);
  // const navigate = useNavigate();
  const [codeSocket, setCodeSocket] = useState<TSocket>();
  const [otherLabel, setOtherLabel] = useState<string>();
  const didUserMoveRef = useRef(false);
  const [question, setQuestion] = useState<QuestionType>();
  const [language, setLanguage] = useState('JavaScript');

  const getEditorUserConfig = (
    user: TCodeEditorUser,
    label: string,
    cursorManager: CodeMirrorCollabExt.RemoteCursorManager,
    selectionManager: CodeMirrorCollabExt.RemoteSelectionManager
  ) => {
    const cursor = cursorManager.addCursor(user.id, user.color, label);
    const selection = selectionManager.addSelection(user.id, user.color);
    return { cursor, selection };
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value);
  };

  // mounting of socket
  useEffect(() => {
    const socket: TSocket = io('http://localhost:8002');
    setCodeSocket(socket);
    socket.on('connect', () => {
      socket.emit('joinRoomEvent', roomId, username);

      socket.on('joinRoomSuccess', () => socket.emit('fetchRoomEvent', roomId));

      socket.on('roomUsersChangeEvent', (users: TUserData[]) => {
        console.log('roomUsersChangeEvent');
        setRoomUsers(users);
        const otherLabel = users.filter((user) => user.username !== username)[0].username;
        setOtherLabel(otherLabel);
      });

      socket.on('roomQuestionEvent', (question) => setQuestion(question));
    });

    return () => {
      // will only come here if like user close the page i guess? :O should we allow them to come back
      socket.emit('exitRoomEvent', roomId, username);
      socket.close();
    };
  }, [roomId, username]);

  // mounting of editor
  useEffect(() => {
    const editorHTML = document.getElementById('editor') as HTMLTextAreaElement;
    if (editorHTML == null || codeSocket == null || otherLabel == null) {
      return;
    }

    const codeEditor = CodeMirror.fromTextArea(editorHTML, {
      lineNumbers: true,
      keyMap: 'sublime',
      theme: 'material-palenight',
      mode: getMode(language) ?? 'javascript', // default
      lineWrapping: true,
      scrollbarStyle: 'native',
    });

    if (question && language) {
      const snippet = getSnippet(question, language);
      if (snippet) codeEditor.setValue(snippet.code);
    }

    // editor.setValue(... some initial code)
    const cursorManager = new CodeMirrorCollabExt.RemoteCursorManager({
      // @ts-ignore This is likely to be a bug in the @types packages lol
      editor: codeEditor,
      tooltips: true,
      tooltipDuration: 1,
    });
    const selectionManager = new CodeMirrorCollabExt.RemoteSelectionManager({
      // @ts-ignore This is likely to be a bug in the @types packages lol
      editor: codeEditor,
    });
    const contentManager = new CodeMirrorCollabExt.EditorContentManager({
      // @ts-ignore This is likely to be a bug in the @types packages lol
      editor: codeEditor,
      onInsert(index, text) {
        codeSocket.emit('codeInsertEvent', roomId, index, text);
      },
      onReplace(index, length, text) {
        codeSocket.emit('codeReplaceEvent', roomId, index, length, text);
      },
      onDelete(index, length) {
        codeSocket.emit('codeDeleteEvent', roomId, index, length);
      },
    });

    const { cursor: sourceCursor, selection: sourceSelection } = getEditorUserConfig(sourceUser, username, cursorManager, selectionManager);
    const { cursor: partnerCursor, selection: partnerSelection } = getEditorUserConfig(partnerUser, otherLabel, cursorManager, selectionManager);

    // this is when we are moving the cursor
    codeEditor.on(
      'mousedown',
      throttle(() => (didUserMoveRef.current = true), 10)
    );
    codeEditor.on(
      'keydown',
      throttle(() => (didUserMoveRef.current = true), 10)
    );
    codeEditor.on(
      'beforeChange',
      throttle(() => (didUserMoveRef.current = false), 10)
    );

    // Prevent backspace on empty editor to avoid error thrown from the EditorContentManager
    codeEditor.on('keydown', (cm, event) => {
      if (event.key == 'Backspace' && cm.getValue().length == 0) {
        event.preventDefault();
      }
    });

    // this is when there is some cursor activity of the source user
    codeEditor.on('cursorActivity', () => {
      const cursor = codeEditor.getCursor();
      const from = codeEditor.getCursor('from');
      const to = codeEditor.getCursor('to');
      // if user move or select a text of code
      if (didUserMoveRef.current || codeEditor.getSelection()) {
        didUserMoveRef.current = false;
        setTimeout(() => codeSocket.emit('cursorChangeEvent', roomId, sourceUser.id, cursor, from, to), 0);
      }

      // setPosition throws error sometimes lol
      setTimeout(() => {
        try {
          sourceCursor.setPosition(cursor);
          sourceSelection.setPositions(from, to);
        } catch {}
      }, 0);
    });

    // this is when there is some cursor activity of the partner cursor
    codeSocket.on('cursorChangeEvent', (_roomId, _userId, cursor, from, to) => {
      try {
        partnerCursor.setPosition(cursor);
        partnerSelection.setPositions(from, to);
      } catch {}
    });

    codeSocket.on('codeInsertEvent', (_roomId, index, text) => {
      try {
        contentManager.insert(index, text);
      } catch {
        errorInTransmit = true;
      }
    });

    codeSocket.on('codeReplaceEvent', (_roomId, index, length, text) => {
      try {
        contentManager.replace(index, length, text);
      } catch {
        errorInTransmit = true;
      }
    });

    codeSocket.on('codeDeleteEvent', (_roomId, index, length) => {
      try {
        contentManager.delete(index, length);
      } catch {
        errorInTransmit = true;
      }
    });

    // this is a fallback extra method to send over incase transmit fail. Somehwo it does fail occasional when i am doing testing
    codeEditor.on('change', (instance, { origin }) => {
      if (origin !== 'setValue') {
        codeSocket.emit('codeSyncEvent', roomId, instance.getValue());
      }
    });

    codeSocket.on('codeSyncEvent', (_roomId, code) => {
      if (errorInTransmit) {
        codeEditor.setValue(code);
        errorInTransmit = false;
      }
    });

    return () => {
      codeEditor.toTextArea();
      // Remove the current client own cursor.
      sourceCursor.dispose();
      sourceSelection.dispose();
      contentManager.dispose();
    };
  }, [codeSocket, roomId, roomUsers, username, otherLabel, language, question]);

  // const handleDisconnect = () => {
  //   navigate(RoutePath.HOME);
  // };

  return (
    <div className="coding">
      <div className="coding__question prose">
        <div className="coding__question_header">{`${question?.questionId}. ${question?.title}`}</div>
        <div className="coding__leetcode_content">{question?.content && parse(question?.content.replace(/&nbsp;/g, ''))}</div>
      </div>
      <div className="divider" />
      <div className="coding__right">
        <div className="coding__language_option">
          <div>Language: </div>
          <FormControl sx={{ m: 1, minWidth: 120, maxWidth: 240 }} size="small" color="secondary">
            <Select value={language} onChange={handleLanguageChange} displayEmpty>
              {languages.map((language) => (
                <MenuItem value={language} key={language}>
                  {language}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="editor__container">
          <textarea id="editor" />
        </div>
        <div className="coding__bottom_tab">
          <div className="coding__users">
            {roomUsers.map(({ username, connected }, index) => {
              if (!connected) return <></>;
              return (
                <div key={username}>
                  <div className="coding__user__ball" style={{ backgroundColor: COLORS[index] }} />
                  <div className="coding__user__name">{username}</div>
                </div>
              );
            })}
          </div>
          <div className="coding__controllers">
            <Button variant="outlined" color="warning" onClick={() => {}}>
              EXIT
            </Button>
            <Button variant="contained" onClick={() => {}}>
              RUN
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
