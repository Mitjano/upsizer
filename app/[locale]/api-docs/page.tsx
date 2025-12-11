/**
 * API Documentation Page
 * Displays interactive API documentation using Swagger UI
 */

import { Metadata } from 'next';
import ApiDocsClient from './ApiDocsClient';

export const metadata: Metadata = {
  title: 'API Documentation | Pixelift',
  description: 'Complete API documentation for Pixelift image processing services',
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
