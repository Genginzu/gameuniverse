import { createCallbackHandler, epicConnection } from "@/lib/services/platform-connection";

export const GET = createCallbackHandler(epicConnection);
