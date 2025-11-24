"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing your blog post..."
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-green-400 hover:text-green-300 underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-lg max-w-none focus:outline-none min-h-[500px] px-6 py-4 text-gray-100 prose-headings:text-white prose-p:text-gray-100 prose-li:text-gray-100 prose-strong:text-white prose-a:text-green-400",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border-2 border-gray-700 rounded-xl bg-gray-900 overflow-hidden shadow-xl">
      {/* Toolbar */}
      <div className="border-b-2 border-gray-700 p-3 flex flex-wrap gap-2 bg-gray-800">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-700 pr-3 mr-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-2 rounded-lg font-bold transition-all ${
              editor.isActive("bold")
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-2 rounded-lg italic transition-all ${
              editor.isActive("italic")
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-2 rounded-lg underline transition-all ${
              editor.isActive("underline")
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Underline"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-2 rounded-lg line-through transition-all ${
              editor.isActive("strike")
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Strikethrough"
          >
            S
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-700 pr-3 mr-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
              editor.isActive("heading", { level: 1 })
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
              editor.isActive("heading", { level: 2 })
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
              editor.isActive("heading", { level: 3 })
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-700 pr-3 mr-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              editor.isActive("bulletList")
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              editor.isActive("orderedList")
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Numbered List"
          >
            1. List
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-700 pr-3 mr-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              editor.isActive({ textAlign: "left" })
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Align Left"
          >
            ⬅
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              editor.isActive({ textAlign: "center" })
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              editor.isActive({ textAlign: "right" })
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Align Right"
          >
            ➡
          </button>
        </div>

        {/* Insert */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={setLink}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              editor.isActive("link")
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Insert Link"
          >
            🔗 Link
          </button>
          <button
            type="button"
            onClick={addImage}
            className="px-3 py-2 rounded-lg text-sm bg-gray-700 text-gray-200 hover:bg-gray-600 transition-all"
            title="Insert Image"
          >
            🖼️ Image
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              editor.isActive("blockquote")
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title="Quote"
          >
            💬 Quote
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
