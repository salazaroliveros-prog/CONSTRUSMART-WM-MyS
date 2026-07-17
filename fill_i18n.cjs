const fs = require('fs');

const es = JSON.parse(fs.readFileSync('./src/lib/i18n/es.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('./src/lib/i18n/en.json', 'utf-8'));

function setDeep(obj, key, value) {
  const parts = key.split('.');
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cursor[parts[i]]) cursor[parts[i]] = {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
}

// Spanish values (inferred from key names and context)
const esValues = {};
// admin
esValues['admin.actualizado_en'] = 'Actualizado en';
esValues['admin.actualizar'] = 'Actualizar';
esValues['admin.cargando'] = 'Cargando...';
esValues['admin.click_actualizar'] = 'Click para actualizar';
esValues['admin.consultas_lentas'] = 'Consultas Lentas';
esValues['admin.filas'] = 'Filas';
esValues['admin.llamadas'] = 'Llamadas';
esValues['admin.media_ms'] = 'Media (ms)';
esValues['admin.metricas_rendimiento'] = 'Métricas de Rendimiento';
esValues['admin.sin_datos_rendimiento'] = 'Sin datos de rendimiento';
esValues['admin.tab_rendimiento'] = 'Rendimiento';
esValues['admin.tamano_tablas'] = 'Tamaño de Tablas';
esValues['admin.total_s'] = 'Total (s)';
// ajustes
esValues['ajustes.total_proyectos'] = 'Total Proyectos';
esValues['ajustes.usuario'] = 'Usuario';
// auditoria
esValues['auditoria.filtro_fecha_desde'] = 'Fecha Desde';
esValues['auditoria.filtro_fecha_hasta'] = 'Fecha Hasta';
// baseprecios
esValues['baseprecios.activado'] = 'Activado';
esValues['baseprecios.activar_btn'] = 'Activar';
esValues['baseprecios.activo'] = 'Activo';
esValues['baseprecios.agregado'] = 'Agregado';
esValues['baseprecios.agregar_btn'] = 'Agregar';
esValues['baseprecios.buscar'] = 'Buscar';
esValues['baseprecios.categoria'] = 'Categoría';
esValues['baseprecios.conversor'] = 'Conversor';
esValues['baseprecios.csv_vacio'] = 'CSV vacío';
esValues['baseprecios.desde'] = 'Desde';
esValues['baseprecios.editar'] = 'Editar';
esValues['baseprecios.eliminado'] = 'Eliminado';
esValues['baseprecios.eliminar_btn'] = 'Eliminar';
esValues['baseprecios.estado'] = 'Estado';
esValues['baseprecios.exportar'] = 'Exportar';
esValues['baseprecios.guardar'] = 'Guardar';
esValues['baseprecios.hasta'] = 'Hasta';
esValues['baseprecios.importados'] = 'Importados';
esValues['baseprecios.importar_fallo'] = 'Importación fallida';
esValues['baseprecios.inactivo'] = 'Inactivo';
esValues['baseprecios.nuevo_insumo'] = 'Nuevo Insumo';
esValues['baseprecios.sin_insumos'] = 'Sin insumos';
esValues['baseprecios.sin_insumos_desc'] = 'No hay insumos registrados';
esValues['baseprecios.total_insumos'] = 'Total de Insumos';
// comercial
esValues['comercial.categoria_'] = 'Categoría';
esValues['comercial.estado_'] = 'Estado';
// common
esValues['common.actions'] = 'Acciones';
esValues['common.cancel'] = 'Cancelar';
esValues['common.cerrar_menu'] = 'Cerrar menú';
esValues['common.costo'] = 'Costo';
esValues['common.create'] = 'Crear';
esValues['common.delete'] = 'Eliminar';
esValues['common.edit'] = 'Editar';
esValues['common.mas'] = 'Más';
esValues['common.mas_modulos'] = 'Más módulos';
esValues['common.project'] = 'Proyecto';
esValues['common.update'] = 'Actualizar';
// crm
esValues['crm.eliminado_exito'] = 'Cliente eliminado exitosamente';
// cuadros
esValues['cuadros.abierto'] = 'Abierto';
esValues['cuadros.abiertos'] = 'Abiertos';
esValues['cuadros.adjudicado'] = 'Adjudicado';
esValues['cuadros.adjudicados'] = 'Adjudicados';
esValues['cuadros.buscar'] = 'Buscar';
esValues['cuadros.cerrado'] = 'Cerrado';
esValues['cuadros.cerrados'] = 'Cerrados';
esValues['cuadros.col_estado'] = 'Estado';
esValues['cuadros.col_fecha'] = 'Fecha';
esValues['cuadros.col_monto'] = 'Monto';
esValues['cuadros.col_proyecto'] = 'Proyecto';
esValues['cuadros.col_solicitud'] = 'Solicitud';
esValues['cuadros.confirmar_eliminar_msg'] = '¿Estás seguro de eliminar este cuadro?';
esValues['cuadros.crear'] = 'Crear';
esValues['cuadros.descripcion'] = 'Descripción';
esValues['cuadros.editar'] = 'Editar';
esValues['cuadros.error_formulario'] = 'Error en el formulario';
esValues['cuadros.estado'] = 'Estado';
esValues['cuadros.fecha_requerida'] = 'Fecha requerida';
esValues['cuadros.fecha_solicitud'] = 'Fecha de Solicitud';
esValues['cuadros.lista'] = 'Lista';
esValues['cuadros.nuevo'] = 'Nuevo';
esValues['cuadros.observaciones'] = 'Observaciones';
esValues['cuadros.proyecto'] = 'Proyecto';
esValues['cuadros.proyecto_requerido'] = 'Proyecto requerido';
esValues['cuadros.seleccionar_proyecto'] = 'Seleccionar proyecto';
esValues['cuadros.solicitud'] = 'Solicitud';
esValues['cuadros.solicitud_requerida'] = 'Solicitud requerida';
// cuentas
esValues['cuentas.cobrar'] = 'Por Cobrar';
esValues['cuentas.pagar'] = 'Por Pagar';
esValues['cuentas.pendientes'] = 'Pendientes';
esValues['cuentas.total'] = 'Total';
esValues['cuentas.vencidas'] = 'Vencidas';
// cuentas_cobrar
esValues['cuentas_cobrar.actualizada'] = 'Cuenta actualizada';
esValues['cuentas_cobrar.buscar'] = 'Buscar cuenta';
esValues['cuentas_cobrar.cobrada'] = 'Cobrada';
esValues['cuentas_cobrar.col_cliente'] = 'Cliente';
esValues['cuentas_cobrar.col_estado'] = 'Estado';
esValues['cuentas_cobrar.col_factura'] = 'Factura';
esValues['cuentas_cobrar.col_monto'] = 'Monto';
esValues['cuentas_cobrar.col_vencimiento'] = 'Vencimiento';
esValues['cuentas_cobrar.confirmar_eliminar'] = 'Confirmar eliminación';
esValues['cuentas_cobrar.confirmar_eliminar_msg'] = '¿Eliminar cuenta por cobrar?';
esValues['cuentas_cobrar.creada'] = 'Cuenta creada';
esValues['cuentas_cobrar.cuentas_pendientes'] = 'Cuentas Pendientes';
esValues['cuentas_cobrar.del_total'] = 'del total';
esValues['cuentas_cobrar.lista'] = 'Lista de Cuentas';
esValues['cuentas_cobrar.marcada_cobrada'] = 'Marcada como cobrada';
esValues['cuentas_cobrar.marcar_cobrada'] = 'Marcar como cobrada';
esValues['cuentas_cobrar.pendientes'] = 'Pendientes';
esValues['cuentas_cobrar.requieren_atencion'] = 'Requieren atención';
esValues['cuentas_cobrar.sin_vencidas'] = 'Sin vencidas';
esValues['cuentas_cobrar.todos_estados'] = 'Todos los estados';
esValues['cuentas_cobrar.vencida'] = 'Vencida';
// cuentas_pagar
esValues['cuentas_pagar.actualizada'] = 'Cuenta actualizada';
esValues['cuentas_pagar.buscar'] = 'Buscar cuenta';
esValues['cuentas_pagar.col_concepto'] = 'Concepto';
esValues['cuentas_pagar.col_estado'] = 'Estado';
esValues['cuentas_pagar.col_monto'] = 'Monto';
esValues['cuentas_pagar.col_proveedor'] = 'Proveedor';
esValues['cuentas_pagar.col_vencimiento'] = 'Vencimiento';
esValues['cuentas_pagar.confirmar_eliminar'] = 'Confirmar eliminación';
esValues['cuentas_pagar.confirmar_eliminar_msg'] = '¿Eliminar cuenta por pagar?';
esValues['cuentas_pagar.creada'] = 'Cuenta creada';
esValues['cuentas_pagar.cuentas_pendientes'] = 'Cuentas Pendientes';
esValues['cuentas_pagar.del_total'] = 'del total';
esValues['cuentas_pagar.lista'] = 'Lista de Cuentas';
esValues['cuentas_pagar.marcada_pagada'] = 'Marcada como pagada';
esValues['cuentas_pagar.marcar_pagada'] = 'Marcar como pagada';
esValues['cuentas_pagar.pagada'] = 'Pagada';
esValues['cuentas_pagar.requiere_pago_inmediato'] = 'Requiere pago inmediato';
esValues['cuentas_pagar.sin_vencidas'] = 'Sin vencidas';
esValues['cuentas_pagar.todos_estados'] = 'Todos los estados';
esValues['cuentas_pagar.vencida'] = 'Vencida';
// destajos
esValues['destajos.confirmar_eliminar_contenido'] = '¿Estás seguro de eliminar este contenido?';
esValues['destajos.confirmar_eliminar_titulo'] = 'Eliminar Contenido';
// financiero
esValues['financiero.egresos'] = 'Egresos';
esValues['financiero.ingresos'] = 'Ingresos';
esValues['financiero.utilidad'] = 'Utilidad';
// gestion_documental
esValues['gestion_documental.archivo'] = 'Archivo';
esValues['gestion_documental.archivo_adjunto'] = 'Archivo adjunto';
esValues['gestion_documental.archivo_submittal'] = 'Archivo de submittal';
esValues['gestion_documental.enviando'] = 'Enviando...';
esValues['gestion_documental.registrando'] = 'Registrando...';
esValues['gestion_documental.subiendo'] = 'Subiendo...';
esValues['gestion_documental.ver_archivo'] = 'Ver archivo';
// hitos
esValues['hitos.actualizado'] = 'Hito actualizado';
esValues['hitos.creado'] = 'Hito creado';
esValues['hitos.crear'] = 'Crear Hito';
esValues['hitos.editar'] = 'Editar Hito';
esValues['hitos.error_fecha'] = 'Fecha requerida';
esValues['hitos.error_nombre'] = 'Nombre requerido';
esValues['hitos.error_proyecto'] = 'Proyecto requerido';
esValues['hitos.fecha'] = 'Fecha';
esValues['hitos.marcar_completado'] = 'Marcar como completado';
esValues['hitos.marcar_pendiente'] = 'Marcar como pendiente';
esValues['hitos.nombre'] = 'Nombre';
esValues['hitos.proyecto'] = 'Proyecto';
esValues['hitos.selecciona_proyecto'] = 'Selecciona un proyecto';
esValues['hitos.sin_datos'] = 'Sin datos';
esValues['hitos.tipo'] = 'Tipo';
esValues['hitos.vencido'] = 'Vencido';
// logistica
esValues['logistica.activo_creado'] = 'Activo creado';
esValues['logistica.eliminar_cuadro'] = 'Eliminar cuadro';
esValues['logistica.error_nombre_requerido'] = 'Nombre requerido';
esValues['logistica.estado_'] = 'Estado';
esValues['logistica.estado_pendiente'] = 'Pendiente';
esValues['logistica.nuevo_cuadro'] = 'Nuevo Cuadro';
esValues['logistica.placeholder_costo'] = 'Costo';
esValues['logistica.placeholder_nombre'] = 'Nombre';
esValues['logistica.tipo_'] = 'Tipo';
esValues['logistica.tipo_accesorio'] = 'Accesorio';
esValues['logistica.tipo_equipo'] = 'Equipo';
esValues['logistica.tipo_herramienta'] = 'Herramienta';
esValues['logistica.tipo_vehiculo'] = 'Vehículo';
// muro
esValues['muro.comentario_agregado'] = 'Comentario agregado';
esValues['muro.enviar_comentario'] = 'Enviar comentario';
esValues['muro.filtrar_tipo'] = 'Filtrar por tipo';
esValues['muro.like'] = 'Me gusta';
esValues['muro.placeholder'] = 'Escribe algo...';
esValues['muro.placeholder_comentario'] = 'Escribe un comentario...';
esValues['muro.publicacion_creada'] = 'Publicación creada';
esValues['muro.publicar'] = 'Publicar';
esValues['muro.tipo_'] = 'Tipo';
esValues['muro.todos'] = 'Todos';
// nav
esValues['nav.main_navigation'] = 'Navegación principal';
esValues['nav.modules'] = 'Módulos';
// ordenes_cambio
esValues['ordenes_cambio.aprobado_por'] = 'Aprobado por';
esValues['ordenes_cambio.aprobar'] = 'Aprobar';
esValues['ordenes_cambio.cambio_rechazado'] = 'Cambio rechazado';
esValues['ordenes_cambio.costo_aprobado'] = 'Costo aprobado';
esValues['ordenes_cambio.enviar_solicitud'] = 'Enviar solicitud';
esValues['ordenes_cambio.error_proyecto'] = 'Proyecto requerido';
esValues['ordenes_cambio.error_titulo'] = 'Título requerido';
esValues['ordenes_cambio.estado_aprobado'] = 'Aprobado';
esValues['ordenes_cambio.estado_rechazado'] = 'Rechazado';
esValues['ordenes_cambio.estado_revision'] = 'En revisión';
esValues['ordenes_cambio.estado_solicitud'] = 'Estado';
esValues['ordenes_cambio.impacto_costo'] = 'Impacto en costo';
esValues['ordenes_cambio.impacto_plazo'] = 'Impacto en plazo';
esValues['ordenes_cambio.nueva'] = 'Nueva';
esValues['ordenes_cambio.nueva_solicitud'] = 'Nueva solicitud';
esValues['ordenes_cambio.pendientes'] = 'Pendientes';
esValues['ordenes_cambio.placeholder_descripcion'] = 'Descripción del cambio';
esValues['ordenes_cambio.placeholder_titulo'] = 'Título de la orden';
esValues['ordenes_cambio.rechazar'] = 'Rechazar';
esValues['ordenes_cambio.sin_datos'] = 'Sin datos';
esValues['ordenes_cambio.total_ordenes'] = 'Total de órdenes';
// plantillas
esValues['plantillas.error_eliminar'] = 'Error al eliminar';
esValues['plantillas.error_eliminar_lote'] = 'Error al eliminar lote';
esValues['plantillas.error_restaurar'] = 'Error al restaurar';
esValues['plantillas.nueva_plantilla_btn'] = 'Nueva Plantilla';
esValues['plantillas.plantilla_aria'] = 'Plantilla';
// profitability
esValues['profitability.sin_datos'] = 'Sin datos';
// proyectos
esValues['proyectos.avance'] = 'Avance';
esValues['proyectos.descripcion'] = 'Descripción';
esValues['proyectos.financiero'] = 'Financiero';
esValues['proyectos.info'] = 'Información';
esValues['proyectos.sin_hitos'] = 'Sin hitos';
esValues['proyectos.tipo_obra'] = 'Tipo de obra';
esValues['proyectos.tipologia'] = 'Tipología';
// riesgos
esValues['riesgos.agregar'] = 'Agregar';
esValues['riesgos.automaticos'] = 'Automáticos';
esValues['riesgos.controles_aplicados'] = 'Controles aplicados';
esValues['riesgos.mitigacion_prioritaria'] = 'Mitigación prioritaria';
esValues['riesgos.monitoreo_activo'] = 'Monitoreo activo';
esValues['riesgos.registrado_ya'] = 'Ya registrado';
esValues['riesgos.riesgos'] = 'Riesgos';
esValues['riesgos.riesgos_climaticos'] = 'Riesgos climáticos';
esValues['riesgos.riesgos_por_proyecto'] = 'Riesgos por proyecto';
esValues['riesgos.top_riesgos'] = 'Top riesgos';
esValues['riesgos.total_activos'] = 'Total activos';
// rrhh
esValues['rrhh.description'] = 'Descripción';
esValues['rrhh.name'] = 'Nombre';
esValues['rrhh.position'] = 'Cargo';
esValues['rrhh.title'] = 'Recursos Humanos';
esValues['rrhh.type'] = 'Tipo';
// seguimiento
esValues['seguimiento.cronograma_titulo'] = 'Cronograma';
esValues['seguimiento.sin_hitos'] = 'Sin hitos';
// sidebar
esValues['sidebar.close_menu'] = 'Cerrar menú';
esValues['sidebar.collapse'] = 'Colapsar';
esValues['sidebar.collapse_menu'] = 'Colapsar menú';
esValues['sidebar.expand_menu'] = 'Expandir menú';
// sso_calidad
esValues['sso_calidad.confirmar_emergencia'] = 'Confirmar emergencia';
esValues['sso_calidad.sin_datos_estadisticas'] = 'Sin datos estadísticos';
// weather
esValues['weather.level'] = 'Nivel';
esValues['weather.temp'] = 'Temperatura';
esValues['weather.urgency'] = 'Urgencia';

// English values
const enValues = {};
for (const [k, v] of Object.entries(esValues)) {
  enValues[k] = v; // Start with Spanish, override below
}

// Override with English translations
const enOverrides = {
  'admin.actualizado_en': 'Updated at',
  'admin.actualizar': 'Update',
  'admin.cargando': 'Loading...',
  'admin.click_actualizar': 'Click to update',
  'admin.consultas_lentas': 'Slow Queries',
  'admin.filas': 'Rows',
  'admin.llamadas': 'Calls',
  'admin.media_ms': 'Average (ms)',
  'admin.metricas_rendimiento': 'Performance Metrics',
  'admin.sin_datos_rendimiento': 'No performance data',
  'admin.tab_rendimiento': 'Performance',
  'admin.tamano_tablas': 'Table Sizes',
  'admin.total_s': 'Total (s)',
  'comercial.categoria_': 'Category',
  'comercial.estado_': 'Status',
  'common.actions': 'Actions',
  'common.cancel': 'Cancel',
  'common.cerrar_menu': 'Close menu',
  'common.costo': 'Cost',
  'common.create': 'Create',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.mas': 'More',
  'common.mas_modulos': 'More modules',
  'common.project': 'Project',
  'common.update': 'Update',
  'crm.eliminado_exito': 'Client deleted successfully',
  'cuadros.abierto': 'Open',
  'cuadros.abiertos': 'Open',
  'cuadros.adjudicado': 'Awarded',
  'cuadros.adjudicados': 'Awarded',
  'cuadros.buscar': 'Search',
  'cuadros.cerrado': 'Closed',
  'cuadros.cerrados': 'Closed',
  'cuadros.col_estado': 'Status',
  'cuadros.col_fecha': 'Date',
  'cuadros.col_monto': 'Amount',
  'cuadros.col_proyecto': 'Project',
  'cuadros.col_solicitud': 'Request',
  'cuadros.confirmar_eliminar_msg': 'Are you sure you want to delete this quote?',
  'cuadros.crear': 'Create',
  'cuadros.descripcion': 'Description',
  'cuadros.editar': 'Edit',
  'cuadros.error_formulario': 'Form error',
  'cuadros.estado': 'Status',
  'cuadros.fecha_requerida': 'Date required',
  'cuadros.fecha_solicitud': 'Request Date',
  'cuadros.lista': 'List',
  'cuadros.nuevo': 'New',
  'cuadros.observaciones': 'Notes',
  'cuadros.proyecto': 'Project',
  'cuadros.proyecto_requerido': 'Project required',
  'cuadros.seleccionar_proyecto': 'Select project',
  'cuadros.solicitud': 'Request',
  'cuadros.solicitud_requerida': 'Request required',
  'cuentas.cobrar': 'Receivables',
  'cuentas.pagar': 'Payables',
  'cuentas.pendientes': 'Pending',
  'cuentas.total': 'Total',
  'cuentas.vencidas': 'Overdue',
  'cuentas_cobrar.actualizada': 'Account updated',
  'cuentas_cobrar.buscar': 'Search accounts',
  'cuentas_cobrar.cobrada': 'Collected',
  'cuentas_cobrar.col_cliente': 'Client',
  'cuentas_cobrar.col_estado': 'Status',
  'cuentas_cobrar.col_factura': 'Invoice',
  'cuentas_cobrar.col_monto': 'Amount',
  'cuentas_cobrar.col_vencimiento': 'Due Date',
  'cuentas_cobrar.confirmar_eliminar': 'Confirm deletion',
  'cuentas_cobrar.confirmar_eliminar_msg': 'Delete receivable?',
  'cuentas_cobrar.creada': 'Account created',
  'cuentas_cobrar.cuentas_pendientes': 'Pending Accounts',
  'cuentas_cobrar.del_total': 'of total',
  'cuentas_cobrar.lista': 'Account List',
  'cuentas_cobrar.marcada_cobrada': 'Marked as collected',
  'cuentas_cobrar.marcar_cobrada': 'Mark as collected',
  'cuentas_cobrar.pendientes': 'Pending',
  'cuentas_cobrar.requieren_atencion': 'Require attention',
  'cuentas_cobrar.sin_vencidas': 'No overdue',
  'cuentas_cobrar.todos_estados': 'All statuses',
  'cuentas_cobrar.vencida': 'Overdue',
  'cuentas_pagar.actualizada': 'Account updated',
  'cuentas_pagar.buscar': 'Search accounts',
  'cuentas_pagar.col_concepto': 'Concept',
  'cuentas_pagar.col_estado': 'Status',
  'cuentas_pagar.col_monto': 'Amount',
  'cuentas_pagar.col_proveedor': 'Supplier',
  'cuentas_pagar.col_vencimiento': 'Due Date',
  'cuentas_pagar.confirmar_eliminar': 'Confirm deletion',
  'cuentas_pagar.confirmar_eliminar_msg': 'Delete payable?',
  'cuentas_pagar.creada': 'Account created',
  'cuentas_pagar.cuentas_pendientes': 'Pending Accounts',
  'cuentas_pagar.del_total': 'of total',
  'cuentas_pagar.lista': 'Account List',
  'cuentas_pagar.marcada_pagada': 'Marked as paid',
  'cuentas_pagar.marcar_pagada': 'Mark as paid',
  'cuentas_pagar.pagada': 'Paid',
  'cuentas_pagar.requiere_pago_inmediato': 'Requires immediate payment',
  'cuentas_pagar.sin_vencidas': 'No overdue',
  'cuentas_pagar.todos_estados': 'All statuses',
  'cuentas_pagar.vencida': 'Overdue',
  'destajos.confirmar_eliminar_contenido': 'Are you sure you want to delete this content?',
  'destajos.confirmar_eliminar_titulo': 'Delete Content',
  'financiero.egresos': 'Expenses',
  'financiero.ingresos': 'Income',
  'financiero.utilidad': 'Profit',
  'gestion_documental.archivo': 'File',
  'gestion_documental.archivo_adjunto': 'Attached file',
  'gestion_documental.archivo_submittal': 'Submittal file',
  'gestion_documental.enviando': 'Sending...',
  'gestion_documental.registrando': 'Registering...',
  'gestion_documental.subiendo': 'Uploading...',
  'gestion_documental.ver_archivo': 'View file',
  'hitos.actualizado': 'Milestone updated',
  'hitos.creado': 'Milestone created',
  'hitos.crear': 'Create Milestone',
  'hitos.editar': 'Edit Milestone',
  'hitos.error_fecha': 'Date required',
  'hitos.error_nombre': 'Name required',
  'hitos.error_proyecto': 'Project required',
  'hitos.fecha': 'Date',
  'hitos.marcar_completado': 'Mark as completed',
  'hitos.marcar_pendiente': 'Mark as pending',
  'hitos.nombre': 'Name',
  'hitos.proyecto': 'Project',
  'hitos.selecciona_proyecto': 'Select a project',
  'hitos.sin_datos': 'No data',
  'hitos.tipo': 'Type',
  'hitos.vencido': 'Overdue',
  'logistica.activo_creado': 'Asset created',
  'logistica.eliminar_cuadro': 'Delete quote',
  'logistica.error_nombre_requerido': 'Name required',
  'logistica.estado_': 'Status',
  'logistica.estado_pendiente': 'Pending',
  'logistica.nuevo_cuadro': 'New Quote',
  'logistica.placeholder_costo': 'Cost',
  'logistica.placeholder_nombre': 'Name',
  'logistica.tipo_': 'Type',
  'logistica.tipo_accesorio': 'Accessory',
  'logistica.tipo_equipo': 'Equipment',
  'logistica.tipo_herramienta': 'Tool',
  'logistica.tipo_vehiculo': 'Vehicle',
  'muro.comentario_agregado': 'Comment added',
  'muro.enviar_comentario': 'Send comment',
  'muro.filtrar_tipo': 'Filter by type',
  'muro.like': 'Like',
  'muro.placeholder': 'Write something...',
  'muro.placeholder_comentario': 'Write a comment...',
  'muro.publicacion_creada': 'Post created',
  'muro.publicar': 'Post',
  'muro.tipo_': 'Type',
  'muro.todos': 'All',
  'nav.main_navigation': 'Main navigation',
  'nav.modules': 'Modules',
  'ordenes_cambio.aprobado_por': 'Approved by',
  'ordenes_cambio.aprobar': 'Approve',
  'ordenes_cambio.cambio_rechazado': 'Change rejected',
  'ordenes_cambio.costo_aprobado': 'Approved cost',
  'ordenes_cambio.enviar_solicitud': 'Submit request',
  'ordenes_cambio.error_proyecto': 'Project required',
  'ordenes_cambio.error_titulo': 'Title required',
  'ordenes_cambio.estado_aprobado': 'Approved',
  'ordenes_cambio.estado_rechazado': 'Rejected',
  'ordenes_cambio.estado_revision': 'Under review',
  'ordenes_cambio.estado_solicitud': 'Status',
  'ordenes_cambio.impacto_costo': 'Cost impact',
  'ordenes_cambio.impacto_plazo': 'Schedule impact',
  'ordenes_cambio.nueva': 'New',
  'ordenes_cambio.nueva_solicitud': 'New request',
  'ordenes_cambio.pendientes': 'Pending',
  'ordenes_cambio.placeholder_descripcion': 'Description of change',
  'ordenes_cambio.placeholder_titulo': 'Order title',
  'ordenes_cambio.rechazar': 'Reject',
  'ordenes_cambio.sin_datos': 'No data',
  'ordenes_cambio.total_ordenes': 'Total orders',
  'plantillas.error_eliminar': 'Error deleting',
  'plantillas.error_eliminar_lote': 'Error deleting batch',
  'plantillas.error_restaurar': 'Error restoring',
  'plantillas.nueva_plantilla_btn': 'New Template',
  'plantillas.plantilla_aria': 'Template',
  'profitability.sin_datos': 'No data',
  'proyectos.avance': 'Progress',
  'proyectos.descripcion': 'Description',
  'proyectos.financiero': 'Financial',
  'proyectos.info': 'Information',
  'proyectos.sin_hitos': 'No milestones',
  'proyectos.tipo_obra': 'Work type',
  'proyectos.tipologia': 'Typology',
  'riesgos.agregar': 'Add',
  'riesgos.automaticos': 'Automatic',
  'riesgos.controles_aplicados': 'Applied controls',
  'riesgos.mitigacion_prioritaria': 'Priority mitigation',
  'riesgos.monitoreo_activo': 'Active monitoring',
  'riesgos.registrado_ya': 'Already registered',
  'riesgos.riesgos': 'Risks',
  'riesgos.riesgos_climaticos': 'Weather risks',
  'riesgos.riesgos_por_proyecto': 'Risks by project',
  'riesgos.top_riesgos': 'Top risks',
  'riesgos.total_activos': 'Total active',
  'rrhh.description': 'Description',
  'rrhh.name': 'Name',
  'rrhh.position': 'Position',
  'rrhh.title': 'Human Resources',
  'rrhh.type': 'Type',
  'seguimiento.cronograma_titulo': 'Schedule',
  'seguimiento.sin_hitos': 'No milestones',
  'sidebar.close_menu': 'Close menu',
  'sidebar.collapse': 'Collapse',
  'sidebar.collapse_menu': 'Collapse menu',
  'sidebar.expand_menu': 'Expand menu',
  'sso_calidad.confirmar_emergencia': 'Confirm emergency',
  'sso_calidad.sin_datos_estadisticas': 'No statistics data',
  'weather.level': 'Level',
  'weather.temp': 'Temperature',
  'weather.urgency': 'Urgency',
  // ajustes
  'ajustes.total_proyectos': 'Total Projects',
  'ajustes.usuario': 'User',
  // auditoria
  'auditoria.filtro_fecha_desde': 'Date From',
  'auditoria.filtro_fecha_hasta': 'Date To',
  // baseprecios (keep Spanish for most since they're generic labels that are valid in English too)
  'baseprecios.activado': 'Activated',
  'baseprecios.activar_btn': 'Activate',
  'baseprecios.activo': 'Active',
  'baseprecios.agregado': 'Added',
  'baseprecios.agregar_btn': 'Add',
  'baseprecios.buscar': 'Search',
  'baseprecios.categoria': 'Category',
  'baseprecios.conversor': 'Converter',
  'baseprecios.csv_vacio': 'Empty CSV',
  'baseprecios.desde': 'From',
  'baseprecios.editar': 'Edit',
  'baseprecios.eliminado': 'Deleted',
  'baseprecios.eliminar_btn': 'Delete',
  'baseprecios.estado': 'Status',
  'baseprecios.exportar': 'Export',
  'baseprecios.guardar': 'Save',
  'baseprecios.hasta': 'To',
  'baseprecios.importados': 'Imported',
  'baseprecios.importar_fallo': 'Import failed',
  'baseprecios.inactivo': 'Inactive',
  'baseprecios.nuevo_insumo': 'New Input',
  'baseprecios.sin_insumos': 'No inputs',
  'baseprecios.sin_insumos_desc': 'No inputs registered',
  'baseprecios.total_insumos': 'Total Inputs',
};

// Apply overrides
for (const [k, v] of Object.entries(enOverrides)) {
  enValues[k] = v;
}

// Add to both locale files
for (const [k, v] of Object.entries(esValues)) {
  setDeep(es, k, v);
}
for (const [k, v] of Object.entries(enValues)) {
  setDeep(en, k, v);
}

fs.writeFileSync('./src/lib/i18n/es.json', JSON.stringify(es, null, 2) + '\n', 'utf-8');
fs.writeFileSync('./src/lib/i18n/en.json', JSON.stringify(en, null, 2) + '\n', 'utf-8');

console.log('Done. es.json and en.json updated.');
