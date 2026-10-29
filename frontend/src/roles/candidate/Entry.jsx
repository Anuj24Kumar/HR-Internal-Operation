
import { Navigate, Route, Routes } from "react-router-dom";
import useRoleAuth from "../useRoleAuth.js";

import CandidateLayout from "./layouts/CandidateLayout.jsx";

import Overview from "./pages/Overview.jsx";
import MyApplication from "./pages/MyApplication.jsx";
import MyDocuments from "./pages/MyDocuments.jsx";
import MyOffer from "./pages/MyOffer.jsx";
import MyProfile from "./pages/MyProfile.jsx";


export default function CandidateEntry() {
  const { message, logout } = useRoleAuth("candidate");

  return (
    <Routes>
      <Route
        element={
          <CandidateLayout
            userMessage={message}
            onLogout={logout}
          />
        }
      >
        <Route index element={<Overview />} />
        <Route path="application" element={<MyApplication />} />
        <Route path="documents" element={<MyDocuments />} />
        <Route path="offer" element={<MyOffer />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="*" element={<Navigate to="/candidate" replace />} />
      </Route>
    </Routes>
  );
}


