import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar.js";

export function RootLayout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
}
