import { createAuthorizeHandler, itchConnection } from "@/lib/services/platform-connection";

export const GET = createAuthorizeHandler(itchConnection);
