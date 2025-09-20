import { prisma } from "@/lib/db";
import { format } from "date-fns";
import type { Prospect, Touch } from "@prisma/client";

/** Compose a readable full name from first/last */
function fullName(p: Pick<Prospect, "firstName" | "lastName">) {
  return `${p.firstName} ${p.lastName}`.trim();
}

type ProspectWithTouches = Prospect & { touches: Touch[] };
type DueItem = { p: ProspectWithTouches; t: Touch };

export default async function Page() {
  // Load prospects with their pending touches (sorted by index)
  const prospects: ProspectWithTouches[] = await prisma.prospect.findMany({
    include: {
      touches: { where: { status: "Pending" }, orderBy: { index: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Start-of-day boundary for "due today/overdue"
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Build today's due list (pending touches whose due <= start of today)
  const dueToday: DueItem[] = prospects.flatMap((p: ProspectWithTouches) =>
    p.touches
      .filter((t: Touch) => new Date(t.due) <= startOfToday)
      .map((t: Touch) => ({ p, t }))
  );

  // Pipeline counts by status (string statuses in SQLite)
  const pipelineCounts = await prisma.prospect.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const order = [
    "Pending",
    "Interested",
    "MeetingScheduled",
    "DealClosed",
    "NotInterested",
  ] as const;

  const pipeline: Record<(typeof order)[number], number> = Object.fromEntries(
    order.map((s) => [
      s,
      pipelineCounts.find(
        (x: { status: string; _count: { status: number } }) => x.status === s
      )?._count.status ?? 0,
    ])
  ) as Record<(typeof order)[number], number>;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Today’s Touches */}
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Today’s Touches</h2>
          <span className="text-xs">{dueToday.length} due</span>
        </div>

        <div className="mt-3 space-y-2">
          {dueToday.map(({ p, t }: DueItem) => (
            <div key={t.id} className="border rounded-xl p-3 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {fullName(p)}
                    {p.company ? (
                      <span className="text-gray-500"> • {p.company}</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-600">{t.name}</div>
                </div>
                <div className="text-right text-xs text-gray-600">
                  Due: {format(new Date(t.due), "dd MMM yyyy")}
                </div>
              </div>
            </div>
          ))}

          {dueToday.length === 0 && (
            <div className="text-sm text-gray-500">No touches due today.</div>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div className="card p-4">
        <h2 className="font-semibold">Pipeline</h2>
        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          {order.map((k) => (
            <div
              key={k}
              className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
            >
              <span>{k.replace("MeetingScheduled", "Meeting Scheduled")}</span>
              <span className="font-semibold">{pipeline[k] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card p-4">
        <h2 className="font-semibold">Quick Links</h2>
        <ul className="list-disc list-inside mt-2 text-sm">
          <li>
            <a className="underline" href="/prospects">
              Manage Prospects
            </a>
          </li>
          <li>
            <a className="underline" href="/import">
              Import CSV / Excel (.csv, .xlsx, .xls)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
