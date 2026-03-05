import LoginForm from "../components/LoginForm";

function LoginPage() {
  return (
    <main className="min-h-screen min-h-[100svh] min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#e9edf2] px-4 py-4 sm:px-6 sm:py-6">
      {/* 100dvh + scroll evita cortes del login en moviles con barra del navegador/teclado */}
      <section className="mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-[400px] items-center justify-center">
        <div className="w-full rounded-[24px] bg-[#f8fafc] px-5 py-6 shadow-[0_14px_36px_rgba(15,23,42,0.12)] sm:px-6 sm:py-7">
          <div className="mb-6 text-center sm:mb-7">
            <img
              src="/image/isotipo1.png"
              alt="GenAccess"
              className="mx-auto mb-3 h-11 w-11 rounded-xl object-contain sm:mb-4 sm:h-12 sm:w-12"
            />
            <h1 className="text-[2rem] font-extrabold leading-none tracking-tight text-slate-900 sm:text-[2.2rem]">
              GenAccess
            </h1>
            <p className="mx-auto mt-2 max-w-[260px] text-[0.98rem] leading-snug text-slate-400 sm:text-[1.02rem]">
              Plataforma Inteligente de Gestion para Propiedad Horizontal
            </p>
          </div>

          <LoginForm />
        </div>
      </section>

      <footer className="mt-4 text-center text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:mt-5 sm:text-[0.78rem]">
        <p>GenAccess Platform Console</p>
        <p className="mt-1.5 text-[0.78rem] normal-case tracking-normal text-slate-500 sm:text-[0.86rem]">
          &copy; 2024 GenAccess - Todos los derechos reservados
        </p>
      </footer>
    </main>
  );
}

export default LoginPage;
