# AGENTS.md — ISeP Archivo Digital

## Regla obligatoria: aprobación previa y control de cambios

**Antes de implementar cualquier cambio importante, se debe pedir y obtener la aceptación explícita del usuario.** No basta con una inferencia, con que el cambio parezca obvio ni con el silencio.

Procedimiento:

1. **Proponer:** explicar al usuario el alcance, los archivos que se tocarán, el riesgo y la verificación prevista.
2. **Esperar:** no modificar código ni documentación hasta recibir la confirmación del usuario.
3. **Implementar:** tras la aceptación, hacer el cambio y ejecutar `npm run lint` y `npm run build`.
4. **Documentar en el mismo commit:**
   - Incrementar la versión en la cabecera de `docs/MANUAL_INSTRUCCIONES.md`.
   - Agregar una fila al **Control de cambios** con versión, fecha, cambio y responsable.
   - Sincronizar `README.md`, `SPEC.md` y `docs/MANUAL_USUARIO.md` cuando el cambio afecte a flujos, permisos, API o auditoría.
   - Mencionar la documentación actualizada en el mensaje del commit.
5. **Verificar y publicar:** comprobar `git status` y hacer commit/push solo después de los pasos anteriores.

Se consideran **cambios importantes** (lista no exhaustiva):

- Permisos, roles, perfiles o acceso a las dos líneas de trabajo.
- Rutas, contratos o cabeceras de la API.
- Eventos, campos o formatos de auditoría.
- Modelo de datos, metadatos o integridad SHA-256.
- Flujo de subida, revisión, descarga o visualización (incluidos modales y capas z-index).
- Seguridad: JWT, URLs firmadas, secretos, almacenamiento o cabeceras de respuesta.
- Dependencias, scripts, configuración de Vite/API y despliegue.
- Cualquier cambio que modifique lo que ve o hace el usuario final.

No requieren aprobación previa las correcciones ortográficas o de formato sin efecto funcional, pero si se publican deben quedar registradas en el control de cambios.

Esta regla está replicada en `docs/MANUAL_INSTRUCCIONES.md` (apartado 11) y enlazada desde `README.md`. Ante duda, **preguntar primero**.
