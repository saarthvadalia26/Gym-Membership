import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(2, "Gym name must be at least 2 characters").max(120),
  address: z.string().max(240).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireOwner();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
        "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const gym = await prisma.gym.update({
      where: { id: ctx.gymId },
      data: {
        name: parsed.data.name,
        address: parsed.data.address || null,
        phone: parsed.data.phone || null,
      },
    });

    return NextResponse.json({ ok: true, gym });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Owner only" }, { status: 403 });
    }
    throw e;
  }
}
