import useRoleAuth from "../useRoleAuth.js";

export default function HrEntry() {
  const { message, logout } = useRoleAuth("hr");

  return (
    <main className="form-page">
      <section className="simple-form">
        <h1>HR page</h1>
        <p>{message}</p>
        <button type="button" onClick={logout}>Log out</button>
      </section>
    </main>
  );
}
