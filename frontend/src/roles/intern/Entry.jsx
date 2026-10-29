import { Navigate, Route, Routes } from "react-router-dom";

import useRoleAuth from "../useRoleAuth.js";
import InternLayout from "./layouts/InternLayout.jsx";

import Overview from "./pages/Overview.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import MyOnboarding from "./pages/MyOnboarding.jsx";
import MyDocuments from "./pages/MyDocuments.jsx";

export default function InternEntry() {
  const { message, logout } = useRoleAuth("intern");

  return (
    <Routes>
      <Route
        element={
          <InternLayout
            userMessage={message}
            onLogout={logout}
          />
        }
      >
        <Route index element={<Overview />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="onboarding" element={<MyOnboarding />} />
        <Route path="documents" element={<MyDocuments />} />

        <Route
          path="*"
          element={<Navigate to="/intern" replace />}
        />
      </Route>
    </Routes>
  );
}