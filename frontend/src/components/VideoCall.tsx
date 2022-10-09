import { useEffect, useRef } from 'react';
import { Button } from '@mui/material';
import { MediaConnection } from 'peerjs';

export type VideoCallProps = {
  mediaConnection?: MediaConnection;
  dialIn: (userMediaPromise: Promise<MediaStream>) => void;
  leaveCall: () => void;
};

const VideoCall = (props: VideoCallProps) => {
  console.log('Rendering VideoCallComponent');

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const attachMediaConnectionListeners = (call: MediaConnection): MediaConnection => {
    call.on('stream', (remoteStream) => {
      remoteVideoRef.current!.srcObject = remoteStream; // Note: Requires video components to be mounted already (in DOM)
    });
    return call;
  };
  const { mediaConnection, dialIn, leaveCall } = props;
  useEffect(() => {
    if (!mediaConnection) return;
    attachMediaConnectionListeners(mediaConnection);
  }, [mediaConnection]);

  const handleCall = () => {
    const mediaPromise = navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((mediaStream) => {
        myVideoRef.current!.srcObject = mediaStream;
        myVideoRef.current!.play();
        return mediaStream;
      });
    dialIn(mediaPromise);
  };
  const handleLeave = () => {
    const mediaStream = myVideoRef.current!.srcObject as MediaStream;
    mediaStream!.getTracks().forEach((track) => {
      track.stop();
    });
    leaveCall();
  };
  return (
    <div>
      <Button style={{ color: '#00FF00' }} size="large" title="Start Call" onClick={handleCall} />
      <video ref={myVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />
      <Button style={{ color: '#FF0000' }} title="End Call" onClick={handleLeave} />
    </div>
  );
};

export default VideoCall;
