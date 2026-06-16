import { JobDetailContainer } from "@/components/jobs/job-detail-container";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobDetailContainer jobId={id} />;
}
