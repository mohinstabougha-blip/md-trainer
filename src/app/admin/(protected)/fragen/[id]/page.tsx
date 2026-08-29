import { notFound } from "next/navigation";
import { FrageForm } from "@/components/admin/frage-form";
import { getQuestionByIdAdmin } from "@/lib/admin-data";

export default async function AdminFrageBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const frage = await getQuestionByIdAdmin(Number(id));
  if (!frage) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Frage #{frage.id} bearbeiten</h1>
      <FrageForm initial={frage} />
    </div>
  );
}
