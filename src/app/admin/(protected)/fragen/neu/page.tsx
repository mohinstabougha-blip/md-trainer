import { FrageForm } from "@/components/admin/frage-form";

export default function AdminNeueFragePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Neue Frage</h1>
      <FrageForm />
    </div>
  );
}
