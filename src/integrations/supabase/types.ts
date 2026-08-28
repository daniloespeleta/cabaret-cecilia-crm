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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      artistas: {
        Row: {
          ativo: boolean
          contato: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          id: string
          instagram: string | null
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          contato?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          instagram?: string | null
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          contato?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          instagram?: string | null
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      auditoria: {
        Row: {
          acao: string
          ator_id: string | null
          created_at: string
          detalhes: Json
          entidade: string
          entidade_id: string | null
          id: string
        }
        Insert: {
          acao: string
          ator_id?: string | null
          created_at?: string
          detalhes?: Json
          entidade: string
          entidade_id?: string | null
          id?: string
        }
        Update: {
          acao?: string
          ator_id?: string | null
          created_at?: string
          detalhes?: Json
          entidade?: string
          entidade_id?: string | null
          id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string
          criado_por: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          preferencias: string | null
          tags: string[] | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          preferencias?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          preferencias?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      comandas: {
        Row: {
          cliente_id: string | null
          created_at: string
          criado_por: string | null
          evento_id: string | null
          id: string
          mesa: string | null
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          evento_id?: string | null
          id?: string
          mesa?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          evento_id?: string | null
          id?: string
          mesa?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "comandas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          aceito_em: string | null
          aceito_por: string | null
          convidado_por: string | null
          created_at: string
          email: string
          envios: number
          expira_em: string
          id: string
          roles: Database["public"]["Enums"]["app_role"][]
          status: string
          token: string
          ultimo_envio_em: string | null
          updated_at: string
        }
        Insert: {
          aceito_em?: string | null
          aceito_por?: string | null
          convidado_por?: string | null
          created_at?: string
          email: string
          envios?: number
          expira_em?: string
          id?: string
          roles?: Database["public"]["Enums"]["app_role"][]
          status?: string
          token?: string
          ultimo_envio_em?: string | null
          updated_at?: string
        }
        Update: {
          aceito_em?: string | null
          aceito_por?: string | null
          convidado_por?: string | null
          created_at?: string
          email?: string
          envios?: number
          expira_em?: string
          id?: string
          roles?: Database["public"]["Enums"]["app_role"][]
          status?: string
          token?: string
          ultimo_envio_em?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          assunto: string
          chave: string
          corpo: string
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          assunto: string
          chave: string
          corpo: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          assunto?: string
          chave?: string
          corpo?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      evento_artistas: {
        Row: {
          artista_id: string
          cache: number
          created_at: string
          evento_id: string
          horario: string | null
          id: string
          ordem: number
        }
        Insert: {
          artista_id: string
          cache?: number
          created_at?: string
          evento_id: string
          horario?: string | null
          id?: string
          ordem?: number
        }
        Update: {
          artista_id?: string
          cache?: number
          created_at?: string
          evento_id?: string
          horario?: string | null
          id?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_artistas_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "artistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_artistas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          artista: string | null
          capacidade: number | null
          created_at: string
          criado_por: string | null
          data_hora: string
          id: string
          local: string | null
          nome: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          artista?: string | null
          capacidade?: number | null
          created_at?: string
          criado_por?: string | null
          data_hora: string
          id?: string
          local?: string | null
          nome: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          artista?: string | null
          capacidade?: number | null
          created_at?: string
          criado_por?: string | null
          data_hora?: string
          id?: string
          local?: string | null
          nome?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      guest_list: {
        Row: {
          created_at: string
          criado_por: string | null
          evento_id: string
          id: string
          nome: string
          promoter_id: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          evento_id: string
          id?: string
          nome: string
          promoter_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          evento_id?: string
          id?: string
          nome?: string
          promoter_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_list_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_list_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      ingressos: {
        Row: {
          created_at: string
          criado_por: string | null
          evento_id: string
          id: string
          preco: number
          quantidade: number
          tipo: string
          updated_at: string
          vendidos: number
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          evento_id: string
          id?: string
          preco?: number
          quantidade?: number
          tipo?: string
          updated_at?: string
          vendidos?: number
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          evento_id?: string
          id?: string
          preco?: number
          quantidade?: number
          tipo?: string
          updated_at?: string
          vendidos?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingressos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_comanda: {
        Row: {
          comanda_id: string
          created_at: string
          descricao: string
          id: string
          quantidade: number
          valor_unitario: number
        }
        Insert: {
          comanda_id: string
          created_at?: string
          descricao: string
          id?: string
          quantidade?: number
          valor_unitario?: number
        }
        Update: {
          comanda_id?: string
          created_at?: string
          descricao?: string
          id?: string
          quantidade?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_comanda_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          taxa_comissao: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          taxa_comissao?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          taxa_comissao?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "promoter" | "staff"
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
  public: {
    Enums: {
      app_role: ["admin", "promoter", "staff"],
    },
  },
} as const
