
import React from 'react';
import { TimelineEvent, LifePhase } from '../types';

interface TimelineViewProps {
  events: TimelineEvent[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const sortedEvents = [...events].sort((a, b) => {
    const order = [LifePhase.CHILDHOOD, LifePhase.YOUTH, LifePhase.ADULTHOOD, LifePhase.SENIORITY];
    return order.indexOf(a.phase) - order.indexOf(b.phase);
  });

  return (
    <div className="relative py-10 pl-8 space-y-12">
      {/* Central Line */}
      <div className="absolute left-[3.5px] top-0 bottom-0 w-[1px] bg-stone-200" />

      {sortedEvents.map((event, idx) => (
        <div key={event.id} className="relative group">
          {/* Dot */}
          <div className="absolute left-[-32.5px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-stone-400 shadow-sm group-hover:bg-stone-900 transition-colors" />
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                {event.phase} {event.timeRange ? `• ${event.timeRange}` : ''}
              </span>
            </div>
            <h3 className="serif text-xl font-medium text-stone-900">{event.event}</h3>
            <p className="text-stone-600 font-light leading-relaxed max-w-2xl">
              {event.description}
            </p>
          </div>
        </div>
      ))}

      {sortedEvents.length === 0 && (
        <div className="text-stone-400 italic font-light py-20 text-center w-full">
          The life path will emerge as more memories are shared.
        </div>
      )}
    </div>
  );
};

export default TimelineView;
