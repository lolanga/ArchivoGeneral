# Especificaciones Técnicas — ISeP Archivo Digital

**Versión:** 1.1 · **Fecha:** 2026-11-19 · **Estado:** Implementado en entorno de desarrollo.

Este documento es la fuente técnica normativa del proyecto. Para procedimientos operativos consultar el [Manual de Instrucciones](./docs/MANUAL_INSTRUCCIONES.md); para el uso diario, el [Manual de Usuario](./docs/MANUAL_USUARIO.md).

---

## 1. Contexto institucional y marco normativo

El sistema opera bajo la órbita del **Instituto de Seguridad Pública de Santa Fe (ISeP)**. Todo el desarrollo respeta el principio de **Privacidad y Seguridad desde el Diseño** y cumple con:

- **Ley Nacional N.º 25.326 y Dto. 1558/2001:** protección de datos personales, medidas de seguridad técnicas y confidencialidad.
- **Ley Nacional N.º 27.699 (Convenio 108+):** privacidad desde el diseño y control del flujo transfronterizo de datos; la nube elegida debe garantizar TLS 1.3 en tránsito y AES-256 en reposo.
- **Constitución de la Provincia de Santa Fe (Art. 29):** ciberseguridad, transparencia y control en entornos digitales.
- **Ley Provincial N.º 14.256:** gobernanza de datos, interoperabilidad y preservación de activos digitales del sector público provincial.
- **Protocolo interno:** Gestión documental de la División Archivo General.

La trazabilidad de cada consulta, descarga y exportación es un requisito de cumplimiento, no una funcionalidad opcional.

---

## 2. Stack y arquitectura

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + TypeScript (strict) + Vite 8. |
| Estilos | CSS puro con variables globales (`src/styles/variables.css`) y CSS Modules. Prohibido Tailwind, Bootstrap o librerías UI pesadas. |
| Iconografía | SVG inline del componente `Icon`; **sin emojis**. |
| API local | Node sin dependencias (`server/dev-server.mjs`). |
| Persistencia local | `server/storage/` (archivos, metadatos JSON y log JSONL). |
| PWA | Base manifest/favicon; el service worker no almacena documentos sensibles. |

Arquitectura responsiva: consulta desktop-first y captura móvil con `capture="environment"`.

---

## 3. Autenticación y autorización

- **No existe pantalla de Login ni registro.** La app recibe un token JWT/sesión desde la plataforma institucional (URL, header o storage seguro).
- Al iniciar se validan `user_id`, `nombre_completo`, `dependencia_id` y `permisos`. Token inválido, expirado o sin `read` → `<AccessDenied />` y bloqueo de peticiones.
- Permisos resueltos en `src/services/permisos.ts`:

| Permiso | Uso |
| --- | --- |
| `read` | Acceso base a la aplicación. |
| `write` | Compatibilidad con tokens anteriores; habilita `subir` si no se informa el campo nuevo. |
| `subir` | Línea 1: alta, edición de metadatos y baja. |
| `revisar` | Línea 2: listado y visor. |
| `descargar` | Descarga del original. Puede ser `false` con `revisar: true`. |
| `auditoria` | Historial detallado y auditoría global. |
| `admin` | Vista global de auditoría y exportación CSV. Implica `auditoria` y `descargar` por defecto. |

- Reglas de compatibilidad: `subir ← write ← read`, `revisar ← read`, `descargar ← (admin ?? write)`, `auditoria ← admin`.
- En desarrollo, `VITE_USE_MOCK_AUTH=true` habilita el selector de perfiles. `VITE_MOCK_ADMIN=true` y `VITE_MOCK_DENY=true` fijan el perfil inicial.
- Todas las peticiones envían identidad y permisos al backend mediante `Authorization`, `X-Usuario-Id`, `X-Nombre-Completo`, `X-Usuario-Dependencia`, `X-Es-Admin`, `X-Puede-Subir`, `X-Puede-Revisar`, `X-Puede-Descargar` y `X-Puede-Auditoria`.
- **En producción las cabeceras no son prueba de identidad**: el backend debe verificar el JWT y derivar los permisos del token.

---

## 4. Flujo en dos líneas de trabajo

### Línea 1 — Subir o Digitalizar

- Acceso condicionado a `subir`.
- Dashboard con búsqueda por número, filtro por tipo (`EXPEDIENTE`/`NOTA`), dependencia y fecha.
- Carga por arrastrar/soltar, selector de archivo o cámara; tarjeta de escaneo destacada en móvil.
- Validación de extensión, tamaño máximo y SHA-256 en cliente y servidor.
- Metadatos obligatorios: tipo, número oficial, fecha del documento y dependencia.
- Edición y eliminación disponibles solo con `subir`.

### Línea 2 — Revisar Documento

- Acceso condicionado a `revisar`. Se entra desde el tab “2. Revisar Documento” o desde “Revisar Archivo” en el listado.
- Vista previa mediante URL firmada de 15 minutos; PDF e imágenes. Toolbar de paginación/zoom y marca de agua “ISEP Santa Fe — Archivo Auditado”.
- Ficha de metadatos con tamaño, usuario de carga, clasificación y huella SHA-256.
- Estados de descarga:

| Estado | Permiso | Presentación |
| --- | --- | --- |
| Consulta | `revisar: true`, `descargar: false` | Banner de restricción; botón bloqueado; el intento se audita. |
| Autorizado | `descargar: true` | Banner de acceso autorizado; “Descargar Documento Oficial”. |
| Auditoría | `auditoria/admin: true` | Banner de sesión de auditoría; “Descarga de Auditoría” e IP visible. |

- “Imprimir Constancia” y “Exportar log” registran su propio evento.
- El historial del documento se muestra como timeline y respeta `revisar`.

---

## 5. Estándares archivísticos y manejo de archivos

- **Formatos aceptados:** `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.tiff`.
- **Recomendación activa en UI:** PDF/A (ISO 19005) para expedientes multipágina; WebP/JPEG comprimido (150–200 DPI, escala de grises) para notas simples.
- **Validación:** extensión, hasta 15 MB y SHA-256 calculado antes del alta. El servidor vuelve a calcular el hash y rechaza discrepancias.
- El original se guarda con UUID; el nombre original se conserva solo como metadato.

---

## 6. Modelo de datos

Cada documento registra:

| Campo | Tipo | Observación |
| --- | --- | --- |
| `id` | UUID v4 | Identificador interno. |
| `tipo_documento` | `'EXPEDIENTE' \| 'NOTA'` | — |
| `numero_documento` | string | Indexado. Ej. `00201-0012345-6`. |
| `fecha_documento` | `YYYY-MM-DD` | — |
| `dependencia` | string | Catálogo normalizado del ISeP. |
| `archivo_url` | string | Reservado; el acceso real es firmado y temporal. |
| `nombre_archivo_original` | string | — |
| `mime_type` | string | — |
| `hash_sha256` | string | Integridad archivística. |
| `tamano_bytes` | number | Tamaño del original informado por la API. |
| `usuario_carga_id` | string | Del token institucional o mock. |
| `timestamp_carga` | ISO-8601 | Sello de alta. |

---

## 7. Auditoría

- Archivo: `server/storage/auditoria.jsonl`, escritura append-only, sin endpoints de borrado/edición.
- Eventos: `ALTA_DOCUMENTO`, `MODIFICACION_DOCUMENTO`, `ELIMINACION_DOCUMENTO`, `CONSULTA_LISTADO`, `CONSULTA_DOCUMENTO`, `DESCARGA_DOCUMENTO`, `CONSULTA_AUDITORIA`, `CONSULTA_AUDITORIA_DOCUMENTO`, `IMPRESION_CONSTANCIA`, `EXPORTACION_AUDITORIA`, `CAMBIO_PERFIL`, `ACCESO_DENEGADO`.
- El cliente solo puede enviar eventos de interfaz permitidos: `ACCESO_DENEGADO`, `IMPRESION_CONSTANCIA`, `EXPORTACION_AUDITORIA`, `CAMBIO_PERFIL`. El resto los emite el servidor.
- Cada registro contiene fecha, hora, ISO timestamp, usuario, dependencia, IP de origen y detalle; los eventos sobre documentos incluyen `documento_id` y `numero_documento`.
- La vista global exige `admin`, permite filtrar por acción, usuario, documento y rango de fechas, y exporta CSV con BOM UTF-8.
- El timeline por documento exige `revisar` y es visible en la ficha de revisión.

---

## 8. API de desarrollo

| Método | Ruta | Permiso | Evento |
| --- | --- | --- | --- |
| `GET` | `/api/health` | ninguno | — |
| `GET` | `/api/documentos` | `revisar` o `subir` | `CONSULTA_LISTADO` |
| `POST` | `/api/documentos` | `subir` | `ALTA_DOCUMENTO` |
| `PATCH/PUT` | `/api/documentos/:id` | `subir` | `MODIFICACION_DOCUMENTO` |
| `DELETE` | `/api/documentos/:id` | `subir` | `ELIMINACION_DOCUMENTO` |
| `GET` | `/api/documentos/:id/auditoria` | `revisar` | `CONSULTA_AUDITORIA_DOCUMENTO` |
| `POST` | `/api/documentos/:id/acceso` | `revisar` / `descargar` según `download` | `CONSULTA_DOCUMENTO` / `DESCARGA_DOCUMENTO` |
| `GET` | `/api/documentos/:id/contenido` | URL firmada vigente | `ACCESO_DENEGADO` si inválida |
| `GET` | `/api/auditoria` | `admin` | `CONSULTA_AUDITORIA` |
| `POST` | `/api/eventos` | sesión válida |-evento de cliente permitido- |

Cualquier denegación devuelve `403` y registra `ACCESO_DENEGADO`. Sin token devuelve `401`.

---

## 9. UI/UX y capas

- Tokens de diseño del mockup Stitch: primario `#0F2C59`, acento `#1D5D9B`, fondo `#F4F6F9`, superficie `#FFFFFF`.
- Tipografías: Afacad Flux (títulos), Instrument Sans (cuerpo), Source Code Pro (códigos/números).
- Todos los modales comparten `.modal-overlay` en `src/styles/global.css`, con `z-index`, `isolation: isolate` y `transform: translateZ(0)`. Esto evita que el plugin nativo del PDF se dibuje por encima de los formularios.
- Capas centralizadas en `variables.css`: `--z-header: 30`, `--z-mock-mark: 40`, `--z-modal: 100`, `--z-toast: 200`.
- El iframe del visor queda confinado con `isolation: isolate` y sin `z-index` propio.
- Accesibilidad: foco visible, `aria-label` en controles, `role="status"` en banners/avisos y `role="alert"` en errores.

---

## 10. Seguridad complementaria

- URLs firmadas con HMAC-SHA256, expiración de 15 min y distinción entre vista y descarga.
- `Cache-Control: no-store` y `X-Content-Type-Options: nosniff` en el contenido.
- Sin caché persistente de documentos en el service worker.
- El selector de perfil solo existe con auth mock; en producción debe eliminarse.
- El log de auditoría es inalterable desde la API y solo consultable por administración.

---

## 11. Pendiente para producción

1. Sustituir `server/dev-server.mjs` por el backend institucional.
2. Verificar JWT y derivar permisos en servidor; eliminar confianza en cabeceras `X-*`.
3. Configurar almacenamiento en nube con cifrado TLS 1.3 / AES-256.
4. Retención, firma y respaldo del log de auditoría según normativa.
5. Desactivar `VITE_USE_MOCK_AUTH`, quitar el selector de perfiles y rotar secretos expuestos.
6. Revisar política offline de la PWA para equipos compartidos.

---

## 12. Documentación asociada

- [README.md](./README.md) — inicio rápido y enlaces.
- [Manual de Usuario](./docs/MANUAL_USUARIO.md)
- [Manual de Instrucciones](./docs/MANUAL_INSTRUCCIONES.md)
