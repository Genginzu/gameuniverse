import { createAuthorizeHandler, epicConnection } from "@/lib/services/platform-connection";

export const GET = createAuthorizeHandler(epicConnection);
