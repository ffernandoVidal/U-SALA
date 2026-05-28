const STATUS_CONFIG = {
  AVAILABLE: { bg: '#dcfce7', color: '#166534', label: 'Disponible' },
  RESERVED: { bg: '#dbeafe', color: '#2563eb', label: 'Reservado' },
  MAINTENANCE: { bg: '#fef9c3', color: '#854d0e', label: 'Mantenimiento' },
  OUT_OF_SERVICE: { bg: '#fee2e2', color: '#991b1b', label: 'Fuera de Servicio' },
};

export default function ResourceStatusChip({ estado, size = 'md' }) {
  const config = STATUS_CONFIG[estado] || STATUS_CONFIG.AVAILABLE;
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: isSmall ? '3px 10px' : isLarge ? '6px 16px' : '4px 12px',
      borderRadius: '20px', fontSize: isSmall ? '11px' : isLarge ? '14px' : '12px',
      fontWeight: '600', backgroundColor: config.bg, color: config.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: isSmall ? '5px' : '7px', height: isSmall ? '5px' : '7px',
        borderRadius: '50%', backgroundColor: config.color, flexShrink: 0,
      }} />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
