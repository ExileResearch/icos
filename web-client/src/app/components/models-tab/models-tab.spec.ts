import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelsTab } from './models-tab';
import { ProviderAdminService } from '../../services/provider-admin.service';
import { SecretAdminService } from '../../services/secret-admin.service';

describe('ModelsTab', () => {
  const api = {
    report: vi.fn(() =>
      Promise.resolve({
        source: 'catalog' as const,
        active: { conversation: 'openrouter', memory: 'local' },
        activeModel: {},
        providers: [
          {
            id: 'openrouter',
            model: 'deepseek/x',
            baseUrl: 'https://openrouter.ai/api/v1',
            enabled: true,
            hasKey: true,
          },
        ],
        errors: [],
        path: '/tmp/providers.json',
      }),
    ),
    catalog: vi.fn(() =>
      Promise.resolve([
        {
          id: 'openrouter',
          baseUrl: 'https://openrouter.ai/api/v1',
          model: 'deepseek/x',
        },
      ]),
    ),
    upsert: vi.fn(() => Promise.resolve({})),
    remove: vi.fn(() => Promise.resolve({})),
    setActive: vi.fn(() => Promise.resolve({})),
    models: vi.fn(() => Promise.resolve({ ok: true, detail: 'HTTP 200', models: [] })),
    probeModels: vi.fn(() =>
      Promise.resolve({ ok: true, detail: 'HTTP 200', models: [] }),
    ),
    test: vi.fn(() => Promise.resolve({ ok: true, detail: 'HTTP 200' })),
    reload: vi.fn(() => Promise.resolve({})),
  };

  const secretsApi = {
    list: vi.fn(() => Promise.resolve({ secrets: [], writable: true })),
    put: vi.fn(() =>
      Promise.resolve({ name: 'x', createdAt: '', updatedAt: '' }),
    ),
    remove: vi.fn(() => Promise.resolve({ deleted: true })),
  };

  let fixture: ComponentFixture<ModelsTab>;

  beforeEach(async () => {
    api.report.mockClear();
    await TestBed.configureTestingModule({
      imports: [ModelsTab],
      providers: [
        { provide: ProviderAdminService, useValue: api },
        { provide: SecretAdminService, useValue: secretsApi },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ModelsTab);
    await fixture.componentInstance.refresh();
    fixture.detectChanges();
  });

  it('renders providers with presence and active markers', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('openrouter');
    expect(text).toContain('present');
    expect(text).toContain('conversation');
  });

  it('opens the editor form', () => {
    fixture.componentInstance.startAdd();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[formControlName="baseUrl"]'),
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
      buttonByText('Add provider').click();
      fixture.detectChanges();

      const dialog = host().querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog).not.toBeNull();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(host().querySelector('.modal-backdrop')).not.toBeNull();

      const titleId = dialog.getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();
      expect(host().querySelector(`#${titleId}`)?.textContent).toContain('Add provider');
    });

    it('closes on Escape and hands focus back to the trigger', async () => {
      const add = buttonByText('Add provider');
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
  });

  it('applies a provider + model selection (FG9c)', async () => {
    const component = fixture.componentInstance;
    component.activeDraft.set({
      conversation: { provider: 'openrouter', model: 'deepseek/y' },
      memory: { provider: 'local', model: '' },
    });
    await component.applyActive('conversation');
    expect(api.setActive).toHaveBeenCalledWith(
      'conversation',
      'openrouter',
      'deepseek/y',
    );
  });

  it('stores a pasted key in the vault and references it (FG9c UX)', async () => {
    const component = fixture.componentInstance;
    component.startAdd();
    component.form.patchValue({
      id: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'deepseek/x',
      apiKeyRef: 'sk-or-v1-literal',
    });
    await component.submit();
    expect(secretsApi.put).toHaveBeenCalledWith(
      'openrouter-key',
      'sk-or-v1-literal',
    );
    expect(api.upsert).toHaveBeenCalledWith(
      'openrouter',
      expect.objectContaining({ apiKeyRef: 'secret:openrouter-key' }),
    );
  });
});
