import useRoleAuth from "../useRoleAuth.js";

export default function EmployeeEntry() {
  const { message, logout } = useRoleAuth("employee");

  return (
    <main className="form-page">
      <section className="simple-form">
        <h1>Employee page</h1>
        <p>{message}</p>
        <button type="button" onClick={logout}>Log out</button>
      </section>
    </main>
  );
}
 