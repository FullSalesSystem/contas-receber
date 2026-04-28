"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { dbToArray, arrayToUpdate, arrayToInsert, getRowId } from "@/types/database";
import type { AuditEntry } from "@/components/ClientCard";

// Columns that may not exist yet in older DB instances
const OPTIONAL_COLUMNS = ["dt_recebido"];

/** Remove optional columns that don't yet exist from an update/insert payload */
function stripMissingCols(payload: Record<string, unknown>, colName: string) {
  const copy = { ...payload };
  delete copy[colName];
  return copy;
}

function isMissingColError(msg: string | undefined, col: string) {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes(col) &&
    (lower.includes("does not exist") ||
      lower.includes("not found") ||
      lower.includes("schema cache") ||
      lower.includes("no such column"))
  );
}

export function useDevedores() {
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchAll();
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchErr } = await supabase
      .from("devedores")
      .select("*")
      .order("id", { ascending: true });

    if (!mounted.current) return;

    if (fetchErr) {
      console.error("Fetch error:", fetchErr.message);
      setError("Erro ao carregar dados: " + fetchErr.message);
      setLoading(false);
      return;
    }

    setRows((data || []).map(dbToArray));
    setLoading(false);
  };

  const updateRow = useCallback(async (
    rowArr: string[],
    auditEntries: AuditEntry[],
  ): Promise<boolean> => {
    const id = getRowId(rowArr);
    if (!id) return false;

    let updateData: Record<string, unknown> = {
      ...arrayToUpdate(rowArr),
      updated_at: new Date().toISOString(),
    };

    let { error: updateErr } = await supabase
      .from("devedores")
      .update(updateData)
      .eq("id", id);

    // Retry without optional columns that may not exist in DB yet
    for (const col of OPTIONAL_COLUMNS) {
      if (updateErr && isMissingColError(updateErr.message, col)) {
        console.warn(`Column "${col}" missing in DB, retrying without it...`);
        updateData = stripMissingCols(updateData, col);
        const retry = await supabase
          .from("devedores")
          .update(updateData)
          .eq("id", id);
        updateErr = retry.error;
      }
    }

    if (updateErr) {
      console.error("Update error:", updateErr.message);
      return false;
    }

    // Insert audit entries (log but don't block on error)
    if (auditEntries.length > 0) {
      const auditRows = auditEntries.map((a) => ({
        devedor_id: id,
        ts: a.ts,
        field: a.field,
        old_value: a.from,
        new_value: a.to,
      }));

      const { error: auditErr } = await supabase.from("audit_trail").insert(auditRows);
      if (auditErr) {
        console.error("Audit insert error:", auditErr.message);
      }
    }

    // Update local state
    if (mounted.current) {
      setRows((prev) => prev.map((r) => (getRowId(r) === id ? rowArr : r)));
    }

    return true;
  }, []);

  const insertRow = useCallback(async (rowArr: string[]): Promise<boolean> => {
    let insertData: Record<string, unknown> = arrayToInsert(rowArr);

    let { data, error: insertErr } = await supabase
      .from("devedores")
      .insert(insertData)
      .select()
      .single();

    // Retry without optional columns that may not exist in DB yet
    for (const col of OPTIONAL_COLUMNS) {
      if (insertErr && isMissingColError(insertErr.message, col)) {
        console.warn(`Column "${col}" missing in DB, retrying without it...`);
        insertData = stripMissingCols(insertData, col);
        const retry = await supabase
          .from("devedores")
          .insert(insertData)
          .select()
          .single();
        insertErr = retry.error;
        data = retry.data;
      }
    }

    if (insertErr) {
      console.error("Insert error:", insertErr.message);
      return false;
    }

    if (mounted.current) {
      setRows((prev) => [...prev, dbToArray(data)]);
    }
    return true;
  }, []);

  const insertMany = useCallback(async (rowArrs: string[][]): Promise<number> => {
    let inserts: Record<string, unknown>[] = rowArrs.map(arrayToInsert);

    let { data, error: insertErr } = await supabase
      .from("devedores")
      .insert(inserts)
      .select();

    // Retry without optional columns that may not exist in DB yet
    for (const col of OPTIONAL_COLUMNS) {
      if (insertErr && isMissingColError(insertErr.message, col)) {
        console.warn(`Column "${col}" missing in DB, retrying without it...`);
        inserts = inserts.map((r) => stripMissingCols(r, col));
        const retry = await supabase
          .from("devedores")
          .insert(inserts)
          .select();
        insertErr = retry.error;
        data = retry.data;
      }
    }

    if (insertErr) {
      console.error("Insert many error:", insertErr.message);
      return 0;
    }

    if (mounted.current) {
      setRows((prev) => [...prev, ...(data || []).map(dbToArray)]);
    }
    return data?.length || 0;
  }, []);

  const fetchAudit = useCallback(async (rowArr: string[]): Promise<AuditEntry[]> => {
    const id = getRowId(rowArr);
    if (!id) return [];

    const { data, error: auditErr } = await supabase
      .from("audit_trail")
      .select("*")
      .eq("devedor_id", id)
      .order("created_at", { ascending: true });

    if (auditErr) {
      console.error("Audit fetch error:", auditErr.message);
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
    error,
    updateRow,
    insertRow,
    insertMany,
    fetchAudit,
    refetch: fetchAll,
  };
}
