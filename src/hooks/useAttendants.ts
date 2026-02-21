import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Attendant = Tables<"attendants">;
export type AttendantInsert = TablesInsert<"attendants">;
export type AttendantUpdate = TablesUpdate<"attendants">;

export function useAttendants() {
  return useQuery({
    queryKey: ["attendants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendants")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Attendant[];
    },
  });
}

export function useCreateAttendant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attendant: AttendantInsert) => {
      const { data, error } = await supabase.from("attendants").insert(attendant).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendants"] }),
  });
}

export function useUpdateAttendant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: AttendantUpdate & { id: string }) => {
      const { data, error } = await supabase.from("attendants").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendants"] }),
  });
}

export function useDeleteAttendant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("attendants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendants"] }),
  });
}
