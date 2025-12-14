"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import ActionButton from './ActionButton';

export interface CopyLinkButtonProps {
  imageId: string;
  accentColor?: 'green' | 'blue' | 'purple' | 'gray';
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export default function CopyLinkButton({
  imageId,
  accentColor = 'blue',
  variant = 'secondary',
  className = '',
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/share/${imageId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ActionButton
      onClick={handleCopyLink}
      icon="link"
      accentColor={accentColor}
      variant={variant}
      className={className}
    >
      {copied ? 'Copied!' : 'Copy Link'}
    </ActionButton>
  );
}
