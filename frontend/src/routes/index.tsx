import { useRoutes, type RouteObject } from "react-router-dom";
import AdminRoutes from "./AdminRoutes";
import UserRoutes from "./UserRoutes";
import LoginRoutes from "./LoginRoutes";

export const role = localStorage.getItem('role')
export const isAdmin = role === 'Admin'
export const isManager = role === 'Manager'
export const isOperator = role === 'Operator'

function ConfigRoutes() {
  const isLoggedIn = localStorage.getItem("isLogin") === "true"; // ตรวจสอบสถานะการเข้าสู่ระบบ
  const role = localStorage.getItem("role"); // รับค่าบทบาทจาก localStorage

  let routes: RouteObject[] = []; // กำหนดค่าเริ่มต้นให้กับ routes

  // ตรวจสอบว่าเข้าสู่ระบบหรือยัง
  if (isLoggedIn) {
    switch (role) {
      case "admin":
        routes = [AdminRoutes()];
        break;
      case "user":
        routes = [UserRoutes()];
        break;
      default:
        routes = [LoginRoutes()];
    }
  } else {
    routes = [UserRoutes ()];
  }

  return useRoutes(routes); // ใช้ useRoutes กับ routes ที่ได้จากเงื่อนไขข้างต้น
}

export default ConfigRoutes;