import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  TreasuryInstrument,
  TreasuryBankAccount,
  InstrumentStatus,
  InstrumentDirection,
} from '../types/treasury';
import { VALID_TRANSITIONS, CURRENCY_RATES } from '../types/treasury';
import { TREASURY_INSTRUMENTS, TREASURY_BANK_ACCOUNTS } from '../data/treasuryMock';
import type { Invoice } from '../data/types';

interface TreasuryContextValue {
  instruments: TreasuryInstrument[];
  bankAccounts: TreasuryBankAccount[];
  addInstrument: (data: Omit<TreasuryInstrument, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => TreasuryInstrument;
  updateInstrumentStatus: (id: string, status: InstrumentStatus, note?: string) => void;
  updateInstrumentNotes: (id: string, notes: string) => void;
  deleteInstrument: (id: string) => void;
  getInstrumentsByStatus: (statuses: InstrumentStatus[]) => TreasuryInstrument[];
  getInstrumentsByDirection: (direction: InstrumentDirection) => TreasuryInstrument[];
  getLinkableInvoices: () => Invoice[];
  addBankAccount: (account: Omit<TreasuryBankAccount, 'id'>) => void;
  canTransition: (current: InstrumentStatus, next: InstrumentStatus) => boolean;
}

const TreasuryContext = createContext<TreasuryContextValue | null>(null);

let idCounter = 16;

export function TreasuryProvider({ children }: { children: ReactNode }) {
  const [instruments, setInstruments] = useState<TreasuryInstrument[]>(TREASURY_INSTRUMENTS);
  const [bankAccounts, setBankAccounts] = useState<TreasuryBankAccount[]>(TREASURY_BANK_ACCOUNTS);

  const canTransition = useCallback((current: InstrumentStatus, next: InstrumentStatus): boolean => {
    return VALID_TRANSITIONS[current].includes(next);
  }, []);

  const addInstrument = useCallback((data: Omit<TreasuryInstrument, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>): TreasuryInstrument => {
    const id = `TRS-${String(idCounter++).padStart(4, '0')}`;
    const now = new Date().toISOString();
    const instrument: TreasuryInstrument = {
      ...data,
      id,
      amountInILS: data.amount * (CURRENCY_RATES[data.currency] ?? 1),
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: data.status, changedAt: now, changedBy: 'admin' }],
    };
    setInstruments(prev => [instrument, ...prev]);
    return instrument;
  }, []);

  const updateInstrumentStatus = useCallback((id: string, status: InstrumentStatus, note?: string): void => {
    const now = new Date().toISOString();
    setInstruments(prev => prev.map(inst => {
      if (inst.id !== id) return inst;
      if (!canTransition(inst.status, status)) return inst;
      return {
        ...inst,
        status,
        updatedAt: now,
        depositedDate: status === 'deposited' ? now.slice(0, 10) : inst.depositedDate,
        clearedDate:   status === 'cleared'   ? now.slice(0, 10) : inst.clearedDate,
        statusHistory: [
          ...inst.statusHistory,
          { status, changedAt: now, changedBy: 'admin', note },
        ],
      };
    }));
  }, [canTransition]);

  const updateInstrumentNotes = useCallback((id: string, notes: string): void => {
    setInstruments(prev => prev.map(inst =>
      inst.id === id ? { ...inst, notes, updatedAt: new Date().toISOString() } : inst
    ));
  }, []);

  const deleteInstrument = useCallback((id: string): void => {
    setInstruments(prev => prev.map(inst =>
      inst.id === id ? { ...inst, isDeleted: true } : inst
    ));
  }, []);

  const getInstrumentsByStatus = useCallback((statuses: InstrumentStatus[]): TreasuryInstrument[] => {
    return instruments.filter(i => !i.isDeleted && statuses.includes(i.status));
  }, [instruments]);

  const getInstrumentsByDirection = useCallback((direction: InstrumentDirection): TreasuryInstrument[] => {
    return instruments.filter(i => !i.isDeleted && i.direction === direction);
  }, [instruments]);

  const getLinkableInvoices = useCallback((): Invoice[] => {
    // Returns placeholder — real app would filter from DataContext invoices
    return [];
  }, []);

  const addBankAccount = useCallback((account: Omit<TreasuryBankAccount, 'id'>): void => {
    const id = `acc-${String(Date.now()).slice(-6)}`;
    setBankAccounts(prev => [...prev, { ...account, id }]);
  }, []);

  return (
    <TreasuryContext.Provider value={{
      instruments: instruments.filter(i => !i.isDeleted),
      bankAccounts,
      addInstrument,
      updateInstrumentStatus,
      updateInstrumentNotes,
      deleteInstrument,
      getInstrumentsByStatus,
      getInstrumentsByDirection,
      getLinkableInvoices,
      addBankAccount,
      canTransition,
    }}>
      {children}
    </TreasuryContext.Provider>
  );
}

export function useTreasury(): TreasuryContextValue {
  const ctx = useContext(TreasuryContext);
  if (!ctx) throw new Error('useTreasury must be used inside TreasuryProvider');
  return ctx;
}
