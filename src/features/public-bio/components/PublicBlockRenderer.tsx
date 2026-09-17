import React from 'react';
import { BlockItem, ThemeConfig } from '../../../types';
import { BookingCard } from '../../../components/BookingCard';
import { LinkBlockView } from './blocks/LinkBlockView';
import { HeaderBlockView } from './blocks/HeaderBlockView';
import { AudioBlockView } from './blocks/AudioBlockView';
import { VideoBlockView } from './blocks/VideoBlockView';
import { FolderBlockView } from './blocks/FolderBlockView';
import { NewsletterBlockView } from './blocks/NewsletterBlockView';
import { SpacerBlockView } from './blocks/SpacerBlockView';
import { RichTextBlockView } from './blocks/RichTextBlockView';
import { ImageBlockView } from './blocks/ImageBlockView';
import { CarouselBlockView } from './blocks/CarouselBlockView';
import { GalleryBlockView } from './blocks/GalleryBlockView';
import { FormBlockView } from './blocks/FormBlockView';
import { DownloadBlockView } from './blocks/DownloadBlockView';
import { MapBlockView } from './blocks/MapBlockView';
import { FaqBlockView } from './blocks/FaqBlockView';
import { TestimonialBlockView } from './blocks/TestimonialBlockView';
import { EventBlockView } from './blocks/EventBlockView';
import { PresaveBlockView } from './blocks/PresaveBlockView';
import { ProductBlockView } from './blocks/ProductBlockView';
import { TipsBlockView } from './blocks/TipsBlockView';
import { PhoneBlockView } from './blocks/PhoneBlockView';
import { ContentGateBlockView } from './blocks/ContentGateBlockView';

interface PublicBlockRendererProps {
  block: BlockItem;
  profileId: string;
  theme: ThemeConfig;
  previewOnly?: boolean;
  blockIndex: number;
  blockCount: number;
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
  activeEmbeddedAudioId: string | null;
  setActiveEmbeddedAudioId: (id: string | null) => void;
  activeVideoId: string | null;
  setActiveVideoId: (id: string | null) => void;
  openFolders: Record<string, boolean>;
  onToggleFolder: (folderId: string) => void;
}

export const PublicBlockRenderer: React.FC<PublicBlockRendererProps> = ({
  block,
  profileId,
  theme,
  previewOnly = false,
  blockIndex,
  blockCount,
  playingAudioId,
  setPlayingAudioId,
  activeEmbeddedAudioId,
  setActiveEmbeddedAudioId,
  activeVideoId,
  setActiveVideoId,
  openFolders,
  onToggleFolder
}) => {
  switch (block.type) {
    case 'booking':
      return (
        <div key={block.id}>
          <BookingCard block={block} theme={theme} previewOnly={previewOnly} />
        </div>
      );

    case 'link':
      return <LinkBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'header':
      return <HeaderBlockView key={block.id} block={block} />;

    case 'audio':
      return (
        <AudioBlockView
          key={block.id}
          block={block}
          theme={theme}
          playingAudioId={playingAudioId}
          setPlayingAudioId={setPlayingAudioId}
          activeEmbeddedAudioId={activeEmbeddedAudioId}
          setActiveEmbeddedAudioId={setActiveEmbeddedAudioId}
        />
      );

    case 'video':
      return (
        <VideoBlockView
          key={block.id}
          block={block}
          theme={theme}
          activeVideoId={activeVideoId}
          setActiveVideoId={setActiveVideoId}
        />
      );

    case 'folder':
      return (
        <FolderBlockView
          key={block.id}
          block={block}
          theme={theme}
          isOpen={Boolean(openFolders[block.id])}
          onToggle={() => onToggleFolder(block.id)}
        />
      );

    case 'newsletter':
      return <NewsletterBlockView key={block.id} block={block} profileId={profileId} theme={theme} />;

    case 'spacer':
      return <SpacerBlockView key={block.id} block={block} blockIndex={blockIndex} blockCount={blockCount} />;

    case 'rich_text':
      return <RichTextBlockView key={block.id} block={block} theme={theme} />;

    case 'image':
      return <ImageBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'carousel':
      return <CarouselBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'gallery':
      return <GalleryBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'form':
      return <FormBlockView key={block.id} block={block} profileId={profileId} theme={theme} />;

    case 'download':
      return <DownloadBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'map':
      return <MapBlockView key={block.id} block={block} theme={theme} />;

    case 'faq':
      return <FaqBlockView key={block.id} block={block} theme={theme} />;

    case 'testimonials':
      return <TestimonialBlockView key={block.id} block={block} theme={theme} />;

    case 'event':
      return <EventBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'presave':
      return <PresaveBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'product':
      return <ProductBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'tips':
      return <TipsBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'phone':
      return <PhoneBlockView key={block.id} block={block} theme={theme} previewOnly={previewOnly} />;

    case 'content_gate':
      return <ContentGateBlockView key={block.id} block={block} profileId={profileId} theme={theme} />;

    default:
      return null;
  }
};
