import { useEffect } from 'react';
import styles from './Toast.module.css';
import { Icon } from '../Icon/Icon';

interface Props {
  mensaje: string;
  onClose: () => void;
  variante?: 'success' | 'warning';
}

export function Toast({ mensaje, onClose, variante = 'success' }: Props) {
  useEffect(() => {
    const temporizador = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(temporizador);
  }, [mensaje, onClose]);

  return (
    <div className={`${styles.toast} ${variante === 'warning' ? styles.warning : ''}`} role="status">
      <Icon nombre={variante === 'warning' ? 'security' : 'check'} size={20} />
      <span>{mensaje}</span>
      <button type="button" onClick={onClose} aria-label="Cerrar aviso"><Icon nombre="close" size={16} /></button>
    </div>
  );
}
