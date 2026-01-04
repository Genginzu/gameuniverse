"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { IoCheckmarkCircle } from "react-icons/io5";

interface AuthSuccessMessageProps {
  message: string;
  show: boolean;
}

export function AuthSuccessMessage({ message, show }: AuthSuccessMessageProps) {
  if (!show) return null;

  return (
    <Alert className="rounded-2xl border-0 bg-green-50/95 shadow-lg backdrop-blur-sm">
      <IoCheckmarkCircle className="h-5 w-5 text-green-600" />
      <AlertDescription className="font-medium text-green-800">{message}</AlertDescription>
    </Alert>
  );
}
