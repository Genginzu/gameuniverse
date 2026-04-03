import { WebhookEventDiff } from "@/components/admin/webhooks/WebhookEventDiff";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function WebhookEventDiffPage({ params }: PageProps) {
  const { eventId } = await params;
  return <WebhookEventDiff eventId={eventId} />;
}
