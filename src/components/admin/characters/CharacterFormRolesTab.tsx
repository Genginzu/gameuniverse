"use client";

import type { CharacterFormTabProps } from "@/types/admin-characters";
import type { AvailableRole } from "@/hooks/useCharacterForm";
import { Icon } from "@iconify/react";

interface CharacterFormRolesTabProps extends CharacterFormTabProps {
  availableRoles: AvailableRole[];
}

export function CharacterFormRolesTab({ form, t, availableRoles }: CharacterFormRolesTabProps) {
  const selectedRoleIds: string[] = form.watch("role_ids") ?? [];

  const toggleRole = (roleId: string) => {
    const current = form.getValues("role_ids") ?? [];
    const updated = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId];
    form.setValue("role_ids", updated, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 dark:border-gray-700/30 dark:bg-gray-900/20">
        <label className="mb-3 block text-sm font-semibold">{t("role")}</label>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t("roleDescription")}</p>
        <div className="flex flex-wrap gap-2">
          {availableRoles.map((role) => {
            const isSelected = selectedRoleIds.includes(role.id);
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-palette-secondary-500/50 from-palette-secondary-500/10 to-palette-primary-500/10 text-palette-secondary-700 dark:text-palette-secondary-300 bg-linear-to-r"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500"
                }`}
              >
                {isSelected && <Icon icon="fa:check" className="h-3 w-3" />}
                {role.name}
              </button>
            );
          })}
          {availableRoles.length === 0 && (
            <p className="text-sm text-gray-400">{t("noRolesAvailable")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
