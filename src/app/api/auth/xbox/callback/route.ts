import { createCallbackHandler, xboxConnection } from "@/lib/services/platform-connection";

export const GET = createCallbackHandler(xboxConnection);
