import { createAuthorizeHandler, discordConnection } from "@/lib/services/platform-connection";

export const GET = createAuthorizeHandler(discordConnection);
