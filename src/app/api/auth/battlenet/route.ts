import { createAuthorizeHandler, battlenetConnection } from "@/lib/services/platform-connection";

export const GET = createAuthorizeHandler(battlenetConnection);
