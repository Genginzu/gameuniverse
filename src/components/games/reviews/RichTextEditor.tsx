"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useReviewTranslations } from "@/hooks/useTranslations";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}

function ToolbarButton({ onClick, isActive, icon, label }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        "rounded-lg p-2 transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  const t = useReviewTranslations();

  if (!editor) return null;

  const buttons: ToolbarButtonProps[] = [
    {
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      icon: <Icon icon="lucide:bold" className="h-4 w-4" />,
      label: t("editor.bold"),
    },
    {
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      icon: <Icon icon="lucide:italic" className="h-4 w-4" />,
      label: t("editor.italic"),
    },
    {
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
      icon: <Icon icon="lucide:list" className="h-4 w-4" />,
      label: t("editor.bulletList"),
    },
    {
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
      icon: <Icon icon="lucide:list-ordered" className="h-4 w-4" />,
      label: t("editor.orderedList"),
    },
  ];

  return (
    <div
      className="border-border flex gap-1 border-b p-2"
      role="toolbar"
      aria-label={t("editor.toolbarAriaLabel")}
    >
      {buttons.map((btn) => (
        <ToolbarButton key={btn.label} {...btn} />
      ))}
    </div>
  );
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none p-3 min-h-[150px] focus:outline-hidden text-foreground",
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  return (
    <div className="border-input bg-background focus-within:ring-ring focus-within:ring-offset-background relative rounded-xl border transition-all focus-within:ring-2 focus-within:ring-offset-2">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      {!content && placeholder && !editor?.isFocused && (
        <p className="text-muted-foreground pointer-events-none absolute bottom-0 left-0 p-3 text-sm">
          {placeholder}
        </p>
      )}
    </div>
  );
}
