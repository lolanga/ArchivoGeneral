import { useCallback, useEffect, useState } from 'react';
import styles from './App.module.css';
import { cambiarPerfilMock, esModoMock, obtenerSesion, perfilMockActual } from './services/authService';
import { registrarEvento } from './services/auditService';
import { eliminarDocumento, listarDocumentos } from './services/documentService';
import type { Documento, UsuarioSesion } from './types/document.types';
import { Header, type Vista } from './components/Header/Header';
import { AccessDenied } from './components/AccessDenied/AccessDenied';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ReviewDocument } from './components/ReviewDocument/ReviewDocument';
import { UploadModal } from './components/UploadModal/UploadModal';
import { AuditLog } from './components/AuditLog/AuditLog';
import { Toast } from './components/Toast/Toast';

interface Aviso {
  mensaje: string;
  variante: 'success' | 'warning';
}

export default function App() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [perfil, setPerfil] = useState(perfilMockActual());
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [cargandoDocs, setCargandoDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState('');
  const [vista, setVista] = useState<Vista>('dashboard');
  const [seleccionado, setSeleccionado] = useState<Documento | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const recargar = useCallback(async (sesion: UsuarioSesion) => {
    setCargandoDocs(true);
    setErrorDocs('');
    try {
      setDocs(await listarDocumentos(sesion));
    } catch (err) {
      setErrorDocs(err instanceof Error ? err.message : 'No se pudo cargar el listado.');
    } finally {
      setCargandoDocs(false);
    }
  }, []);

  useEffect(() => {
    obtenerSesion().then(async (sesion) => {
      if (!sesion || !sesion.permisos.read) {
        setSinAcceso(true);
        setCargandoSesion(false);
        return;
      }
      setUsuario(sesion);
      await recargar(sesion);
      setCargandoSesion(false);
    }).catch(() => {
      setSinAcceso(true);
      setCargandoSesion(false);
    });
  }, [recargar]);

  const notificar = useCallback((mensaje: string, variante: 'success' | 'warning' = 'success') => {
    setAviso({ mensaje, variante });
  }, []);

  const cerrarAviso = useCallback(() => setAviso(null), []);

  const denegado = useCallback((mensaje: string) => {
    notificar(mensaje, 'warning');
    if (usuario) {
      void registrarEvento('ACCESO_DENEGADO', mensaje, usuario).catch(() => {});
    }
  }, [notificar, usuario]);

  const abrirSubida = () => {
    if (!usuario) return;
    if (!usuario.permisos.subir) {
      denegado('Su perfil no tiene permiso para subir o digitalizar documentos (línea 1).');
      return;
    }
    setShowUpload(true);
  };

  const irRevision = (doc?: Documento) => {
    if (!usuario) return;
    if (!usuario.permisos.revisar) {
      denegado('Su perfil no tiene permiso para revisar documentos (línea 2).');
      return;
    }
    const destino = doc ?? seleccionado ?? docs[0];
    if (!destino) {
      notificar('No hay documentos archivados para revisar. Primero digitalice uno.', 'warning');
      return;
    }
    setSeleccionado(destino);
    setVista('revision');
  };

  const borrar = async (doc: Documento) => {
    if (!usuario) return;
    if (!usuario.permisos.subir) {
      denegado('Su perfil no tiene permiso para eliminar documentos.');
      return;
    }
    if (!window.confirm(`¿Eliminar el documento ${doc.numero_documento}? Esta acción quedará registrada en la auditoría.`)) return;
    try {
      await eliminarDocumento(doc.id, usuario);
      setSeleccionado(null);
      setVista('dashboard');
      notificar(`Documento ${doc.numero_documento} eliminado y registrado en la auditoría.`);
      await recargar(usuario);
    } catch (err) {
      notificar(err instanceof Error ? err.message : 'No se pudo eliminar el documento.', 'warning');
    }
  };

  const cambiarPerfil = (id: string) => {
    if (!usuario) return;
    const sesion = cambiarPerfilMock(id);
    setUsuario(sesion);
    setPerfil(id);
    setVista('dashboard');
    setSeleccionado(null);
    void registrarEvento('CAMBIO_PERFIL', `Perfil de prueba: ${id}`, sesion).catch(() => {});
    notificar('Perfil de acceso actualizado. Permisos reevaluados.');
    void recargar(sesion);
  };

  if (cargandoSesion) return <p className={styles.cargando}>Cargando…</p>;
  if (sinAcceso || !usuario) return <AccessDenied />;

  const trasSubida = () => {
    notificar('Documento guardado correctamente en el archivo digital.');
    void recargar(usuario);
  };

  const trasEdicion = () => {
    notificar('Metadatos actualizados y registrados en la auditoría.');
    void recargar(usuario);
  };

  return (
    <div className={styles.app}>
      <Header
        usuario={usuario}
        vista={vista}
        perfilMock={perfil}
        onIrDashboard={() => setVista('dashboard')}
        onIrRevision={() => irRevision()}
        onUpload={abrirSubida}
        onAudit={() => setShowAudit(true)}
        onCambiarPerfil={cambiarPerfil}
      />

      <main className={styles.main}>
        {vista === 'dashboard' ? (
          <Dashboard
            docs={docs}
            cargando={cargandoDocs}
            error={errorDocs}
            puedeRevisar={usuario.permisos.revisar}
            puedeSubir={usuario.permisos.subir}
            onRevisar={(doc) => irRevision(doc)}
            onSubir={abrirSubida}
            onDenegado={denegado}
          />
        ) : seleccionado ? (
          <ReviewDocument
            key={seleccionado.id}
            doc={seleccionado}
            usuario={usuario}
            onVolver={() => setVista('dashboard')}
            onNotificar={notificar}
            onDenegado={denegado}
            onCambios={trasEdicion}
            onEliminar={(doc) => void borrar(doc)}
          />
        ) : (
          <p className={styles.cargando}>Seleccione un documento desde el dashboard para revisarlo.</p>
        )}
      </main>

      {showUpload && (
        <UploadModal
          usuario={usuario}
          onClose={() => setShowUpload(false)}
          onSubido={trasSubida}
        />
      )}
      {showAudit && <AuditLog usuario={usuario} onClose={() => setShowAudit(false)} />}

      {aviso && <Toast mensaje={aviso.mensaje} variante={aviso.variante} onClose={cerrarAviso} />}

      {esModoMock() && <span className={styles.mockMark} aria-hidden="true">MODO PRUEBA</span>}
    </div>
  );
}
