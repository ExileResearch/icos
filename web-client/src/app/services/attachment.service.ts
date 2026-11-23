import { Injectable, inject } from '@angular/core';
import { ATTACHMENTS_ENDPOINT, SERVER_URL } from '../../constants';
import type { StoredAttachment } from '../models/attachment';
import { CoreApiService } from './core-api.service';

/**
 * Uploads files to the core attachment store (M16.2). Each file is sent as
 * its own multipart request; the returned reference is what a turn carries.
 */
@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly api = inject(CoreApiService);

  /**
   * Fetch a stored attachment's bytes for an inline preview (GH22). Only
   * `/core/attachments/<uuid>` references are fetched — a transcript must never
   * make the browser request an arbitrary URL with the session cookie.
   */
  async preview(url: string): Promise<Blob | null> {
    if (!/^\/core\/attachments\/[0-9a-f-]{36}$/i.test(url)) return null;
    const response = await fetch(`${SERVER_URL}${url}`, {
      credentials: 'include',
    });
    return response.ok ? response.blob() : null;
  }

  async upload(file: File): Promise<StoredAttachment> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.api.postForm<StoredAttachment>(ATTACHMENTS_ENDPOINT, form);
  }
}
