interface PermissionChipProps {
  statement: string;
}

export function PermissionChip({ statement }: PermissionChipProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-hairline bg-panel-raised px-2.5 py-1 font-mono text-xs text-paper-dim">
      <span className="mr-1 text-vital">Can</span>
      {statement}
    </span>
  );
}
