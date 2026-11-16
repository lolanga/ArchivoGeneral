# Especificaciones Técnicas del Proyecto: Sistema de Gestión de Archivos Digitalizados (ISeP)

## 1. Contexto Institucional y Marco Normativo Obligatorio
El sistema opera bajo la órbita del **Instituto de Seguridad Pública de Santa Fe (ISeP)**. Todo el desarrollo debe respetar el principio de **Privacidad y Seguridad desde el Diseño** cumpliendo con:
- **Ley Nacional N.º 25.326 y Dto. 1558/2001:** Protección de datos personales, medidas de seguridad técnica y confidencialidad.
- **Ley Nacional N.º 27.699 (Convenio 108+):** Privacidad desde el diseño y control en el flujo transfronterizo de datos (la nube externa elegida debe garantizar estándares adecuados de protección y cifrado en tránsito TLS 1.3 y en reposo AES-256).
- **Constitución de la Provincia de Santa Fe (Art. 29):** Ciberseguridad, transparencia y control en entornos digitales.
- **Ley Provincial N.º 14.256:** Gobernanza de datos, interoperabilidad y preservación de activos digitales en el sector público provincial.
- **Protocolo Interno:** Protocolo de Gestión documental de la División Archivo General.

## 2. Stack Tecnológico
- **Frontend:** React + Vite + TypeScript (Strict Mode).
- **Estilos:** 100% **CSS Puro** utilizando variables globales en `src/styles/variables.css` y CSS Modules (`*.module.css`). Prohibido instalar Tailwind, Bootstrap o librerías de UI pesadas.
- **Arquitectura:** PWA (Progressive Web App) responsiva (Desktop-first para consulta / Mobile-first para captura).

## 3. Autenticación y Autorización (Integración Externa)
- **No implementar pantalla de Login ni registro de usuarios.**
- La app recibe un **Token JWT / Sesión** desde la plataforma institucional madre (vía URL/Header/Storage seguro).
- El frontend debe validar el token al iniciar y extraer: `user_id`, `nombre_completo`, `dependencia_id` y `permisos` (`read`, `write`).
- Si el token es inválido, expiró o carece de permisos, renderizar la vista `<AccessDenied />` y bloquear cualquier petición a la API.

## 4. Estándares Archivísticos y Manejo de Archivos
- **Formatos aceptados en el input:** `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.tiff`.
- **Recomendación activa en UI:** 
  - Para documentos multipágina o expedientes: Recomendar **PDF/A (ISO 19005)** por ser el estándar internacional de preservación digital a largo plazo (Ley 14.256).
  - Para digitalización rápida de notas simples o imágenes: Recomendar **WebP** o **JPEG comprimido (150-200 DPI en escala de grises)** para optimizar el almacenamiento en la nube.
- **Validación en cliente:** Verificar extensión, tamaño máximo (ej. 15 MB) y calcular hash SHA-256 del archivo antes de subirlo para garantizar su integridad (no alteración).

## 5. Modelo de Datos y Metadatos (Esquema JSON / Tabla)
Cada archivo digitalizado debe registrarse con los siguientes metadatos obligatorios:
- `id`: UUID v4
- `tipo_documento`: `'EXPEDIENTE' | 'NOTA'`
- `numero_documento`: String (Ej. `"00201-0012345-6"`, indexado)
- `fecha_documento`: Date (`YYYY-MM-DD`)
- `dependencia`: String (Catálogo normalizado de áreas del ISeP)
- `archivo_url`: String (URL firmada temporalmente / Signed URL, nunca pública)
- `nombre_archivo_original`: String
- `mime_type`: String
- `hash_sha256`: String (Para auditoría e integridad archivística)
- `usuario_carga_id`: String (ID proveniente del token institucional)
- `timestamp_carga`: ISO-8601 Timestamp (Auditoría inmutable)

## 6. Reglas de Seguridad en Frontend (Cumplimiento Art. 29 y Ley 25.326)
- **URLs Firmadas (Signed URLs):** Los archivos en la nube externa nunca tendrán acceso público directo. El visor solicitará una URL temporal con expiración corta (ej. 15 minutos).
- **Auditoría de Consulta:** Cada apertura de archivo debe registrar un evento de lectura (`usuario_id`, `documento_id`, `fecha_hora`) en el backend.
- **Sin caché local sensible:** Configurar cabeceras y Service Worker para no almacenar documentos descargados en la caché persistente del navegador en equipos compartidos de oficina.
