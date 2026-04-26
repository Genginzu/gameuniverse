import type { CancellationPolicy } from "@/types/coaching";

interface RefundResult {
  refundAmount: number;
  refundPercentage: number;
}

export function calculateRefund(
  cancellationPolicy: CancellationPolicy,
  scheduledAt: string,
  paymentAmount: number
): RefundResult {
  const hoursUntilSession = (new Date(scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilSession >= cancellationPolicy.free_until_hours) {
    return { refundAmount: paymentAmount, refundPercentage: 100 };
  }

  if (hoursUntilSession >= cancellationPolicy.no_refund_after_hours) {
    const percentage = cancellationPolicy.partial_refund_percentage;
    return {
      refundAmount: Math.round(paymentAmount * (percentage / 100) * 100) / 100,
      refundPercentage: percentage,
    };
  }

  return { refundAmount: 0, refundPercentage: 0 };
}
