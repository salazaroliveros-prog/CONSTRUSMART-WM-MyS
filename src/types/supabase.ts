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
        Relationships: [
          {
            foreignKeyName: "activos_herramientas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "anticipos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "cajas_chicas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "centros_costo_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "cotizaciones_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "erp_proveedores"
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
        Relationships: [
          {
            foreignKeyName: "cuadro_comparativo_proveedores_adjudicado_a_fkey"
            columns: ["adjudicado_a"]
            isOneToOne: false
            referencedRelation: "erp_proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuadro_comparativo_proveedores_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "destajos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
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
      erp_empleados: {
        Row: {
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
          fecha: string
          id: string
          proyecto_id: string | null
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
          fecha?: string
          id?: string
          proyecto_id?: string | null
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
          fecha?: string
          id?: string
          proyecto_id?: string | null
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
      erp_ordenes_compra: {
        Row: {
          cantidad: number
          created_at: string
          created_by: string | null
          estado: string
          fecha: string
          id: string
          material: string
          monto: number
          proveedor: string
          updated_at: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          id?: string
          material: string
          monto?: number
          proveedor: string
          updated_at?: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          id?: string
          material?: string
          monto?: number
          proveedor?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "erp_presupuestos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_proveedores: {
        Row: {
          calificacion: number
          contacto: string | null
          created_at: string
          created_by: string | null
          id: string
          nombre: string
          rubro: string | null
          updated_at: string
        }
        Insert: {
          calificacion?: number
          contacto?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nombre: string
          rubro?: string | null
          updated_at?: string
        }
        Update: {
          calificacion?: number
          contacto?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nombre?: string
          rubro?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      erp_proyectos: {
        Row: {
          avance_financiero: number
          avance_fisico: number
          cliente: string
          created_at: string
          created_by: string | null
          estado: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          lat: number | null
          lng: number | null
          monto_contrato: number
          nombre: string
          presupuesto_actual_id: string | null
          presupuesto_total: number
          tipologia: string
          ubicacion: string
          updated_at: string
        }
        Insert: {
          avance_financiero?: number
          avance_fisico?: number
          cliente: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          monto_contrato?: number
          nombre: string
          presupuesto_actual_id?: string | null
          presupuesto_total?: number
          tipologia: string
          ubicacion: string
          updated_at?: string
        }
        Update: {
          avance_financiero?: number
          avance_fisico?: number
          cliente?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          monto_contrato?: number
          nombre?: string
          presupuesto_actual_id?: string | null
          presupuesto_total?: number
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
      erp_rendimientos_cuadrilla: {
        Row: {
          actividad: string
          cuadrilla: string
          id: string
          rendimiento_diario: number
          unidad: string
        }
        Insert: {
          actividad: string
          cuadrilla: string
          id?: string
          rendimiento_diario?: number
          unidad: string
        }
        Update: {
          actividad?: string
          cuadrilla?: string
          id?: string
          rendimiento_diario?: number
          unidad?: string
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
        Relationships: [
          {
            foreignKeyName: "pagos_proveedores_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "erp_proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_proveedores_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nombre: string
          rol: string
          user_metadata: Json | null
        }
        Insert: {
          created_at?: string
          id: string
          nombre?: string
          rol?: string
          user_metadata?: Json | null
        }
        Update: {
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
        Relationships: [
          {
            foreignKeyName: "ventas_paquetes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "erp_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
