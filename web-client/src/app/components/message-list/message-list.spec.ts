import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { MessageList } from './message-list';
import { AttachmentService } from '../../services/attachment.service';
import type { ChatMessage } from '../../models/message';

describe('MessageList', () => {
  let fixture: ComponentFixture<MessageList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageList],
      providers: [
        {
          provide: AttachmentService,
          useValue: { preview: vi.fn(() => Promise.resolve(null)) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MessageList);
  });

  function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
    return {
      role: 'user',
      content: 'hello',
      excludedFromContext: false,
      createdAt: '2026-10-23T00:00:00.000Z',
      ...overrides,
    };
  }

  it('renders the attachment strip for a message with files (GH22)', () => {
    fixture.componentRef.setInput('messages', [
      message({
        attachments: [
          {
            url: '/core/attachments/11111111-1111-1111-1111-111111111111',
            name: 'cat.png',
            contentType: 'image/png',
            sizeBytes: 10,
          },
        ],
      }),
    ]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const strip = host.querySelector('app-message-attachments');
    expect(strip).not.toBeNull();
    expect(strip?.className).toContain('user');
    expect(host.textContent).toContain('cat.png');
  });

  it('renders no strip for a message without files', () => {
    fixture.componentRef.setInput('messages', [message()]);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-message-attachments'),
    ).toBeNull();
  });
});
