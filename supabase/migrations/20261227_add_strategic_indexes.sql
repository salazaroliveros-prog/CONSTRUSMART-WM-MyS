create index if not exists idx_erp_proyectos_cliente on erp_proyectos (cliente);
create index if not exists idx_erp_proyectos_estado on erp_proyectos (estado);
create index if not exists idx_erp_proyectos_fecha_inicio on erp_proyectos (fecha_inicio);
create index if not exists idx_erp_proyectos_created_by on erp_proyectos (created_by);

create index if not exists idx_erp_movimientos_proyecto_id on erp_movimientos (proyecto_id);
create index if not exists idx_erp_movimientos_fecha on erp_movimientos (fecha desc);
create index if not exists idx_erp_movimientos_tipo on erp_movimientos (tipo);
create index if not exists idx_erp_movimientos_created_by on erp_movimientos (created_by);

create index if not exists idx_erp_presupuestos_proyecto_id on erp_presupuestos (proyecto_id);
create index if not exists idx_erp_presupuestos_estado on erp_presupuestos (estado);

create index if not exists idx_erp_ordenes_compra_proyecto_id on erp_ordenes_compra (proyecto_id);
create index if not exists idx_erp_ordenes_compra_estado on erp_ordenes_compra (estado);
create index if not exists idx_erp_ordenes_compra_proveedor on erp_ordenes_compra (proveedor);
create index if not exists idx_erp_ordenes_compra_created_by on erp_ordenes_compra (created_by);

create index if not exists idx_erp_materiales_nombre on erp_materiales (nombre);
create index if not exists idx_erp_materiales_critico on erp_materiales (critico);
create index if not exists idx_erp_materiales_created_by on erp_materiales (created_by);

create index if not exists idx_erp_empleados_proyecto_id on erp_empleados (proyecto_id);
create index if not exists idx_erp_empleados_created_by on erp_empleados (created_by);

create index if not exists idx_erp_hitos_proyecto_id on erp_hitos (proyecto_id);
create index if not exists idx_erp_hitos_created_by on erp_hitos (created_by);

create index if not exists idx_erp_riesgos_proyecto_id on erp_riesgos (proyecto_id);
create index if not exists idx_erp_riesgos_nivel on erp_riesgos (nivel);
create index if not exists idx_erp_riesgos_created_by on erp_riesgos (created_by);

create index if not exists idx_erp_incidentes_proyecto_id on erp_incidentes (proyecto_id);
create index if not exists idx_erp_incidentes_estado on erp_incidentes (estado);
create index if not exists idx_erp_incidentes_created_by on erp_incidentes (created_by);

create index if not exists idx_erp_avances_proyecto_id on erp_avances (proyecto_id);
create index if not exists idx_erp_avances_fecha on erp_avances (fecha);
create index if not exists idx_erp_avances_created_by on erp_avances (created_by);

create index if not exists idx_erp_notificaciones_proyecto_id on erp_notificaciones (proyecto_id);
create index if not exists idx_erp_notificaciones_leido on erp_notificaciones (leido);

create index if not exists idx_erp_proveedores_created_by on erp_proveedores (created_by);

create index if not exists idx_erp_vales_salida_proyecto_id on erp_vales_salida (proyecto_id);
create index if not exists idx_erp_vales_salida_fecha on erp_vales_salida (fecha);
create index if not exists idx_erp_vales_salida_created_by on erp_vales_salida (created_by);

create index if not exists idx_erp_cotizaciones_negocio_estado on erp_cotizaciones_negocio (estado);
create index if not exists idx_erp_cotizaciones_negocio_cliente on erp_cotizaciones_negocio (cliente);

create index if not exists idx_erp_licitaciones_estado on erp_licitaciones (estado);
create index if not exists idx_erp_licitaciones_proyecto_id on erp_licitaciones (proyecto_id);

create index if not exists idx_erp_planos_proyecto_id on erp_planos (proyecto_id);
create index if not exists idx_erp_planos_estado on erp_planos (estado);

create index if not exists idx_erp_rfis_proyecto_id on erp_rfis (proyecto_id);
create index if not exists idx_erp_rfis_estado on erp_rfis (estado);

create index if not exists idx_erp_submittals_proyecto_id on erp_submittals (proyecto_id);
create index if not exists idx_erp_submittals_estado on erp_submittals (estado);

create index if not exists idx_erp_seguimiento_proyecto_id on erp_seguimiento (proyecto_id);
create index if not exists idx_erp_seguimiento_fecha on erp_seguimiento (fecha);

create index if not exists idx_erp_seguimiento_evm_proyecto_id on erp_seguimiento_evm (proyecto_id);

create index if not exists idx_erp_activos_proyecto_id on erp_activos (proyecto_id);

create index if not exists idx_erp_cuadros_proyecto_id on erp_cuadros (proyecto_id);

create index if not exists idx_usuarios_email on erp_usuarios (email);
