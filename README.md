# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Desarrollo local (subir / listar / modificar / eliminar / previsualizar / descargar / auditar)

La app necesita la API de desarrollo para guardar archivos y metadatos. Se arranca en dos terminales:

```bash
npm run dev:api   # API Node en http://127.0.0.1:3001
npm run dev       # Vite en http://127.0.0.1:5173 (proxy /api -> :3001)
```

El almacenamiento queda en `server/storage/`:

- `files/` — archivos originales, con UUID como nombre.
- `metadata.json` — metadatos de cada documento.
- `auditoria.jsonl` — registro append-only de **todas** las acciones (alta, modificación, eliminación, consultas, vista, descarga y accesos denegados), con `fecha`, `hora`, `usuario_id`, `nombre_usuario`, `dependencia`, `origen_ip` y detalle. No se puede modificar ni borrar desde la API.

La API valida extensión, tamaño máximo (15 MB) y vuelve a calcular el SHA-256 recibido. La descarga usa URLs firmadas con HMAC y expiración de 15 minutos; no hay acceso público directo. `Cache-Control: no-store` evita caché local sensible.

Variables de entorno opcionales de la API: `API_PORT` (por defecto 3001) e `ISEP_DEV_SECRET` (secreto de firma; **cambiar fuera de desarrollo**).

## Auditoría y rol de administrador

Toda acción queda registrada en `server/storage/auditoria.jsonl`. La vista **Auditoría** del header solo aparece si el token trae `permisos.admin: true`. Permite filtrar por acción, usuario y rango de fechas, y exportar CSV.

Con el auth mock se puede habilitar el rol para probar:

```bash
$env:VITE_MOCK_ADMIN='true'; npm run dev
```

En producción el administrador se designa en el token institucional (`permisos.admin`), **no** en el frontend. La API de auditoría exige además la cabecera `X-Es-Admin`; en producción debe sustituirse por verificación JWT real en el backend.

> Este servidor es solo para pruebas. En producción debe reemplazarse por el backend institucional con autenticación JWT real y almacenamiento en la nube.
