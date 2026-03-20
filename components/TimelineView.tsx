
import React from 'react';
import { TimelineEvent, LifePhase } from '../types';

interface TimelineViewProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  labels: {
    recordedAt: string;
    empty: string;
  };
}

const TimelineView: React.FC<TimelineViewProps> = ({ events, onEventClick, labels }) => {
  const sortedEvents = [...events].sort((a, b) => {
    const order = ['Childhood', 'Youth', 'Adulthood', 'Seniority'];
    
    const getOrder = (phase: string) => {
      const p = phase?.charAt(0).toUpperCase() + phase?.slice(1).toLowerCase();
      const index = order.indexOf(p);
      return index === -1 ? 99 : index;
    };

    const orderA = getOrder(a.phase as string);
    const orderB = getOrder(b.phase as string);

    if (orderA !== orderB) return orderA - orderB;
    return (a.recordedAt || 0) - (b.recordedAt || 0);
  });

  return (
    <div className="relative py-10 pl-8 space-y-12 animate-fade-in">
      <div className="absolute left-[3.5px] top-0 bottom-0 w-[1px] bg-stone-200" />

      {sortedEvents.map((event, idx) => (
        <div 
          key={event.id || idx} 
          className={`relative group ${onEventClick ? 'cursor-pointer' : ''}`}
          onClick={() => onEventClick?.(event)}
        >
          <div className="absolute left-[-32.5px] top-1.5 w-4 h-4 rounded-full border-2 border-[#fdfcf8] bg-stone-300 group-hover:bg-stone-900 group-hover:scale-125 transition-all duration-300" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors">
                {event.phase} {event.timeRange ? `• ${event.timeRange}` : ''}
              </span>
              <span className="text-[9px] text-stone-300 italic font-medium">
                {labels.recordedAt}: {new Date(event.recordedAt).toLocaleDateString()}
              </span>
            </div>
            <h3 className="serif text-2xl font-medium text-stone-900 leading-tight">{event.event}</h3>
            <p className="text-stone-500 font-light leading-relaxed max-w-2xl serif italic opacity-80 group-hover:opacity-100 transition-opacity">
              {event.description}
            </p>
          </div>
        </div>
      ))}

      {sortedEvents.length === 0 && (
        <div className="text-stone-300 italic font-light py-20 text-center w-full serif text-xl">
          {labels.empty}
        </div>
      )}
    </div>
  );
};

export default TimelineView;
