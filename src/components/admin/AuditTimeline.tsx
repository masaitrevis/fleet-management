'use client';

import { Clock, User, ArrowRight } from 'lucide-react';

interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
  userId?: string | null;
}

interface AuditTimelineProps {
  events: AuditEvent[];
}

export default function AuditTimeline({ events }: AuditTimelineProps) {
  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No audit events found</p>
      ) : (
        events.map((event, idx) => (
          <div key={event.id} className="flex gap-3 relative">
            {idx < events.length - 1 && (
              <div className="absolute left-[11px] top-7 bottom-0 w-px bg-gray-200 />
            )}
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50
              <User className="h-3 w-3 text-blue-600 />
            </div>
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500
              </div>
              {event.details && (
                <p className="text-xs text-gray-500 mt-0.5">{event.details}</p>
              )}
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
