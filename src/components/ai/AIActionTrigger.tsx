type AIActionTriggerProps = {
  label: string;
  onClick: () => void;
};

export default function AIActionTrigger({
  label,
  onClick,
}: AIActionTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={styles.button}
    >
      {label}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    border: "1px solid #dbeafe",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};