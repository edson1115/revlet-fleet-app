import { format } from "date-fns";

interface Tech {
  id: string;
  full_name: string;
  // Add other fields if necessary
}

interface TeslaTechAvailabilityProps {
  technicians?: Tech[]; // Mark as optional
  selectedDate?: Date;
}

export function TeslaTechAvailability({ technicians = [], selectedDate }: TeslaTechAvailabilityProps) {
  
  // SAFETY CHECK: If technicians is somehow null/undefined, default to empty array
  const safeTechs = technicians || [];

  if (safeTechs.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-2 italic">
        No technicians available for dispatch.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Technician Availability
      </h3>
      
      <div className="grid grid-cols-1 gap-2">
        {safeTechs.map((tech) => (
          <div 
            key={tech.id} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                {tech.full_name?.charAt(0) || "T"}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {tech.full_name || "Unknown Tech"}
              </div>
            </div>
            
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Available
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}