
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "bookings": {
                  Row: {
                    "booked_by": string,"created_at": string,"currency": string,"id": string,"payment_external_id": string | null,"payment_provider": string | null,"payment_status": Database["public"]['Enums']["payment_status"] | null,"platform_fee": number,"slot_id": string,"status": Database["public"]['Enums']["booking_status"],"total_amount": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "booked_by": string,"created_at"?: string,"currency"?: string,"id"?: string,"payment_external_id"?: string | null,"payment_provider"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"] | null,"platform_fee"?: number,"slot_id": string,"status"?: Database["public"]['Enums']["booking_status"],"total_amount": number,"updated_at"?: string
                  }
                  Update: {
                    "booked_by"?: string,"created_at"?: string,"currency"?: string,"id"?: string,"payment_external_id"?: string | null,"payment_provider"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"] | null,"platform_fee"?: number,"slot_id"?: string,"status"?: Database["public"]['Enums']["booking_status"],"total_amount"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_booked_by_fkey"
      columns: ["booked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_slot_id_fkey"
      columns: ["slot_id"]
isOneToOne: false
      referencedRelation: "court_slots"
      referencedColumns: ["id"]
    }
                  ]
                },"cities": {
                  Row: {
                    "active": boolean,"country_code": string,"created_at": string,"id": string,"name": string,"province": string,"slug": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"country_code"?: string,"created_at"?: string,"id"?: string,"name": string,"province": string,"slug": string,"timezone"?: string
                  }
                  Update: {
                    "active"?: boolean,"country_code"?: string,"created_at"?: string,"id"?: string,"name"?: string,"province"?: string,"slug"?: string,"timezone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"club_members": {
                  Row: {
                    "club_id": string,"created_at": string,"profile_id": string,"role": Database["public"]['Enums']["club_member_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "club_id": string,"created_at"?: string,"profile_id": string,"role"?: Database["public"]['Enums']["club_member_role"]
                  }
                  Update: {
                    "club_id"?: string,"created_at"?: string,"profile_id"?: string,"role"?: Database["public"]['Enums']["club_member_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_members_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"club_payment_accounts": {
                  Row: {
                    "club_id": string,"connected_at": string | null,"created_at": string,"external_account_id": string | null,"id": string,"provider": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "club_id": string,"connected_at"?: string | null,"created_at"?: string,"external_account_id"?: string | null,"id"?: string,"provider": string,"status"?: string
                  }
                  Update: {
                    "club_id"?: string,"connected_at"?: string | null,"created_at"?: string,"external_account_id"?: string | null,"id"?: string,"provider"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_payment_accounts_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"clubs": {
                  Row: {
                    "active": boolean,"city_id": string,"created_at": string,"description": string | null,"id": string,"name": string,"phone": string | null,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"city_id": string,"created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"phone"?: string | null,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"city_id"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"phone"?: string | null,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "clubs_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                },"court_slots": {
                  Row: {
                    "court_id": string,"created_at": string,"currency": string,"ends_at": string,"id": string,"price": number,"starts_at": string,"status": Database["public"]['Enums']["slot_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "court_id": string,"created_at"?: string,"currency"?: string,"ends_at": string,"id"?: string,"price": number,"starts_at": string,"status"?: Database["public"]['Enums']["slot_status"]
                  }
                  Update: {
                    "court_id"?: string,"created_at"?: string,"currency"?: string,"ends_at"?: string,"id"?: string,"price"?: number,"starts_at"?: string,"status"?: Database["public"]['Enums']["slot_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "court_slots_court_id_fkey"
      columns: ["court_id"]
isOneToOne: false
      referencedRelation: "courts"
      referencedColumns: ["id"]
    }
                  ]
                },"courts": {
                  Row: {
                    "active": boolean,"created_at": string,"features": NonNullable<Json>,"has_lighting": boolean,"id": string,"is_indoor": boolean,"name": string,"sport_id": string,"surface": string | null,"venue_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"features"?: NonNullable<Json>,"has_lighting"?: boolean,"id"?: string,"is_indoor"?: boolean,"name": string,"sport_id": string,"surface"?: string | null,"venue_id": string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"features"?: NonNullable<Json>,"has_lighting"?: boolean,"id"?: string,"is_indoor"?: boolean,"name"?: string,"sport_id"?: string,"surface"?: string | null,"venue_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "courts_sport_id_fkey"
      columns: ["sport_id"]
isOneToOne: false
      referencedRelation: "sports"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "courts_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "created_at": string,"id": number,"match_id": string | null,"name": string,"profile_id": string | null,"properties": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"match_id"?: string | null,"name": string,"profile_id"?: string | null,"properties"?: NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"match_id"?: string | null,"name"?: string,"profile_id"?: string | null,"properties"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"match_participants": {
                  Row: {
                    "confirmed_at": string | null,"created_at": string,"id": string,"match_id": string,"out_of_level": boolean,"profile_id": string,"status": Database["public"]['Enums']["participant_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmed_at"?: string | null,"created_at"?: string,"id"?: string,"match_id": string,"out_of_level"?: boolean,"profile_id": string,"status": Database["public"]['Enums']["participant_status"],"updated_at"?: string
                  }
                  Update: {
                    "confirmed_at"?: string | null,"created_at"?: string,"id"?: string,"match_id"?: string,"out_of_level"?: boolean,"profile_id"?: string,"status"?: Database["public"]['Enums']["participant_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "match_participants_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "match_participants_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"matches": {
                  Row: {
                    "acceptance_mode": Database["public"]['Enums']["acceptance_mode"],"age_max": number | null,"age_min": number | null,"booking_id": string | null,"cancelled_at": string | null,"city_id": string,"created_at": string,"description": string | null,"featured_until": string | null,"filled_at": string | null,"id": string,"level_max": number | null,"level_min": number | null,"organizer_id": string,"price_per_person": number,"sport_id": string,"spots_left": number,"spots_needed": number,"starts_at": string,"status": Database["public"]['Enums']["match_status"],"total_players": number,"updated_at": string,"venue_address": string,"venue_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acceptance_mode"?: Database["public"]['Enums']["acceptance_mode"],"age_max"?: number | null,"age_min"?: number | null,"booking_id"?: string | null,"cancelled_at"?: string | null,"city_id": string,"created_at"?: string,"description"?: string | null,"featured_until"?: string | null,"filled_at"?: string | null,"id"?: string,"level_max"?: number | null,"level_min"?: number | null,"organizer_id"?: string,"price_per_person"?: number,"sport_id": string,"spots_left"?: number,"spots_needed": number,"starts_at": string,"status"?: Database["public"]['Enums']["match_status"],"total_players": number,"updated_at"?: string,"venue_address": string,"venue_name": string
                  }
                  Update: {
                    "acceptance_mode"?: Database["public"]['Enums']["acceptance_mode"],"age_max"?: number | null,"age_min"?: number | null,"booking_id"?: string | null,"cancelled_at"?: string | null,"city_id"?: string,"created_at"?: string,"description"?: string | null,"featured_until"?: string | null,"filled_at"?: string | null,"id"?: string,"level_max"?: number | null,"level_min"?: number | null,"organizer_id"?: string,"price_per_person"?: number,"sport_id"?: string,"spots_left"?: number,"spots_needed"?: number,"starts_at"?: string,"status"?: Database["public"]['Enums']["match_status"],"total_players"?: number,"updated_at"?: string,"venue_address"?: string,"venue_name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "matches_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "matches_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "matches_organizer_id_fkey"
      columns: ["organizer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "matches_sport_id_fkey"
      columns: ["sport_id"]
isOneToOne: false
      referencedRelation: "sports"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "matches_sport_id_level_max_fkey"
      columns: ["sport_id","level_max"]
isOneToOne: false
      referencedRelation: "sport_levels"
      referencedColumns: ["sport_id","rank"]
    },{
      foreignKeyName: "matches_sport_id_level_min_fkey"
      columns: ["sport_id","level_min"]
isOneToOne: false
      referencedRelation: "sport_levels"
      referencedColumns: ["sport_id","rank"]
    }
                  ]
                },"player_sports": {
                  Row: {
                    "created_at": string,"level_rank": number,"profile_id": string,"sport_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"level_rank": number,"profile_id": string,"sport_id": string
                  }
                  Update: {
                    "created_at"?: string,"level_rank"?: number,"profile_id"?: string,"sport_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "player_sports_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "player_sports_sport_id_fkey"
      columns: ["sport_id"]
isOneToOne: false
      referencedRelation: "sports"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "player_sports_sport_id_level_rank_fkey"
      columns: ["sport_id","level_rank"]
isOneToOne: false
      referencedRelation: "sport_levels"
      referencedColumns: ["sport_id","rank"]
    }
                  ]
                },"profile_private": {
                  Row: {
                    "birth_date": string | null,"profile_id": string,"updated_at": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "birth_date"?: string | null,"profile_id": string,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Update: {
                    "birth_date"?: string | null,"profile_id"?: string,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_private_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"city_id": string | null,"created_at": string,"full_name": string,"id": string,"membership_tier": string | null,"role": Database["public"]['Enums']["app_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"city_id"?: string | null,"created_at"?: string,"full_name"?: string,"id": string,"membership_tier"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"city_id"?: string | null,"created_at"?: string,"full_name"?: string,"id"?: string,"membership_tier"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                },"sport_levels": {
                  Row: {
                    "description": string,"id": string,"name": string,"rank": number,"sport_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "description": string,"id"?: string,"name": string,"rank": number,"sport_id": string
                  }
                  Update: {
                    "description"?: string,"id"?: string,"name"?: string,"rank"?: number,"sport_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sport_levels_sport_id_fkey"
      columns: ["sport_id"]
isOneToOne: false
      referencedRelation: "sports"
      referencedColumns: ["id"]
    }
                  ]
                },"sports": {
                  Row: {
                    "active": boolean,"created_at": string,"icon": string,"id": string,"name": string,"slug": string,"sort_order": number,"typical_players": number
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"icon": string,"id"?: string,"name": string,"slug": string,"sort_order"?: number,"typical_players": number
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"icon"?: string,"id"?: string,"name"?: string,"slug"?: string,"sort_order"?: number,"typical_players"?: number
                  }
                  Relationships: [
                    
                  ]
                },"venues": {
                  Row: {
                    "active": boolean,"address": string,"city_id": string,"club_id": string,"created_at": string,"id": string,"latitude": number | null,"longitude": number | null,"name": string,"phone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"address": string,"city_id": string,"club_id": string,"created_at"?: string,"id"?: string,"latitude"?: number | null,"longitude"?: number | null,"name": string,"phone"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"address"?: string,"city_id"?: string,"club_id"?: string,"created_at"?: string,"id"?: string,"latitude"?: number | null,"longitude"?: number | null,"name"?: string,"phone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "venues_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "venues_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "metrics_events_daily": {
                  Row: {
                    "day": string | null,"name": string | null,"total": number | null,"unique_users": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"metrics_matches_daily": {
                  Row: {
                    "avg_minutes_to_fill": number | null,"cancelled": number | null,"city": string | null,"day": string | null,"filled": number | null,"median_minutes_to_fill": number | null,"published": number | null,"sport": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "age_years":
{ Args: { "p_birth_date": string }; Returns: number
                           },
"can_view_match":
{ Args: { "p_match_id": string }; Returns: boolean
                           },
"court_club_id":
{ Args: { "p_court_id": string }; Returns: string
                           },
"finish_past_matches":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"get_match_contacts":
{ Args: { "p_match_id": string }; Returns: {
              "full_name": string,"is_organizer": boolean,"profile_id": string,"whatsapp": string
            }[]
                           },
"get_match_participants":
{ Args: { "p_match_id": string }; Returns: {
              "age": number,"avatar_url": string,"created_at": string,"full_name": string,"level_name": string,"level_rank": number,"out_of_level": boolean,"participant_id": string,"profile_id": string,"status": Database["public"]['Enums']["participant_status"]
            }[]
                           },
"is_club_member":
{ Args: { "p_club_id": string,"p_owner_only"?: boolean }; Returns: boolean
                           },
"is_match_organizer":
{ Args: { "p_match_id": string }; Returns: boolean
                           },
"is_match_participant":
{ Args: { "p_confirmed_only"?: boolean,"p_match_id": string }; Returns: boolean
                           },
"is_platform_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"join_match":
{ Args: { "p_match_id": string }; Returns: Database["public"]['Enums']["participant_status"]
                           },
"leave_match":
{ Args: { "p_match_id": string }; Returns: undefined
                           },
"lock_participant_for_organizer":
{ Args: { "p_participant_id": string }; Returns: {
              "confirmed_at": string | null,
"created_at": string,
"id": string,
"match_id": string,
"out_of_level": boolean,
"profile_id": string,
"status": Database["public"]['Enums']["participant_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "match_participants"
        isOneToOne: true
        isSetofReturn: false
      } },
"log_event":
{ Args: { "p_match_id": string,"p_name": string,"p_profile_id": string,"p_properties"?: Json }; Returns: undefined
                           },
"profile_age":
{ Args: { "p_profile_id": string }; Returns: number
                           },
"profile_is_complete":
{ Args: { "p_profile_id": string }; Returns: boolean
                           },
"refresh_match_spots":
{ Args: { "p_match_id": string }; Returns: undefined
                           },
"remove_participant":
{ Args: { "p_participant_id": string }; Returns: undefined
                           },
"respond_to_request":
{ Args: { "p_accept": boolean,"p_participant_id": string }; Returns: Database["public"]['Enums']["participant_status"]
                           },
"search_matches":
{ Args: { "p_age_max"?: number,"p_age_min"?: number,"p_city_id"?: string,"p_for_me"?: boolean,"p_from"?: string,"p_level_max"?: number,"p_level_min"?: number,"p_limit"?: number,"p_offset"?: number,"p_sport_ids"?: (string)[],"p_to"?: string }; Returns: {
              "acceptance_mode": Database["public"]['Enums']["acceptance_mode"],
"age_max": number | null,
"age_min": number | null,
"booking_id": string | null,
"cancelled_at": string | null,
"city_id": string,
"created_at": string,
"description": string | null,
"featured_until": string | null,
"filled_at": string | null,
"id": string,
"level_max": number | null,
"level_min": number | null,
"organizer_id": string,
"price_per_person": number,
"sport_id": string,
"spots_left": number,
"spots_needed": number,
"starts_at": string,
"status": Database["public"]['Enums']["match_status"],
"total_players": number,
"updated_at": string,
"venue_address": string,
"venue_name": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "matches"
        isOneToOne: false
        isSetofReturn: true
      } },
"set_match_status":
{ Args: { "p_match_id": string,"p_status": Database["public"]['Enums']["match_status"] }; Returns: Database["public"]['Enums']["match_status"]
                           },
"slot_club_id":
{ Args: { "p_slot_id": string }; Returns: string
                           },
"today_ar":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"track_event":
{ Args: { "p_match_id"?: string,"p_name": string,"p_properties"?: Json }; Returns: undefined
                           },
"venue_club_id":
{ Args: { "p_venue_id": string }; Returns: string
                           }
          }
          Enums: {
            "acceptance_mode": "auto"|"approval","app_role": "player"|"club_admin"|"platform_admin","booking_status": "pending_payment"|"confirmed"|"cancelled"|"refunded"|"expired","club_member_role": "owner"|"staff","match_status": "open"|"full"|"closed"|"cancelled"|"finished","participant_status": "pending"|"confirmed"|"rejected"|"cancelled","payment_status": "pending"|"approved"|"rejected"|"refunded"|"cancelled","slot_status": "available"|"held"|"booked"|"blocked"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "acceptance_mode": ["auto", "approval"],"app_role": ["player", "club_admin", "platform_admin"],"booking_status": ["pending_payment", "confirmed", "cancelled", "refunded", "expired"],"club_member_role": ["owner", "staff"],"match_status": ["open", "full", "closed", "cancelled", "finished"],"participant_status": ["pending", "confirmed", "rejected", "cancelled"],"payment_status": ["pending", "approved", "rejected", "refunded", "cancelled"],"slot_status": ["available", "held", "booked", "blocked"]
          }
        }
} as const
