# Manual de Usuario — ISeP Archivo Digital

| Campo | Valor |
| --- | --- |
| Versión | 1.0 |
| Fecha | 2026-11-19 |
| Destinatarios | Operadores de mesa de entradas, digitalizadores, revisores, oficiales y auditores del ISeP |
| Responsable de actualización | División Archivo General — ISeP |
| Documento relacionado | [Manual de Instrucciones](./MANUAL_INSTRUCCIONES.md) |

> Documento vivo: se actualiza cuando cambian los flujos, los permisos o la interfaz. Registre toda modificación en la tabla de control de cambios.

### Control de cambios

| Versión | Fecha | Cambio | Responsable |
| --- | --- | --- | --- |
| 1.0 | 2026-11-19 | Primera versión. Cubre las dos líneas de trabajo, perfiles y auditoría. | Archivo General |

---

## 1. Objetivo

Este manual explica **cómo usar la aplicación** en el día a día. No incluye tareas de instalación ni configuración; esas están en el [Manual de Instrucciones](./MANUAL_INSTRUCCIONES.md).

La aplicación permite:

1. **Subir o digitalizar** expedientes y notas.
2. **Revisar** documentos archivados con descarga sujeta a permisos.
3. **Auditar** todas las acciones desde una vista restringida.

---

## 2. Acceso y perfiles

No hay pantalla de inicio de sesión. El usuario entra con la sesión institucional. Según los permisos asignados verá uno o varios menús.

Si la sesión es inválida, expiró o no tiene acceso, se muestra la pantalla **“Acceso denegado”**. No es un error de la aplicación: solicite la habilitación de su usuario.

| Perfil | Qué puede hacer |
| --- | --- |
| **Agente Completo** | Subir/digitalizar, revisar y descargar documentos. |
| **Operador (Solo Subir)** | Solo digitalizar y gestionar metadatos. No puede abrir la línea 2. |
| **Revisor (Solo Consulta)** | Solo revisar documentos. Puede ver el archivo, pero no descargarlo. |
| **Oficial** | Revisar y descargar originales. No puede subir documentos. |
| **Auditor de Seguridad** | Revisar, descargar y consultar la auditoría global con IP y exportación CSV. |

> En el entorno de prueba el header muestra un selector “Perfil asignado”. En producción ese selector no existe.

---

## 3. Pantalla principal

El encabezado contiene:

- **Marca ISeP — Archivo Digital.**
- **Dos pestañas de navegación:**
  - `1. Subir o Digitalizar`
  - `2. Revisar Documento`
- **Selector de perfil** (solo prueba).
- **Botón Auditoría** (solo perfiles con permiso `admin`).
- **Botón `+ Digitalizar / Subir Documento`** (solo con permiso `subir`).

Si un menú no está habilitado para su perfil, aparece con un candado o con opacidad reducida. Al intentar usarse se muestra un aviso y el evento queda registrado.

---

## 4. Línea 1 — Subir o Digitalizar

### 4.1 Cargar un documento

1. Haga clic en **`+ Digitalizar / Subir Documento`** (o en **“Escanear con Cámara / Subir Archivo”** en móvil).
2. Arrastre el archivo al área punteada o presione **“Seleccionar archivo o usar cámara”**.
3. Elija el tipo: **Expediente** o **Nota**.
4. Complete:
   - **Número Oficial** (ej. `00201-0012345-6`).
   - **Fecha del Documento.**
   - **Dependencia** emisora.
5. Presione **“Guardar Documento”**.

Formatos permitidos: **PDF, JPG, JPEG, PNG, WEBP y TIFF**. Tamaño máximo: **15 MB**.

Recomendación archivística:

- Expedientes multipágina: **PDF/A**.
- Notas o imágenes simples: **WebP/JPG optimizado (150–200 DPI, escala de grises)**.

El formulario calcula el **SHA-256** del archivo. El servidor vuelve a calcularlo; si no coincide, el alta se rechaza y se registra el intento.

### 4.2 Buscar y filtrar

El dashboard ofrece:

- **Buscar documento** por número de expediente o nota.
- **Tipo:** Todos / Expediente / Nota.
- **Dependencia.**
- **Fecha del documento.**

El contador indica cuántos documentos coinciden con los filtros. Para limpiar, deje los campos en “Todos / Todas” y sin fecha.

### 4.3 Revisar desde el listado

La columna **Acción** contiene **“Revisar Archivo”**. Al presionarlo se abre la Línea 2 con ese documento seleccionado. Si su perfil no tiene permiso `revisar`, verá un aviso y no se abrirá el visor.

---

## 5. Línea 2 — Revisar Documento

Se entra desde el tab **“2. Revisar Documento”** o desde **“Revisar Archivo”** en el listado. Sin permiso `revisar`, la opción está bloqueada.

### 5.1 Vista previa

- El documento se abre con una **URL firmada de 15 minutos**; vencido ese tiempo debe volver a abrirlo.
- Se muestran PDF e imágenes con una marca de agua “ISEP SANTA FE — ARCHIVO AUDITADO”.
- La barra del visor permite pasar de página y ajustar el zoom (`Alejar` / `Acercar`).
- Cada apertura queda registrada como **“Vista de documento”**.

Si el formato no tiene vista previa, se indica en pantalla y se ofrece la descarga cuando el permiso está habilitado.

### 5.2 Ficha de metadatos

A la derecha se muestra:

- Tipo documental, dependencia emisora y número oficial.
- Fecha del documento, formato y tamaño.
- Usuario de carga y clasificación “Reservado ISeP”.
- Huella **SHA-256** desplegable.

Con permiso `subir` aparecen además **“Editar metadatos”** y **“Eliminar”**. La eliminación pide confirmación. Ambas acciones se registran en la auditoría.

### 5.3 Descarga

El botón de descarga cambia según el perfil:

| Situación | Botón | Resultado |
| --- | --- | --- |
| Sin permiso `descargar` | “Descarga restringida por permisos” | Muestra un aviso; el intento se audita. |
| Con permiso `descargar` | “Descargar Documento Oficial” | Descarga el original y registra la acción. |
| Perfil auditor | “Descarga de Auditoría” | Descarga con banner de sesión de auditoría e IP visible en el historial. |

El banner superior explica siempre el nivel de acceso: **Modo Consulta**, **Acceso autorizado** o **Sesión de Auditoría Activa**.

### 5.4 Historial del documento

El timeline muestra, de más reciente a más antiguo, altas, vistas, descargas, modificaciones, eliminaciones, impresiones y accesos denegados.

- Los perfiles de auditoría ven además la **IP de origen** y el código exacto del evento.
- **“Exportar log”** genera un CSV del historial. La exportación también queda registrada.
- **“Imprimir Constancia”** envía la vista a impresión y genera un evento de auditoría.

Para volver al listado, use la flecha **“Volver al dashboard”** o la pestaña `1. Subir o Digitalizar`.

---

## 6. Auditoría global

Disponible solo con permiso `admin` mediante el botón **“Auditoría”** del encabezado.

La ventana permite:

- Filtrar por **acción**, **usuario** y rango de fechas.
- Actualizar el listado.
- **Exportar CSV** con BOM UTF-8 (compatible con Excel).
- Cerrar haciendo clic en “Cerrar” o fuera del panel.

La vista global incluye todos los documentos y usuarios. Está restringida por diseño: si su perfil no es administrador, el botón no aparece y cualquier intento directo sería rechazado y registrado.

---

## 7. Avisos y problemas frecuentes

| Mensaje o síntoma | Causa probable | Acción |
| --- | --- | --- |
| “Acceso denegado” al entrar | Sesión vencida o sin permiso `read` | Solicite sesión vigente al administrador. |
| “Su perfil no tiene permiso para revisar documentos” | Perfil sin `revisar` | Cambie a un perfil con Línea 2 o pida el permiso. |
| “Descarga restringida por permisos” | `revisar: true`, `descargar: false` | Solicite autorización de descarga. El intento ya quedó registrado. |
| “El SHA-256 no coincide con el archivo recibido” | Archivo modificado durante la carga | Vuelva a seleccionar el original y repita el alta. |
| “Formato no permitido” | Extensión fuera del catálogo | Convierta el archivo a PDF/JPG/PNG/WEBP/TIFF. |
| “El archivo supera el tamaño máximo de 15 MB” | Archivo demasiado grande | Comprima o divida el documento. |
| “URL firmada inválida o expirada” | Pasaron más de 15 minutos | Cierre y vuelva a abrir el documento. |
| El modal no se ve sobre el PDF | Carga pendiente de estilos | Recargue la página; los modales están configurados para quedar siempre encima. |

---

## 8. Buenas prácticas

- No comparta su sesión ni deje el navegador abierto en equipos compartidos.
- Verifique el número oficial y la fecha antes de guardar: son datos de trazabilidad.
- Use el nombre original del archivo tal como llegó; el sistema conserva el SHA-256.
- Cierre la sesión institucional al finalizar la jornada.
- Recuerde que **toda consulta y descarga se registra con usuario, IP y sello de tiempo**.

---

## 9. Glosario

| Término | Significado |
| --- | --- |
| **Expediente** | Documento multipágina digitalizado, preferentemente en PDF/A. |
| **Nota** | Comunicación simple, generalmente una sola página. |
| **SHA-256** | Huella digital del archivo; permite detectar cualquier modificación. |
| **URL firmada** | Enlace temporal con HMAC y vencimiento; no es público ni permanente. |
| **Auditoría** | Registro inalterable de quién hizo qué y cuándo. |
| **Dependencia** | Área del ISeP emisora del documento. |

---

## 10. Soporte

Ante incidentes, consulte primero la tabla del apartado 7 y luego contacte a la **División Archivo General — ISeP**, indicando:

- Perfil usado.
- Número de documento.
- Fecha y hora aproximada.
- Texto exacto del mensaje mostrado.

Para novedades y mantenimiento del sistema, consulte el [Manual de Instrucciones](./MANUAL_INSTRUCCIONES.md).
