import useRoleAuth from "../useRoleAuth.js";

export default function AdminEntry() {
  const { message, logout } = useRoleAuth("admin");

  return (
    <main className="form-page">
      <section className="simple-form">
        <h1>Admin page</h1>
        <p>{message}</p>
        <button type="button" onClick={logout}>Log out</button>
      </section>
    </main>
  );
}
