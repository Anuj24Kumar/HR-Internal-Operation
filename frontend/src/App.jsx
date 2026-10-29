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
return ( <Routes>
{/* Public routes */}
<Route path="/" element={<Navigate to="/login" replace />} />
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />


  {/* Candidate routes */}
  <Route path="/candidate/*" element={<CandidateEntry />} />

  {/* Intern routes */}
  <Route path="/intern/*" element={<InternEntry />} />

  {/* Employee routes */}
  <Route path="/employee/*" element={<EmployeeEntry />} />

  {/* HR routes */}
  <Route path="/hr/*" element={<HrEntry />} />

  {/* Hiring Manager routes */}
  <Route
    path="/hiring-manager/*"
    element={<HiringManagerEntry />}
  />

  {/* Interviewer routes */}
  <Route path="/interviewer/*" element={<InterviewerEntry />} />

  {/* Admin routes */}
  <Route path="/admin/*" element={<AdminEntry />} />

  {/* Fallback route */}
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>


);
}
