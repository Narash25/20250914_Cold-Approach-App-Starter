import { prisma } from "@/lib/db";
import ProspectForm from "@/ui/ProspectForm";

type Props = { params: { id: string } };

export default async function EditProspectPage({ params }: Props) {
  if (!params?.id) return <div className="card p-4">Missing id in route.</div>;

  const p = await prisma.prospect.findUnique({ where: { id: params.id } });
  if (!p) return <div className="card p-4">Prospect not found.</div>;

  const d = new Date(p.firstContact);
  const firstContact = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;

  return (
    <div>
      <h2 className="font-semibold text-xl mb-3">Edit Prospect</h2>
      <ProspectForm
        prospectId={p.id}
        preset={{
          firstName: p.firstName,
          lastName: p.lastName,
          company: p.company ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          firstContact,
          status: (p.status as any) ?? "Pending",
          notes: p.notes ?? "",
        }}
      />
    </div>
  );
}
