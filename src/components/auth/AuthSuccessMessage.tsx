"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { AuthSuccessMessage as AuthSuccessMessageType } from "@/types/auth";
import { Icon } from "@iconify/react";

interface AuthSuccessMessageProps extends AuthSuccessMessageType {}

export function AuthSuccessMessage({ message, show }: AuthSuccessMessageProps) {
  if (!show) return null;

  return (
    <Alert className="rounded-2xl border-0 bg-green-50/95 shadow-lg backdrop-blur-xs">
      <Icon icon="ion:checkmark-circle" className="h-5 w-5 text-green-600" />
      <AlertDescription className="font-medium text-green-800">{message}</AlertDescription>
    </Alert>
  );
}
