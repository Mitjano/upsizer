import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserDetailClient from "./UserDetailClient";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  const { id } = await params;

  // Fetch user with related data
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      usages: {
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
      imageHistory: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Serialize dates and map fields for client component
  const serializedUser = {
    ...JSON.parse(JSON.stringify(user)),
    usages: user.usages.map(usage => ({
      id: usage.id,
      toolType: usage.type, // Map 'type' from DB to 'toolType' expected by client
      creditsUsed: usage.creditsUsed,
      createdAt: usage.createdAt.toISOString(),
    })),
    imageHistory: user.imageHistory.map(img => ({
      id: img.id,
      toolType: img.type, // Map 'type' enum to 'toolType' for consistency
      originalUrl: img.originalUrl,
      processedUrl: img.processedUrl,
      createdAt: img.createdAt.toISOString(),
    })),
  };

  return <UserDetailClient user={serializedUser} />;
}
