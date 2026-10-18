import { createAuthorizeHandler, steamConnection } from "@/lib/services/platform-connection";

export const GET = createAuthorizeHandler(steamConnection);
