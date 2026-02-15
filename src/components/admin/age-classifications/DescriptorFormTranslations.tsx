"use client";

import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { FaPlus, FaTrash } from "react-icons/fa";
import type { DescriptorFormData } from "@/lib/validations/admin-descriptor-form";

export interface DescriptorFormTranslationsProps {
  form: UseFormReturn<DescriptorFormData>;
}

export function DescriptorFormTranslations({ form }: DescriptorFormTranslationsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "translations",
  });

  const handleAddTranslation = () => {
    append({ language_code: "", name: "", description: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Traductions</h3>
        <Button type="button" variant="outline" size="sm" onClick={handleAddTranslation}>
          <FaPlus className="mr-2 h-3 w-3" />
          Ajouter une traduction
        </Button>
      </div>

      {/* Erreur globale sur le tableau de traductions */}
      {form.formState.errors.translations?.root && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.translations.root.message}
        </p>
      )}

      {fields.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune traduction. Cliquez sur « Ajouter une traduction » pour commencer.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-700/40 dark:bg-gray-800/60"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Traduction {index + 1}
              </span>
              {/* Ne pas permettre de supprimer si c'est la dernière traduction */}
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label={`Supprimer la traduction ${index + 1}`}
                >
                  <FaTrash className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Code de langue */}
              <FormField
                control={form.control}
                name={`translations.${index}.language_code`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Code de langue</FormLabel>
                    <FormControl>
                      <Input placeholder="fr, en, de…" {...formField} maxLength={10} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nom */}
              <FormField
                control={form.control}
                name={`translations.${index}.name`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du descripteur" {...formField} maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name={`translations.${index}.description`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description (optionnel)"
                        {...formField}
                        value={formField.value ?? ""}
                        maxLength={500}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
