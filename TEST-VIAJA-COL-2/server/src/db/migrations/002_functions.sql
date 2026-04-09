-- Create functions and triggers for VIAJA COL database

-- ============================================================================
-- TRIGGER FUNCTION: Update updated_at timestamp on all tables
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_empresas_clientes_updated_at BEFORE UPDATE ON empresas_clientes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresa_transportista_updated_at BEFORE UPDATE ON empresa_transportista
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empleados_autorizados_updated_at BEFORE UPDATE ON empleados_autorizados
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conductores_updated_at BEFORE UPDATE ON conductores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehiculos_updated_at BEFORE UPDATE ON vehiculos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_servicio_updated_at BEFORE UPDATE ON tipos_servicio
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON solicitudes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asignaciones_updated_at BEFORE UPDATE ON asignaciones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertas_updated_at BEFORE UPDATE ON alertas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_sessions_updated_at BEFORE UPDATE ON whatsapp_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: calcular_tarifa - Calculate service fare based on duration and surcharges
-- ============================================================================
-- Parameters:
--   p_tipo_servicio_id UUID - Service type ID
--   p_duracion_min INT - Duration in minutes
--   p_es_nocturno BOOL - Is it nighttime?
--   p_es_festivo BOOL - Is it a holiday?
-- Returns: TABLE with tarifa_base, costo_extra, recargo, tarifa_total
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_tarifa(
  p_tipo_servicio_id UUID,
  p_duracion_min INTEGER,
  p_es_nocturno BOOLEAN,
  p_es_festivo BOOLEAN
)
RETURNS TABLE (
  tarifa_base NUMERIC,
  costo_extra NUMERIC,
  recargo NUMERIC,
  tarifa_total NUMERIC,
  bloques_extra INTEGER
) AS $$
DECLARE
  v_tarifa_base NUMERIC;
  v_tiempo_incluido INTEGER;
  v_costo_bloque NUMERIC;
  v_bloque_min INTEGER;
  v_tiempo_excedido INTEGER;
  v_bloques_extra INTEGER;
  v_costo_extra NUMERIC;
  v_recargo_nocturno NUMERIC;
  v_recargo_festivo NUMERIC;
  v_recargo_total NUMERIC;
  v_tarifa_total NUMERIC;
BEGIN
  -- Get service type details
  SELECT
    tarifa_base,
    tiempo_max_incluido_min,
    costo_bloque_extra,
    bloque_extra_min,
    recargo_nocturno_pct,
    recargo_festivo_pct
  INTO
    v_tarifa_base,
    v_tiempo_incluido,
    v_costo_bloque,
    v_bloque_min,
    v_recargo_nocturno,
    v_recargo_festivo
  FROM tipos_servicio
  WHERE id = p_tipo_servicio_id;

  IF v_tarifa_base IS NULL THEN
    RAISE EXCEPTION 'Tipo de servicio no encontrado: %', p_tipo_servicio_id;
  END IF;

  -- Calculate extra time and blocks
  v_tiempo_excedido := CASE
    WHEN p_duracion_min > v_tiempo_incluido THEN p_duracion_min - v_tiempo_incluido
    ELSE 0
  END;

  v_bloques_extra := CASE
    WHEN v_tiempo_excedido > 0 THEN CEIL(v_tiempo_excedido::NUMERIC / v_bloque_min)
    ELSE 0
  END;

  v_costo_extra := v_bloques_extra * v_costo_bloque;

  -- Calculate surcharges
  v_recargo_total := 0;

  IF p_es_nocturno THEN
    v_recargo_total := v_recargo_total + (v_tarifa_base * v_recargo_nocturno / 100);
  END IF;

  IF p_es_festivo THEN
    v_recargo_total := v_recargo_total + (v_tarifa_base * v_recargo_festivo / 100);
  END IF;

  -- Calculate total fare
  v_tarifa_total := v_tarifa_base + v_costo_extra + v_recargo_total;

  RETURN QUERY SELECT
    v_tarifa_base,
    v_costo_extra,
    v_recargo_total,
    v_tarifa_total,
    v_bloques_extra;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: reset_servicios_mensuales - Reset monthly service counters for all employees
-- ============================================================================
-- Called once per month (1st day at 00:00 UTC)
-- Resets servicios_usados_mes to 0 for all empleados_autorizados
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_servicios_mensuales()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE empleados_autorizados
  SET servicios_usados_mes = 0
  WHERE estado = 'activo';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log the action
  INSERT INTO log_auditoria (accion, tabla_afectada, datos_nuevos)
  VALUES ('reset_servicios_mensuales', 'empleados_autorizados',
          jsonb_build_object('registros_actualizados', v_count, 'fecha_reset', NOW()));

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: generar_alerta - Create an alert for an assignment or request
-- ============================================================================
-- Parameters:
--   p_tipo tipo_alerta - Type of alert
--   p_asignacion_id UUID - Assignment ID (optional)
--   p_solicitud_id UUID - Request ID (optional)
--   p_mensaje TEXT - Alert message
--   p_datos JSONB - Additional data (optional)
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_alerta(
  p_tipo tipo_alerta,
  p_asignacion_id UUID DEFAULT NULL,
  p_solicitud_id UUID DEFAULT NULL,
  p_mensaje TEXT,
  p_datos JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO alertas (asignacion_id, solicitud_id, tipo, mensaje, datos_adicionales)
  VALUES (p_asignacion_id, p_solicitud_id, p_tipo, p_mensaje, COALESCE(p_datos, '{}'))
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: validar_cedula_asignacion - Validate ID at service start
-- ============================================================================
-- Updates cedula_confirmada and cedula_valida in assignment
-- Called when driver confirms passenger identity
-- ============================================================================
CREATE OR REPLACE FUNCTION validar_cedula_asignacion(
  p_asignacion_id UUID,
  p_cedula_confirmada VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_cedula_esperada VARCHAR;
  v_cedula_valida BOOLEAN;
  v_solicitud_id UUID;
BEGIN
  -- Get expected cedula from the assigned employee
  SELECT solicitudes.empleado_id INTO v_solicitud_id
  FROM asignaciones
  JOIN solicitudes ON asignaciones.solicitud_id = solicitudes.id
  WHERE asignaciones.id = p_asignacion_id;

  SELECT cedula INTO v_cedula_esperada
  FROM empleados_autorizados
  WHERE id = (SELECT empleado_id FROM solicitudes WHERE id = v_solicitud_id);

  -- Validate
  v_cedula_valida := (p_cedula_confirmada = v_cedula_esperada);

  -- Update assignment
  UPDATE asignaciones
  SET cedula_confirmada = p_cedula_confirmada,
      cedula_valida = v_cedula_valida,
      updated_at = NOW()
  WHERE id = p_asignacion_id;

  -- Generate alert if ID doesn't match
  IF NOT v_cedula_valida THEN
    PERFORM generar_alerta(
      'inconsistencia_datos'::tipo_alerta,
      p_asignacion_id,
      v_solicitud_id,
      'Cédula confirmada no coincide con cédula registrada',
      jsonb_build_object(
        'cedula_esperada', v_cedula_esperada,
        'cedula_confirmada', p_cedula_confirmada
      )
    );
  END IF;

  RETURN v_cedula_valida;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: finalizar_asignacion - Finalize an assignment and calculate charges
-- ============================================================================
-- Updates hora_fin_real, duracion_min, and calculates final tariff
-- ============================================================================
CREATE OR REPLACE FUNCTION finalizar_asignacion(
  p_asignacion_id UUID,
  p_es_festivo BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  tarifa_total NUMERIC,
  tiempo_excedido INTEGER,
  bloques_extra INTEGER
) AS $$
DECLARE
  v_hora_inicio TIMESTAMPTZ;
  v_duracion_min INTEGER;
  v_tipo_servicio_id UUID;
  v_es_nocturno BOOLEAN;
  v_tarifa_base NUMERIC;
  v_costo_extra NUMERIC;
  v_recargo NUMERIC;
  v_tarifa_total NUMERIC;
  v_bloques_extra INTEGER;
BEGIN
  -- Get assignment details
  SELECT
    hora_inicio_real,
    solicitudes.tipo_servicio_id
  INTO
    v_hora_inicio,
    v_tipo_servicio_id
  FROM asignaciones
  JOIN solicitudes ON asignaciones.solicitud_id = solicitudes.id
  WHERE asignaciones.id = p_asignacion_id;

  IF v_hora_inicio IS NULL THEN
    RAISE EXCEPTION 'Asignación no encontrada o sin hora de inicio';
  END IF;

  -- Calculate duration
  v_duracion_min := EXTRACT(EPOCH FROM (NOW() - v_hora_inicio)) / 60;

  -- Check if it's nighttime
  v_es_nocturno := (EXTRACT(HOUR FROM NOW()) < 6 OR EXTRACT(HOUR FROM NOW()) >= 20);

  -- Calculate fare
  SELECT tarifa_base, costo_extra, recargo, tarifa_total, bloques_extra
  INTO v_tarifa_base, v_costo_extra, v_recargo, v_tarifa_total, v_bloques_extra
  FROM calcular_tarifa(v_tipo_servicio_id, v_duracion_min::INTEGER, v_es_nocturno, p_es_festivo);

  -- Update assignment with calculated values
  UPDATE asignaciones
  SET
    hora_fin_real = NOW(),
    duracion_min = v_duracion_min,
    tiempo_excedido_min = CASE
      WHEN v_duracion_min > (SELECT tiempo_max_incluido_min FROM tipos_servicio WHERE id = v_tipo_servicio_id)
      THEN v_duracion_min - (SELECT tiempo_max_incluido_min FROM tipos_servicio WHERE id = v_tipo_servicio_id)
      ELSE 0
    END,
    bloques_extra = v_bloques_extra,
    tarifa_base_aplicada = v_tarifa_base,
    costo_extra = v_costo_extra,
    recargo_aplicado = v_recargo,
    tarifa_total = v_tarifa_total,
    updated_at = NOW()
  WHERE id = p_asignacion_id;

  RETURN QUERY SELECT v_tarifa_total,
    CASE
      WHEN v_duracion_min > (SELECT tiempo_max_incluido_min FROM tipos_servicio WHERE id = v_tipo_servicio_id)
      THEN v_duracion_min - (SELECT tiempo_max_incluido_min FROM tipos_servicio WHERE id = v_tipo_servicio_id)
      ELSE 0
    END,
    v_bloques_extra;
END;
$$ LANGUAGE plpgsql;
