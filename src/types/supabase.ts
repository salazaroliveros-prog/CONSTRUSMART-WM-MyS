export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activos_herramientas: {
        Row: {
          asignado_a: string | null
          codigo_inventario: string
          created_at: string
          created_by: string | null
          estado: string
          fecha_adquisicion: string
          fecha_asignacion: string | null
          id: string
          marca: string | null
          modelo: string | null
          nombre: string
          numero_serie: string | null
          proyecto_id: string | null
          tipo: string
          ubicacion: string | null
          valor_adquisicion: number
        }
        Insert: {
          asignado_a?: string | null
          codigo_inventario: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_adquisicion?: string
          fecha_asignacion?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre: string
          numero_serie?: string | null
          proyecto_id?: string | null
          tipo: string
          ubicacion?: string | null
          valor_adquisicion?: number
        }
        Update: {
          asignado_a?: string | null
          codigo_inventario?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_adquisicion?: string
          fecha_asignacion?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre?: string
          numero_serie?: string | null
          proyecto_id?: string | null
          tipo?: string
          ubicacion?: string | null
          valor_adquisicion?: number
        }
        Relationships: []
      }
      amortizaciones: {
        Row: {
          anticipo_id: string
          created_at: string
          created_by: string | null
          fecha: string
          id: string
          monto: number
          referencia: string | null
        }
        Insert: {
          anticipo_id: string
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          monto?: number
          referencia?: string | null
        }
        Update: {
          anticipo_id?: string
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          monto?: number
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amortizaciones_anticipo_id_fkey"
            columns: ["anticipo_id"]
            isOneToOne: false
            referencedRelation: "anticipos"
            referencedColumns: ["id"]
          },
        ]
      }
      anticipos: {
        Row: {
          beneficiario: string
          concepto: string
          created_at: string
          created_by: string | null
          estado: string
          fecha_entrega: string
          fecha_ultima_amortizacion: string | null
          id: string
          monto_total: number
          proyecto_id: string
          saldo_pendiente: number
          tipo: string
        }
        Insert: {
          beneficiario: string
          concepto: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_entrega?: string
          fecha_ultima_amortizacion?: string | null
          id?: string
          monto_total?: number
          proyecto_id: string
          saldo_pendiente?: number
          tipo: string
        }
        Update: {
          beneficiario?: string
          concepto?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_entrega?: string
          fecha_ultima_amortizacion?: string | null
          id?: string
          monto_total?: number
          proyecto_id?: string
          saldo_pendiente?: number
          tipo?: string
        }
        Relationships: []
      }
      cajas_chicas: {
        Row: {
          aprobado_por: string | null
          categoria: string
          created_at: string
          created_by: string | null
          descripcion: string
          estado: string
          factura_url: string | null
          fecha_aprobacion: string | null
          fecha_gasto: string
          foto_url: string | null
          id: string
          latitud: number | null
          longitud: number | null
          monto: number
          proyecto_id: string
          solicitante: string
        }
        Insert: {
          aprobado_por?: string | null
          categoria: string
          created_at?: string
          created_by?: string | null
          descripcion: string
          estado?: string
          factura_url?: string | null
          fecha_aprobacion?: string | null
          fecha_gasto?: string
          foto_url?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          monto?: number
          proyecto_id: string
          solicitante: string
        }
        Update: {
          aprobado_por?: string | null
          categoria?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string
          estado?: string
          factura_url?: string | null
          fecha_aprobacion?: string | null
          fecha_gasto?: string
          foto_url?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          monto?: number
          proyecto_id?: string
          solicitante?: string
        }
        Relationships: []
      }
      centros_costo: {
        Row: {
          codigo: string
          created_at: string
          gasto_actual: number
          id: string
          nombre: string
          presupuesto_asignado: number
          proyecto_id: string
          tipo: string
        }
        Insert: {
          codigo: string
          created_at?: string
          gasto_actual?: number
          id?: string
          nombre: string
          presupuesto_asignado?: number
          proyecto_id: string
          tipo?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          gasto_actual?: number
          id?: string
          nombre?: string
          presupuesto_asignado?: number
          proyecto_id?: string
          tipo?: string
        }
        Relationships: []
      }
      cotizaciones: {
        Row: {
          condiciones_pago: string | null
          created_at: string
          cuadro_id: string
          id: string
          monto_total: number
          plazo_entrega: number | null
          proveedor_id: string
          seleccionada: boolean
          validez_oferta: string | null
        }
        Insert: {
          condiciones_pago?: string | null
          created_at?: string
          cuadro_id: string
          id?: string
          monto_total?: number
          plazo_entrega?: number | null
          proveedor_id: string
          seleccionada?: boolean
          validez_oferta?: string | null
        }
        Update: {
          condiciones_pago?: string | null
          created_at?: string
          cuadro_id?: string
          id?: string
          monto_total?: number
          plazo_entrega?: number | null
          proveedor_id?: string
          seleccionada?: boolean
          validez_oferta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cuadro_id_fkey"
            columns: ["cuadro_id"]
            isOneToOne: false
            referencedRelation: "cuadro_comparativo_proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      cuadro_comparativo_proveedores: {
        Row: {
          adjudicado_a: string | null
          created_at: string
          created_by: string | null
          estado: string
          fecha_cierre: string | null
          fecha_solicitud: string
          id: string
          observaciones: string | null
          proyecto_id: string | null
          solicitud: string
        }
        Insert: {
          adjudicado_a?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_cierre?: string | null
          fecha_solicitud?: string
          id?: string
          observaciones?: string | null
          proyecto_id?: string | null
          solicitud: string
        }
        Update: {
          adjudicado_a?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_cierre?: string | null
          fecha_solicitud?: string
          id?: string
          observaciones?: string | null
          proyecto_id?: string | null
          solicitud?: string
        }
        Relationships: []
      }
      destajos: {
        Row: {
          cantidad_ejecutada: number
          created_at: string
          cuadrilla: string
          fecha: string
          horas_trabajadas: number
          id: string
          observaciones: string | null
          proyecto_id: string
          registrado_por: string | null
          rendimiento_real: number | null
          rendimiento_teorico: number
          renglon_codigo: string
          unidad: string
        }
        Insert: {
          cantidad_ejecutada?: number
          created_at?: string
          cuadrilla: string
          fecha?: string
          horas_trabajadas?: number
          id?: string
          observaciones?: string | null
          proyecto_id: string
          registrado_por?: string | null
          rendimiento_real?: number | null
          rendimiento_teorico?: number
          renglon_codigo: string
          unidad: string
        }
        Update: {
          cantidad_ejecutada?: number
          created_at?: string
          cuadrilla?: string
          fecha?: string
          horas_trabajadas?: number
          id?: string
          observaciones?: string | null
          proyecto_id?: string
          registrado_por?: string | null
          rendimiento_real?: number | null
          rendimiento_teorico?: number
          renglon_codigo?: string
          unidad?: string
        }
        Relationships: []
      }
      erp_activos: {
        Row: {
          asignado_a: string | null
          costo: number | null
          created_at: string | null
          created_by: string | null
          estado: string | null
          fecha_compra: string | null
          id: string
          modelo: string | null
          nombre: string
          numero_serie: string | null
          proyecto_id: string
          tipo: string
          ubicacion: string | null
          updated_at: string | null
          vida_util: number | null
        }
        Insert: {
          asignado_a?: string | null
          costo?: number | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_compra?: string | null
          id?: string
          modelo?: string | null
          nombre: string
          numero_serie?: string | null
          proyecto_id: string
          tipo: string
          ubicacion?: string | null
          updated_at?: string | null
          vida_util?: number | null
        }
        Update: {
          asignado_a?: string | null
          costo?: number | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_compra?: string | null
          id?: string
          modelo?: string | null
          nombre?: string
          numero_serie?: string | null
          proyecto_id?: string
          tipo?: string
          ubicacion?: string | null
          updated_at?: string | null
          vida_util?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_activos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_auditoria: {
        Row: {
          accion: string
          creado_en: string
          datos: Json | null
          id: string
          ip: string | null
          registro_id: string | null
          tabla: string
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          creado_en?: string
          datos?: Json | null
          id?: string
          ip?: string | null
          registro_id?: string | null
          tabla: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          creado_en?: string
          datos?: Json | null
          id?: string
          ip?: string | null
          registro_id?: string | null
          tabla?: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      erp_avances: {
        Row: {
          avance_fisico: number
          cantidad_ejecutada: number
          created_at: string
          created_by: string | null
          fecha: string
          foto: string | null
          id: string
          latitud: number | null
          longitud: number | null
          presupuesto_id: string | null
          proyecto_id: string
          renglon_id: string | null
        }
        Insert: {
          avance_fisico?: number
          cantidad_ejecutada?: number
          created_at?: string
          created_by?: string | null
          fecha?: string
          foto?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          presupuesto_id?: string | null
          proyecto_id: string
          renglon_id?: string | null
        }
        Update: {
          avance_fisico?: number
          cantidad_ejecutada?: number
          created_at?: string
          created_by?: string | null
          fecha?: string
          foto?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          presupuesto_id?: string | null
          proyecto_id?: string
          renglon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_avances_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "erp_presupuestos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_bitacora: {
        Row: {
          clima: string | null
          created_at: string
          created_by: string | null
          fecha: string
          id: string
          maquinaria: string | null
          observaciones: string | null
          personal: number
          proyecto_id: string
          tareas: string
          updated_at: string
        }
        Insert: {
          clima?: string | null
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          maquinaria?: string | null
          observaciones?: string | null
          personal?: number
          proyecto_id: string
          tareas: string
          updated_at?: string
        }
        Update: {
          clima?: string | null
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          maquinaria?: string | null
          observaciones?: string | null
          personal?: number
          proyecto_id?: string
          tareas?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_bitacora_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_cuadros: {
        Row: {
          archivo_url: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          id: string
          nombre: string
          proyecto_id: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          archivo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          proyecto_id: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          archivo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          proyecto_id?: string
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_cuadros_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_cuentas_cobrar: {
        Row: {
          cliente: string
          concepto: string
          created_at: string
          created_by: string | null
          estado: string
          fecha_cobro: string | null
          fecha_emision: string
          fecha_vencimiento: string
          id: string
          monto: number
          notas: string | null
          proyecto_id: string
          saldo_pendiente: number
          updated_at: string
        }
        Insert: {
          cliente: string
          concepto: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_cobro?: string | null
          fecha_emision: string
          fecha_vencimiento: string
          id?: string
          monto: number
          notas?: string | null
          proyecto_id: string
          saldo_pendiente: number
          updated_at?: string
        }
        Update: {
          cliente?: string
          concepto?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_cobro?: string | null
          fecha_emision?: string
          fecha_vencimiento?: string
          id?: string
          monto?: number
          notas?: string | null
          proyecto_id?: string
          saldo_pendiente?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_cuentas_cobrar_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_cuentas_pagar: {
        Row: {
          concepto: string
          created_at: string
          created_by: string | null
          estado: string
          factura_url: string | null
          fecha_emision: string
          fecha_pago: string | null
          fecha_vencimiento: string
          id: string
          monto: number
          proveedor: string
          proyecto_id: string
          saldo_pendiente: number
          updated_at: string
        }
        Insert: {
          concepto: string
          created_at?: string
          created_by?: string | null
          estado?: string
          factura_url?: string | null
          fecha_emision: string
          fecha_pago?: string | null
          fecha_vencimiento: string
          id?: string
          monto: number
          proveedor: string
          proyecto_id: string
          saldo_pendiente: number
          updated_at?: string
        }
        Update: {
          concepto?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          factura_url?: string | null
          fecha_emision?: string
          fecha_pago?: string | null
          fecha_vencimiento?: string
          id?: string
          monto?: number
          proveedor?: string
          proyecto_id?: string
          saldo_pendiente?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_cuentas_pagar_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_empleados: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          dias_trabajados: number
          id: string
          nombre: string
          proyecto_id: string | null
          puesto: string
          salario_diario: number
          tipo: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          dias_trabajados?: number
          id?: string
          nombre: string
          proyecto_id?: string | null
          puesto: string
          salario_diario?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          dias_trabajados?: number
          id?: string
          nombre?: string
          proyecto_id?: string | null
          puesto?: string
          salario_diario?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_empleados_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_eventos_calendario: {
        Row: {
          completado: boolean | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          fecha: string
          hora: string | null
          id: string
          proyecto_id: string | null
          tipo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          completado?: boolean | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          fecha: string
          hora?: string | null
          id?: string
          proyecto_id?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          completado?: boolean | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          fecha?: string
          hora?: string | null
          id?: string
          proyecto_id?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_eventos_calendario_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_hitos: {
        Row: {
          completado_en: string | null
          created_at: string
          created_by: string | null
          depends_on: string | null
          descripcion: string | null
          estado: string
          fecha: string
          id: string
          nombre: string
          proyecto_id: string
          responsable: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          completado_en?: string | null
          created_at?: string
          created_by?: string | null
          depends_on?: string | null
          descripcion?: string | null
          estado?: string
          fecha: string
          id?: string
          nombre: string
          proyecto_id: string
          responsable?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          completado_en?: string | null
          created_at?: string
          created_by?: string | null
          depends_on?: string | null
          descripcion?: string | null
          estado?: string
          fecha?: string
          id?: string
          nombre?: string
          proyecto_id?: string
          responsable?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_hitos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_incidentes: {
        Row: {
          acciones_inmediatas: string | null
          afectados: string
          created_at: string
          created_by: string | null
          descripcion: string
          estado: string
          fecha: string
          fotos: string[] | null
          hora: string | null
          id: string
          latitud: number | null
          longitud: number | null
          proyecto_id: string
          reportado_por: string
          testigos: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          acciones_inmediatas?: string | null
          afectados: string
          created_at?: string
          created_by?: string | null
          descripcion: string
          estado?: string
          fecha: string
          fotos?: string[] | null
          hora?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          proyecto_id: string
          reportado_por: string
          testigos?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          acciones_inmediatas?: string | null
          afectados?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string
          estado?: string
          fecha?: string
          fotos?: string[] | null
          hora?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          proyecto_id?: string
          reportado_por?: string
          testigos?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_incidentes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_insumos: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          nombre: string
          precio: number
          rendimiento: number
          renglon_id: string
          tipo: string
          unidad: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          nombre: string
          precio?: number
          rendimiento?: number
          renglon_id: string
          tipo: string
          unidad: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          nombre?: string
          precio?: number
          rendimiento?: number
          renglon_id?: string
          tipo?: string
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_insumos_renglon_id_fkey"
            columns: ["renglon_id"]
            isOneToOne: false
            referencedRelation: "erp_renglones"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_insumos_base: {
        Row: {
          activo: boolean
          categoria: string
          fecha_actualizacion: string
          id: string
          nombre: string
          precio_referencia: number
          rubro: string
          unidad: string
        }
        Insert: {
          activo?: boolean
          categoria: string
          fecha_actualizacion?: string
          id?: string
          nombre: string
          precio_referencia?: number
          rubro: string
          unidad: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          fecha_actualizacion?: string
          id?: string
          nombre?: string
          precio_referencia?: number
          rubro?: string
          unidad?: string
        }
        Relationships: []
      }
      erp_liberaciones_partida: {
        Row: {
          checklist_aprobado: boolean | null
          created_at: string
          created_by: string | null
          estado: string
          fecha_liberacion: string | null
          fecha_solicitud: string
          id: string
          observaciones: string | null
          proyecto_id: string
          renglon_id: string | null
          renglon_nombre: string
          solicitante: string
          supervisor: string
          updated_at: string
        }
        Insert: {
          checklist_aprobado?: boolean | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_liberacion?: string | null
          fecha_solicitud: string
          id?: string
          observaciones?: string | null
          proyecto_id: string
          renglon_id?: string | null
          renglon_nombre: string
          solicitante: string
          supervisor: string
          updated_at?: string
        }
        Update: {
          checklist_aprobado?: boolean | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_liberacion?: string | null
          fecha_solicitud?: string
          id?: string
          observaciones?: string | null
          proyecto_id?: string
          renglon_id?: string | null
          renglon_nombre?: string
          solicitante?: string
          supervisor?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_liberaciones_partida_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_licitaciones: {
        Row: {
          cliente: string
          created_at: string
          created_by: string | null
          documentos: Json
          estado: string
          fecha_limite: string
          id: string
          monto: number
          nombre: string
          notas: string | null
          updated_at: string
        }
        Insert: {
          cliente: string
          created_at?: string
          created_by?: string | null
          documentos?: Json
          estado?: string
          fecha_limite: string
          id?: string
          monto?: number
          nombre: string
          notas?: string | null
          updated_at?: string
        }
        Update: {
          cliente?: string
          created_at?: string
          created_by?: string | null
          documentos?: Json
          estado?: string
          fecha_limite?: string
          id?: string
          monto?: number
          nombre?: string
          notas?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      erp_materiales: {
        Row: {
          created_at: string
          created_by: string | null
          critico: boolean
          id: string
          nombre: string
          precio: number
          stock: number
          stock_minimo: number
          unidad: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          critico?: boolean
          id?: string
          nombre: string
          precio?: number
          stock?: number
          stock_minimo?: number
          unidad: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          critico?: boolean
          id?: string
          nombre?: string
          precio?: number
          stock?: number
          stock_minimo?: number
          unidad?: string
          updated_at?: string
        }
        Relationships: []
      }
      erp_movimientos: {
        Row: {
          cantidad: number
          categoria: string
          costo_total: number
          costo_unitario: number
          created_at: string
          created_by: string | null
          descripcion: string
          factura: string | null
          fecha: string
          forma_pago: string | null
          id: string
          notas: string | null
          proveedor_nit: string | null
          proyecto_id: string | null
          referencia_bancaria: string | null
          retencion_isr: number | null
          retencion_iva: number | null
          tipo: string
          unidad: string
          updated_at: string
        }
        Insert: {
          cantidad?: number
          categoria: string
          costo_total?: number
          costo_unitario?: number
          created_at?: string
          created_by?: string | null
          descripcion: string
          factura?: string | null
          fecha?: string
          forma_pago?: string | null
          id?: string
          notas?: string | null
          proveedor_nit?: string | null
          proyecto_id?: string | null
          referencia_bancaria?: string | null
          retencion_isr?: number | null
          retencion_iva?: number | null
          tipo: string
          unidad: string
          updated_at?: string
        }
        Update: {
          cantidad?: number
          categoria?: string
          costo_total?: number
          costo_unitario?: number
          created_at?: string
          created_by?: string | null
          descripcion?: string
          factura?: string | null
          fecha?: string
          forma_pago?: string | null
          id?: string
          notas?: string | null
          proveedor_nit?: string | null
          proyecto_id?: string | null
          referencia_bancaria?: string | null
          retencion_isr?: number | null
          retencion_iva?: number | null
          tipo?: string
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_movimientos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_muro: {
        Row: {
          autor: string
          autor_avatar: string | null
          comentarios: Json | null
          contenido: string
          created_at: string
          created_by: string | null
          documento: Json | null
          fotos: string[] | null
          id: string
          likes: number | null
          proyecto_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          autor: string
          autor_avatar?: string | null
          comentarios?: Json | null
          contenido: string
          created_at?: string
          created_by?: string | null
          documento?: Json | null
          fotos?: string[] | null
          id?: string
          likes?: number | null
          proyecto_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          autor?: string
          autor_avatar?: string | null
          comentarios?: Json | null
          contenido?: string
          created_at?: string
          created_by?: string | null
          documento?: Json | null
          fotos?: string[] | null
          id?: string
          likes?: number | null
          proyecto_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_muro_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_no_conformidades: {
        Row: {
          categoria: string
          codigo: string
          created_at: string
          created_by: string | null
          descripcion: string
          detectado_por: string
          estado: string
          fecha_cierre: string | null
          fecha_deteccion: string
          id: string
          plan_accion: string | null
          proyecto_id: string
          responsable_cierre: string | null
          updated_at: string
        }
        Insert: {
          categoria: string
          codigo: string
          created_at?: string
          created_by?: string | null
          descripcion: string
          detectado_por: string
          estado?: string
          fecha_cierre?: string | null
          fecha_deteccion: string
          id?: string
          plan_accion?: string | null
          proyecto_id: string
          responsable_cierre?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string
          codigo?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string
          detectado_por?: string
          estado?: string
          fecha_cierre?: string | null
          fecha_deteccion?: string
          id?: string
          plan_accion?: string | null
          proyecto_id?: string
          responsable_cierre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_no_conformidades_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_ordenes_cambio: {
        Row: {
          aprobador: string | null
          created_at: string
          created_by: string | null
          descripcion: string
          estado: string
          fecha_aprobacion: string | null
          id: string
          impacto_costo: number
          impacto_plazo: number
          proyecto_id: string
          solicitante: string
          solicitante_rol: string
          titulo: string
          updated_at: string
        }
        Insert: {
          aprobador?: string | null
          created_at?: string
          created_by?: string | null
          descripcion: string
          estado?: string
          fecha_aprobacion?: string | null
          id?: string
          impacto_costo: number
          impacto_plazo: number
          proyecto_id: string
          solicitante: string
          solicitante_rol: string
          titulo: string
          updated_at?: string
        }
        Update: {
          aprobador?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string
          estado?: string
          fecha_aprobacion?: string | null
          id?: string
          impacto_costo?: number
          impacto_plazo?: number
          proyecto_id?: string
          solicitante?: string
          solicitante_rol?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_ordenes_cambio_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_ordenes_compra: {
        Row: {
          cantidad: number
          created_at: string
          created_by: string | null
          estado: string
          fecha: string
          id: string
          items: Json | null
          material: string
          monto: number
          proveedor: string
          proyecto_id: string | null
          updated_at: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          id?: string
          items?: Json | null
          material: string
          monto?: number
          proveedor: string
          proyecto_id?: string | null
          updated_at?: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          id?: string
          items?: Json | null
          material?: string
          monto?: number
          proveedor?: string
          proyecto_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_ordenes_compra_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_planos: {
        Row: {
          archivo_url: string | null
          created_at: string | null
          created_by: string | null
          disciplina: string | null
          estado: string
          fecha_revision: string | null
          id: string
          nombre: string
          observaciones: string | null
          proyecto_id: string
          revisado_por: string | null
          tipo: string
          updated_at: string | null
          version: number
        }
        Insert: {
          archivo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          disciplina?: string | null
          estado?: string
          fecha_revision?: string | null
          id?: string
          nombre: string
          observaciones?: string | null
          proyecto_id: string
          revisado_por?: string | null
          tipo: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          archivo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          disciplina?: string | null
          estado?: string
          fecha_revision?: string | null
          id?: string
          nombre?: string
          observaciones?: string | null
          proyecto_id?: string
          revisado_por?: string | null
          tipo?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "erp_planos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_presupuestos: {
        Row: {
          costo_directo_total: number
          created_by: string | null
          estado: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          notas: string | null
          proyecto_id: string
          renglones: Json
          tipologia: string
          total_calculado: number
          updated_by: string | null
          version_presupuesto: number
        }
        Insert: {
          costo_directo_total?: number
          created_by?: string | null
          estado?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          notas?: string | null
          proyecto_id: string
          renglones?: Json
          tipologia: string
          total_calculado?: number
          updated_by?: string | null
          version_presupuesto?: number
        }
        Update: {
          costo_directo_total?: number
          created_by?: string | null
          estado?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          notas?: string | null
          proyecto_id?: string
          renglones?: Json
          tipologia?: string
          total_calculado?: number
          updated_by?: string | null
          version_presupuesto?: number
        }
        Relationships: []
      }
      erp_proveedores: {
        Row: {
          calificacion: number
          categoria: string | null
          contacto: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          nombre: string
          rubro: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          calificacion?: number
          categoria?: string | null
          contacto?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nombre: string
          rubro?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          calificacion?: number
          categoria?: string | null
          contacto?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nombre?: string
          rubro?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      erp_proyectos: {
        Row: {
          area_construccion: number | null
          arquitecto: string | null
          avance_financiero: number
          avance_fisico: number
          ciudad: string | null
          cliente: string
          cliente_email: string | null
          cliente_nit: string | null
          cliente_telefono: string | null
          codigo_postal: string | null
          created_at: string
          created_by: string | null
          departamento: string | null
          descripcion: string | null
          direccion: string | null
          estado: string
          etapa: string | null
          factor_sobrecosto: Json | null
          fecha_fin: string | null
          fecha_fin_estimada: string | null
          fecha_inicio: string | null
          fecha_inicio_real: string | null
          id: string
          ingeniero_residente: string | null
          lat: number | null
          lng: number | null
          margen_utilidad_objetivo: number | null
          moneda: string | null
          monto_contrato: number
          nombre: string
          num_pisos: number | null
          numero_expediente: string | null
          numero_licencia: string | null
          pais: string | null
          plazo_semanas: number | null
          presupuesto_actual_id: string | null
          presupuesto_total: number
          supervisor: string | null
          tipo_obra: string | null
          tipologia: string
          ubicacion: string
          updated_at: string
        }
        Insert: {
          area_construccion?: number | null
          arquitecto?: string | null
          avance_financiero?: number
          avance_fisico?: number
          ciudad?: string | null
          cliente: string
          cliente_email?: string | null
          cliente_nit?: string | null
          cliente_telefono?: string | null
          codigo_postal?: string | null
          created_at?: string
          created_by?: string | null
          departamento?: string | null
          descripcion?: string | null
          direccion?: string | null
          estado?: string
          etapa?: string | null
          factor_sobrecosto?: Json | null
          fecha_fin?: string | null
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          fecha_inicio_real?: string | null
          id?: string
          ingeniero_residente?: string | null
          lat?: number | null
          lng?: number | null
          margen_utilidad_objetivo?: number | null
          moneda?: string | null
          monto_contrato?: number
          nombre: string
          num_pisos?: number | null
          numero_expediente?: string | null
          numero_licencia?: string | null
          pais?: string | null
          plazo_semanas?: number | null
          presupuesto_actual_id?: string | null
          presupuesto_total?: number
          supervisor?: string | null
          tipo_obra?: string | null
          tipologia: string
          ubicacion: string
          updated_at?: string
        }
        Update: {
          area_construccion?: number | null
          arquitecto?: string | null
          avance_financiero?: number
          avance_fisico?: number
          ciudad?: string | null
          cliente?: string
          cliente_email?: string | null
          cliente_nit?: string | null
          cliente_telefono?: string | null
          codigo_postal?: string | null
          created_at?: string
          created_by?: string | null
          departamento?: string | null
          descripcion?: string | null
          direccion?: string | null
          estado?: string
          etapa?: string | null
          factor_sobrecosto?: Json | null
          fecha_fin?: string | null
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          fecha_inicio_real?: string | null
          id?: string
          ingeniero_residente?: string | null
          lat?: number | null
          lng?: number | null
          margen_utilidad_objetivo?: number | null
          moneda?: string | null
          monto_contrato?: number
          nombre?: string
          num_pisos?: number | null
          numero_expediente?: string | null
          numero_licencia?: string | null
          pais?: string | null
          plazo_semanas?: number | null
          presupuesto_actual_id?: string | null
          presupuesto_total?: number
          supervisor?: string | null
          tipo_obra?: string | null
          tipologia?: string
          ubicacion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_proyectos_presupuesto_actual_id_fkey"
            columns: ["presupuesto_actual_id"]
            isOneToOne: false
            referencedRelation: "erp_presupuestos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_pruebas_laboratorio: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string
          fecha_muestra: string
          fecha_resultado: string | null
          id: string
          observaciones: string | null
          proyecto_id: string
          responsable: string
          resultado: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion: string
          fecha_muestra: string
          fecha_resultado?: string | null
          id?: string
          observaciones?: string | null
          proyecto_id: string
          responsable: string
          resultado?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string
          fecha_muestra?: string
          fecha_resultado?: string | null
          id?: string
          observaciones?: string | null
          proyecto_id?: string
          responsable?: string
          resultado?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_pruebas_laboratorio_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_rendimientos_cuadrilla: {
        Row: {
          actividad: string
          created_at: string | null
          created_by: string | null
          cuadrilla: string
          id: string
          rendimiento_diario: number
          unidad: string
          updated_at: string | null
        }
        Insert: {
          actividad: string
          created_at?: string | null
          created_by?: string | null
          cuadrilla: string
          id?: string
          rendimiento_diario?: number
          unidad: string
          updated_at?: string | null
        }
        Update: {
          actividad?: string
          created_at?: string | null
          created_by?: string | null
          cuadrilla?: string
          id?: string
          rendimiento_diario?: number
          unidad?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      erp_renglones: {
        Row: {
          cantidad: number
          codigo: string
          costo_equipo: number
          costo_mano_obra: number
          costo_materiales: number
          created_at: string
          created_by: string | null
          id: string
          nombre: string
          proyecto_id: string | null
          rendimiento_cuadrilla: number
          tipologia: string
          unidad: string
          updated_at: string
        }
        Insert: {
          cantidad?: number
          codigo: string
          costo_equipo?: number
          costo_mano_obra?: number
          costo_materiales?: number
          created_at?: string
          created_by?: string | null
          id?: string
          nombre: string
          proyecto_id?: string | null
          rendimiento_cuadrilla?: number
          tipologia: string
          unidad: string
          updated_at?: string
        }
        Update: {
          cantidad?: number
          codigo?: string
          costo_equipo?: number
          costo_mano_obra?: number
          costo_materiales?: number
          created_at?: string
          created_by?: string | null
          id?: string
          nombre?: string
          proyecto_id?: string | null
          rendimiento_cuadrilla?: number
          tipologia?: string
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_renglones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_rfis: {
        Row: {
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          destinatario: string
          estado: string | null
          fecha_envio: string | null
          fecha_respuesta_esperada: string | null
          id: string
          numero: string
          prioridad: string | null
          proyecto_id: string
          remitente: string
          respuesta: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          destinatario: string
          estado?: string | null
          fecha_envio?: string | null
          fecha_respuesta_esperada?: string | null
          id?: string
          numero: string
          prioridad?: string | null
          proyecto_id: string
          remitente: string
          respuesta?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          destinatario?: string
          estado?: string | null
          fecha_envio?: string | null
          fecha_respuesta_esperada?: string | null
          id?: string
          numero?: string
          prioridad?: string | null
          proyecto_id?: string
          remitente?: string
          respuesta?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_rfis_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_riesgos: {
        Row: {
          costo_soporte: number | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: string
          fecha_identificacion: string
          id: string
          impacto: number
          nivel: string
          nombre: string
          plan_contingencia: string | null
          plan_mitigacion: string | null
          probabilidad: number
          proyecto_id: string
          responsable: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          costo_soporte?: number | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fecha_identificacion: string
          id?: string
          impacto: number
          nivel: string
          nombre: string
          plan_contingencia?: string | null
          plan_mitigacion?: string | null
          probabilidad: number
          proyecto_id: string
          responsable?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          costo_soporte?: number | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fecha_identificacion?: string
          id?: string
          impacto?: number
          nivel?: string
          nombre?: string
          plan_contingencia?: string | null
          plan_mitigacion?: string | null
          probabilidad?: number
          proyecto_id?: string
          responsable?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_riesgos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_seguimiento: {
        Row: {
          avance_financiero: number
          avance_fisico: number
          costo_planeado: number
          costo_real: number
          created_at: string
          created_by: string | null
          cv: number | null
          fecha: string
          id: string
          proyecto_id: string
          sv: number | null
          updated_at: string
          valor_ganado: number
          valor_planeado: number
        }
        Insert: {
          avance_financiero?: number
          avance_fisico?: number
          costo_planeado?: number
          costo_real?: number
          created_at?: string
          created_by?: string | null
          cv?: number | null
          fecha?: string
          id?: string
          proyecto_id: string
          sv?: number | null
          updated_at?: string
          valor_ganado?: number
          valor_planeado?: number
        }
        Update: {
          avance_financiero?: number
          avance_fisico?: number
          costo_planeado?: number
          costo_real?: number
          created_at?: string
          created_by?: string | null
          cv?: number | null
          fecha?: string
          id?: string
          proyecto_id?: string
          sv?: number | null
          updated_at?: string
          valor_ganado?: number
          valor_planeado?: number
        }
        Relationships: [
          {
            foreignKeyName: "erp_seguimiento_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_sub_renglones: {
        Row: {
          cantidad_unitaria: number
          created_at: string
          created_by: string | null
          id: string
          nombre_material: string
          precio_unitario: number
          renglon_id: string
          total: number | null
          unidad: string
          updated_at: string
        }
        Insert: {
          cantidad_unitaria?: number
          created_at?: string
          created_by?: string | null
          id?: string
          nombre_material: string
          precio_unitario?: number
          renglon_id: string
          total?: number | null
          unidad: string
          updated_at?: string
        }
        Update: {
          cantidad_unitaria?: number
          created_at?: string
          created_by?: string | null
          id?: string
          nombre_material?: string
          precio_unitario?: number
          renglon_id?: string
          total?: number | null
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_sub_renglones_renglon_id_fkey"
            columns: ["renglon_id"]
            isOneToOne: false
            referencedRelation: "erp_renglones"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_submittals: {
        Row: {
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          estado: string | null
          fecha_aprobacion: string | null
          fecha_envio: string | null
          id: string
          numero: string
          proyecto_id: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_envio?: string | null
          id?: string
          numero: string
          proyecto_id: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_aprobacion?: string | null
          fecha_envio?: string | null
          id?: string
          numero?: string
          proyecto_id?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_submittals_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_vales_salida: {
        Row: {
          created_at: string | null
          created_by: string | null
          fecha: string
          id: string
          items: Json
          observaciones: string | null
          proyecto_id: string | null
          renglon_id: string | null
          solicitante: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          fecha?: string
          id?: string
          items?: Json
          observaciones?: string | null
          proyecto_id?: string | null
          renglon_id?: string | null
          solicitante?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          fecha?: string
          id?: string
          items?: Json
          observaciones?: string | null
          proyecto_id?: string | null
          renglon_id?: string | null
          solicitante?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      logs_sistema: {
        Row: {
          accion: string
          created_at: string
          entidad: string
          entidad_id: string | null
          id: string
          ip_address: string | null
          usuario_id: string | null
          usuario_nombre: string
          valores_anteriores: Json | null
          valores_nuevos: Json | null
        }
        Insert: {
          accion: string
          created_at?: string
          entidad: string
          entidad_id?: string | null
          id?: string
          ip_address?: string | null
          usuario_id?: string | null
          usuario_nombre?: string
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Update: {
          accion?: string
          created_at?: string
          entidad?: string
          entidad_id?: string | null
          id?: string
          ip_address?: string | null
          usuario_id?: string | null
          usuario_nombre?: string
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Relationships: []
      }
      pagos_proveedores: {
        Row: {
          concepto: string
          created_at: string
          created_by: string | null
          estado: string
          factura_url: string | null
          fecha_emision: string
          fecha_pago: string | null
          fecha_vencimiento: string
          id: string
          monto: number
          proveedor_id: string
          proyecto_id: string | null
        }
        Insert: {
          concepto: string
          created_at?: string
          created_by?: string | null
          estado?: string
          factura_url?: string | null
          fecha_emision?: string
          fecha_pago?: string | null
          fecha_vencimiento: string
          id?: string
          monto?: number
          proveedor_id: string
          proyecto_id?: string | null
        }
        Update: {
          concepto?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          factura_url?: string | null
          fecha_emision?: string
          fecha_pago?: string | null
          fecha_vencimiento?: string
          id?: string
          monto?: number
          proveedor_id?: string
          proyecto_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nombre: string
          rol: string
          user_metadata: Json | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nombre?: string
          rol?: string
          user_metadata?: Json | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nombre?: string
          rol?: string
          user_metadata?: Json | null
        }
        Relationships: []
      }
      ventas_paquetes: {
        Row: {
          cliente: string | null
          created_at: string
          created_by: string | null
          estado: string
          fecha_reserva: string | null
          fecha_venta: string | null
          id: string
          identificador: string
          notas: string | null
          plan_pago: string | null
          precio_contrato: number
          precio_venta: number
          proyecto_id: string
          tipo: string
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_reserva?: string | null
          fecha_venta?: string | null
          id?: string
          identificador: string
          notas?: string | null
          plan_pago?: string | null
          precio_contrato?: number
          precio_venta?: number
          proyecto_id: string
          tipo: string
        }
        Update: {
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_reserva?: string | null
          fecha_venta?: string | null
          id?: string
          identificador?: string
          notas?: string | null
          plan_pago?: string | null
          precio_contrato?: number
          precio_venta?: number
          proyecto_id?: string
          tipo?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_accessible_proyectos: { Args: never; Returns: string[] }
      get_current_user_role: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      obtener_kpis_dashboard: { Args: never; Returns: Json }
      verificar_rol_usuario: {
        Args: never
        Returns: {
          avatar_url: string
          nombre: string
          rol: string
        }[]
      }
      verificar_sesion_activa: {
        Args: never
        Returns: {
          email: string
          sesion_valida: boolean
          ultimo_acceso: string
          usuario_id: string
        }[]
      }
    }
    Enums: {
      estado_activo: "disponible" | "asignado" | "mantenimiento" | "baja"
      estado_anticipo: "activo" | "amortizado" | "cancelado"
      estado_caja: "pendiente" | "aprobada" | "rechazada"
      estado_cuadro: "abierto" | "cerrado" | "adjudicado"
      estado_licitacion: "activa" | "ganada" | "perdida" | "cancelada"
      estado_orden:
        | "borrador"
        | "pendiente"
        | "aprobado"
        | "rechazado"
        | "recibida"
        | "cancelada"
      estado_pago: "pendiente" | "pagado" | "vencido" | "cancelado"
      estado_presupuesto: "borrador" | "aprobado" | "revisado" | "rechazado"
      estado_proyecto: "planeacion" | "ejecucion" | "pausado" | "finalizado"
      estado_venta: "disponible" | "reservado" | "vendido" | "entregado"
      tipo_activo: "herramienta" | "equipo" | "vehiculo" | "accesorio"
      tipo_caja:
        | "materiales"
        | "herramientas"
        | "transporte"
        | "comidas"
        | "otros"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      estado_activo: ["disponible", "asignado", "mantenimiento", "baja"],
      estado_anticipo: ["activo", "amortizado", "cancelado"],
      estado_caja: ["pendiente", "aprobada", "rechazada"],
      estado_cuadro: ["abierto", "cerrado", "adjudicado"],
      estado_licitacion: ["activa", "ganada", "perdida", "cancelada"],
      estado_orden: [
        "borrador",
        "pendiente",
        "aprobado",
        "rechazado",
        "recibida",
        "cancelada",
      ],
      estado_pago: ["pendiente", "pagado", "vencido", "cancelado"],
      estado_presupuesto: ["borrador", "aprobado", "revisado", "rechazado"],
      estado_proyecto: ["planeacion", "ejecucion", "pausado", "finalizado"],
      estado_venta: ["disponible", "reservado", "vendido", "entregado"],
      tipo_activo: ["herramienta", "equipo", "vehiculo", "accesorio"],
      tipo_caja: [
        "materiales",
        "herramientas",
        "transporte",
        "comidas",
        "otros",
      ],
    },
  },
} as const
A new version of Supabase CLI is available: v2.105.0 (currently installed v2.75.0)
