import { createCallbackHandler, battlenetConnection } from "@/lib/services/platform-connection";

export const GET = createCallbackHandler(battlenetConnection);
