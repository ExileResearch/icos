import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CommandCatalogService } from './command-catalog.service';
import { CoreApiService } from './core-api.service';

describe('CommandCatalogService', () => {
  it('fetches the catalog once and caches it (GH20)', async () => {
    const get = vi.fn(() =>
      Promise.resolve({
        commands: [{ name: 'health', description: 'Runtime health' }],
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        CommandCatalogService,
        { provide: CoreApiService, useValue: { get } },
      ],
    });
    const service = TestBed.inject(CommandCatalogService);

    const first = await service.list();
    const second = await service.list();

    expect(first).toEqual([{ name: 'health', description: 'Runtime health' }]);
    expect(second).toEqual(first);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('degrades to no suggestions when the catalog is unavailable', async () => {
    TestBed.configureTestingModule({
      providers: [
        CommandCatalogService,
        {
          provide: CoreApiService,
          useValue: { get: vi.fn(() => Promise.reject(new Error('offline'))) },
        },
      ],
    });
    const service = TestBed.inject(CommandCatalogService);

    await expect(service.list()).resolves.toEqual([]);
  });
});
