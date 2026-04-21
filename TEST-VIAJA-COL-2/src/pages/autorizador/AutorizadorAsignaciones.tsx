import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { autorizadorAPI } from '@/services/api';
import { useRealtimeSolicitudes } from '@/hooks/useRealtimeSolicitudes';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Search, MapPin, FileDown } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Helper for long texts
const TruncatedCell = ({ text, maxWidth = "120px" }: { text: string; maxWidth?: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text || text === '-') return <span className="text-gray-400">-</span>;
    return (
        <div 
            className={`text-[11px] cursor-pointer transition-all duration-200 ${
                isExpanded 
                    ? "whitespace-normal bg-indigo-50 p-2 rounded border border-indigo-100 shadow-sm z-10 relative text-gray-900" 
                    : "truncate text-gray-500"
            }`}
            style={{ maxWidth: isExpanded ? '250px' : maxWidth }}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Click para contraer" : "Click para ver completo"}
        >
            {text}
        </div>
    );
};

const formatPrice = (value: string | number) => {
    if (!value && value !== 0) return '$ 0';
    return '$ ' + String(value).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const AutorizadorAsignaciones = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMes, setFilterMes] = useState('all');
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState('');

    useRealtimeSolicitudes(['autorizador-asignaciones']);

    const { data: asignacionesData, isLoading: isAsignacionesLoading } = useQuery({
        queryKey: ['autorizador-asignaciones'],
        queryFn: () => autorizadorAPI.getAsignaciones(),
    });

    const asignaciones = asignacionesData?.data || [];

    const filteredAsignaciones = asignaciones.filter((s: any) => {
        const matchesSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.empleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.conductor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.origen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.destino?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    const handleExportExcel = () => {
        if (filteredAsignaciones.length === 0) return;
        const dataToExport = filteredAsignaciones.map((s: any) => ({
            ID: s.id,
            'Fecha Solicitud': s.fecha,
            Empleado: s.empleado,
            Origen: s.origen,
            Destino: s.destino,
            Observaciones: s.observaciones || '',
            'Fecha Programada': s.hora_programada,
            'Hora Inicio': s.hora_inicio || 'N/A',
            'Hora Fin': s.hora_fin || 'N/A',
            Conductor: s.conductor || 'N/A',
            Placa: s.placa || 'N/A',
            Precio: s.precio || 0,
            Estado: s.estado
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Asignaciones');
        XLSX.writeFile(workbook, `Asignaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getMesesOptions = () => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
            options.push({ val, label });
        }
        return options;
    };

    return (
        <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-[#1B3A5C] tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-emerald-600" size={36} />
                        Asignaciones
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">
                        Control total sobre los servicios autorizados por tu área
                    </p>
                </div>

                <Button 
                    onClick={handleExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex gap-2 shadow-lg shadow-emerald-100"
                    disabled={filteredAsignaciones.length === 0}
                >
                    <FileDown size={18} />
                    Exportar Excel
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Servicios', value: filteredAsignaciones.length, color: 'text-blue-700', bg: 'bg-blue-50' },
                    { label: 'En Curso', value: filteredAsignaciones.filter((s:any) => s.estado === 'EN_CURSO').length, color: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Completados', value: filteredAsignaciones.filter((s:any) => s.estado === 'COMPLETADO').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { 
                        label: 'Inversión Total', 
                        value: formatPrice(filteredAsignaciones.reduce((acc:number, s:any) => acc + (s.precio || 0), 0)), 
                        color: 'text-indigo-700', bg: 'bg-indigo-50' 
                    },
                ].map((stat, i) => (
                    <Card key={i} className={`border-none shadow-sm ${stat.bg}`}>
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
                            <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm bg-white">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[250px]">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Buscar en la tabla</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    placeholder="ID, pasajero, conductor, dirección..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all shadow-none"
                                />
                            </div>
                        </div>

                        <div className="w-[180px]">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Mes</label>
                            <Select value={filterMes} onValueChange={setFilterMes}>
                                <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50 shadow-none">
                                    <SelectValue placeholder="Cualquier mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Cualquier mes</SelectItem>
                                    {getMesesOptions().map((opt) => (
                                        <SelectItem key={opt.val} value={opt.val}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Desde</label>
                                <Input 
                                    type="date" 
                                    value={filterDesde} 
                                    onChange={(e) => setFilterDesde(e.target.value)} 
                                    className="rounded-xl border-gray-100 bg-gray-50/50 shadow-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Hasta</label>
                                <Input 
                                    type="date" 
                                    value={filterHasta} 
                                    onChange={(e) => setFilterHasta(e.target.value)} 
                                    className="rounded-xl border-gray-100 bg-gray-50/50 shadow-none"
                                />
                            </div>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setFilterMes('all');
                                setFilterDesde('');
                                setFilterHasta('');
                                setSearchTerm('');
                            }}
                            className="text-gray-400 hover:text-gray-600 rounded-xl"
                        >
                            Limpiar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 border-none">
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest pl-6">ID</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">F. Solicitud</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Pasajero</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Origen</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Destino</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Observaciones</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Conductor / Placa</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Programado</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Estado</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Inicio / Fin</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Duración</TableHead>
                                    <TableHead className="font-bold text-slate-500 uppercase text-[9px] tracking-widest text-right pr-6">Costo ($)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isAsignacionesLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-gray-400 font-medium">Cargando asignaciones...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredAsignaciones.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center py-20 text-gray-400 font-medium italic">
                                            No se encontraron servicios registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAsignaciones.map((s: any) => (
                                        <TableRow key={s.id} className="hover:bg-indigo-50/30 transition-colors border-b border-slate-50/50">
                                            <TableCell className="font-black text-blue-900 pl-6 text-xs">{s.id}</TableCell>
                                            <TableCell className="text-[10px] text-gray-400 font-medium">
                                                {s.fecha}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-bold text-gray-800">{s.empleado}</span>
                                            </TableCell>
                                            <TableCell><TruncatedCell text={s.origen} /></TableCell>
                                            <TableCell><TruncatedCell text={s.destino} /></TableCell>
                                            <TableCell><TruncatedCell text={s.observaciones} maxWidth="100px" /></TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[11px] font-bold text-gray-800 leading-none">{s.conductor}</span>
                                                    <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded w-fit font-mono font-black">
                                                        {s.placa}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-black text-slate-700">{s.hora_programada}</TableCell>
                                            <TableCell>
                                                <StatusBadge estado={s.estado} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-[10px] font-bold">
                                                    <span className="text-emerald-600">▶ {s.hora_inicio || 'N/A'}</span>
                                                    <span className="text-rose-600">■ {s.hora_fin || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-[11px] font-black ${s.estado === 'EN_CURSO' ? 'text-blue-600 animate-pulse' : 'text-amber-600'}`}>
                                                    {s.duracion}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                    {formatPrice(s.precio)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AutorizadorAsignaciones;
