"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { dbToArray, arrayToUpdate, arrayToInsert, getRowId } from "@/types/database";
import type { AuditEntry } from "@/components/ClientCard";

export function useDevedores() {
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all devedores on mount
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("devedores")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Fetch error:", error.message);
      setLoading(false);
      return;
    }

    setRows((data || []).map(dbToArray));
    setLoading(false);
  };

  // Update a single row
  const updateRow = useCallback(async (
    rowArr: string[],
    auditEntries: AuditEntry[],
  ): Promise<boolean> => {
    const id = getRowId(rowArr);
    if (!id) return false;

    const updateData = arrayToUpdate(rowArr);

    const { error } = await supabase
      .from("devedores")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Update error:", error.message);
      return false;
    }

    // Insert audit entries
    if (auditEntries.length > 0) {
      const auditRows = auditEntries.map((a) => ({
        devedor_id: id,
        ts: a.ts,
        field: a.field,
        old_value: a.from,
        new_value: a.to,
      }));

      await supabase.from("audit_trail").insert(auditRows);
    }

    // Update local state
    setRows((prev) => prev.map((r) => {
      if (getRowId(r) === id) return rowArr;
      return r;
    }));

    return true;
  }, []);

  // Insert a new row
  const insertRow = useCallback(async (rowArr: string[]): Promise<boolean> => {
    const insertData = arrayToInsert(rowArr);

    const { data, error } = await supabase
      .from("devedores")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error.message);
      return false;
    }

    setRows((prev) => [...prev, dbToArray(data)]);
    return true;
  }, []);

  // Insert multiple rows (import)
  const insertMany = useCallback(async (rowArrs: string[][]): Promise<number> => {
    const inserts = rowArrs.map(arrayToInsert);

    const { data, error } = await supabase
      .from("devedores")
      .insert(inserts)
      .select();

    if (error) {
      console.error("Insert many error:", error.message);
      return 0;
    }

    setRows((prev) => [...prev, ...(data || []).map(dbToArray)]);
    return data?.length || 0;
  }, []);

  // Fetch audit trail for a specific devedor
  const fetchAudit = useCallback(async (rowArr: string[]): Promise<AuditEntry[]> => {
    const id = getRowId(rowArr);
    if (!id) return [];

    const { data, error } = await supabase
      .from("audit_trail")
      .select("*")
      .eq("devedor_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Audit fetch error:", error.message);
      return [];
    }

    return (data || []).map((a) => ({
      ts: a.ts,
      field: a.field,
      from: a.old_value,
      to: a.new_value,
    }));
  }, []);

  return {
    rows,
    loading,
    updateRow,
    insertRow,
    insertMany,
    fetchAudit,
    refetch: fetchAll,
  };
}
