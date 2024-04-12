import React, { useEffect, useRef, useState } from "react";

import Peer from "simple-peer";
import io from "socket.io-client";
// import "./App.css";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { api } from "../../utils/linkApi";
const socket = io.connect(api);

function VideoCall() {
  const auth = JSON.parse(localStorage.getItem('User'));
  const [me, setMe] = useState(auth.DT_UserID);
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState(auth.DT_Name);
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // console.log(auth);
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);

        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      });

    socket.on("me", (id) => {
      console.log("tôi là ai: ",id)
      setMe(id);
    });

    // socket.emit("user", {
    //   id: 'haha',
    //   userID: auth.DT_UserID,
    // });

    socket.on("callUser", (data) => {
      console.log(data.name, data.from, data.signal);
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });
  }, []);


  const callUser = (id) => {

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      // console.log({me, id, name, data})
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });
    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });
    socket.on("callAccepted", (signal) => {
 
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
    console.log(peer)

  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };
  return (
    
      <div className="bg-black px-2 h-screen w-screen" >
        <div className="video-container bg-black" >
          <div className="video bg-black">
            {stream && (
              <video
                playsInline
                muted
                ref={myVideo}
                autoPlay className="bg-black"
                style={{ width: callAccepted ? "20vw" : "100vw",height: callAccepted ? "20vh" : "100vh", position:'absolute', right:0}}
              />
            )}
          </div>
          <div className="video bg-black" style={{height:'100%', width:'100%'}}>
            {callAccepted && !callEnded ? (
              <video
                playsInline
                ref={userVideo}
                autoPlay
                
                style={{ width: "100vw", height:'100vh',left:'0px' }}
              />
            ) : null}
          </div>
          <div className="text-white px-5 py-2 bg-red-700 mt-2 absolute bottom-10 left-[60%]">
            {callAccepted && !callEnded ? (
              <button onClick={leaveCall}>End Call</button>
            ) : (
              <button onClick={() => callUser(idToCall)}>Call</button>
            )}
            {/* {idToCall} */}
          </div>
        </div>
        <div className="myId" style={{position:'absolute', top:0, left: '20px'}}>
          <CopyToClipboard text={me}  >
            <button className="w-full text-white" >{me}</button>
          </CopyToClipboard>
          <br />
          <p className="text-white">Họ và Tên</p>
          <input
            id="filled-basic"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          
          />

          <p className="text-blue-400 ">Link</p>

          <input
            type="text"
            id="filled-basic"
            label="ID to call"
            value={idToCall}
            onChange={(e) => setIdToCall(e.target.value)}
          /> <br />


<div className="text-white">
          <div>{receivingCall}</div>
          {receivingCall && !callAccepted ? (
            <div className="caller">
              <h1>{name} is calling...</h1>
              <button onClick={answerCall}>Answer</button>
            </div>
          ) : <></>}
        </div>
        </div>
   
      </div>
    
  );
}

export default VideoCall;
