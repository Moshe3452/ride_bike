import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Car } from "lucide-react";
import { differenceInMinutes, format } from "date-fns";
import { he } from "date-fns/locale";

const vehicleTypeLabels = {
  bike: "אופניים",
  electric_bike: "אופניים חשמליים",
  scooter: "קורקינט",
  electric_scooter: "קורקינט חשמלי",
};

const formatTimeLeft = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const sign = minutes < 0 ? "-" : "";
  return `${sign}${Math.abs(hours).toString()}:${Math.abs(mins).toString().padStart(2, '0')}`;
};

export default function RentedToolsModal({ open, onOpenChange, rentals, customers, vehicles, onSelectRental }) {
  const currentTime = new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
      <DialogContent className="max-w-3xl max-h-[80vh] bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            כלים בהשכרה ({rentals.length})
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-2">
          {rentals.length === 0 ? (
            <p className="text-center text-slate-500 py-8">אין כלים מושכרים כרגע.</p>
          ) : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 font-medium text-slate-600">כלי</th>
                  <th className="py-2 px-3 font-medium text-slate-600">אצל מי נמצא</th>
                  <th className="py-2 px-3 font-medium text-slate-600">שעת התחלה</th>
                  <th className="py-2 px-3 font-medium text-slate-600">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {rentals
                  .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                  .map(rental => {
                    const customer = customers.find(c => c.id === rental.customer_id);
                    const vehicle = vehicles.find(v => v.id === rental.vehicle_id);

                    if (!customer || !vehicle) return null;

                    const startTime = new Date(rental.start_date);
                    const elapsedMinutes = differenceInMinutes(currentTime, startTime);
                    const plannedMinutes = rental.planned_duration;
                    const isOverdue = elapsedMinutes > plannedMinutes;
                    const timeLeft = plannedMinutes - elapsedMinutes;

                    return (
                      <tr
                        key={rental.id}
                        onClick={() => onSelectRental(rental)}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50 cursor-pointer"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="font-semibold text-slate-800">{vehicleTypeLabels[vehicle.type] || vehicle.type} #{vehicle.serial_number}</span>
                            <Car className="w-4 h-4 text-slate-500" />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                           <div className="flex items-center gap-2 justify-end">
                            <span>{customer.name}</span>
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {format(startTime, "HH:mm")}
                        </td>
                        <td className="py-3 px-3">
                          <Badge 
                            className={`text-xs px-2 py-1 whitespace-nowrap h-fit ${
                              isOverdue 
                                ? "bg-red-100 text-red-800 border-red-200" 
                                : "bg-green-100 text-green-800 border-green-200"
                            }`}
                          >
                            <Clock className="w-3 h-3 ml-1" />
                            {isOverdue ? 
                              `חריגה של ${formatTimeLeft(timeLeft)}` : 
                              `נותרו ${formatTimeLeft(timeLeft)}`
                            }
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}