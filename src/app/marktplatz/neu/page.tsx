import { AngebotForm } from "@/components/marktplatz/angebot-form";
import { Rechtshinweis } from "@/components/marktplatz/rechtshinweis";

export default function NeuesAngebotPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Neues Angebot</h1>
      <Rechtshinweis />
      <AngebotForm />
    </div>
  );
}
