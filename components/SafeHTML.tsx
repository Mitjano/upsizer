"use client";

import DOMPurify from "isomorphic-dompurify";

interface SafeHTMLProps {
  html: string;
  className?: string;
}

/**
 * SafeHTML component that sanitizes HTML content using DOMPurify
 * to prevent XSS attacks when rendering user-generated content
 */
export default function SafeHTML({ html, className }: SafeHTMLProps) {
  // Configure DOMPurify to allow safe HTML elements
  const cleanHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "a", "strong", "em", "b", "i", "u", "s", "strike",
      "blockquote", "pre", "code",
      "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
      "sup", "sub",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "title",
      "class", "id", "width", "height",
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    // Force all links to have noopener noreferrer for security
    FORBID_TAGS: ["script", "style", "iframe", "form", "input", "button", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });

  // Add rel="noopener noreferrer" to all external links
  const secureHTML = cleanHTML.replace(
    /<a\s+(?=[^>]*href=["'][^"']*["'])/gi,
    '<a rel="noopener noreferrer" '
  );

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: secureHTML }}
    />
  );
}
