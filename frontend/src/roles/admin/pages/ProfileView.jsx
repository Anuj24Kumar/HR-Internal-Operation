import CommonProfilePage from "../../../components/CommonProfilePage.jsx";

export default function ProfileView({ user }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CommonProfilePage
        role="admin"
        roleLabel="Admin"
        initialUser={user}
      />
    </div>
  );
}
