import Link from "next/link";
import { CreateForm } from "./CreateForm";

export const metadata = { title: "Crear cata · Copa Ciega" };

export default function CreatePage() {
  return (
    <main className="bg-wine min-h-dvh px-5 py-8">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="text-sm text-marfil/60 hover:text-marfil">
          ← Volver
        </Link>
        <h1 className="mb-1 mt-4 text-2xl font-bold text-marfil">Crear una cata</h1>
        <p className="mb-6 text-sm text-marfil/60">
          Elige la modalidad y el formato. Guardarás un código SOS para recuperar el
          control si pierdes acceso.
        </p>

        <CreateForm />

        <p className="mt-4 text-center text-xs text-marfil/40">
          ¿Perdiste el acceso de administrador?{" "}
          <Link href="/recover" className="text-dorado hover:underline">
            Recupéralo con tu código SOS
          </Link>
        </p>
      </div>
    </main>
  );
}
