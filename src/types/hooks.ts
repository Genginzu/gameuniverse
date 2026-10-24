// Types pour les hooks personnalisés

import { RoleFilterOption } from "./character";
import { PlatformFilterOption } from "./platform";

// --- Characters ---

export interface UseCharacterFiltersReturn {
  roles: RoleFilterOption[];
  platforms: PlatformFilterOption[];
  rolesLoading: boolean;
  platformsLoading: boolean;
}
