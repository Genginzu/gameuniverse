export { connectPlatform } from "./connectPlatform";
export type { ConnectPlatformParams } from "./connectPlatform";
export { PlatformConnectionError } from "./errors";
export { getValidAccessToken } from "./refresh";
export { getXboxAuthForPlayer } from "./xboxPlayerAuth";
export { authorizeXboxLive, xboxAuthorizationHeader } from "./xboxLive";
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
  getConnectionAdapter,
  itchConnection,
  psnConnection,
  steamConnection,
  xboxConnection,
} from "./adapters";
