import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

function formatDate(value) {
  if (!value) {
    return "Not available";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function Profile({ user, onBack }) {
  const name = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Hiring Manager";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const details = [
    { label: "Full name", value: name, icon: UserRound },
    { label: "Email address", value: user?.email || "Not available", icon: Mail },
    { label: "Phone number", value: user?.phone || "Not provided", icon: Phone },
    { label: "Role", value: user?.role?.replace(/_/g, " ") || "Hiring Manager", icon: ShieldCheck },
    { label: "Account status", value: user?.status || "Not available", icon: CheckCircle2 },
    { label: "Member since", value: formatDate(user?.createdAt), icon: CalendarDays },
  ];

  return (
    <main className="content-area">
      <section className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your account information.</p>
        </div>
        <button type="button" className="btn-action-outline" onClick={onBack}>
          <ArrowLeft size={14} />
          <span>Back to Overview</span>
        </button>
      </section>
      <section className="card-box" aria-label="Hiring manager profile">
        <div className="profile-summary">
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <div>
            <h2 className="card-box-title">{name}</h2>
            <p className="card-box-subtitle">Hiring Manager</p>
          </div>
        </div>
        <div className="profile-details-grid">
          {details.map(({ label, value, icon: Icon }) => (
            <div className="profile-detail" key={label}>
              <span className="profile-detail-icon"><Icon size={17} /></span>
              <div>
                <p className="profile-detail-label">{label}</p>
                <p className="profile-detail-value">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
