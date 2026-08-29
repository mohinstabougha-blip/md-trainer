import { FeedbackListe } from "@/components/admin/feedback-liste";
import { getOffenesFeedbackGruppiert } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const gruppen = await getOffenesFeedbackGruppiert();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Gemeldetes Feedback</h1>
      <FeedbackListe gruppen={gruppen} />
    </div>
  );
}
