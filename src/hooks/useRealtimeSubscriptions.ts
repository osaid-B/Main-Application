import { useEffect } from "react";
import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { FactoryOrderRow, LoyaltyTransactionRow, PosSaleRow } from "../types/database";

type RealtimeCallbacks = {
  onFactoryOrderChange?: (row: FactoryOrderRow) => void;
  onLoyaltyTransaction?: (row: LoyaltyTransactionRow) => void;
  onPosSale?: (row: PosSaleRow) => void;
};

/**
 * Subscribe to Supabase realtime for factory_orders, loyalty_transactions, and pos_sales.
 * Each callback receives the new/updated row. No-ops when USE_SUPABASE is false.
 */
export function useRealtimeSubscriptions({
  onFactoryOrderChange,
  onLoyaltyTransaction,
  onPosSale,
}: RealtimeCallbacks) {
  useEffect(() => {
    if (!USE_SUPABASE) return;

    const channel = supabase
      .channel("atlas-erp-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "factory_orders" },
        (payload: { new: Record<string, unknown> }) => {
          if (onFactoryOrderChange && payload.new) {
            onFactoryOrderChange(payload.new as unknown as FactoryOrderRow);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "loyalty_transactions" },
        (payload: { new: Record<string, unknown> }) => {
          if (onLoyaltyTransaction && payload.new) {
            onLoyaltyTransaction(payload.new as unknown as LoyaltyTransactionRow);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pos_sales" },
        (payload: { new: Record<string, unknown> }) => {
          if (onPosSale && payload.new) {
            onPosSale(payload.new as unknown as PosSaleRow);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onFactoryOrderChange, onLoyaltyTransaction, onPosSale]);
}
