import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface FormSkeletonProps {
  fields?: number;
  showHeader?: boolean;
  showButtons?: boolean;
}

export function FormSkeleton({
  fields = 4,
  showHeader = true,
  showButtons = true,
}: FormSkeletonProps) {
  return (
    <Card className="mx-auto w-full max-w-md">
      {showHeader && (
        <CardHeader>
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}

        {showButtons && (
          <div className="flex space-x-2 pt-4">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
