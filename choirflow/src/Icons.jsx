export const HomeIcon = ({ active }) => (
  <svg
    width="24"
    height="24"
    fill={active ? "var(--primary)" : "var(--accent)"}
    viewBox="0 0 24 24"
  >
    <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z"></path>
  </svg>
);

export const AddIcon = ({ active }) => (
  <svg
    width="24"
    height="24"
    fill={active ? "var(--primary)" : "var(--accent)"}
    viewBox="0 0 24 24"
  >
    <path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7V4z"></path>
  </svg>
);

export const CategoryIcon = ({ active }) => (
  <svg
    width="24"
    height="24"
    fill={active ? "var(--primary)" : "var(--accent)"}
    viewBox="0 0 24 24"
  >
    <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"></path>
  </svg>
);

export const ProfileIcon = ({ active }) => (
  <svg
    width="24"
    height="24"
    fill={active ? "var(--primary)" : "var(--accent)"}
    viewBox="0 0 24 24"
  >
    <path d="M12 2a5 5 0 1 1 0 10a5 5 0 0 1 0-10zm0 12c4.42 0 8 2.014 8 4.5V21H4v-2.5C4 16.014 7.58 14 12 14z"></path>
  </svg>
);

export function SearchIcon({ active }) {
  return (
    <span style={{ color: active ? "var(--primary)" : "var(--muted)" }}>
      🔍
    </span>
  );
}
