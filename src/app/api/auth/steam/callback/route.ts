import { createCallbackHandler, steamConnection } from "@/lib/services/platform-connection";

export const GET = createCallbackHandler(steamConnection);
