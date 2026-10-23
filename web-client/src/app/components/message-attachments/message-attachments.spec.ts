import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { MessageAttachments, attachmentKind } from './message-attachments';
import { AttachmentService } from '../../services/attachment.service';
import type { TurnAttachment } from '../../models/attachment';

const IMAGE: TurnAttachment = {
  url: '/core/attachments/11111111-1111-1111-1111-111111111111',
  name: 'cat.png',
  contentType: 'image/png',
  sizeBytes: 2048,
};

const ARCHIVE: TurnAttachment = {
  url: '/core/attachments/22222222-2222-2222-2222-222222222222',
  name: 'bundle.zip',
  contentType: 'application/zip',
  sizeBytes: 5 * 1024 * 1024,
};

describe('attachmentKind', () => {
  it('classifies by content type', () => {
    expect(attachmentKind('image/png')).toBe('image');
    expect(attachmentKind('video/mp4')).toBe('video');
    expect(attachmentKind('audio/mpeg')).toBe('audio');
    expect(attachmentKind('application/pdf')).toBe('document');
    expect(attachmentKind('application/zip')).toBe('archive');
  });

  it('falls back to the file extension for generic types', () => {
    expect(attachmentKind('application/octet-stream', 'notes.md')).toBe('document');
    expect(attachmentKind('application/octet-stream', 'clip.mov')).toBe('video');
    expect(attachmentKind('application/octet-stream', 'bundle.rar')).toBe('archive');
    expect(attachmentKind(undefined, 'mystery.bin')).toBe('unknown');
  });
});

describe('MessageAttachments', () => {
  let fixture: ComponentFixture<MessageAttachments>;
  const preview = vi.fn(
    (url: string): Promise<Blob | null> => {
      void url;
      return Promise.resolve(new Blob(['png'], { type: 'image/png' }));
    },
  );

  beforeEach(async () => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });
    await TestBed.configureTestingModule({
      imports: [MessageAttachments],
      providers: [{ provide: AttachmentService, useValue: { preview } }],
    }).compileComponents();
    fixture = TestBed.createComponent(MessageAttachments);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders an image thumbnail, a size, and an icon tile for other types', async () => {
    fixture.componentRef.setInput('attachments', [IMAGE, ARCHIVE]);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const image = host.querySelector('img');
    expect(image).not.toBeNull();
    expect(image?.getAttribute('alt')).toBe('cat.png');
    expect(image?.getAttribute('src')).toBe('blob:preview');

    // The archive has no preview: icon tile with its name.
    expect(host.querySelector('lucide-archive, svg')).not.toBeNull();
    expect(host.textContent).toContain('bundle.zip');
    expect(host.textContent).toContain('5.0 MB');

    // Only previewable kinds are fetched.
    expect(preview).toHaveBeenCalledTimes(1);
    expect(preview).toHaveBeenCalledWith(IMAGE.url);
  });

  it('falls back to an icon when a preview cannot be fetched', async () => {
    preview.mockResolvedValueOnce(null);
    fixture.componentRef.setInput('attachments', [IMAGE]);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent).toContain('cat.png');
  });
});
