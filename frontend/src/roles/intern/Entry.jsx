import useRoleAuth from "../useRoleAuth.js";

export default function InternEntry() {
  const { message, logout } = useRoleAuth("intern");

  return (
    <main className="form-page">
      <section className="simple-form">
        <h1>Intern page</h1>
        <p>{message}</p>
        <button type="button" onClick={logout}>Log out</button>
      </section>
    </main>
  );
}
