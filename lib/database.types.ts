export type Database = {
  public: {
    Tables: {
      products: {
        Row: { id: string; product_number: string; name: string; slug: string; subtitle: string; card_line: string | null; micro_description: string | null; description: string; short_description: string; scent_family: string | null; status: "draft" | "coming_soon" | "active" | "sold_out" | "archived"; notes: Record<string, unknown>; notes_verified: boolean; scent_profile: Record<string, unknown>; occasions: string[]; seasons: string[]; suitability: "unisex" | "men" | "women"; suitability_note: string | null; positioning: string | null; reviews_enabled: boolean; image_path: string | null; campaign_image_path: string | null; image_alt_text: string | null; image_display_order: number; featured: boolean; launch_date: string | null; seo_title: string | null; seo_description: string | null; og_image_path: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; product_number: string; name: string; slug: string; subtitle?: string; card_line?: string | null; micro_description?: string | null; description?: string; short_description?: string; scent_family?: string | null; status?: "draft" | "coming_soon" | "active" | "sold_out" | "archived"; scent_profile?: Record<string, unknown>; occasions?: string[]; suitability?: "unisex" | "men" | "women"; suitability_note?: string | null; positioning?: string | null; reviews_enabled?: boolean; image_path?: string | null; campaign_image_path?: string | null; image_alt_text?: string | null; image_display_order?: number; featured?: boolean; seo_title?: string | null; seo_description?: string | null; og_image_path?: string | null; notes_verified?: boolean; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: { id: string; product_id: string; size_ml: number; sku: string; price_paise: number | null; bottle_id:string|null; enabled: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; product_id: string; size_ml: number; sku: string; price_paise?: number | null; bottle_id?:string|null; enabled?: boolean; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      bottles: {
        Row:{id:string;name:string;internal_code:string|null;volume_ml:number;public_label:string|null;short_description:string|null;photo_path:string|null;thumbnail_path:string|null;alt_text:string|null;material:string|null;applicator_type:string|null;colour:string|null;dimensions:string|null;empty_weight_grams:number|null;packaging_box_id:string|null;packaging_cost_paise:number|null;bottle_cost_paise:number|null;available_packaging_quantity:number|null;low_stock_threshold:number|null;status:"active"|"inactive"|"archived";display_order:number;admin_notes:string|null;archived_at:string|null;created_at:string;updated_at:string};
        Insert:{id?:string;name:string;internal_code?:string|null;volume_ml:number;public_label?:string|null;short_description?:string|null;photo_path?:string|null;thumbnail_path?:string|null;alt_text?:string|null;material?:string|null;applicator_type?:string|null;colour?:string|null;dimensions?:string|null;empty_weight_grams?:number|null;packaging_box_id?:string|null;packaging_cost_paise?:number|null;bottle_cost_paise?:number|null;available_packaging_quantity?:number|null;low_stock_threshold?:number|null;status?:"active"|"inactive"|"archived";display_order?:number;admin_notes?:string|null;archived_at?:string|null;updated_at?:string};
        Update:Partial<Database["public"]["Tables"]["bottles"]["Insert"]>;Relationships:[];
      };
      inventory: {
        Row: { variant_id: string; quantity: number; reserved: number; low_stock_threshold: number; updated_at: string };
        Insert: { variant_id: string; quantity?: number; reserved?: number; low_stock_threshold?: number; updated_at?: string };
        Update: { quantity?: number; reserved?: number; low_stock_threshold?: number; updated_at?: string };
        Relationships: [];
      };
      profiles: { Row: { id: string; display_name: string | null; role: "customer" | "admin" | "super_admin"; created_at: string; updated_at: string }; Insert: { id: string; display_name?: string | null; role?: "customer" }; Update: { display_name?: string | null }; Relationships: [] };
      next_drop_votes: { Row: { id: string; campaign_id: string; user_id: string; answers: string[]; created_at: string; updated_at: string }; Insert: { campaign_id: string; user_id: string; answers: string[]; updated_at?: string }; Update: { answers?: string[]; updated_at?: string }; Relationships: [] };
      notification_subscriptions: { Row: { id: string; user_id: string | null; email: string; channel: string; category: string; product_slug: string; consented_at: string; unsubscribed_at: string | null; created_at: string }; Insert: { user_id?: string | null; email: string; channel: "email"; category: string; product_slug?: string; consented_at: string; unsubscribed_at?: string | null }; Update: { unsubscribed_at?: string | null }; Relationships: [] };
      audit_logs: { Row: { id: number; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string }; Insert: { actor_id: string; action: string; entity_type: string; entity_id?: string; metadata?: Record<string, unknown> }; Update: never; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: { is_admin: { Args: Record<string, never>; Returns: boolean }; is_super_admin: { Args: Record<string, never>; Returns: boolean } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
