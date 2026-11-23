import { ComponentFixture, TestBed } from '@angular/core/testing';

import { McpTab } from './mcp-tab';
import { McpAdminService } from '../../services/mcp-admin.service';

describe('McpTab', () => {
  const api = {
    servers: vi.fn(() =>
      Promise.resolve([
        {
          name: 'files',
          transport: 'stdio',
          state: 'connected',
          toolCount: 2,
        },
      ]),
    ),
    catalog: vi.fn(() =>
      Promise.resolve([{ name: 'files', transport: 'stdio' as const }]),
    ),
    upsert: vi.fn(() => Promise.resolve({})),
    remove: vi.fn(() => Promise.resolve({})),
    reload: vi.fn(() => Promise.resolve({})),
  };

  let fixture: ComponentFixture<McpTab>;

  beforeEach(async () => {
    api.servers.mockClear();
    await TestBed.configureTestingModule({
      imports: [McpTab],
      providers: [{ provide: McpAdminService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(McpTab);
    await fixture.componentInstance.refresh();
    fixture.detectChanges();
  });

  it('renders the live server list', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('files');
    expect(text).toContain('connected');
    expect(api.servers).toHaveBeenCalled();
  });

  it('opens the editor form', () => {
    const component = fixture.componentInstance;
    component.startAdd();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[formControlName="name"]'),
    ).not.toBeNull();
  });

  describe('editor dialog (GH21)', () => {
    function host(): HTMLElement {
      return fixture.nativeElement as HTMLElement;
    }

    function buttonByText(text: string): HTMLButtonElement {
      const match = [...host().querySelectorAll('button')].find((b) =>
        (b.textContent ?? '').trim().includes(text),
      );
      if (!match) throw new Error(`button "${text}" not found`);
      return match;
    }

    it('opens as a labelled modal dialog, not an inline form', () => {
      buttonByText('Add server').click();
      fixture.detectChanges();

      const dialog = host().querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog).not.toBeNull();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(host().querySelector('.modal-backdrop')).not.toBeNull();

      const titleId = dialog.getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();
      expect(host().querySelector(`#${titleId}`)?.textContent).toContain('Add server');
    });

    it('closes on Escape and hands focus back to the trigger', async () => {
      const add = buttonByText('Add server');
      add.focus();
      add.click();
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(document.activeElement?.getAttribute('role')).toBe('dialog');

      host().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(host().querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(add);
    });

    it('closes on a backdrop click but not on a click inside the dialog', () => {
      buttonByText('Add server').click();
      fixture.detectChanges();

      (host().querySelector('.modal') as HTMLElement).click();
      fixture.detectChanges();
      expect(host().querySelector('[role="dialog"]')).not.toBeNull();

      (host().querySelector('.modal-backdrop') as HTMLElement).click();
      fixture.detectChanges();
      expect(host().querySelector('[role="dialog"]')).toBeNull();
    });
  });
});
