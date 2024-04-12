/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { RiEyeCloseLine, RiEyeLine } from "react-icons/ri";
import "./login.css";
// import LanguageIcon from "../../components/LanguageIcon";
import axios from "axios";
import { api, config } from "../../utils/linkApi";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
const socket = io.connect(api);
const HomeScreen = () => {
  const [UserID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [socketid, setSocketid] = useState("");
  const [Open, setOpen] = useState("hopclose");
  const PlaceholderUser = "UserID";
  const PlaceholderPass = "Mật khẩu";

  const navigate = useNavigate();
  const auth = JSON.parse(localStorage.getItem("User"));

  useEffect(() => {
    if (auth) {
      navigate("/");
    }

    socket.on("me", (id) => {
      console.log("tôi là ai: ", id);
      setSocketid(id);
    });
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = () => {
    const url = api + "/api/login";

    const data = {
      user: UserID,
      password: password,
      socket: socketid,
    };
    axios
      .post(url, data, config)
      .then((response) => {
        if (response.data.err_code === 0) {
          const dataString = JSON.stringify(response.data.data.mine);
          localStorage.setItem("User", dataString);
          navigate("/");
        } else {
          alert("Thất bại");
        }
      })
      .finally(() => {});
  };

  return (
    <div className="screen">
      <div
        className={`hop  ${Open} `}
        onClick={() => {
          setOpen("hopopen");
        }}
      >
        <div className="login">
          <div className="loginBx">
            <h2 className="titleNameLogin">
              <i className="fa-solid fa-right-to-bracket"></i>
              ĐĂNG NHẬP
              <i className="fa-solid fa-heart"></i>
            </h2>
            <input
              type="text"
              placeholder={PlaceholderUser}
              onChange={(e) => {
                setUserID(e.target.value);
              }}
              value={UserID}
            />
            {/* <label htmlFor="" className="absolute top-16 text-left left-4 flex bg-black px-2 bg-teal-700 text-white">UserID</label> */}
            <input
              type={showPassword ? "text" : "password"}
              placeholder={PlaceholderPass}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
            <button
              type="button"
              className="absolute top-1/3 pt-3 right-4 transform 
              -translate-y-1/4 cursor-pointer text-2xl"
              onClick={handleTogglePassword}
            >
              {showPassword ? <RiEyeLine /> : <RiEyeCloseLine />}
            </button>
            {/* <input type="radio" name="" id="" /> */}

            {/* <input type="submit" value="Sign In" /> */}

            <button className="btnSubmit " onClick={handleLogin}>
              Đăng nhập
            </button>

            <div className="nhom flex justify-center"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
