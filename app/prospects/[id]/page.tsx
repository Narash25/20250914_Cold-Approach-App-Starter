import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import DeleteProspectButton from "@/ui/DeleteProspectButton";
import Link from "next/link";

function safe(fmt: () => string, fallback = "-") {
  try {
    const v = fmt();
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

type PageProps = { params: { id: string } };

export default async function ProspectDetailPage({ params }: PageProps) {
  const prospect = await prisma.prospect.findUnique({
    where: { id: params.id },
    include: { touches: { orderBy: { index: "asc" } } },
  });
  if (!prospect) return notFound();

  const firstContactLabel = safe(() =>
    format(new Date(prospect.firstContact as unknown as Date), "d-M-yyyy")
  );
  const statusLabel = safe(() =>
    (prospect.status || "")
      .toString()
      .replace("MeetingScheduled", "Meeting Scheduled")
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">Prospect</h2>
        <div className="flex gap-2">
          <Link className="btn" href="/prospects" prefetch={false}>
            ← Back
          </Link>
          <Link
            className="btn"
            href={`/prospects/${prospect.id}/edit`}
            prefetch={false}
          >
            Edit
          </Link>
          <DeleteProspectButton id={prospect.id} />
        </div>
      </div>
      {/* …rest of your detail UI (unchanged)… */}
    </div>
  );
}
