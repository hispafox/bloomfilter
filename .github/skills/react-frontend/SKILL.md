---
name: react-frontend
description: >
  Genera el frontend React para el checker de usernames. Usa este skill
  cuando necesites crear componentes del UI, conectar con la API .NET,
  o implementar el feedback visual en tiempo real (debounce, estados
  de carga, indicadores de disponibilidad).
---

# Frontend React — Username Checker

## Stack
- React 19 + TypeScript
- Vite como bundler
- CSS modules o inline styles (no Tailwind en este proyecto)
- fetch nativo (no axios)

## Hook principal

```typescript
import { useState, useEffect } from 'react';

interface CheckResult {
  username: string;
  available: boolean;
  note: string;
}

export function useUsernameCheck(debounceMs = 300) {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username.length < 3) {
      setResult(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check/${encodeURIComponent(username)}`);
        if (res.ok) {
          setResult(await res.json());
          setError(null);
        }
      } catch {
        setError('Error checking username');
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [username, debounceMs]);

  return { username, setUsername, result, loading, error };
}
```

## Componente principal

Input con debounce de 300ms. Indicador visual:
- Spinner mientras carga
- ✓ verde si available: true
- ✗ rojo si available: false
- Mínimo 3 caracteres para activar la búsqueda

## Registro

Botón de Register que hace POST /api/username/register.
Manejar 201 (éxito), 409 (duplicado) y errores de red.

## Visualización pedagógica (M7 extension)

Para componentes que visualizan el estado interno del Bloom Filter (bit grid,
hash positions, stats panel), consulta el skill `visual-design`. Ese skill
contiene la paleta, tipografía y contratos con los endpoints
`/api/username/stats` (ampliado con `bitsSample`) y
`/api/username/visualize/{name}`.
