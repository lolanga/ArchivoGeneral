# ISeP — Archivo Digital

Aplicación web para la **digitalización, archivo, revisión y descarga controlada** de expedientes y notas del Instituto de Seguridad Pública de Santa Fe.

El flujo está dividido en dos líneas de trabajo con permisos independientes:

1. **Subir o Digitalizar** — alta de documentos y gestión de metadatos.
2. **Revisar Documento** — consulta controlada, vista previa con URL firmada, descarga condicionada e historial de auditoría.

Toda acción queda registrada en un log append-only consultable solo por perfiles de auditoría/administración.

---

## Documentación

| Documento | Contenido |
| --- | --- |
| [SPEC.md](./SPEC.md) | Especificaciones técnicas, normativa aplicable, modelo de datos y reglas de seguridad. |
| [Manual de Usuario](./docs/MANUAL_USUARIO.md) | Guía para operadores, revisores, oficiales y auditores. |
| [Manual de Instrucciones](./docs/MANUAL_INSTRUCCIONES.md) | Instalación, configuración, API, permisos, auditoría, despliegue y mantenimiento. **Documento vivo: se actualiza en cada entrega.** |
| [.env.example](./.env.example) | Variables de entorno de ejemplo para desarrollo. No contiene secretos. |

---

## Inicio rápido (desarrollo local)

Requiere Node.js 20.19+ o 22.12+.

```bash
npm install
```

En dos terminales, dentro de la carpeta del repo:

```bash
npm run dev:api   # API Node en http://127.0.0.1:3001
npm run dev       # Vite en http://127.0.0.1:5173 (proxy /api -> :3001)
```

Abrir <http://127.0.0.1:5173>.

La autenticación simulada (`VITE_USE_MOCK_AUTH=true`) permite cambiar de perfil desde el header para probar cada camino de permisos. En producción se usa el token institucional; **no hay pantalla de login**.

Comandos disponibles:

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo Vite. |
| `npm run dev:api` | API de desarrollo sin dependencias externas. |
| `npm run lint` | Linter Oxlint. |
| `npm run build` | Compilación TypeScript + Vite (`tsc -b && vite build`). |
| `npm run preview` | Vista previa del build. |

---

## Permisos principales

| Permiso | Habilita |
| --- | --- |
| `subir` | Línea 1: digitalizar/subir, editar metadatos y eliminar documentos. |
| `revisar` | Línea 2: listar y abrir documentos en el visor. |
| `descargar` | Obtener el original; puede estar denegado aunque se pueda revisar. |
| `auditoria` / `admin` | Historial del documento, auditoría global y exportación CSV. |

Los campos ausentes en tokens antiguos se infieren de `read`, `write` y `admin` para mantener compatibilidad. La API de desarrollo recibe estos permisos por cabeceras `X-Puede-*`; en producción deben verificarse desde el JWT en el backend.

Perfiles mock incluidos: **Agente Completo**, **Operador (Solo Subir)**, **Revisor (Solo Consulta)**, **Oficial (Revisar + Descargar)** y **Auditor de Seguridad**.

---

## Almacenamiento y auditoría

La API de desarrollo guarda todo en `server/storage/` (ignorado por Git):

- `files/` — originales con UUID como nombre.
- `metadata.json` — metadatos de cada documento.
- `auditoria.jsonl` — registro append-only de altas, modificaciones, bajas, consultas, vistas, descargas, impresión, exportación, cambio de perfil y accesos denegados.

Cada registro incluye `fecha`, `hora`, `usuario_id`, `nombre_usuario`, `dependencia`, `origen_ip`, `documento_id` y detalle. No se puede modificar ni borrar desde la API.

Formatos admitidos: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.tiff`. Tamaño máximo: **15 MB**. El servidor recalcula el SHA-256 y rechaza el archivo si no coincide.

Las URLs firmadas usan HMAC con expiración de 15 minutos y `Cache-Control: no-store`; no existe acceso público directo a los originales.

Variables de la API (configurar en el entorno del proceso, no en `.env` de Vite): `API_PORT` (por defecto `3001`) e `ISEP_DEV_SECRET` (cambiar fuera de desarrollo).

---

## Seguridad

> La API incluida es **solo para desarrollo/pruebas**. La validación de sesión, los permisos por cabecera y el rol de administrador son stubs. Antes de producción debe sustituirse por el backend institucional con verificación JWT real, almacenamiento seguro en la nube, cifrado en tránsito/reposo y retención formal del log de auditoría.

No abrir ni versionar archivos `.env`: pueden contener credenciales. Las credenciales expuestas deben rotarse externamente.
