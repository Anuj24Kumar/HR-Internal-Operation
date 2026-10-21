import useRoleAuth from "../useRoleAuth.js";

export default function CandidateEntry() {
  const { message, logout } = useRoleAuth("candidate");

  return (
    <main className="form-page">
      <section className="simple-form">
        <h1>Candidate page</h1>
        <p>{message}</p>
        <button type="button" onClick={logout}>Log out</button>
      </section>
    </main>
  );
}
