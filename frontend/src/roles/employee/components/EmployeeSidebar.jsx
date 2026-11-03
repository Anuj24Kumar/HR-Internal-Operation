import {
  LayoutDashboard,
  Clock,
  CreditCard,
  Files,
  FileText,
  DoorOpen,
  Award,
} from "lucide-react";
import UnifiedSidebar from "../../../components/UnifiedSidebar.jsx";

const employeeTabs = [
  { label: "Overview", path: "/employee", icon: LayoutDashboard, end: true },
  { label: "My Offer", path: "/employee/offer", icon: Award },
  { label: "Employment History", path: "/employee/history", icon: Clock },
  { label: "My Salary", path: "/employee/salary", icon: CreditCard },
  { label: "My Documents", path: "/employee/documents", icon: Files },
  { label: "My Letters", path: "/employee/letters", icon: FileText },
  { label: "Resignation", path: "/employee/resignation", icon: DoorOpen },
];

export default function EmployeeSidebar({ mobileOpen, onCloseMobile }) {
  return (
    <UnifiedSidebar
      roleTitle="Employee Portal"
      tabs={employeeTabs}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
