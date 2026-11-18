import { useCallback, useEffect, useState } from 'react';
import { obtenerSesion } from './services/authService';
import { descargarDocumento, eliminarDocumento, listarDocumentos } from './services/documentService';
import type { UsuarioSesion, Documento } from './types/document.types';
import { Header } from './components/Header/Header';
import { AccessDenied } from './components/AccessDenied/AccessDenied';
import { DocumentFilters } from './components/DocumentFilters/DocumentFilters';
import { DocumentList } from './components/DocumentList/DocumentList';
import { UploadModal } from './components/UploadModal/UploadModal';
import { DocumentViewer } from './components/DocumentViewer/DocumentViewer';
import { EditModal } from './components/EditModal/EditModal';
import { AuditLog } from './components/AuditLog/AuditLog';

export default function App() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [cargandoDocs, setCargandoDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [viewing, setViewing] = useState<Documento | null>(null);
  const [editing, setEditing] = useState<Documento | null>(null);

  useEffect(() => {
    obtenerSesion().then(async u => {
      if (!u || !u.permisos.read) {
        setError(true);
        setLoading(false);
        return;
      }
      setUsuario(u);
      setCargandoDocs(true);
      try {
        setDocs(await listarDocumentos(u));
      } catch (err) {
        setErrorDocs(err instanceof Error ? err.message : 'No se pudo cargar el listado.');
      } finally {
        setCargandoDocs(false);
        setLoading(false);
      }
    }).catch(() => { setError(true); setLoading(false); });
  }, []);

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

  const descargar = async (doc: Documento) => {
    if (!usuario) return;
    try {
      await descargarDocumento(doc, usuario);
    } catch (err) {
      setErrorDocs(err instanceof Error ? err.message : 'No se pudo descargar el archivo.');
    }
  };

  const borrar = async (doc: Documento) => {
    if (!usuario) return;
    if (!window.confirm(`¿Eliminar el documento ${doc.numero_documento}? Esta acción quedará registrada en la auditoría.`)) return;
    try {
      await eliminarDocumento(doc.id, usuario);
      setViewing(null);
      await recargar(usuario);
    } catch (err) {
      setErrorDocs(err instanceof Error ? err.message : 'No se pudo eliminar el documento.');
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Cargando...</p>;
  if (error || !usuario) return <AccessDenied />;
  return (
    <div>
      <Header
        usuario={usuario}
        onUpload={() => setShowUpload(true)}
        onAudit={() => setShowAudit(true)}
      />
      <main style={{ padding: 16 }}>
        <DocumentFilters />
        {errorDocs && <p role="alert" style={{ color: 'var(--color-error)' }}>{errorDocs}</p>}
        {cargandoDocs
          ? <p>Cargando documentos…</p>
          : <DocumentList
              docs={docs}
              onConsult={setViewing}
              onDownload={(d) => void descargar(d)}
              onUpload={() => setShowUpload(true)}
              onEdit={setEditing}
              onDelete={(d) => void borrar(d)}
              puedeEditar={Boolean(usuario.permisos.write)}
            />}
      </main>
      {showUpload && (
        <UploadModal
          usuario={usuario}
          onClose={() => setShowUpload(false)}
          onSubido={() => void recargar(usuario)}
        />
      )}
      {viewing && (
        <DocumentViewer
          key={viewing.id}
          doc={viewing}
          usuario={usuario}
          onClose={() => setViewing(null)}
          onDownload={(d) => void descargar(d)}
        />
      )}
      {editing && (
        <EditModal
          key={editing.id}
          doc={editing}
          usuario={usuario}
          onClose={() => setEditing(null)}
          onGuardado={() => void recargar(usuario)}
        />
      )}
      {showAudit && <AuditLog usuario={usuario} onClose={() => setShowAudit(false)} />}
    </div>
  );
}
