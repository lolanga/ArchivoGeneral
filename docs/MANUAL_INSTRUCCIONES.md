# Manual de Instrucciones — ISeP Archivo Digital

| Campo | Valor |
| --- | --- |
| Versión | 1.0 |
| Fecha | 2026-11-19 |
| Destinatarios | Desarrollo, soporte técnico, administradores del sistema y responsables de auditoría |
| Responsable de actualización | División Archivo General — ISeP / Equipo de desarrollo |
| Alcance | Instalación, configuración, operación, verificación y mantenimiento de la aplicación |
| Documento relacionado | [Manual de Usuario](./MANUAL_USUARIO.md) |

> **Documento vivo.** Debe actualizarse en cada entrega, cambio de permisos, cambio de API o modificación del modelo de datos. Registre siempre la versión, la fecha y el detalle en el control de cambios.

### Control de cambios

| Versión | Fecha | Cambio | Responsable |
| --- | --- | --- | --- |
| 1.0 | 2026-11-19 | Primera versión. Documenta el flujo en dos líneas, permisos, API de desarrollo, auditoría y capas de modales. | Desarrollo / Archivo General |

---

## 1. Propósito

Reunir en un único lugar las instrucciones técnicas necesarias para:

- Levantar el entorno de desarrollo.
- Configurar y verificar permisos por menú.
- Operar y auditar la API local.
- Comprobar la correcta visualización de modales sobre el visor de PDF.
- Preparar el sistema para un despliegue productivo.

No sustituye a la [SPEC técnica](../SPEC.md), que define los requisitos normativos y de diseño.

---

## 2. Arquitectura general

```text
Navegador (React + Vite)
   |  /api/*  (proxy Vite -> 127.0.0.1:3001)
   v
API de desarrollo (server/dev-server.mjs, Node sin dependencias)
   |
   +-- server/storage/files/          originales por UUID
   +-- server/storage/metadata.json   metadatos
   +-- server/storage/auditoria.jsonl log append-only
```

Componentes principales:

| Ruta | Función |
| --- | --- |
| `src/App.tsx` | Sesión, navegación entre líneas y estado global. |
| `src/components/Dashboard/` | Línea 1: filtros y listado. |
| `src/components/UploadModal/` | Alta y digitalización. |
| `src/components/ReviewDocument/` | Línea 2: visor, metadatos, descarga e historial. |
| `src/components/AuditLog/` | Auditoría global (admin). |
| `src/services/permisos.ts` | Resolución de permisos y perfiles mock. |
| `src/services/authService.ts` | Sesión mock o JWT institucional. |
| `src/services/api.ts` | Cabeceras de identidad/permisos y manejo de errores. |
| `server/dev-server.mjs` | API local y registro de auditoría. |

---

## 3. Requisitos

- Node.js **20.19+** o **22.12+** (recomendado LTS 22).
- npm incluido con Node.
- Navegador Chromium/Edge para probar el visor de PDF.
- No se requiere bases de datos ni servicios externos en desarrollo.

---

## 4. Instalación y ejecución

```bash
cd ArchivoGeneral
npm install
```

Terminal 1 — API:

```bash
npm run dev:api
```

Terminal 2 — Frontend:

```bash
npm run dev
```

URLs:

| Servicio | URL |
| --- | --- |
| Frontend | http://127.0.0.1:5173 |
| API | http://127.0.0.1:3001 |
| Health check | http://127.0.0.1:3001/api/health |

El proxy `/api` está definido en `vite.config.ts`. No cambiar el puerto de la API sin actualizar ese archivo.

### 4.1 Variables de entorno

Copiar `.env.example` a `.env` y ajustar solo lo necesario:

```bash
cp .env.example .env
```

| Variable | Consumida por | Uso |
| --- | --- | --- |
| `VITE_USE_MOCK_AUTH` | Vite | `true` habilita perfiles de prueba y selector de rol. |
| `VITE_MOCK_ADMIN` | Vite | Fija el perfil inicial `auditor`. |
| `VITE_MOCK_DENY` | Vite | Fija el perfil inicial `denegado`. |
| `API_PORT` | Proceso Node | Puerto de la API (por defecto `3001`). |
| `ISEP_DEV_SECRET` | Proceso Node | Secreto HMAC de URLs firmadas. Cambiar fuera de desarrollo. |

> `API_PORT` e `ISEP_DEV_SECRET` **no** los lee Vite desde `.env`. En PowerShell se configuran antes de arrancar la API:
>
> ```powershell
> $env:API_PORT = '3001'
> $env:ISEP_DEV_SECRET = 'valor-solo-local'
> npm run dev:api
> ```

**Nunca** versionar `.env` ni imprimir su contenido. Si se expusieron credenciales, rotarlas externamente.

---

## 5. Configuración de permisos

### 5.1 Permisos resueltos

| Permiso | Línea / acción |
| --- | --- |
| `read` | Acceso base; sin él se muestra “Acceso denegado”. |
| `write` | Compatibilidad con tokens anteriores. |
| `subir` | Línea 1: alta, edición y baja. |
| `revisar` | Línea 2: listado, visor e historial. |
| `descargar` | Descarga del original. |
| `auditoria` | Historial detallado y exportación. |
| `admin` | Auditoría global y CSV. |

Compatibilidad implementada en `normalizarPermisos()`:

```text
admin     = permisos.admin ?? adminPorEntorno
read      = permisos.read  ?? true
write     = permisos.write ?? permisos.subir ?? read
subir     = permisos.subir ?? write
revisar   = permisos.revisar ?? read
descargar = permisos.descargar ?? admin ?? write
auditoria = permisos.auditoria ?? admin
```

### 5.2 Perfiles mock

Si `VITE_USE_MOCK_AUTH=true`, el selector del header permite probar:

| ID | Etiqueta | subir | revisar | descargar | auditoria/admin |
| --- | --- | --- | --- | --- | --- |
| `completo` | Agente Completo | sí | sí | sí | no |
| `solo-subir` | Operador (Solo Subir) | sí | no | no | no |
| `solo-revisar` | Revisor (Solo Consulta) | no | sí | no | no |
| `oficial` | Oficial (Revisar + Descargar) | no | sí | sí | no |
| `auditor` | Auditor de Seguridad | no | sí | sí | sí |
| `denegado` | Sin acceso | no | no | no | no |

El perfil se guarda en `localStorage` bajo `isep_mock_perfil`. Para volver al inicial, borrar esa clave o usar el selector.

### 5.3 Asignación en producción

1. El proveedor de identidad institucional emite el JWT con los claims de permisos.
2. El backend verifica firma, expiración y audiencia.
3. El backend **deriva** los permisos del token; nunca confía en `X-Puede-*`.
4. El frontend recibe la sesión ya resuelta.
5. El selector de perfiles y las variables `VITE_MOCK_*` deben estar desactivados.

---

## 6. API de desarrollo

Todas las rutas responden JSON y usan `Cache-Control: no-store`.

| Método | Ruta | Permiso requerido | Efecto / evento |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | `{"ok":true}` |
| `GET` | `/api/documentos` | `revisar` o `subir` | `CONSULTA_LISTADO` |
| `POST` | `/api/documentos` | `subir` | `ALTA_DOCUMENTO` |
| `PATCH` | `/api/documentos/:id` | `subir` | `MODIFICACION_DOCUMENTO` |
| `DELETE` | `/api/documentos/:id` | `subir` | `ELIMINACION_DOCUMENTO` |
| `GET` | `/api/documentos/:id/auditoria` | `revisar` | `CONSULTA_AUDITORIA_DOCUMENTO` |
| `POST` | `/api/documentos/:id/acceso` | `revisar` o `descargar` | `CONSULTA_DOCUMENTO` / `DESCARGA_DOCUMENTO` |
| `GET` | `/api/documentos/:id/contenido` | URL firmada | Sirve el original |
| `GET` | `/api/auditoria` | `admin` | `CONSULTA_AUDITORIA` |
| `POST` | `/api/eventos` | sesión válida | Eventos de interfaz permitidos |

### 6.1 Cabeceras enviadas por el frontend

```text
Authorization: Bearer <token>
X-Usuario-Id
X-Nombre-Completo
X-Usuario-Dependencia
X-Es-Admin
X-Puede-Subir
X-Puede-Revisar
X-Puede-Descargar
X-Puede-Auditoria
```

Los valores de identidad van URL-encodeados. En producción estas cabeceras se ignoran y se sustituyen por el JWT verificado.

### 6.2 Ejemplo rápido (PowerShell)

```powershell
$h = @{
  Authorization = 'Bearer mock-token'
  'X-Usuario-Id' = 'mock-completo'
  'X-Puede-Subir' = 'true'
  'X-Puede-Revisar' = 'true'
  'X-Puede-Descargar' = 'true'
  'X-Puede-Auditoria' = 'true'
  'X-Es-Admin' = 'true'
}
Invoke-RestMethod 'http://127.0.0.1:3001/api/documentos' -Headers $h
```

Una petición sin permisos devuelve `403` y genera `ACCESO_DENEGADO`. Sin token devuelve `401`.

---

## 7. Auditoría

### 7.1 Archivo

`server/storage/auditoria.jsonl`: una línea JSON por evento, escritura append-only. No existe endpoint para editarlo o borrarlo.

Estructura mínima:

```json
{
  "id": "uuid",
  "evento": "DESCARGA_DOCUMENTO",
  "fecha": "2026-11-19",
  "hora": "17:32:27",
  "fecha_hora": "2026-11-19T17:32:27.000Z",
  "usuario_id": "mock-oficial",
  "nombre_usuario": "Oficial Mesa de Entradas",
  "dependencia": "MESA DE ENTRADAS",
  "origen_ip": "127.0.0.1",
  "documento_id": "uuid-del-documento",
  "numero_documento": "00201-0012345-6",
  "detalles": "Descarga de archivo.pdf"
}
```

### 7.2 Eventos

| Evento | Origen |
| --- | --- |
| `ALTA_DOCUMENTO` | Servidor, al guardar el original. |
| `MODIFICACION_DOCUMENTO` | Servidor, al cambiar metadatos. |
| `ELIMINACION_DOCUMENTO` | Servidor, al borrar. |
| `CONSULTA_LISTADO` | Servidor, al listar. |
| `CONSULTA_DOCUMENTO` | Servidor, al emitir URL de vista. |
| `DESCARGA_DOCUMENTO` | Servidor, al emitir URL de descarga. |
| `CONSULTA_AUDITORIA` | Servidor, al consultar log global. |
| `CONSULTA_AUDITORIA_DOCUMENTO` | Servidor, al abrir timeline por documento. |
| `IMPRESION_CONSTANCIA` | Cliente, al imprimir. |
| `EXPORTACION_AUDITORIA` | Cliente, al exportar CSV. |
| `CAMBIO_PERFIL` | Cliente, al cambiar de perfil mock. |
| `ACCESO_DENEGADO` | Servidor o cliente ante intentos bloqueados. |

El endpoint `POST /api/eventos` solo acepta los cuatro eventos de cliente. El resto se generan exclusivamente en el servidor.

### 7.3 Consulta y exportación

- La vista global exige `admin` y permite filtros por evento, usuario, documento y fechas.
- El timeline por documento exige `revisar`.
- Ambos CSV se exportan con BOM UTF-8 (`\uFEFF`).
  - Auditoría global: `fecha, hora, usuario_id, nombre_usuario, evento, numero_documento, detalles` (el código del evento se sustituye por su etiqueta legible).
  - Historial por documento: `fecha, hora, evento, nombre_usuario, origen_ip, detalles` (también con etiqueta legible en `evento`).

---

## 8. UI/UX y capas de apilamiento

Tokens en `src/styles/variables.css`:

```css
--z-header: 30;
--z-mock-mark: 40;
--z-modal: 100;
--z-toast: 200;
```

Todos los modales usan la clase global `.modal-overlay` definida en `src/styles/global.css`:

```css
.modal-overlay {
  z-index: var(--z-modal);
  isolation: isolate;
  transform: translateZ(0);
  will-change: transform;
}
```

Aplicada en:

- `EditModal` (modificar metadatos).
- `UploadModal` (carga).
- `AuditLog` (auditoría global).
- `DocumentViewer` (visor legacy).

El visor de revisión confina el iframe con `isolation: isolate` y no le asigna `z-index` propio. Esto evita que el plugin nativo de PDF de Chromium se dibuje por encima de los formularios.

**Al crear un nuevo modal:** agregar siempre `modal-overlay` a su contenedor. No fijar un `z-index` local.

---

## 9. Verificación

### 9.1 Comandos

```bash
npm run lint
npm run build
```

Ambos deben terminar sin errores. El build genera `dist/`.

### 9.2 Checklist funcional por perfil

| Perfil | Comprobación esperada |
| --- | --- |
| `completo` | Ve ambas pestañas; puede subir, revisar, descargar y editar. |
| `solo-subir` | Puede subir; la pestaña 2 está bloqueada y registra `ACCESO_DENEGADO`. |
| `solo-revisar` | No puede subir; ve banner “Modo Consulta”; descarga bloqueada y auditada. |
| `oficial` | Descarga habilitada con banner “Acceso autorizado”. |
| `auditor` | Botón Auditoría visible, banner de sesión, IP en el historial y exportación CSV. |

### 9.3 Verificación del modal sobre el PDF

1. Abrir un documento PDF desde la Línea 2.
2. Presionar **“Editar metadatos”**.
3. Comprobar que el formulario “Modificar metadatos” tapa al visor.
4. En consola del navegador, verificar que el overlay tiene `z-index: 100`.

### 9.4 Verificación de integridad

1. Subir un archivo y anotar el SHA-256 mostrado.
2. Descargar el original.
3. Comparar hashes:

```powershell
Get-FileHash .\archivo.pdf -Algorithm SHA256
```

Deben coincidir.

---

## 10. Despliegue a producción

Checklist mínimo:

1. Reemplazar `server/dev-server.mjs` por el backend institucional.
2. Verificar JWT real en servidor; eliminar confianza en cabeceras `X-*`.
3. Desactivar `VITE_USE_MOCK_AUTH`, `VITE_MOCK_ADMIN` y `VITE_MOCK_DENY`.
4. Quitar el selector de perfiles del header.
5. Configurar almacenamiento en nube con TLS 1.3 y AES-256.
6. Usar secreto HMAC gestionado por el proveedor de secretos; rotar el valor de desarrollo.
7. Definir retención, firma y respaldo del log de auditoría.
8. Ajustar la política offline del service worker para equipos compartidos.
9. Ejecutar `npm run lint` y `npm run build` sobre el código final.
10. Actualizar este manual con la fecha y responsable del despliegue.

---

## 11. Mantenimiento de este manual

Procedimiento obligatorio en cada cambio relevante:

1. Incrementar la versión en la tabla de cabecera (`1.0` → `1.1`, etc.).
2. Actualizar la fecha.
3. Agregar una fila al **Control de cambios** con: versión, fecha, cambio y responsable.
4. Revisar que los apartados afectados estén sincronizados con:
   - `README.md`
   - `SPEC.md`
   - `MANUAL_USUARIO.md`
5. Si cambian permisos o rutas, actualizar también los ejemplos de API.
6. Hacer commit y push con mensaje que mencione la documentación actualizada.

Criterio de urgencia:

| Tipo de cambio | Actualización |
| --- | --- |
| Permisos, rutas API o eventos de auditoría | Inmediata, en el mismo commit del código. |
| Cambios visuales de flujo | En la misma entrega. |
| Correcciones de redacción | Próxima revisión. |

Revisión programada recomendada: **mensual** o antes de cada release.

---

## 12. Solución de problemas

| Síntoma | Causa | Acción |
| --- | --- | --- |
| `/api` devuelve 404 en Vite | API detenida o puerto cambiado | Arrancar `npm run dev:api`; verificar `vite.config.ts`. |
| `403` al listar | Perfil sin `revisar` ni `subir` | Revisar permisos enviados o JWT. |
| `403` al descargar | Falta `descargar` | Revisar claim y banner del visor. |
| `403` en `/api/auditoria` | Falta `admin` | Usar perfil auditor en prueba o corregir token. |
| “SHA-256 no coincide” | Archivo alterado o cabecera codificada dos veces | Reenviar archivo original sin procesar. |
| Modal detrás del PDF | Falta clase global | Agregar `modal-overlay` al contenedor y compilar. |
| CSV con acentos mal en Excel | Falta BOM | Confirmar `\uFEFF` al crear el Blob. |
| `AccessDenied` con mock | `VITE_MOCK_DENY=true` o perfil `denegado` | Ajustar `.env` o selector. |

---

## 13. Referencias

- [README.md](../README.md)
- [SPEC.md](../SPEC.md)
- [Manual de Usuario](./MANUAL_USUARIO.md)
- Ley Provincial N.º 14.256
- Ley Nacional N.º 25.326 y Decreto 1558/2001
- Ley Nacional N.º 27.699 (Convenio 108+)
- Constitución de la Provincia de Santa Fe, Art. 29
