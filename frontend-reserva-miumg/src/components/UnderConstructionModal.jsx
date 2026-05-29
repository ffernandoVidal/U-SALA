import { X, Construction } from 'lucide-react';

export default function UnderConstructionModal({ titulo, onClose }) {
  if (!titulo) return null;

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      width: '400px', backgroundColor: '#fff', borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
      textAlign: 'center', padding: '40px 28px', zIndex: 999,
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '12px', right: '12px', padding: '4px',
          background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
          borderRadius: '8px', lineHeight: 0,
        }}
      >
        <X size={18} />
      </button>

      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <Construction size={24} color='#d97706' />
      </div>

      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
        {titulo}
      </h3>
      <p style={{ color: '#64748b', fontSize: '13px', marginTop: '8px', lineHeight: '1.5' }}>
        Esta sección está actualmente en desarrollo. Estamos trabajando para tenerla lista pronto.
      </p>
    </div>
  );
}
