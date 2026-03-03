import LoginForm from "../components/LoginForm";

function LoginPage() {
  return (
    <main className="min-h-screen bg-[#d9dbe0] px-4 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-2xl bg-white px-6 py-8 shadow-[0_25px_60px_rgba(15,23,42,0.2)] sm:px-7">
          <div className="mb-9">
            <div className="mb-8 flex items-center gap-2 text-[#1e4db7]">
              <img src="/image/isotipo1.png" alt="GenAccess" className="h-9 w-auto" />
              <span className="text-[1.85rem] font-extrabold leading-none tracking-tight">
                GenAccess
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
              Necesitas ayuda para ingresar?{" "}
              <button type="button" className="font-semibold text-blue-700 hover:text-blue-800">
                Contactar administracion
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
