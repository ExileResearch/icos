import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { SafeUrl } from '@angular/platform-browser';
import {
  LucideArchive,
  LucideFile,
  LucideFileQuestion,
  LucideFileText,
  LucideFilm,
  LucideMusic,
} from '@lucide/angular';
import type { TurnAttachment } from '../../models/attachment';
import { AttachmentService } from '../../services/attachment.service';

type Kind = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'unknown';

const EXTENSION_KINDS: Record<string, Kind> = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image',
  mp4: 'video', mov: 'video', webm: 'video', mkv: 'video', m4v: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio', flac: 'audio',
  pdf: 'document', txt: 'document', md: 'document', json: 'document', csv: 'document',
  doc: 'document', docx: 'document', rtf: 'document',
  zip: 'archive', rar: 'archive', gz: 'archive', tar: 'archive', '7z': 'archive', bz2: 'archive',
};

/** Classify by content type first, then by extension (uploads often arrive as octet-stream). */
export function attachmentKind(
  contentType?: string,
  name?: string,
): Kind {
  const type = (contentType ?? '').toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('text/')) return 'document';
  if (/json|pdf|document|markdown|rtf/.test(type)) return 'document';
  if (/zip|rar|gzip|tar|7z|x-compressed|x-tar/.test(type)) return 'archive';
  const extension = (name ?? '').split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_KINDS[extension] ?? 'unknown';
}

function sizeLabel(bytes?: number): string | null {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Attachments sent with a message (GH22): image/video thumbnails, an icon for
 * everything else. Previews are fetched with the session cookie and shown as
 * object URLs, so they work across origins without exposing file ids.
 */
@Component({
  selector: 'app-message-attachments',
  imports: [
    LucideArchive,
    LucideFile,
    LucideFileQuestion,
    LucideFileText,
    LucideFilm,
    LucideMusic,
  ],
  templateUrl: './message-attachments.html',
  styleUrl: './message-attachments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageAttachments {
  readonly attachments = input.required<readonly TurnAttachment[]>();

  private readonly files = inject(AttachmentService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly objectUrls: string[] = [];
  /** Preview object URLs keyed by the attachment reference. */
  readonly previews = signal<ReadonlyMap<string, SafeUrl>>(new Map());

  constructor() {
    // The input is bound after construction, so previews load from an effect.
    effect(() => void this.loadPreviews(this.attachments()));
    inject(DestroyRef).onDestroy(() => {
      for (const url of this.objectUrls) URL.revokeObjectURL(url);
    });
  }

  kindOf(attachment: TurnAttachment): Kind {
    return attachmentKind(attachment.contentType, attachment.name);
  }

  sizeOf(attachment: TurnAttachment): string | null {
    return sizeLabel(attachment.sizeBytes);
  }

  label(attachment: TurnAttachment): string {
    const size = this.sizeOf(attachment);
    return size ? `${attachment.name ?? 'attachment'} (${size})` : (attachment.name ?? 'attachment');
  }

  previewFor(url: string): SafeUrl | null {
    return this.previews().get(url) ?? null;
  }

  private async loadPreviews(list: readonly TurnAttachment[]): Promise<void> {
    const loaded = this.previews();
    const previewable = list.filter((attachment) => {
      if (loaded.has(attachment.url)) return false;
      const kind = this.kindOf(attachment);
      return kind === 'image' || kind === 'video';
    });
    if (previewable.length === 0) return;

    const next = new Map(loaded);
    for (const attachment of previewable) {
      try {
        const blob = await this.files.preview(attachment.url);
        if (!blob) continue;
        const objectUrl = URL.createObjectURL(blob);
        this.objectUrls.push(objectUrl);
        next.set(attachment.url, this.sanitizer.bypassSecurityTrustUrl(objectUrl));
      } catch {
        // A missing preview is never fatal: the icon tile stands in.
      }
    }
    this.previews.set(next);
  }
}
