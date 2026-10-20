import { createAuthorizeHandler, xboxConnection } from "@/lib/services/platform-connection";

export const GET = createAuthorizeHandler(xboxConnection);
