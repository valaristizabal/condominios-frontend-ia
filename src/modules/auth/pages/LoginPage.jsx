import LoginForm from "../components/LoginForm";

function LoginPage() {
  return (
    <main className="min-h-screen bg-[#d9dbe0] px-4 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-2xl bg-white px-6 py-8 shadow-[0_25px_60px_rgba(15,23,42,0.2)] sm:px-7">
          <div className="mb-9">
            <div className="mb-8 flex items-center gap-2 text-[#1e4db7]">
              <GridIcon />
              <span className="text-[1.85rem] font-extrabold leading-none tracking-tight">
                CondoManager
              </span>
            </div>
            <h1 className="text-[3rem] font-extrabold leading-[1.04] tracking-tight text-slate-900">
              Bienvenido
            </h1>
            <p className="mt-3 text-[2rem] leading-tight text-slate-500">
              Ingresa tus credenciales para gestionar tu condominio.
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 border-t border-slate-200 pt-6 text-center">
            <p className="text-[1.05rem] text-slate-500">
              Need help accessing your account?{" "}
              <button type="button" className="font-semibold text-blue-700 hover:text-blue-800">
                Contact Administration
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
      <path d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8ZM5 5v4h4V5H5Zm10 0v4h4V5h-4ZM5 15v4h4v-4H5Zm10 0v4h4v-4h-4Z" />
    </svg>
  );
}

export default LoginPage;

