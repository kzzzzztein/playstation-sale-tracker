/**
 * Hand-written mirror of the Postgres schema (supabase/migrations/0001_init.sql)
 * for use with supabase-js's generic client. In a real deployment this would
 * be regenerated with `supabase gen types typescript` and this file replaced.
 */
export interface Database {
  public: {
    Tables: {
      regions: {
        Row: {
          id: string;
          code: string;
          name: string;
          currency: string;
          currency_symbol: string;
          flag_emoji: string;
          store_locale: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["regions"]["Row"]> & { code: string; name: string; currency: string; currency_symbol: string };
        Update: Partial<Database["public"]["Tables"]["regions"]["Row"]>;
      };
      games: {
        Row: {
          id: string;
          title: string;
          slug: string;
          platform: string;
          cover_image: string | null;
          store_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["games"]["Row"]> & { title: string; slug: string; platform: string };
        Update: Partial<Database["public"]["Tables"]["games"]["Row"]>;
      };
      game_prices: {
        Row: {
          id: string;
          game_id: string;
          region_id: string;
          original_price: number;
          sale_price: number | null;
          discount_percentage: number;
          currency: string;
          sale_start: string | null;
          sale_end: string | null;
          is_on_sale: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["game_prices"]["Row"]> & {
          game_id: string;
          region_id: string;
          original_price: number;
          currency: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_prices"]["Row"]>;
      };
      price_history: {
        Row: {
          id: string;
          game_id: string;
          region_id: string;
          price: number;
          currency: string;
          recorded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["price_history"]["Row"]> & {
          game_id: string;
          region_id: string;
          price: number;
          currency: string;
        };
        Update: Partial<Database["public"]["Tables"]["price_history"]["Row"]>;
      };
      exchange_rates: {
        Row: {
          id: string;
          currency: string;
          php_rate: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exchange_rates"]["Row"]> & { currency: string; php_rate: number };
        Update: Partial<Database["public"]["Tables"]["exchange_rates"]["Row"]>;
      };
      update_runs: {
        Row: {
          id: string;
          region_code: string;
          started_at: string;
          finished_at: string | null;
          success: boolean | null;
          games_processed: number;
          prices_changed: number;
          history_records_inserted: number;
          error: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["update_runs"]["Row"]> & { region_code: string; started_at: string };
        Update: Partial<Database["public"]["Tables"]["update_runs"]["Row"]>;
      };
    };
  };
}
