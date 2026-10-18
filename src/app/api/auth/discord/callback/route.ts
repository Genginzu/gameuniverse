import { createCallbackHandler, discordConnection } from "@/lib/services/platform-connection";

export const GET = createCallbackHandler(discordConnection);
