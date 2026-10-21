import useRoleAuth from "../useRoleAuth.js";

export default function InterviewerEntry() {
  const { message, logout } = useRoleAuth("interviewer");

  return (
    <main className="form-page">
      <section className="simple-form">
        <h1>Interviewer page</h1>
        <p>{message}</p>
        <button type="button" onClick={logout}>Log out</button>
      </section>
    </main>
  );
}
