import { useState } from 'react';
import type { TreasuryInstrument } from '../../types/treasury';
import TreasuryPage from './TreasuryPage';
import InstrumentPanel from './InstrumentPanel';
import InstrumentForm from './InstrumentForm';
import StatusModals from './StatusModals';

type FormMode = 'check' | 'transfer';

export default function TreasuryHub() {
  const [panelInstrument, setPanelInstrument] = useState<TreasuryInstrument | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [actionInstrument, setActionInstrument] = useState<TreasuryInstrument | null>(null);
  const [actionName, setActionName] = useState<string | null>(null);

  function handleAction(instrument: TreasuryInstrument, action: string) {
    if (action === 'add_check') {
      setFormMode('check');
      return;
    }
    if (action === 'add_transfer') {
      setFormMode('transfer');
      return;
    }
    // All status-change actions go to StatusModals
    setActionInstrument(instrument);
    setActionName(action);
    // Keep panel open if it's already showing this instrument
  }

  function handleStatusDone() {
    setActionInstrument(null);
    setActionName(null);
    // Refresh panel if open
    if (panelInstrument) {
      // Panel reads live from context, nothing extra needed
    }
  }

  return (
    <>
      <TreasuryPage
        onOpenPanel={setPanelInstrument}
        onAddCheck={() => setFormMode('check')}
        onAddTransfer={() => setFormMode('transfer')}
        onAction={handleAction}
      />

      <InstrumentPanel
        key={panelInstrument?.id ?? 'none'}
        instrument={panelInstrument}
        onClose={() => setPanelInstrument(null)}
        onAction={(inst, action) => handleAction(inst, action)}
      />

      {formMode && (
        <InstrumentForm
          mode={formMode}
          onClose={() => setFormMode(null)}
          onSaved={(inst) => {
            setFormMode(null);
            setPanelInstrument(inst);
          }}
        />
      )}

      <StatusModals
        instrument={actionInstrument}
        action={actionName}
        onClose={() => { setActionInstrument(null); setActionName(null); }}
        onDone={handleStatusDone}
      />
    </>
  );
}
