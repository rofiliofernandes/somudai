// Database types for Somudai.
//
// Hand-written to match migrations 0001-0004, in the same shape that
// `npx supabase gen types typescript --project-id <dev-project-id>` produces.
// Once the migrations are pushed to somudai-dev, regenerate this file with that
// command and commit the result; it should be a no-op or close to one.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      matters: {
        Row: { id: number; slug: string; name: string; image_path: string | null };
        Insert: { id?: never; slug: string; name: string; image_path?: string | null };
        Update: { id?: never; slug?: string; name?: string; image_path?: string | null };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          bio: string | null;
          area: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          bio?: string | null;
          area?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          bio?: string | null;
          area?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profile_matters: {
        Row: { profile_id: string; matter_id: number };
        Insert: { profile_id: string; matter_id: number };
        Update: { profile_id?: string; matter_id?: number };
        Relationships: [
          {
            foreignKeyName: 'profile_matters_matter_id_fkey';
            columns: ['matter_id'];
            isOneToOne: false;
            referencedRelation: 'matters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profile_matters_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      posts: {
        Row: {
          id: string;
          matter_id: number;
          type: Database['public']['Enums']['post_type'];
          title: string;
          summary: string;
          description: string | null;
          area: string | null;
          place: string | null;
          starts_at: string | null;
          organiser_name: string;
          image_path: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          matter_id: number;
          type: Database['public']['Enums']['post_type'];
          title: string;
          summary: string;
          description?: string | null;
          area?: string | null;
          place?: string | null;
          starts_at?: string | null;
          organiser_name: string;
          image_path?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'posts_matter_id_fkey';
            columns: ['matter_id'];
            isOneToOne: false;
            referencedRelation: 'matters';
            referencedColumns: ['id'];
          },
        ];
      };
      taps: {
        Row: { user_id: string; post_id: string; created_at: string };
        Insert: { user_id: string; post_id: string; created_at?: string };
        Update: { user_id?: string; post_id?: string; created_at?: string };
        Relationships: [
          {
            foreignKeyName: 'taps_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taps_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      post_counts: {
        Row: { post_id: string | null; tap_count: number | null };
        Relationships: [];
      };
    };
    Functions: {
      get_posts: {
        Args: { p_matter?: number; p_post?: string; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          matter_id: number;
          matter_name: string;
          type: Database['public']['Enums']['post_type'];
          title: string;
          summary: string;
          description: string | null;
          area: string | null;
          place: string | null;
          starts_at: string | null;
          organiser_name: string;
          image_path: string | null;
          tap_count: number;
          tapped: boolean;
        }[];
      };
      tap_post: { Args: { p_post: string }; Returns: undefined };
      untap_post: { Args: { p_post: string }; Returns: undefined };
    };
    Enums: {
      post_type: 'action' | 'stance';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type PostType = PublicSchema['Enums']['post_type'];

/** One row from get_posts(): everything a card or the detail screen needs. */
export type FeedPost = PublicSchema['Functions']['get_posts']['Returns'][number];
export type Matter = Tables<'matters'>;
export type Profile = Tables<'profiles'>;
