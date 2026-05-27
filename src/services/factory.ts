import { supabase, USE_SUPABASE } from "../lib/supabase";
import type {
  FactoryOrderRow, FactoryOrderInsert, FactoryOrderUpdate,
  FactoryBomRow,
  FactoryQcRow, FactoryQcInsert, FactoryQcUpdate,
  FactoryBatchRow, FactoryBatchInsert, FactoryBatchUpdate,
  RawMaterialRow, RawMaterialUpdate,
  FinishedGoodRow, FinishedGoodInsert, FinishedGoodUpdate,
  WarehouseLocationRow,
  ImportOrderRow, ImportOrderInsert, ImportOrderUpdate,
  CostingEntryRow,
} from "../types/database";

// ── Factory Orders ────────────────────────────────────────────────────────────

export async function fetchFactoryOrders(): Promise<FactoryOrderRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("factory_orders")
    .select("*")
    .eq("is_deleted", false)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createFactoryOrder(input: FactoryOrderInsert): Promise<FactoryOrderRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_orders")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFactoryOrder(id: string, patch: FactoryOrderUpdate): Promise<FactoryOrderRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_orders")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── BOMs ──────────────────────────────────────────────────────────────────────

export async function fetchBoms(): Promise<FactoryBomRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("factory_boms")
    .select("*, factory_bom_lines(*)")
    .order("product_name");
  if (error) throw error;
  return data ?? [];
}

// ── Quality Control ───────────────────────────────────────────────────────────

export async function fetchQualityChecks(): Promise<FactoryQcRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("factory_qc")
    .select("*")
    .order("inspection_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createQualityCheck(input: FactoryQcInsert): Promise<FactoryQcRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_qc")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQualityCheck(id: string, patch: FactoryQcUpdate): Promise<FactoryQcRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_qc")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Batches ───────────────────────────────────────────────────────────────────

export async function fetchBatches(): Promise<FactoryBatchRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("factory_batches")
    .select("*")
    .order("produced_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createBatch(input: FactoryBatchInsert): Promise<FactoryBatchRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_batches")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBatch(id: string, patch: FactoryBatchUpdate): Promise<FactoryBatchRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_batches")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Raw Materials ─────────────────────────────────────────────────────────────

export async function fetchRawMaterials(): Promise<RawMaterialRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("factory_raw_materials")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function updateRawMaterial(id: string, patch: RawMaterialUpdate): Promise<RawMaterialRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_raw_materials")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Finished Goods ────────────────────────────────────────────────────────────

export async function fetchFinishedGoods(): Promise<FinishedGoodRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("factory_finished_goods")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function upsertFinishedGood(input: FinishedGoodInsert): Promise<FinishedGoodRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_finished_goods")
    .upsert(input, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFinishedGood(id: string, patch: FinishedGoodUpdate): Promise<FinishedGoodRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_finished_goods")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Warehouse ─────────────────────────────────────────────────────────────────

export async function fetchWarehouseLocations(): Promise<WarehouseLocationRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("factory_warehouse")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// ── Import Orders ─────────────────────────────────────────────────────────────

export async function fetchImportOrders(): Promise<ImportOrderRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("factory_imports")
    .select("*, factory_import_lines(*)")
    .order("order_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createImportOrder(input: ImportOrderInsert): Promise<ImportOrderRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_imports")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateImportOrder(id: string, patch: ImportOrderUpdate): Promise<ImportOrderRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("factory_imports")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Costing ───────────────────────────────────────────────────────────────────

export async function fetchCostingEntries(): Promise<CostingEntryRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("factory_costing")
    .select("*")
    .order("period", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
