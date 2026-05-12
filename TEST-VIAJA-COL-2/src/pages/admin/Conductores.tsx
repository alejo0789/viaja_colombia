import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Truck } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';

export default function Conductores() {
  const [conductores, setConductores] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    fecha_nacimiento: '',
    telefono: '',
    vacuna_covid: '',
    vacuna_tetano: '',
    vacuna_fiebre_amarilla: '',
    categoria_licencia: '',
    vigencia_licencia: '',
    examenes: '',
    curso_primeros_auxilios: '',
    curso_mecanica_basica: '',
    curso_manejo_extintores: '',
    curso_manejo_defensivo_tp: '',
    curso_manejo_defensivo: '',
    curso_terreno_agreste: '',
    vehiculos_ids: [] as number[],
  });

  // Cargar maestros
  const fetchData = async () => {
    setLoading(true);
    try {
      const [conductoresData, vehiculosData] = await Promise.all([
        adminAPI.getConductores(),
        adminAPI.getVehiculos()
      ]);
      setConductores(Array.isArray(conductoresData) ? conductoresData : []);
      setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVehicleToggle = (vehiculoId: number) => {
    const id = Number(vehiculoId);
    setFormData(prev => {
      const isAlreadyIncluded = prev.vehiculos_ids.some(vid => Number(vid) === id);
      return {
        ...prev,
        vehiculos_ids: isAlreadyIncluded
          ? prev.vehiculos_ids.filter(vid => Number(vid) !== id)
          : [...prev.vehiculos_ids, id]
      };
    });
  };

  const handleSaveDriver = async () => {
    try {
      const driverData = {
        nombre: formData.nombre,
        cedula: formData.cedula,
        fecha_nacimiento: formData.fecha_nacimiento,
        telefono: formData.telefono,
        whatsapp: formData.telefono,
        vacuna_covid: formData.vacuna_covid,
        vacuna_tetano: formData.vacuna_tetano,
        vacuna_fiebre_amarilla: formData.vacuna_fiebre_amarilla,
        categoria_licencia: formData.categoria_licencia,
        vigencia_licencia: formData.vigencia_licencia,
        examenes: formData.examenes,
        curso_primeros_auxilios: formData.curso_primeros_auxilios,
        curso_mecanica_basica: formData.curso_mecanica_basica,
        curso_manejo_extintores: formData.curso_manejo_extintores,
        curso_manejo_defensivo_tp: formData.curso_manejo_defensivo_tp,
        curso_manejo_defensivo: formData.curso_manejo_defensivo,
        curso_terreno_agreste: formData.curso_terreno_agreste,
        vehiculos_ids: formData.vehiculos_ids,
      };

      if (editingDriver) {
        await adminAPI.updateConductor(editingDriver.id, driverData);
      } else {
        await adminAPI.createConductor(driverData);
      }
      
      await fetchData();
      setIsDialogOpen(false);
      setEditingDriver(null);
      setFormData({
        nombre: '',
        cedula: '',
        fecha_nacimiento: '',
        telefono: '',
        vacuna_covid: '',
        vacuna_tetano: '',
        vacuna_fiebre_amarilla: '',
        categoria_licencia: '',
        vigencia_licencia: '',
        examenes: '',
        curso_primeros_auxilios: '',
        curso_mecanica_basica: '',
        curso_manejo_extintores: '',
        curso_manejo_defensivo_tp: '',
        curso_manejo_defensivo: '',
        curso_terreno_agreste: '',
        vehiculos_ids: []
      });
    } catch (error) {
      console.error('Error saving driver:', error);
    }
  };

  const formatToInputDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A' || dateStr === 'X' || dateStr === 'NO' || dateStr === 'SI') return '';
    
    // Si ya viene en formato YYYY-MM-DD, retornarlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    try {
      // Caso 1: DD/MM/YYYY
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          // Validar que sea YYYY-MM-DD
          if (year.length === 4) return `${year}-${month}-${day}`;
          // Si el año es de 2 dígitos, asumir 20XX
          return `20${year}-${month}-${day}`;
        }
      }

      // Caso 2: DD-mes/YYYY (ej: 28-abr/2028)
      if (dateStr.includes('-') && dateStr.includes('/')) {
        const months: { [key: string]: string } = {
          'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
          'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
        };
        
        const mainParts = dateStr.split('/'); // [28-abr, 2028]
        const dateParts = mainParts[0].split('-'); // [28, abr]
        
        const day = dateParts[0].padStart(2, '0');
        const monthName = dateParts[1].toLowerCase().substring(0, 3);
        const month = months[monthName];
        const year = mainParts[1];
        
        if (day && month && year) return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.error('Error parsing date:', dateStr);
    }
    
    return '';
  };

  const openEditModal = (driver: any) => {
    setEditingDriver(driver);
    setFormData({
      nombre: driver.nombre,
      cedula: driver.cedula || '',
      fecha_nacimiento: formatToInputDate(driver.fecha_nacimiento),
      telefono: driver.telefono || '',
      vacuna_covid: driver.vacuna_covid || '',
      vacuna_tetano: driver.vacuna_tetano || '',
      vacuna_fiebre_amarilla: driver.vacuna_fiebre_amarilla || '',
      categoria_licencia: driver.categoria_licencia || '',
      vigencia_licencia: formatToInputDate(driver.vigencia_licencia),
      examenes: formatToInputDate(driver.examenes),
      curso_primeros_auxilios: formatToInputDate(driver.curso_primeros_auxilios),
      curso_mecanica_basica: formatToInputDate(driver.curso_mecanica_basica),
      curso_manejo_extintores: formatToInputDate(driver.curso_manejo_extintores),
      curso_manejo_defensivo_tp: formatToInputDate(driver.curso_manejo_defensivo_tp),
      curso_manejo_defensivo: formatToInputDate(driver.curso_manejo_defensivo),
      curso_terreno_agreste: formatToInputDate(driver.curso_terreno_agreste),
      vehiculos_ids: (driver.vehiculos || []).map((v: any) => v.id),
    });
    setIsDialogOpen(true);
  };

  const filteredConductores = conductores.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesPlaca = (c.vehiculos || []).some((v: any) => 
      v.placa?.toLowerCase().includes(term)
    );
    return (
      c.nombre?.toLowerCase().includes(term) ||
      c.cedula?.toLowerCase().includes(term) ||
      matchesPlaca
    );
  });

  const toggleDriverStatus = async (conductorId: number) => {
    try {
      await adminAPI.toggleConductorStatus(conductorId);
      setConductores(
        conductores.map((c) =>
          c.id === conductorId
            ? { ...c, disponible: !c.disponible }
            : c
        )
      );
    } catch (error) {
      console.error('Error toggling driver status:', error);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#1B3A5C]">Gestión de Conductores</h1>
          <p className="text-gray-600 mt-2">Administra el personal operativo y sus asignaciones de vehículos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Buscar por nombre, CC o placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 border-gray-300 focus:ring-blue-500"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingDriver(null);
              setFormData({
                nombre: '',
                cedula: '',
                fecha_nacimiento: '',
                telefono: '',
                vacuna_covid: '',
                vacuna_tetano: '',
                vacuna_fiebre_amarilla: '',
                categoria_licencia: '',
                vigencia_licencia: '',
                examenes: '',
                curso_primeros_auxilios: '',
                curso_mecanica_basica: '',
                curso_manejo_extintores: '',
                curso_manejo_defensivo_tp: '',
                curso_manejo_defensivo: '',
                curso_terreno_agreste: '',
                vehiculos_ids: []
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#F97316] hover:bg-orange-600" onClick={() => { setEditingDriver(null); }}>
                <Plus size={18} className="mr-2" />
                Nuevo Conductor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingDriver ? 'Editar Conductor' : 'Agregar Nuevo Conductor'}</DialogTitle>
                <DialogDescription>
                  Completa los datos y selecciona los vehículos asignados al conductor.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                    <Input name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej: Carlos Rodríguez" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">C.C / Identificación</label>
                    <Input name="cedula" value={formData.cedula} onChange={handleInputChange} placeholder="12345678" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Fecha Nacimiento</label>
                    <Input name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Teléfono / WhatsApp</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded px-2 py-2 select-none">+57</span>
                      <Input name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="3001234567" className="flex-1" maxLength={10} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div className="col-span-3 font-semibold text-sm text-gray-800">Vacunas</div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">COVID</label><Input name="vacuna_covid" value={formData.vacuna_covid} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">Tétano</label><Input name="vacuna_tetano" value={formData.vacuna_tetano} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">Fiebre Amarilla</label><Input name="vacuna_fiebre_amarilla" value={formData.vacuna_fiebre_amarilla} onChange={handleInputChange} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div className="col-span-3 font-semibold text-sm text-gray-800">Licencia y Exámenes</div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">Categoría</label><Input name="categoria_licencia" value={formData.categoria_licencia} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">Vigencia</label><Input name="vigencia_licencia" type="date" value={formData.vigencia_licencia} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">Exámenes</label><Input name="examenes" type="date" value={formData.examenes} onChange={handleInputChange} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="col-span-2 font-semibold text-sm text-gray-800">Cursos</div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">Primeros Auxilios</label><Input name="curso_primeros_auxilios" type="date" value={formData.curso_primeros_auxilios} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">Mecánica Básica</label><Input name="curso_mecanica_basica" type="date" value={formData.curso_mecanica_basica} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">Extintores e Incendios</label><Input name="curso_manejo_extintores" type="date" value={formData.curso_manejo_extintores} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">M. Defensivo T-P</label><Input name="curso_manejo_defensivo_tp" type="date" value={formData.curso_manejo_defensivo_tp} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">M. Defensivo</label><Input name="curso_manejo_defensivo" type="date" value={formData.curso_manejo_defensivo} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><label className="text-xs font-medium text-gray-600">Terreno Agreste</label><Input name="curso_terreno_agreste" type="date" value={formData.curso_terreno_agreste} onChange={handleInputChange} /></div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Vehículos Asignados</label>
                  <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2 bg-gray-50">
                    {vehiculos.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No hay vehículos registrados en la flota.</p>
                    ) : (
                      vehiculos.map((v) => {
                        const isChecked = formData.vehiculos_ids.includes(Number(v.id));
                        return (
                          <div key={v.id} className="flex items-center space-x-3 bg-white p-2.5 rounded border shadow-sm hover:bg-blue-50/50 transition-colors cursor-pointer group" onClick={() => handleVehicleToggle(Number(v.id))}>
                            <Checkbox id={`veh-${v.id}`} checked={isChecked} className="pointer-events-none" />
                            <div className="flex justify-between w-full select-none">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                <Truck size={14} className={isChecked ? "text-blue-600" : "text-gray-400"} />
                                {v.marca} {v.modelo}
                              </span>
                              <span className={`font-mono text-sm font-bold ${isChecked ? "text-blue-700" : "text-gray-400"}`}>
                                {v.placa}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-[#F97316] hover:bg-orange-600" onClick={handleSaveDriver} disabled={!formData.nombre || !formData.telefono}>
                  {editingDriver ? 'Guardar Cambios' : 'Agregar Conductor'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead>Nombre</TableHead>
                <TableHead>C.C</TableHead>
                <TableHead>Nacimiento</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="bg-green-50/50">COVID</TableHead>
                <TableHead className="bg-green-50/50">Tétano</TableHead>
                <TableHead className="bg-green-50/50">F. Amarilla</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Exámenes</TableHead>
                <TableHead className="bg-blue-50/30">P. Auxilios</TableHead>
                <TableHead className="bg-blue-50/30">Mecánica</TableHead>
                <TableHead className="bg-blue-50/30">Extintores</TableHead>
                <TableHead className="bg-blue-50/30">M. Defensivo TP</TableHead>
                <TableHead className="bg-blue-50/30">M. Defensivo</TableHead>
                <TableHead className="bg-blue-50/30">T. Agreste</TableHead>
                <TableHead>Vehículos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="sticky right-0 bg-white shadow-[-1px_0_0_0_#e5e7eb]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={19} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-500 font-medium">Cargando conductores...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredConductores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={19} className="text-center py-10 text-gray-400">
                    {searchTerm ? 'No se encontraron conductores con ese término.' : 'No hay conductores registrados.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredConductores.map((conductor) => (
                  <TableRow key={conductor.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell className="font-semibold">{conductor.nombre}</TableCell>
                    <TableCell className="text-xs">{conductor.cedula || 'N/A'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{conductor.fecha_nacimiento || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{conductor.telefono}</TableCell>
                    <TableCell className="text-xs bg-green-50/20">{conductor.vacuna_covid || 'N/A'}</TableCell>
                    <TableCell className="text-xs bg-green-50/20">{conductor.vacuna_tetano || 'N/A'}</TableCell>
                    <TableCell className="text-xs bg-green-50/20">{conductor.vacuna_fiebre_amarilla || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{conductor.categoria_licencia || 'N/A'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{conductor.vigencia_licencia || 'N/A'}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{conductor.examenes || 'N/A'}</TableCell>
                    <TableCell className="text-xs bg-blue-50/10 whitespace-nowrap">{conductor.curso_primeros_auxilios || 'N/A'}</TableCell>
                    <TableCell className="text-xs bg-blue-50/10 whitespace-nowrap">{conductor.curso_mecanica_basica || 'N/A'}</TableCell>
                    <TableCell className="text-xs bg-blue-50/10 whitespace-nowrap">{conductor.curso_manejo_extintores || 'N/A'}</TableCell>
                    <TableCell className="text-xs bg-blue-50/10 whitespace-nowrap">{conductor.curso_manejo_defensivo_tp || 'N/A'}</TableCell>
                    <TableCell className="text-xs bg-blue-50/10 whitespace-nowrap">{conductor.curso_manejo_defensivo || 'N/A'}</TableCell>
                    <TableCell className="text-xs bg-blue-50/10 whitespace-nowrap">{conductor.curso_terreno_agreste || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {conductor.vehiculos && conductor.vehiculos.length > 0 ? (
                          conductor.vehiculos.map((v: any) => (
                            <Badge key={v.id} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] py-0 px-2">
                              {v.placa}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin vehículos</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge estado={conductor.disponible ? 'activo' : 'inactivo'} />
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white shadow-[-1px_0_0_0_#e5e7eb]">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleDriverStatus(conductor.id)}
                          className={conductor.disponible ? 'border-red-200 text-red-600 hover:bg-red-50 text-[10px] h-7 px-2' : 'border-green-200 text-green-600 hover:bg-green-50 text-[10px] h-7 px-2'}
                        >
                          {conductor.disponible ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(conductor)}
                          className="h-7 w-7 text-blue-600"
                        >
                          <Pencil size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
