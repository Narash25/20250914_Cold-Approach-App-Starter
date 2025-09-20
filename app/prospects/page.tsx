import { prisma } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fullName(p: { firstName?: string | null; lastName?: string | null }) {
  const fn = (p.firstName ?? "").trim();
  const ln = (p.lastName ?? "").trim();
  return `${fn} ${ln}`.trim() || "-";
}
function statusLabel(s?: string | null) {
  if (!s) return "-";
  return s.replace("MeetingScheduled", "Meeting Scheduled");
}
function nextPendingTouch(
  touches: Array<{ status: string; name: string; due: Date }>
) {
  return touches.find((t) => t.status === "Pending");
}

export default async function ProspectsPage() {
  const prospects = await prisma.prospect.findMany({
    include: {
      touches: { where: { status: "Pending" }, orderBy: { index: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prospects</h1>
        <Link className="btn-primary" href="/prospects/new" prefetch={false}>
          Add Prospect
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Company</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Status</th>
              <th className="p-3">Next Touch</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((p) => {
              const next = nextPendingTouch(
                p.touches as unknown as {
                  status: string;
                  name: string;
                  due: Date;
                }[]
              );
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{fullName(p)}</td>
                  <td className="p-3">{p.company || "-"}</td>
                  <td className="p-3">
                    {p.email ? (
                      <a className="underline" href={`mailto:${p.email}`}>
                        {p.email}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3">{p.phone || "-"}</td>
                  <td className="p-3">{statusLabel(p.status)}</td>
                  <td className="p-3">
                    {next ? (
                      <div>
                        <div>
                          {next.name.replace(
                            "MeetingScheduled",
                            "Meeting Scheduled"
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(next.due), "dd MMM yyyy")}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      className="btn"
                      href={`/prospects/${p.id}`}
                      prefetch={false}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}

            {prospects.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No prospects yet.{" "}
                  <Link
                    className="underline"
                    href="/prospects/new"
                    prefetch={false}
                  >
                    Add your first one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
