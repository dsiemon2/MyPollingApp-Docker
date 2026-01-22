/**
 * Poll Status Helper
 *
 * Manages poll status transitions based on scheduling:
 * - draft: Poll created but not visible
 * - scheduled: Poll will auto-open at scheduledAt time
 * - open: Poll is accepting votes
 * - closed: Poll is no longer accepting votes
 */

export type PollStatus = 'draft' | 'scheduled' | 'open' | 'closed';

interface PollScheduleData {
  status: string;
  scheduledAt?: Date | string | null;
  closedAt?: Date | string | null;
}

/**
 * Calculate the effective status of a poll based on current time and scheduling
 */
export function calculatePollStatus(poll: PollScheduleData): PollStatus {
  const now = new Date();
  const scheduledAt = poll.scheduledAt ? new Date(poll.scheduledAt) : null;
  const closedAt = poll.closedAt ? new Date(poll.closedAt) : null;

  // If explicitly closed, stay closed
  if (poll.status === 'closed') {
    return 'closed';
  }

  // If draft, stay draft unless it has scheduledAt in the past
  if (poll.status === 'draft') {
    if (scheduledAt && scheduledAt <= now) {
      // Draft with past scheduledAt should be open
      return 'open';
    }
    return 'draft';
  }

  // If scheduled, check if it should be open now
  if (poll.status === 'scheduled') {
    if (scheduledAt && scheduledAt <= now) {
      // Check if it should also be closed
      if (closedAt && closedAt <= now) {
        return 'closed';
      }
      return 'open';
    }
    return 'scheduled';
  }

  // If open, check if it should be closed
  if (poll.status === 'open') {
    if (closedAt && closedAt <= now) {
      return 'closed';
    }
    return 'open';
  }

  // Default fallback
  return poll.status as PollStatus;
}

/**
 * Determine the initial status when creating a poll
 */
export function determineInitialStatus(scheduledAt?: Date | string | null): PollStatus {
  if (!scheduledAt) {
    return 'open'; // No scheduling = immediately open
  }

  const scheduleDate = new Date(scheduledAt);
  const now = new Date();

  if (scheduleDate <= now) {
    return 'open'; // Scheduled in the past = open now
  }

  return 'scheduled'; // Future date = scheduled
}

/**
 * Check if a poll can accept votes
 */
export function canAcceptVotes(poll: PollScheduleData): boolean {
  const effectiveStatus = calculatePollStatus(poll);
  return effectiveStatus === 'open';
}

/**
 * Check if a poll is visible to the public
 */
export function isVisibleToPublic(poll: PollScheduleData): boolean {
  const effectiveStatus = calculatePollStatus(poll);
  return effectiveStatus === 'open' || effectiveStatus === 'closed';
}

/**
 * Get human-readable status description
 */
export function getStatusDescription(poll: PollScheduleData): string {
  const effectiveStatus = calculatePollStatus(poll);
  const scheduledAt = poll.scheduledAt ? new Date(poll.scheduledAt) : null;
  const closedAt = poll.closedAt ? new Date(poll.closedAt) : null;

  switch (effectiveStatus) {
    case 'draft':
      return 'This poll is a draft and not visible to voters.';
    case 'scheduled':
      return scheduledAt
        ? `This poll will open on ${scheduledAt.toLocaleString()}.`
        : 'This poll is scheduled to open.';
    case 'open':
      if (closedAt) {
        return `This poll is open and will close on ${closedAt.toLocaleString()}.`;
      }
      return 'This poll is open and accepting votes.';
    case 'closed':
      return 'This poll is closed and no longer accepting votes.';
    default:
      return 'Unknown poll status.';
  }
}

/**
 * Format a date for datetime-local input
 */
export function formatForDateTimeInput(date?: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  // Format: YYYY-MM-DDTHH:mm
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse datetime-local input value to Date
 */
export function parseDateTimeInput(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}
