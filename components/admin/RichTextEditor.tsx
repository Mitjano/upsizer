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
        class: "prose prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4",
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
    <div className="border border-gray-700 rounded-xl bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-700 p-2 flex flex-wrap gap-2 bg-gray-800/50">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-700 transition ${
              editor.isActive("bold") ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-700 transition ${
              editor.isActive("italic") ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-700 transition ${
              editor.isActive("underline") ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-700 transition ${
              editor.isActive("strike") ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive("heading", { level: 1 }) ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive("heading", { level: 2 }) ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive("heading", { level: 3 }) ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive("bulletList") ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive("orderedList") ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Numbered List"
          >
            1. List
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-2 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive({ textAlign: "left" }) ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Align Left"
          >
            ⬅
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-2 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive({ textAlign: "center" }) ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-2 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive({ textAlign: "right" }) ? "bg-gray-700 text-green-400" : "text-gray-400"
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
            className={`px-2 py-1 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive("link") ? "bg-gray-700 text-green-400" : "text-gray-400"
            }`}
            title="Insert Link"
          >
            🔗 Link
          </button>
          <button
            type="button"
            onClick={addImage}
            className="px-2 py-1 rounded hover:bg-gray-700 transition text-sm text-gray-400"
            title="Insert Image"
          >
            🖼️ Image
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 rounded hover:bg-gray-700 transition text-sm ${
              editor.isActive("blockquote") ? "bg-gray-700 text-green-400" : "text-gray-400"
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
