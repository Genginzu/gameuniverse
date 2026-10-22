export { connectPlatform } from "./connectPlatform";
export type { ConnectPlatformParams } from "./connectPlatform";
export { getValidAccessToken } from "./refresh";
export { getXboxAuthForPlayer } from "./xboxPlayerAuth";
export { xboxAuthorizationHeader } from "./xboxLive";
export {
  createAuthorizeHandler,
  createCallbackHandler,
  createImplicitBridgeHandler,
  createImplicitCallbackHandler,
  createNpssoHandler,
} from "./routeHandlers";
export {
  battlenetConnection,
  discordConnection,
  epicConnection,
  itchConnection,
  psnConnection,
  steamConnection,
  xboxConnection,
} from "./adapters";
