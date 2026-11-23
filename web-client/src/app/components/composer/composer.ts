import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePaperclip, LucideSend, LucideX } from '@lucide/angular';
import type { ComposerSubmission, TurnAttachment } from '../../models/attachment';
import { toTurnAttachment } from '../../models/attachment';
import { AttachmentService } from '../../services/attachment.service';
import { CommandCatalogService } from '../../services/command-catalog.service';
import type { SlashCommand } from '../../models/slash-command';

/**
 * Message composer. Enter sends, Shift+Enter adds a newline.
 *
 * Attachments are uploaded to the core attachment store on submit (M16.2) and
 * carried as references with the turn. The server bounds size and content
 * type; on failure the message and files are kept so the user can retry.
 */
@Component({
  selector: 'app-composer',
  imports: [ReactiveFormsModule, LucidePaperclip, LucideSend, LucideX],
  templateUrl: './composer.html',
  styleUrl: './composer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Composer {
  readonly busy = input(false);
  readonly submitted = output<ComposerSubmission>();

  private readonly attachmentsApi = inject(AttachmentService);
  private readonly catalog = inject(CommandCatalogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  readonly form = new FormGroup({
    message: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  /** Slash-command suggestions (GH20). */
  readonly commands = signal<readonly SlashCommand[]>([]);
  /** Filter while the message is still just `/name`; null closes the list. */
  readonly query = signal<string | null>(null);
  private readonly activeIndex = signal(0);

  readonly suggestions = computed(() => {
    const query = this.query();
    if (query === null) return [];
    return this.commands()
      // The menu scrolls; the cap only bounds rendering for a huge catalog.
      .filter((command) => command.name.toLowerCase().startsWith(query))
      .slice(0, 20);
  });

  readonly suggestionsOpen = computed(() => this.suggestions().length > 0);

  /** Clamped so the highlight is always on a real row. */
  readonly active = computed(() => {
    const list = this.suggestions();
    return list.length === 0 ? 0 : Math.min(this.activeIndex(), list.length - 1);
  });

  readonly activeId = computed(() =>
    this.suggestionsOpen() ? this.optionId(this.suggestions()[this.active()]) : null,
  );

  /** Files chosen for the next turn (uploaded on submit). */
  readonly attachments = signal<readonly File[]>([]);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  readonly sendLabel = computed(() => {
    if (this.uploading()) return 'Uploading…';
    return this.busy() ? '...' : 'Send';
  });

  readonly sendDisabled = computed(() => this.busy() || this.uploading());

  constructor() {
    void this.catalog.list().then((commands) => this.commands.set(commands));
    this.form.controls.message.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.trackQuery(value));
  }

  optionId(command: SlashCommand | undefined): string {
    return command ? `composer-command-${command.name}` : '';
  }

  /** Insert a suggestion and return focus to the message box. */
  accept(command: SlashCommand | undefined): void {
    if (!command) return;
    const value = `/${command.name} `;
    this.query.set(null);
    this.form.controls.message.setValue(value);
    const textarea = this.textarea()?.nativeElement;
    if (textarea) {
      textarea.setSelectionRange(value.length, value.length);
      textarea.focus();
    }
  }

  dismissSuggestions(): void {
    this.query.set(null);
  }

  moveActive(delta: number): void {
    const length = this.suggestions().length;
    if (length === 0) return;
    this.activeIndex.set((this.active() + delta + length) % length);
  }

  /**
   * Suggestions appear only while the message is still the command token —
   * once an argument follows (`/model deepseek`), the list would be noise.
   */
  private trackQuery(value: string): void {
    // Deliberately not trimmed: a trailing space means an argument follows,
    // which is exactly when the list should close (the accept path inserts one).
    const match = /^\/([a-z0-9-]*)$/i.exec(value);
    if (!match) {
      this.query.set(null);
      return;
    }
    const next = match[1].toLowerCase();
    if (next !== this.query()) this.activeIndex.set(0);
    this.query.set(next);
  }

  async onSubmit(): Promise<void> {
    const message = this.form.controls.message.value.trim();
    if (!message || this.sendDisabled()) {
      return;
    }
    const files = this.attachments();
    this.uploadError.set(null);
    let refs: TurnAttachment[] = [];
    if (files.length > 0) {
      this.uploading.set(true);
      try {
        const stored = await Promise.all(
          files.map((file) => this.attachmentsApi.upload(file)),
        );
        refs = stored.map(toTurnAttachment);
      } catch (error) {
        // Keep the message and files so the user can retry.
        this.uploadError.set(
          error instanceof Error ? error.message : 'Upload failed',
        );
        this.uploading.set(false);
        return;
      }
      this.uploading.set(false);
    }
    this.form.reset();
    this.clearAttachments();
    this.submitted.emit({ message, attachments: refs });
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.suggestionsOpen()) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.moveActive(1);
          return;
        case 'ArrowUp':
          event.preventDefault();
          this.moveActive(-1);
          return;
        case 'Enter':
        case 'Tab':
          event.preventDefault();
          this.accept(this.suggestions()[this.active()]);
          return;
        case 'Escape':
          event.preventDefault();
          this.dismissSuggestions();
          return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.onSubmit();
    }
  }

  openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    if (files.length > 0) {
      this.attachments.update((current) => [...current, ...files]);
    }
    input.value = '';
  }

  removeAttachment(index: number): void {
    this.attachments.update((current) => current.filter((_, i) => i !== index));
  }

  clearAttachments(): void {
    this.attachments.set([]);
    this.uploadError.set(null);
  }

  /** Return keyboard focus to the message box (session switch, turn done). */
  focusInput(): void {
    this.textarea()?.nativeElement.focus({ preventScroll: true });
  }
}
