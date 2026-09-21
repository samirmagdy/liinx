import React from 'react';
import { type ProfileBlock, type ThemeConfig } from '../../types';
import { SpacerBlockView } from '../../features/public-bio/components/blocks/SpacerBlockView';
import { RichTextBlockView } from '../../features/public-bio/components/blocks/RichTextBlockView';
import { FaqBlockView } from '../../features/public-bio/components/blocks/FaqBlockView';
import { FormBlockView } from '../../features/public-bio/components/blocks/FormBlockView';

/**
 * The document block family a starter site is allowed to compose.
 *
 * These four render through the same views the published page uses, so a preview of a starter
 * site shows the block exactly as a visitor will see it.
 */
const DOCUMENT_BLOCK_TYPES = ['spacer', 'rich_text', 'faq', 'form'];

export const isDocumentBlock = (type: string) => DOCUMENT_BLOCK_TYPES.includes(type);

interface PhoneDocumentBlockProps {
  block: ProfileBlock;
  theme: ThemeConfig;
  blockIndex: number;
  blockCount: number;
  profileId?: string;
}

export const PhoneDocumentBlock: React.FC<PhoneDocumentBlockProps> = ({
  block,
  theme,
  blockIndex,
  blockCount,
  profileId = ''
}) => {
  if (block.type === 'rich_text') return <RichTextBlockView block={block} theme={theme} />;
  if (block.type === 'faq') return <FaqBlockView block={block} theme={theme} />;
  if (block.type === 'form') return <FormBlockView block={block} theme={theme} profileId={profileId} />;
  if (block.type === 'spacer') return <SpacerBlockView block={block} blockIndex={blockIndex} blockCount={blockCount} />;
  return null;
};
