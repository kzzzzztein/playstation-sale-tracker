import { ReactNode } from "react";
import { GameControllerIcon, WarningCircleIcon } from "@phosphor-icons/react";

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-surface-border py-16 text-center">
      <div className="text-zinc-600">{icon ?? <GameControllerIcon size={40} weight="light" />}</div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {description && <p className="max-w-sm text-sm text-zinc-500">{description}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-900/40 bg-red-950/20 py-16 text-center">
      <WarningCircleIcon size={36} className="text-red-400" weight="light" />
      <p className="text-sm font-medium text-red-200">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-lg border border-red-800 px-3 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-900/30"
        >
          Try again
        </button>
      )}
    </div>
  );
}
