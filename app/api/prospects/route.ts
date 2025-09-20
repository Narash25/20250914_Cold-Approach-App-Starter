import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

function parseFirstContact(input: string): Date | null {
  if (!input) return null;
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(input.trim());
  if (m) {
    const d = Number(m[1]),
      mo = Number(m[2]) - 1,
      y = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo, d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(input);
  return isNaN(dt.getTime()) ? null : dt;
}

const bodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine(
      (v) => v === "" || z.string().email().safeParse(v).success,
      "Invalid email."
    ),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine((v) => !v || /^\+[1-9]\d{6,14}$/.test(v), "Invalid phone (E.164)."),
  firstContact: z.string().min(1),
  status: z
    .enum([
      "Pending",
      "Interested",
      "MeetingScheduled",
      "DealClosed",
      "NotInterested",
    ])
    .default("Pending"),
  notes: z.string().optional(),
});

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const item = await prisma.prospect.findUnique({
    where: { id: ctx.params.id },
    include: { touches: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path[0]}: ${i.message}`)
      .join("; ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const {
    firstName,
    lastName,
    company,
    email,
    phone,
    firstContact,
    status,
    notes,
  } = parsed.data;
  const firstDate = parseFirstContact(firstContact);
  if (!firstDate)
    return NextResponse.json(
      { error: "Invalid first contact date. Use dd-m-yyyy." },
      { status: 400 }
    );

  const updated = await prisma.prospect.update({
    where: { id: ctx.params.id },
    data: {
      firstName,
      lastName,
      company,
      email: email || undefined,
      phone: phone || undefined,
      firstContact: firstDate,
      status,
      notes,
    },
    include: { touches: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const id = ctx.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.touch.deleteMany({ where: { prospectId: id } });
  const deleted = await prisma.prospect
    .delete({ where: { id } })
    .catch(() => null);

  if (!deleted)
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
