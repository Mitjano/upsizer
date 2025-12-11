"use client";

import dynamic from "next/dynamic";
import type SwaggerUIType from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

// Dynamic import to avoid SSR issues
const SwaggerUIReact = dynamic<React.ComponentProps<typeof SwaggerUIType>>(
  () => import("swagger-ui-react"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    ),
  }
);

interface SwaggerUIProps {
  specUrl?: string;
}

export default function SwaggerUI({ specUrl = "/api/openapi" }: SwaggerUIProps) {
  return (
    <div className="swagger-wrapper">
      <SwaggerUIReact
        url={specUrl}
        docExpansion="list"
        defaultModelsExpandDepth={-1}
        displayRequestDuration
        filter
        showExtensions
        showCommonExtensions
        tryItOutEnabled
      />
      <style jsx global>{`
        .swagger-wrapper {
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .info .title {
          color: #1a1a2e;
        }
        .swagger-ui .info .description {
          color: #4a5568;
        }
        .swagger-ui .opblock-tag {
          color: #1a1a2e;
          border-bottom: 1px solid #e2e8f0;
        }
        .swagger-ui .opblock {
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .swagger-ui .opblock .opblock-summary {
          border-radius: 8px;
        }
        .swagger-ui .opblock.opblock-post {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #10b981;
        }
        .swagger-ui .opblock.opblock-get {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #3b82f6;
        }
        .swagger-ui .opblock.opblock-delete {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #ef4444;
        }
        .swagger-ui .opblock.opblock-put {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.05);
        }
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: #f59e0b;
        }
        .swagger-ui .btn.execute {
          background: #8b5cf6;
          border-color: #8b5cf6;
        }
        .swagger-ui .btn.execute:hover {
          background: #7c3aed;
        }
        .swagger-ui .btn.authorize {
          background: #8b5cf6;
          border-color: #8b5cf6;
          color: white;
        }
        .swagger-ui .authorization__btn.locked {
          fill: #10b981;
        }
        .swagger-ui select {
          border-radius: 6px;
        }
        .swagger-ui input[type="text"],
        .swagger-ui input[type="password"],
        .swagger-ui textarea {
          border-radius: 6px;
        }
        .swagger-ui .response-col_status {
          font-weight: 600;
        }
        .swagger-ui table tbody tr td {
          padding: 12px 0;
        }
        .swagger-ui .model-box {
          background: #f8fafc;
          border-radius: 8px;
        }
        .swagger-ui section.models {
          border-radius: 8px;
        }
        .swagger-ui .filter-container input {
          border-radius: 8px;
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
}
