import CommonProfilePage from "../../components/CommonProfilePage.jsx";

export default function HrProfile({ user }) {
  return (
    <CommonProfilePage
      role="hr"
      roleLabel="HR"
      initialUser={user}
    />
  );
}
