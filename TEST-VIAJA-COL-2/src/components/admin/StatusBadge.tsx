import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  estado: string;
}

export default function StatusBadge({ estado }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    // Estados de Solicitudes
    pendiente_autorizacion: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    PENDIENTE: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    
    autorizada: { label: 'Autorizada', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    AUTORIZADO: { label: 'Autorizada', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    
    rechazada: { label: 'Rechazada', className: 'bg-red-100 text-red-700 border-red-200' },
    RECHAZADO: { label: 'Rechazada', className: 'bg-red-100 text-red-700 border-red-200' },
    
    asignada: { label: 'Asignada', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    ASIGNADO: { label: 'Asignada', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    
    en_curso: { label: 'En Curso', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    EN_CURSO: { label: 'En Curso', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    
    finalizada: { label: 'Finalizada', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    COMPLETADO: { label: 'Finalizada', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    
    cancelada: { label: 'Cancelada', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    CANCELADO: { label: 'Cancelada', className: 'bg-gray-100 text-gray-700 border-gray-200' },

    // Estados de Flota / Usuarios
    activo: { label: 'Activo', className: 'bg-green-100 text-green-700 border-green-200' },
    inactivo: { label: 'Inactivo', className: 'bg-red-100 text-red-700 border-red-200' },
    mantenimiento: { label: 'Mantenimiento', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  };

  const normalizedEstado = estado?.toUpperCase() || '';
  // Intentar match directo o buscar por la version mayúscula
  const config = statusConfig[estado] || statusConfig[normalizedEstado] || {
    label: estado,
    className: 'bg-gray-50 text-gray-500 border-gray-100',
  };

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
