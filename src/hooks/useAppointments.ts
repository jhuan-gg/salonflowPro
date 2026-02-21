import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Appointment = Tables<"appointments"> & {
  clients?: Tables<"clients"> | null;
  attendants?: Tables<"attendants"> | null;
  appointment_services?: (Tables<"appointment_services"> & {
    services?: Tables<"services"> | null;
  })[];
};

export function useAppointments(date?: string) {
  return useQuery({
    queryKey: ["appointments", date],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          clients(*),
          attendants(*),
          appointment_services(*, services(*))
        `)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (date) {
        query = query.eq("date", date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
  });
}

export function useAppointmentsByRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["appointments", "range", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients(*),
          attendants(*),
          appointment_services(*, services(*))
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date")
        .order("start_time");

      if (error) throw error;
      return data as Appointment[];
    },
  });
}

interface CreateAppointmentData {
  client_id: string;
  attendant_id: string;
  date: string;
  start_time: string;
  notes?: string;
  service_ids: string[];
  total_price: number;
  return_days?: number | null;
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      const { service_ids, return_days, ...appointmentData } = data;

      // Calculate return_date if applicable
      const return_date = return_days
        ? new Date(new Date(data.date).getTime() + return_days * 86400000).toISOString().split("T")[0]
        : null;

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({ ...appointmentData, return_date })
        .select()
        .single();
      if (error) throw error;

      // Insert appointment_services
      if (service_ids.length > 0) {
        // Fetch service prices
        const { data: services } = await supabase
          .from("services")
          .select("id, price")
          .in("id", service_ids);

        const serviceEntries = service_ids.map((sid) => ({
          appointment_id: appointment.id,
          service_id: sid,
          price: services?.find((s) => s.id === sid)?.price ?? 0,
        }));

        const { error: svcError } = await supabase
          .from("appointment_services")
          .insert(serviceEntries);
        if (svcError) throw svcError;
      }

      // Create return appointment if configured
      if (return_date) {
        await supabase.from("appointments").insert({
          client_id: data.client_id,
          attendant_id: data.attendant_id,
          date: return_date,
          start_time: data.start_time,
          total_price: data.total_price,
          notes: `Retorno automático de ${return_days} dias`,
          status: "scheduled",
        });
      }

      return appointment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete appointment_services first
      await supabase.from("appointment_services").delete().eq("appointment_id", id);
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
