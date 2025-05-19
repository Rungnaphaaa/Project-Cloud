import type { RouteObject } from "react-router-dom";
import OutletLayout from "../layout/OutletLayout";
import Login from "../pages/Login/Login";

const LoginRoutes = (): RouteObject => {
  return {
    path: "/",
    element: <OutletLayout/>,
    children: [
      {
        path: "/",
        element: <Login/>,
      },
    ],
  };
};

export default LoginRoutes;