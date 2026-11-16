import { useEffect, useState } from 'react';
import { obtenerSesion } from './services/authService';
import type { UsuarioSesion, Documento } from './types/document.types';
import { Header } from './components/Header/Header';
import { AccessDenied } from './components/AccessDenied/AccessDenied';
import { DocumentFilters } from './components/DocumentFilters/DocumentFilters';
import { DocumentList } from './components/DocumentList/DocumentList';
import { UploadModal } from './components/UploadModal/UploadModal';
import { DocumentViewer } from './components/DocumentViewer/DocumentViewer';

const MOCK_DOCS: Documento[] = [
  { id: '1', tipo_documento: 'EXPEDIENTE', numero_documento: '00201-0012345-6', fecha_documento: '2026-01-10', dependencia: 'ARCHIVO GENERAL', archivo_url: '', nombre_archivo_original: 'exp.pdf', mime_type: 'application/pdf', hash_sha256: 'abc', usuario_carga_id: 'u1', timestamp_carga: new Date().toISOString() },
];

export default function App() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [viewing, setViewing] = useState<Documento | null>(null);

  useEffect(() => {
    obtenerSesion().then(u => {
      if (!u || !u.permisos.read) { setError(true); }
      else setUsuario(u);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Cargando...</p>;
  if (error || !usuario) return <AccessDenied />;
  return (
    <div>
      <Header usuario={usuario} onUpload={() => setShowUpload(true)} />
      <main style={{ padding: 16 }}>
        <DocumentFilters />
        <DocumentList docs={MOCK_DOCS} onConsult={setViewing} />
      </main>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {viewing && <DocumentViewer doc={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}