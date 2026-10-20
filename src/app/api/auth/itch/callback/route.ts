import {
  createImplicitBridgeHandler,
  createImplicitCallbackHandler,
  itchConnection,
} from "@/lib/services/platform-connection";

export const GET = createImplicitBridgeHandler();
export const POST = createImplicitCallbackHandler(itchConnection);
