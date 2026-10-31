import { Navigate, Route, Routes } from "react-router-dom";
import useRoleAuth from "../useRoleAuth.js";
import EmployeeLayout from "./layouts/EmployeeLayout.jsx";
import Overview from "./pages/Overview.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import MyHistory from "./pages/MyHistory.jsx";
import MySalary from "./pages/MySalary.jsx";
import MyDocuments from "./pages/MyDocuments.jsx";
import MyLetters from "./pages/MyLetters.jsx";
import MyResignation from "./pages/MyResignation.jsx";

export default function EmployeeEntry() {
  const { message, logout } = useRoleAuth("employee");

  return (
    <Routes>
      <Route
        element={
          <EmployeeLayout userMessage={message} onLogout={logout} />
        }
      >
        <Route index element={<Overview />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="history" element={<MyHistory />} />
        <Route path="salary" element={<MySalary />} />
        <Route path="documents" element={<MyDocuments />} />
        <Route path="letters" element={<MyLetters />} />
        <Route path="resignation" element={<MyResignation />} />
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Route>
    </Routes>
  );
}
