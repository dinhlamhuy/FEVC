import { Routes, Route, Navigate } from "react-router-dom";

import HomeScreen from "./Screens/Home/HomeScreen.js";
// import LoginScreen from "./Screens/Login/LoginScreen.js";
import VideoCallScreen from "./Screens/VideoCall/VideoCall.js";
// import AboutScreen from "./screens/home/AboutScreen.js";
const auth = JSON.parse(localStorage.getItem("User"));
function App() {

  return (
    <Routes>

      <Route path="/login" element={<HomeScreen />} />
      <Route path="/"  element={auth && auth.DT_UserID ? <VideoCallScreen /> : <Navigate to="/login" /> } />
  
    </Routes>
  );
}

export default App;
