import LoginForm from "../components/LoginForm";

function LoginPage() {
  return (
    <main className="min-h-screen min-h-[100svh] min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#e9edf2] px-4 py-6 sm:px-6 sm:py-8">
      {/* 100dvh + scroll evita cortes del login en moviles con barra del navegador/teclado */}
      <section className="mx-auto flex min-h-[calc(100dvh-5.5rem)] w-full max-w-[430px] items-center justify-center">
        <div className="w-full rounded-[28px] bg-[#f8fafc] px-6 py-8 shadow-[0_14px_36px_rgba(15,23,42,0.12)] sm:px-8 sm:py-10">
          <div className="mb-8 text-center sm:mb-10">
            <img
              src="/image/isotipo1.png"
              alt="GenAccess"
              className="mx-auto mb-5 h-14 w-14 rounded-2xl object-contain sm:mb-6 sm:h-[62px] sm:w-[62px]"
            />
            <h1 className="text-[2.55rem] font-extrabold leading-none tracking-tight text-slate-900 sm:text-[2.75rem]">
              GenAccess
            </h1>
            <p className="mx-auto mt-3 max-w-[290px] text-[1.1rem] leading-snug text-slate-400 sm:text-[1.2rem]">
              Plataforma Inteligente de Gestion para Propiedad Horizontal
            </p>
          </div>

          <LoginForm />
        </div>
      </section>

      <footer className="mt-6 text-center text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:text-[0.82rem]">
        <p>GenAccess Platform Console</p>
        <p className="mt-2 text-[0.84rem] normal-case tracking-normal text-slate-500 sm:text-[0.92rem]">
          &copy; 2024 GenAccess · Todos los derechos reservados
        </p>
      </footer>
    </main>
  );
}

export default LoginPage;
