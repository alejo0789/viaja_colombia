import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Hook para mantener los datos del dashboard y solicitudes actualizados.
 * En lugar de usar WebSockets complejos, usamos un polling inteligente que refresca 
 * las queries de React Query cada 10 segundos.
 */
export const useRealtimeSolicitudes = (queryKeys: string[]) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Definimos el intervalo de refresco (10 segundos)
    const intervalId = setInterval(() => {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }, 10000);

    // Limpieza al desmontar el componente
    return () => clearInterval(intervalId);
  }, [queryClient, queryKeys]);
};
