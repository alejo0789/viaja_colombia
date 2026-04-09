import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  estado: string;
}

export default function StatusBadge({ estado }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pendiente_autorizacion: {
      label: 'Pendiente Autorización',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    autorizada: {
      label: 'Autorizada',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    asignada: {
      label: 'Asignada',
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    },
    en_curso: {
      label: 'En Curso',
      className: 'bg-[#FED7AA] text-orange-900 hover:bg-[#FED7AA]',
    },
    finalizada: {
      label: 'Finalizada',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    cancelada: {
      label: 'Cancelada',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
    activo: {
      label: 'Activo',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    mantenimiento: {
      label: 'Mantenimiento',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    inactivo: {
      label: 'Inactivo',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
  };

  const config = statusConfig[estado] || {
    label: estado,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  };

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
