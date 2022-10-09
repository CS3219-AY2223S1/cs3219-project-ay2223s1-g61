import { useMemo, useState } from 'react';
import { TextField, Button } from '@mui/material';
import { DataConnection } from 'peerjs';

export type ChatBoxProps = {
  username: string;
  dataConnection: DataConnection;
};

export type TChatMsg = {
  username: string;
  msg: string;
};

const ChatBox = (props: ChatBoxProps) => {
  console.log('Rendering ChatBox');
  const username = props.username;
  const [draftMsg, setDraftMsg] = useState('');
  const [msgLst, setMsgLst] = useState<TChatMsg[]>([]);
  const dataConnection = useMemo(() => {
    props.dataConnection.on('open', () => {
      props.dataConnection.send(username + ' connected');
    });
    props.dataConnection.on('data', (data) => {
      console.log('Data connection received:', data);
      const parseRawData = (data: unknown): TChatMsg => {
        return data as TChatMsg;
      };
      setMsgLst((prev) => [...prev, parseRawData(data)]);
    });
    props.dataConnection.on('error', (error) => {
      console.log('Data connection error:', error);
    });
    return props.dataConnection;
  }, [props.dataConnection, username]);

  return (
    <div>
      {msgLst.map((msg, index) => {
        return (
          <div key={index}>
            <h1>{msg.msg}</h1>
          </div>
        );
      })}
      <TextField variant="outlined" onChange={(event) => setDraftMsg(event.target.value)} />
      <Button
        title="send"
        onClick={() => {
          if (dataConnection) {
            if (dataConnection.open) {
              setMsgLst((prev) => [...prev, { msg: draftMsg, username: username }]);
              dataConnection.send({ msg: draftMsg, username: username });
            } else {
              console.log('Connection not open');
            }
          }
        }}
      />
    </div>
  );
};

export default ChatBox;
