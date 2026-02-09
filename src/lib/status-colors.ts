/**
 * Unified status color system for the entire CRM.
 * Use these to render status badges consistently across all modules.
 */

export type StatusColor = {
  bg: string
  text: string
  dot: string
}

const statusColorMap: Record<string, StatusColor> = {
  // General statuses
  active: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  inactive: { bg: 'bg-gray-500/10 dark:bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' },
  pending: { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  completed: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },

  // Task statuses
  in_progress: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  in_review: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  review_changes: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },

  // Deadline statuses
  data_pending: { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  data_received: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  filed: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  overdue: { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },

  // Lead stages
  new: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  contacted: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500' },
  qualified: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
  proposal: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  won: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  lost: { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  converted: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },

  // Priority
  urgent: { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  medium: { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  low: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },

  // Support
  open: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  waiting: { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  resolved: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  closed: { bg: 'bg-gray-500/10 dark:bg-gray-500/20', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' },
  escalated: { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },

  // DSC / License
  valid: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  expired: { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  expiring_soon: { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
}

const fallback: StatusColor = {
  bg: 'bg-gray-500/10 dark:bg-gray-500/20',
  text: 'text-gray-700 dark:text-gray-400',
  dot: 'bg-gray-500',
}

export function getStatusColor(status: string | null | undefined): StatusColor {
  if (!status) return fallback
  return statusColorMap[status.toLowerCase().replace(/[\s-]/g, '_')] || fallback
}

export function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
