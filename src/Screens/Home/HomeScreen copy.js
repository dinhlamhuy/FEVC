import axios from "axios";
import { api, config } from "../../utils/linkApi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
const socket = io.connect(api);

const HomeScreen = () => {
  const auth = JSON.parse(localStorage.getItem("User"));
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("Home");

  const navigator = useNavigate();
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

  useEffect(() => {
    if (!auth) {
      navigator("/login");
    }
    socket.on("me", async (id) => {
      if (id !== auth.DT_Token) {
        await updateTOKEN(id);
      }
    });
    socket.on("getUser", (data) => {
      // console.log(data)
      getUser();
    });
    getUser();
  }, []);


  return (
    <>
      {status === "Home" ? (
        <table className="table w-full border">
          <thead>
            <tr>
              <th className="border">STT</th>
              <th className="border">UserID</th>
              <th className="border">Name</th>
              <th className="border">Token</th>
              <th className="border">Action</th>
            </tr>
          </thead>
          <tbody>
            {data &&
              data.map((item, index) => {
                return (
                  <tr key={index}>
                    <td className="border text-center p-4">{index + 1}</td>
                    <td className="border text-center p-4">{item.DT_UserID}</td>
                    <td className="border text-center p-4">{item.DT_Name}</td>
                    <td className="border text-center p-4">{item.DT_Token}</td>
                    <td className="border text-center ">
                      {auth.DT_Name !== item.DT_Name ? (
                        <button className="bg-red-400 px-4  py-2">Call</button>
                      ) : (
                        <></>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      ) : (
        <></>
      )}
    </>
  );
};

export default HomeScreen;
