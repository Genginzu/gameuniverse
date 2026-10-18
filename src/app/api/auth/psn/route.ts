import { createNpssoHandler, psnConnection } from "@/lib/services/platform-connection";

export const POST = createNpssoHandler(psnConnection);
