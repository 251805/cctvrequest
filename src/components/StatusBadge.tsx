/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
  seeking_approval: 'bg-purple-100 text-purple-800 border-purple-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  denied: 'bg-red-100 text-red-800 border-red-200',
  processing: 'bg-amber-100 text-amber-800 border-amber-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export const STATUS_LABELS: Record<keyof typeof STATUS_COLORS, string> = {
  pending: 'Pending Review',
  reviewing: 'Reviewing Request',
  seeking_approval: 'Video Captured',
  approved: 'Approved / Ready',
  denied: 'Rejected',
  processing: 'No Video Captured',
  closed: 'Closed / Archived',
};

export function StatusBadge({ status }: { status: keyof typeof STATUS_COLORS }) {
  const label = STATUS_LABELS[status] || String(status).toUpperCase();
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
      {label}
    </span>
  );
}
