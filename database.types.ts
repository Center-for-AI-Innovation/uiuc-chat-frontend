export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          is_active: boolean
          key: string
          modified_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          key: string
          modified_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          key?: string
          modified_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          model: string
          name: string
          project_name: string
          prompt: string
          temperature: number
          updated_at: string
          user_email: string | null
        }
        Insert: {
          created_at: string
          folder_id?: string | null
          id: string
          model: string
          name: string
          project_name?: string
          prompt: string
          temperature: number
          updated_at: string
          user_email?: string | null
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          model?: string
          name?: string
          project_name?: string
          prompt?: string
          temperature?: number
          updated_at?: string
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      course_names: {
        Row: {
          course_name: string | null
        }
        Insert: {
          course_name?: string | null
        }
        Update: {
          course_name?: string | null
        }
        Relationships: []
      }
      "cropwizard-papers": {
        Row: {
          created_at: string
          doi: string | null
          id: number
          license: string | null
          metadata: Json | null
          publisher: string | null
        }
        Insert: {
          created_at?: string
          doi?: string | null
          id?: number
          license?: string | null
          metadata?: Json | null
          publisher?: string | null
        }
        Update: {
          created_at?: string
          doi?: string | null
          id?: number
          license?: string | null
          metadata?: Json | null
          publisher?: string | null
        }
        Relationships: []
      }
      depricated_uiuc_chatbot: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      doc_groups: {
        Row: {
          course_name: string
          created_at: string
          doc_count: number | null
          enabled: boolean
          id: number
          name: string
          private: boolean
        }
        Insert: {
          course_name: string
          created_at?: string
          doc_count?: number | null
          enabled?: boolean
          id?: number
          name: string
          private?: boolean
        }
        Update: {
          course_name?: string
          created_at?: string
          doc_count?: number | null
          enabled?: boolean
          id?: number
          name?: string
          private?: boolean
        }
        Relationships: []
      }
      doc_groups_sharing: {
        Row: {
          created_at: string
          destination_project_id: number | null
          destination_project_name: string | null
          doc_group_id: number | null
          doc_group_name: string | null
          id: number
        }
        Insert: {
          created_at?: string
          destination_project_id?: number | null
          destination_project_name?: string | null
          doc_group_id?: number | null
          doc_group_name?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          destination_project_id?: number | null
          destination_project_name?: string | null
          doc_group_id?: number | null
          doc_group_name?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "doc_groups_sharing_destination_project_id_fkey"
            columns: ["destination_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_groups_sharing_destination_project_name_fkey"
            columns: ["destination_project_name"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["course_name"]
          },
          {
            foreignKeyName: "doc_groups_sharing_doc_group_id_fkey"
            columns: ["doc_group_id"]
            isOneToOne: false
            referencedRelation: "doc_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      document_insight: {
        Row: {
          context_id: string | null
          created_at: string
          description: string | null
          document_id: string | null
          id: string
          name: string | null
          section_id: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          context_id?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          name?: string | null
          section_id?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          context_id?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          name?: string | null
          section_id?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_insights_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "llm-guided-contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_insights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "llm-guided-docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_insights_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "llm-guided-sections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_metadata: {
        Row: {
          context_id: string | null
          created_at: string
          description: string | null
          document_id: string | null
          id: string
          name: string | null
          section_id: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          context_id?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          name?: string | null
          section_id?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          context_id?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          name?: string | null
          section_id?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_metadata_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "llm-guided-contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "llm-guided-docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "llm-guided-sections"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          base_url: string | null
          contexts: Json | null
          course_name: string | null
          created_at: string | null
          id: number
          readable_filename: string | null
          s3_path: string | null
          url: string | null
        }
        Insert: {
          base_url?: string | null
          contexts?: Json | null
          course_name?: string | null
          created_at?: string | null
          id?: number
          readable_filename?: string | null
          s3_path?: string | null
          url?: string | null
        }
        Update: {
          base_url?: string | null
          contexts?: Json | null
          course_name?: string | null
          created_at?: string | null
          id?: number
          readable_filename?: string | null
          s3_path?: string | null
          url?: string | null
        }
        Relationships: []
      }
      documents_doc_groups: {
        Row: {
          created_at: string
          doc_group_id: number
          document_id: number
        }
        Insert: {
          created_at?: string
          doc_group_id: number
          document_id?: number
        }
        Update: {
          created_at?: string
          doc_group_id?: number
          document_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_documents_doc_groups_doc_group_id_fkey"
            columns: ["doc_group_id"]
            isOneToOne: false
            referencedRelation: "doc_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_documents_doc_groups_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_failed: {
        Row: {
          base_url: string | null
          contexts: Json | null
          course_name: string | null
          created_at: string
          doc_groups: string | null
          error: string | null
          id: number
          readable_filename: string | null
          s3_path: string | null
          url: string | null
        }
        Insert: {
          base_url?: string | null
          contexts?: Json | null
          course_name?: string | null
          created_at?: string
          doc_groups?: string | null
          error?: string | null
          id?: number
          readable_filename?: string | null
          s3_path?: string | null
          url?: string | null
        }
        Update: {
          base_url?: string | null
          contexts?: Json | null
          course_name?: string | null
          created_at?: string
          doc_groups?: string | null
          error?: string | null
          id?: number
          readable_filename?: string | null
          s3_path?: string | null
          url?: string | null
        }
        Relationships: []
      }
      documents_in_progress: {
        Row: {
          base_url: string | null
          beam_task_id: string | null
          contexts: Json | null
          course_name: string | null
          created_at: string
          doc_groups: string | null
          error: string | null
          id: number
          readable_filename: string | null
          s3_path: string | null
          url: string | null
        }
        Insert: {
          base_url?: string | null
          beam_task_id?: string | null
          contexts?: Json | null
          course_name?: string | null
          created_at?: string
          doc_groups?: string | null
          error?: string | null
          id?: number
          readable_filename?: string | null
          s3_path?: string | null
          url?: string | null
        }
        Update: {
          base_url?: string | null
          beam_task_id?: string | null
          contexts?: Json | null
          course_name?: string | null
          created_at?: string
          doc_groups?: string | null
          error?: string | null
          id?: number
          readable_filename?: string | null
          s3_path?: string | null
          url?: string | null
        }
        Relationships: []
      }
      "email-newsletter": {
        Row: {
          created_at: string
          email: string | null
          id: string
          "unsubscribed-from-newsletter": boolean | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          "unsubscribed-from-newsletter"?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          "unsubscribed-from-newsletter"?: boolean | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string | null
          updated_at: string | null
          user_email: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          type?: string | null
          updated_at?: string | null
          user_email: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string | null
          updated_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
      "llm-convo-monitor": {
        Row: {
          convo: Json | null
          convo_id: string | null
          course_name: string | null
          created_at: string | null
          id: number
          user_email: string | null
        }
        Insert: {
          convo?: Json | null
          convo_id?: string | null
          course_name?: string | null
          created_at?: string | null
          id?: number
          user_email?: string | null
        }
        Update: {
          convo?: Json | null
          convo_id?: string | null
          course_name?: string | null
          created_at?: string | null
          id?: number
          user_email?: string | null
        }
        Relationships: []
      }
      "llm-guided-contexts": {
        Row: {
          created_at: string
          doc_id: string | null
          id: string
          num_tokens: string | null
          section_id: string | null
          stop_reason: string | null
          text: string | null
        }
        Insert: {
          created_at?: string
          doc_id?: string | null
          id?: string
          num_tokens?: string | null
          section_id?: string | null
          stop_reason?: string | null
          text?: string | null
        }
        Update: {
          created_at?: string
          doc_id?: string | null
          id?: string
          num_tokens?: string | null
          section_id?: string | null
          stop_reason?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm-guided-contexts_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "llm-guided-docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm-guided-contexts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "llm-guided-sections"
            referencedColumns: ["id"]
          },
        ]
      }
      "llm-guided-docs": {
        Row: {
          authors: string | null
          created_at: string
          date_published: string | null
          id: string
          minio_path: string | null
          num_tokens: number | null
          outline: string | null
          title: string | null
        }
        Insert: {
          authors?: string | null
          created_at?: string
          date_published?: string | null
          id?: string
          minio_path?: string | null
          num_tokens?: number | null
          outline?: string | null
          title?: string | null
        }
        Update: {
          authors?: string | null
          created_at?: string
          date_published?: string | null
          id?: string
          minio_path?: string | null
          num_tokens?: number | null
          outline?: string | null
          title?: string | null
        }
        Relationships: []
      }
      "llm-guided-sections": {
        Row: {
          created_at: string
          doc_id: string | null
          id: string
          num_tokens: number | null
          section_num: string | null
          section_title: string | null
        }
        Insert: {
          created_at?: string
          doc_id?: string | null
          id?: string
          num_tokens?: number | null
          section_num?: string | null
          section_title?: string | null
        }
        Update: {
          created_at?: string
          doc_id?: string | null
          id?: string
          num_tokens?: number | null
          section_num?: string | null
          section_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm-guided-sections_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "llm-guided-docs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content_image_url: string[] | null
          content_text: string
          contexts: Json | null
          conversation_id: string | null
          created_at: string
          feedback_category: string | null
          feedback_details: string | null
          feedback_is_positive: boolean | null
          final_prompt_engineered_message: string | null
          id: string
          image_description: string | null
          latest_system_message: string | null
          response_time_sec: number | null
          role: string
          tools: Json | null
          updated_at: string | null
        }
        Insert: {
          content_image_url?: string[] | null
          content_text: string
          contexts?: Json | null
          conversation_id?: string | null
          created_at: string
          feedback_category?: string | null
          feedback_details?: string | null
          feedback_is_positive?: boolean | null
          final_prompt_engineered_message?: string | null
          id: string
          image_description?: string | null
          latest_system_message?: string | null
          response_time_sec?: number | null
          role: string
          tools?: Json | null
          updated_at?: string | null
        }
        Update: {
          content_image_url?: string[] | null
          content_text?: string
          contexts?: Json | null
          conversation_id?: string | null
          created_at?: string
          feedback_category?: string | null
          feedback_details?: string | null
          feedback_is_positive?: boolean | null
          final_prompt_engineered_message?: string | null
          id?: string
          image_description?: string | null
          latest_system_message?: string | null
          response_time_sec?: number | null
          role?: string
          tools?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_workflows: {
        Row: {
          is_locked: boolean
          latest_workflow_id: number
        }
        Insert: {
          is_locked: boolean
          latest_workflow_id?: number
        }
        Update: {
          is_locked?: boolean
          latest_workflow_id?: number
        }
        Relationships: []
      }
      nal_publications: {
        Row: {
          created_at: string
          doi: string | null
          doi_number: string | null
          downloadable: boolean
          id: number
          ingested: boolean
          license: string | null
          link: string | null
          metadata: Json | null
          modified_date: string | null
          notes: string | null
          publisher: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          doi?: string | null
          doi_number?: string | null
          downloadable?: boolean
          id?: number
          ingested?: boolean
          license?: string | null
          link?: string | null
          metadata?: Json | null
          modified_date?: string | null
          notes?: string | null
          publisher?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          doi?: string | null
          doi_number?: string | null
          downloadable?: boolean
          id?: number
          ingested?: boolean
          license?: string | null
          link?: string | null
          metadata?: Json | null
          modified_date?: string | null
          notes?: string | null
          publisher?: string | null
          title?: string | null
        }
        Relationships: []
      }
      pre_authorized_api_keys: {
        Row: {
          created_at: string
          emails: Json | null
          id: number
          notes: string | null
          providerBodyNoModels: Json | null
          providerName: Database["public"]["Enums"]["LLMProvider"] | null
        }
        Insert: {
          created_at?: string
          emails?: Json | null
          id?: number
          notes?: string | null
          providerBodyNoModels?: Json | null
          providerName?: Database["public"]["Enums"]["LLMProvider"] | null
        }
        Update: {
          created_at?: string
          emails?: Json | null
          id?: number
          notes?: string | null
          providerBodyNoModels?: Json | null
          providerName?: Database["public"]["Enums"]["LLMProvider"] | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          convo_map_id: string | null
          course_name: string | null
          created_at: string
          description: string | null
          doc_map_id: string | null
          id: number
          last_uploaded_convo_id: number | null
          last_uploaded_doc_id: number | null
          metadata_schema: Json | null
          n8n_api_key: string | null
          subscribed: number | null
        }
        Insert: {
          convo_map_id?: string | null
          course_name?: string | null
          created_at?: string
          description?: string | null
          doc_map_id?: string | null
          id?: number
          last_uploaded_convo_id?: number | null
          last_uploaded_doc_id?: number | null
          metadata_schema?: Json | null
          n8n_api_key?: string | null
          subscribed?: number | null
        }
        Update: {
          convo_map_id?: string | null
          course_name?: string | null
          created_at?: string
          description?: string | null
          doc_map_id?: string | null
          id?: number
          last_uploaded_convo_id?: number | null
          last_uploaded_doc_id?: number | null
          metadata_schema?: Json | null
          n8n_api_key?: string | null
          subscribed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_subscribed_fkey"
            columns: ["subscribed"]
            isOneToOne: false
            referencedRelation: "doc_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          article_title: string | null
          created_at: string
          doi: string | null
          filepath: string | null
          full_text: boolean | null
          id: number
          issn: string | null
          journal_title: string | null
          last_revised: string | null
          license: string | null
          live: boolean | null
          modified_at: string | null
          pmcid: string | null
          pmid: string
          published: string | null
          pubmed_ftp_link: string | null
          release_date: string | null
          xml_filename: string | null
        }
        Insert: {
          article_title?: string | null
          created_at?: string
          doi?: string | null
          filepath?: string | null
          full_text?: boolean | null
          id?: number
          issn?: string | null
          journal_title?: string | null
          last_revised?: string | null
          license?: string | null
          live?: boolean | null
          modified_at?: string | null
          pmcid?: string | null
          pmid: string
          published?: string | null
          pubmed_ftp_link?: string | null
          release_date?: string | null
          xml_filename?: string | null
        }
        Update: {
          article_title?: string | null
          created_at?: string
          doi?: string | null
          filepath?: string | null
          full_text?: boolean | null
          id?: number
          issn?: string | null
          journal_title?: string | null
          last_revised?: string | null
          license?: string | null
          live?: boolean | null
          modified_at?: string | null
          pmcid?: string | null
          pmid?: string
          published?: string | null
          pubmed_ftp_link?: string | null
          release_date?: string | null
          xml_filename?: string | null
        }
        Relationships: []
      }
      "uiuc-course-table": {
        Row: {
          course_name: string | null
          created_at: string
          id: number
          total_completions_price: number | null
          total_embeddings_price: number | null
          total_prompt_price: number | null
          total_queries: number | null
          total_tokens: number | null
        }
        Insert: {
          course_name?: string | null
          created_at?: string
          id?: number
          total_completions_price?: number | null
          total_embeddings_price?: number | null
          total_prompt_price?: number | null
          total_queries?: number | null
          total_tokens?: number | null
        }
        Update: {
          course_name?: string | null
          created_at?: string
          id?: number
          total_completions_price?: number | null
          total_embeddings_price?: number | null
          total_prompt_price?: number | null
          total_queries?: number | null
          total_tokens?: number | null
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          admin_name: string | null
          course_name: string | null
          created_at: string
          id: number
          most_recent_convo: string | null
          owner_name: string | null
          total_convos: number | null
          total_docs: number | null
        }
        Insert: {
          admin_name?: string | null
          course_name?: string | null
          created_at?: string
          id?: number
          most_recent_convo?: string | null
          owner_name?: string | null
          total_convos?: number | null
          total_docs?: number | null
        }
        Update: {
          admin_name?: string | null
          course_name?: string | null
          created_at?: string
          id?: number
          most_recent_convo?: string | null
          owner_name?: string | null
          total_convos?: number | null
          total_docs?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      distinct_course_names: {
        Row: {
          course_name: string | null
        }
        Relationships: []
      }
      hypopg_list_indexes: {
        Row: {
          am_name: unknown | null
          index_name: string | null
          indexrelid: unknown | null
          schema_name: unknown | null
          table_name: unknown | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_document_to_group: {
        Args: {
          p_course_name: string
          p_s3_path: string
          p_url: string
          p_readable_filename: string
          p_doc_groups: string[]
        }
        Returns: boolean
      }
      add_document_to_group_url: {
        Args: {
          p_course_name: string
          p_s3_path: string
          p_url: string
          p_readable_filename: string
          p_doc_groups: string[]
        }
        Returns: boolean
      }
      c: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>
      }
      check_and_lock_flows_v2: {
        Args: {
          id: number
        }
        Returns: string
      }
      cn: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_course_names: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_distinct_course_names: {
        Args: Record<PropertyKey, never>
        Returns: {
          course_name: string
        }[]
      }
      get_latest_workflow_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hello: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      hypopg: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      hypopg_create_index: {
        Args: {
          sql_order: string
        }
        Returns: Record<string, unknown>[]
      }
      hypopg_drop_index: {
        Args: {
          indexid: unknown
        }
        Returns: boolean
      }
      hypopg_get_indexdef: {
        Args: {
          indexid: unknown
        }
        Returns: string
      }
      hypopg_relation_size: {
        Args: {
          indexid: unknown
        }
        Returns: number
      }
      hypopg_reset: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      hypopg_reset_index: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment: {
        Args: {
          usage: number
          apikey: string
        }
        Returns: undefined
      }
      increment_api_usage: {
        Args: {
          usage: number
          apikey: string
        }
        Returns: undefined
      }
      increment_api_usage_count: {
        Args: {
          usage: number
          apikey: string
        }
        Returns: undefined
      }
      index_advisor: {
        Args: {
          query: string
        }
        Returns: {
          startup_cost_before: Json
          startup_cost_after: Json
          total_cost_before: Json
          total_cost_after: Json
          index_statements: string[]
        }[]
      }
      myfunc: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_document_from_group: {
        Args: {
          p_course_name: string
          p_s3_path: string
          p_url: string
          p_doc_group: string
        }
        Returns: undefined
      }
      search_conversations: {
        Args: {
          p_user_email: string
          p_project_name: string
          p_search_term?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      test_function: {
        Args: {
          id: number
        }
        Returns: string
      }
    }
    Enums: {
      LLMProvider:
        | "Azure"
        | "OpenAI"
        | "Anthropic"
        | "Ollama"
        | "NCSAHosted"
        | "WebLLM"
        | "null"
    }
    CompositeTypes: {
      index_advisor_output: {
        index_statements: string[] | null
        startup_cost_before: Json | null
        startup_cost_after: Json | null
        total_cost_before: Json | null
        total_cost_after: Json | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
