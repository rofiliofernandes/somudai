import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { setAuthUser } from "@/redux/authSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = async () => {
    try {
      await api.post("/api/v1/auth/logout");
      dispatch(setAuthUser(null));
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <nav className="flex justify-between items-center p-4 shadow">
      <h1 className="font-bold">Somudai</h1>
      <button
        onClick={logoutHandler}
        className="text-red-600 font-medium"
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
