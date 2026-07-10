export default function ArchetypeBadge({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-neutral-600">–</span>;
  return (
    <span className="text-xs rounded bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5" title={names.join(', ')}>
      {names[0]}{names.length > 1 ? ` +${names.length - 1}` : ''}
    </span>
  );
}
