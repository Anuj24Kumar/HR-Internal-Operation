import CommonProfilePage from "../../components/CommonProfilePage.jsx";

export default function Profile({ user }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CommonProfilePage
        role="interviewer"
        roleLabel="Interviewer"
        initialUser={user}
      />
    </div>
  );
}
