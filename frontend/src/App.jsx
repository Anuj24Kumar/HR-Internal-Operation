import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import CandidateEntry from "./roles/candidate/Entry.jsx";
import InternEntry from "./roles/intern/Entry.jsx";
import EmployeeEntry from "./roles/employee/Entry.jsx";
import HrEntry from "./roles/hr/Entry.jsx";
import HiringManagerEntry from "./roles/hiring-manager/Entry.jsx";
import InterviewerEntry from "./roles/interviewer/Entry.jsx";
import AdminEntry from "./roles/admin/Entry.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/candidate" element={<CandidateEntry />} />
      <Route path="/intern" element={<InternEntry />} />
      <Route path="/employee" element={<EmployeeEntry />} />
      <Route path="/hr" element={<HrEntry />} />
      <Route path="/hiring-manager" element={<HiringManagerEntry />} />
      <Route path="/interviewer" element={<InterviewerEntry />} />
      <Route path="/admin" element={<AdminEntry />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
