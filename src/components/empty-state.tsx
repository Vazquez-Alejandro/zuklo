"use client";

import Link from "next/link";

interface EmptyStateProps {
  icon?: string;
  iconSvg?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon,
  iconSvg,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  const actionButton = actionLabel && (onAction || actionHref) && (
    actionHref ? (
      <Link
        href={actionHref}
        className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition-colors inline-block"
      >
        {actionLabel}
      </Link>
    ) : (
      <button
        onClick={onAction}
        className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition-colors cursor-pointer"
      >
        {actionLabel}
      </button>
    )
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {iconSvg ? (
        <div className="bg-slate-700/30 rounded-full p-4 mb-4">
          {iconSvg}
        </div>
      ) : icon ? (
        <div className="bg-slate-700/30 rounded-full p-4 mb-4">
          <span className="text-4xl block">{icon}</span>
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {actionButton}
    </div>
  );
}
