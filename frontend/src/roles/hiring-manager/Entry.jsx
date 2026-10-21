import useRoleAuth from "../useRoleAuth.js";

export default function HiringManagerEntry() {
  const { message, logout } = useRoleAuth("hiring_manager");

  return (
    <main className="form-page">
      <section className="simple-form">
        <h1>Hiring manager page</h1>
        <p>{message}</p>
        <button type="button" onClick={logout}>Log out</button>
      </section>
    </main>
  );
}
