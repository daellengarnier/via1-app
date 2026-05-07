-- Add new notification kinds for feedback
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'FEEDBACK_COMMENT';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'FEEDBACK_RESOLVED';
