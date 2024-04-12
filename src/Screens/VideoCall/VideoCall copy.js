import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Peer from "simple-peer";
import io from "socket.io-client";
import { MdCallEnd } from "react-icons/md";
import { FaCameraRotate } from "react-icons/fa6";
import { LuMonitorUp } from "react-icons/lu";
// import { CopyToClipboard } from "react-copy-to-clipboard";
import { api, config } from "../../utils/linkApi";
import { useNavigate } from "react-router-dom";
const socket = io.connect(api);

function VideoCall() {
  const [status, setStatus] = useState("Home");
  const auth = JSON.parse(localStorage.getItem("User"));
  const [data, setData] = useState([]);
  const [me, setMe] = useState(auth.DT_UserID);
  const [latcam, setLatCam] = useState("user");
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
  let mediaStream;
  const navigate = useNavigate();

  const getUser = async () => {
    const url = api + "/api/getuser";

    await axios
      .get(url, config)
      .then((response) => {
        if (response.data.err_code === 0) {
          setData(response.data.data.user);
        }
      })
      .finally(() => {});
  };
  const updateTOKEN = async (token) => {
    const url = api + "/api/updatetoken";
    const data = {
      user: auth.DT_UserID,
      socket: token,
    };
    await axios
      .post(url, data, config)
      .then((response) => {
        if (response.data.err_code === 0) {
          // setData(response.data.data.user);
        }
      })
      .finally(() => {});
  };
  // const getPreferredCamera = async () => {
  //   try {
  //     const devices = await navigator.mediaDevices.enumerateDevices();
  //     const preferredCamera = devices.find(
  //       (device) =>
  //         device.kind === "videoinput" &&
  //         device.label.toLowerCase().includes("back")
  //     );
  //     console.log(devices)
  //     return preferredCamera ? "environment" : "user";
  //   } catch (error) {
  //     console.error("Error enumerating devices:", error);
  //     return "user";
  //   }
  // };
 
  const mocamcall = () => {
    return new Promise(async (resolve, reject) => {
      try {
        // const facingMode = await getPreferredCamera();
        mediaStream = await navigator.mediaDevices
          .getUserMedia({ video: { facingMode: { latcam } }, audio: true })
          .then((stream) => {
            if (myVideo.current) {
              setStream(stream);
              console.log(latcam);
              myVideo.current.srcObject = stream;
            }
            resolve(stream);
          })
          .catch((error) => reject(error));
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  };


  const fnLatCam=async()=>{
    if(latcam=== 'user'){
       
      // alert('environment')
      setLatCam('environment')
      
    }else{
      setLatCam('user')
      
    }
    mocamcall();
  }
  useEffect(() => {
    if (status === "call") {
      mocamcall();
    }
  }, [status]);



  function mocamuser() {
    return new Promise(async (resolve, reject) => {
      try {
        // const facingMode = await getPreferredCamera();
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: { latcam } }, audio: true })
          .then((stream) => {
            // setStream(stream)
            if (userVideo.current) {
              userVideo.current.srcObject = stream;
            }

            console.log({ stream });
            resolve(stream);
          })
          .catch((error) => reject(error));
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }
  function stopCamera() {
    // Ngắt kết nối đến stream
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      // Xóa tham chiếu đến stream
      mediaStream = null;
    }
  }
  useEffect(() => {
    socket.on("me", async (id) => {
      if (id !== auth.DT_Token) {
        setMe(id);
        await updateTOKEN(id);
      }
    });
    socket.on("leaveCall", (data) => {
      window.location.reload();
      // getUser();
    });
    socket.on("getUser", (data) => {
      // console.log(data)
      getUser();
    });
    getUser();
    socket.on("callUser", (data) => {
      // console.log(data.name, data.from, data.signal);
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setIdToCall(data.name);
      setCallerSignal(data.signal);
    });
  }, []);
  const callUser = async (id) => {
    try {
      const streams = await mocamcall();
      setStatus("call");
      setIdToCall(id);
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: streams,
      });
      peer.on("signal", (data) => {
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
      console.log(peer);
    } catch (error) {
      console.error(error);
    }
  };

  const answerCall = async () => {
    const streams = await mocamuser();
    setStatus("call");
    // setStatus("call");

    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: streams,
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
    socket.emit("leaveCall", { from: me, to: idToCall });
    userVideo.current = null;
    stopCamera();
    connectionRef.current.destroy();
    setStatus("Home");
  };
  const logout = () => {
    localStorage.removeItem("User");
    navigate("/login");
  };
  return (
    <>
      {status === "Home" ? (
        <>
          <table className="table w-full border">
            <thead>
              <tr>
                {/* <th className="border">STT</th> */}
                <th className="border">UserID</th>
                <th className="border">Name</th>
                {/* <th className="border">Token</th> */}
                <th className="border">Action</th>
              </tr>
            </thead>
            <tbody>
              {data &&
                data.map((item, index) => {
                  return (
                    <tr key={index}>
                      {/* <td className="border text-center p-4">{index + 1}</td> */}
                      <td className="border text-center p-4">
                        {item.DT_UserID}
                      </td>
                      <td className="border text-left p-4">{item.DT_Name}</td>
                      {/* <td className="border text-center p-4">
                        {item.DT_Token}
                      </td> */}
                      <td className="border text-center ">
                        {auth.DT_Name !== item.DT_Name ? (
                          <button
                            className="bg-red-400 px-4  py-2"
                            onClick={() => callUser(item.DT_Token)}
                          >
                            Call
                          </button>
                        ) : (
                          <>
                            <button className="bg-gray-400 " onClick={logout}>
                              Đăng xuất
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <div className="text-black">
            <div>{receivingCall}</div>
            {receivingCall && !callAccepted ? (
              <div className="caller">
                <h1>{name} is calling...</h1>
                <button onClick={answerCall}>Answer</button>
              </div>
            ) : (
              <></>
            )}
          </div>
        </>
      ) : (
        <div className="bg-black px-2 h-screen w-screen">
          <div className="video-container bg-black">
            <div className="video bg-black canhan">
              {/* {stream && myVideo && ( */}
              <video
                playsInline
                muted
                ref={myVideo}
                autoPlay
                className="bg-black"
                style={{
                  width: callAccepted ? "20vw" : "100vw",
                  height: callAccepted ? "20vh" : "100vh",
                  position: "absolute",
                  right: 0,
                }}
              />
              {/* )} */}
            </div>
            <div
              className="video bg-black"
              style={{ height: "100%", width: "100%" }}
            >
              {callAccepted && !callEnded ? (
                <video
                  playsInline
                  ref={userVideo}
                  autoPlay
                  style={{ width: "100vw", height: "100vh", left: "0px" }}
                />
              ) : null}
            </div>
            {/* <div className="text-white px-5 py-2 bg-red-700 mt-2 absolute bottom-10 left-[55%]">
           
            </div> */}
            {callAccepted && !callEnded ? (
              <div className="text-white gap-3 px-5 py-2  mt-2 absolute bottom-10 justify-center  w-full flex">
                  <button onClick={fnLatCam} className="mr-3"><FaCameraRotate  className="text-4xl" /></button>
                  
                <button onClick={leaveCall} className="bg-red-700 p-3 rounded-full"><MdCallEnd  className="text-4xl"/></button>
                <button className="ml-3"><LuMonitorUp   className="text-4xl" /></button>
             
              </div>
            ) : (
              <></>
            )}
            {/* {idToCall} */}
          </div>
          <div
            className="myId"
            style={{ position: "absolute", top: 0, left: "20px" }}
          ></div>
        </div>
      )}
    </>
  );
}

export default VideoCall;
