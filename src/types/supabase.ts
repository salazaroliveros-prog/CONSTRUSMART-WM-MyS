export type Json = | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
            foreignKeyName: "erp_bitacora_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "erp_empleados_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "erp_eventos_calendario_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "erp_insumos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_insumos_renglon_id_fkey"
            columns: ["renglon_id"]
            isOneToOne: false
            referencedRelation: "erp_renglones"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_materiales: {
        Row: {
          critico: boolean
          created_at: string
          created_by: string | null
          id: string
          nombre: string
          precio: number
          stock: number
          stock_minimo: number
          unidad: string
          updated_at: string
        }
        Insert: {
          critico?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nombre: string
          precio?: number
          stock?: number
          stock_minimo?: number
          unidad: string
          updated_at?: string
        }
        Update: {
          critico?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nombre?: string
          precio?: number
          stock?: number
          stock_minimo?: number
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_materiales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "erp_movimientos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
        Relationships: [
          {
            foreignKeyName: "erp_ordenes_compra_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          presupuesto_total?: number
          tipologia?: string
          ubicacion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_proyectos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
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
        Relationships: [
          {
            foreignKeyName: "erp_proveedores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "erp_renglones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          fecha?: string
          id?: string
          proyecto_id: string
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
          fecha?: string
          id?: string
          proyecto_id?: string
          updated_at?: string
          valor_ganado?: number
          valor_planeado?: number
        }
        Relationships: [
          {
            foreignKeyName: "erp_seguimiento_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "erp_sub_renglones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_sub_renglones_renglon_id_fkey"
            columns: ["renglon_id"]
            isOneToOne: false
            referencedRelation: "erp_renglones"
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_set_updated_at: {
        Args: Record<string, never>
        Returns: Record<string, unknown>
      }
      handle_new_user: {
        Args: Record<string, never>
        Returns: Record<string, unknown>
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database; table: keyof Database["Tables"][Extract<keyof Database, "public">]["Tables"] }
> = PublicTableNameOrOptions extends { table: infer T }
  ? PublicSchema["Tables"][Extract<T, keyof PublicSchema["Tables"]>]
  : PublicSchema["Tables"][Extract<PublicTableNameOrOptions, keyof PublicSchema["Tables"]>];

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database; table: keyof PublicSchema["Tables"][Extract<keyof Database, "public">]["Tables"] }
> = PublicTableNameOrOptions extends { table: infer T }
  ? PublicSchema["Tables"][Extract<T, keyof PublicSchema["Tables"]>]["Insert"]
  : PublicSchema["Tables"][Extract<PublicTableNameOrOptions, keyof PublicSchema["Tables"]>]["Insert"];

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database; table: keyof PublicSchema["Tables"][Extract<keyof Database, "public">]["Tables"] }
> = PublicTableNameOrOptions extends { table: infer T }
  ? PublicSchema["Tables"][Extract<T, keyof PublicSchema["Tables"]>]["Update"]
  : PublicSchema["Tables"][Extract<PublicTableNameOrOptions, keyof PublicSchema["Tables"]>]["Update"];

export type Enums<
  Definition extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database; enum: keyof PublicSchema["Enums"] }
> = Definition extends { enum: infer T }
  ? PublicSchema["Enums"][Extract<T, keyof PublicSchema["Enums"]>]
  : PublicSchema["Enums"][Extract<Definition, keyof PublicSchema["Enums"]>];