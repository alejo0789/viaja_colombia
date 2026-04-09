import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { adminAPI } from '@/services/api';
import { mockAlertas } from '@/data/mockData';

export default function Alertas() {
  const [alertas, setAlertas] = useState(mockAlertas);
  const [filteredAlertas, setFilteredAlertas] = useState(alertas);
  const [filterNivel, setFilterNivel] = useState('all');
  const [filterLeida, setFilterLeida] = useState('all');

  useEffect(() => {
    let filtered = alertas;

    if (filterNivel !== 'all') {
      filtered = filtered.filter((a) => a.nivel === filterNivel);
    }

    if (filterLeida !== 'all') {
      const isLeida = filterLeida === 'leida';
      filtered = filtered.filter((a) => a.leida === isLeida);
    }

    setFilteredAlertas(filtered);
  }, [alertas, filterNivel, filterLeida]);

  const handleMarkAsRead = async (alertaId: string) => {
    try {
      await adminAPI.marcarAlertaLeida(alertaId);
      setAlertas(
        alertas.map((a) =>
          a.id === alertaId
            ? { ...a, leida: true }
            : a
        )
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleResolve = async (alertaId: string) => {
    try {
      await adminAPI.resolverAlerta(alertaId);
      setAlertas(alertas.filter((a) => a.id !== alertaId));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getAlertIcon = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return <AlertCircle className="text-red-600" size={24} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={24} />;
      case 'info':
      default:
        return <Info className="text-blue-600" size={24} />;
    }
  };

  const getAlertColor = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return 'border-l-4 border-red-400 bg-red-50';
      case 'warning':
        return 'border-l-4 border-yellow-400 bg-yellow-50';
      case 'info':
      default:
        return 'border-l-4 border-blue-400 bg-blue-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Alertas</h1>
        <p className="text-gray-600 mt-2">Monitorea y gestiona las alertas del sistema</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
                <SelectItem value="info">Información</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLeida} onValueChange={setFilterLeida}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="leida">Leídas</SelectItem>
                <SelectItem value="no-leida">No leídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlertas.length > 0 ? (
          filteredAlertas.map((alerta) => (
            <Card key={alerta.id} className={`overflow-hidden ${getAlertColor(alerta.nivel)}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alerta.nivel)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{alerta.mensaje}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          {formatDate(alerta.fecha)}
                        </p>
                        {alerta.solicitud_id && (
                          <p className="text-sm text-gray-600 mt-1">
                            Solicitud: <span className="font-medium">{alerta.solicitud_id}</span>
                          </p>
                        )}
                      </div>
                      {!alerta.leida && (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-orange-200 text-orange-800 text-xs font-semibold">
                          Nueva
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      {!alerta.leida && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(alerta.id)}
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Marcar como Leída
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleResolve(alerta.id)}
                      >
                        <XCircle size={16} className="mr-2" />
                        Resolver
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 text-lg">No hay alertas que coincidan con los filtros</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
