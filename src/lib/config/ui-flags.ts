export interface UiFlags {
  autoSciLayoutV2: boolean;
}

const FLAG_KEY = 'autosci-layout-v2';

function parseBoolean(value: string | null | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on", "v2"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "v1"].includes(normalized)) return false;
  return fallback;
}

export function resolveUiFlags(searchParams?: URLSearchParams): UiFlags {
  const envDefault = parseBoolean(process.env.NEXT_PUBLIC_AUTOSCI_LAYOUT_V2 ?? 'true', true);

  if (typeof window === 'undefined') {
    return { autoSciLayoutV2: envDefault };
  }

  const params = searchParams ?? new URLSearchParams(window.location.search);
  const queryUi = params.get('ui');
  if (queryUi === 'v2' || queryUi === 'v1') {
    const enabled = queryUi === 'v2';
    window.sessionStorage.setItem(FLAG_KEY, enabled ? 'v2' : 'v1');
    return { autoSciLayoutV2: enabled };
  }

  const sessionOverride = window.sessionStorage.getItem(FLAG_KEY);
  if (sessionOverride === 'v2' || sessionOverride === 'v1') {
    return { autoSciLayoutV2: sessionOverride === 'v2' };
  }

  return { autoSciLayoutV2: envDefault };
}
