import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Car,
  Calendar,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { differenceInMinutes, format } from "date-fns";
import { he } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import RentalDetailsDialog from "./RentalDetailsDialog";

export default function OverdueRentalsTable({ 
  activeRentals, 
  customers, 
  vehicles, 
  onUpdate 
}) {
  const [groupedOverdue, setGroupedOverdue] = useState({});
  const [selectedRental, setSelectedRental] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateOverdueRentals = () => {
      const currentTime = new Date();
      const overdue = activeRentals.filter(rental => {
        const startTime = new Date(rental.start_date);
        const elapsedMinutes = differenceInMinutes(currentTime, startTime);
        return elapsedMinutes > rental.planned_duration + 5; // חריגה של 5 דקות ומעלה
      }).map(rental => {
        const startTime = new Date(rental.start_date);
        const elapsedMinutes = differenceInMinutes(currentTime, startTime);
        const overdueMinutes = elapsedMinutes - rental.planned_duration;
        return {
          ...rental,
          elapsedMinutes,
          overdueMinutes,
          customer: customers.find(c => c.id === rental.customer_id),
          vehicle: vehicles.find(v => v.id === rental.vehicle_id)
        };
      });
      
      const grouped = overdue.reduce((acc, rental) => {
        if (!rental.customer) return acc;
        if (!acc[rental.customer.id]) {
          acc[rental.customer.id] = {
            customer: rental.customer,
            rentals: [],
          };
        }
        acc[rental.customer.id].rentals.push(rental);
        return acc;
      }, {});
      setGroupedOverdue(grouped);
    };

    updateOverdueRentals();
    const interval = setInterval(updateOverdueRentals, 30000);

    return () => clearInterval(interval);
  }, [activeRentals, customers, vehicles]);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  if (Object.keys(groupedOverdue).length === 0) {
    return null;
  }

  // Get all rentals as flat array for display limiting
  const allOverdueRentals = Object.values(groupedOverdue).flatMap(g => g.rentals);
  const displayedRentals = isExpanded ? allOverdueRentals : allOverdueRentals.slice(0, 2);
  const hasMoreRentals = allOverdueRentals.length > 2;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-red-100 to-orange-100 border-b border-red-200 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold">טבלת חריגות ({allOverdueRentals.length})</span>
              </CardTitle>
              {hasMoreRentals && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-red-700 hover:bg-red-200/50"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 ml-1" />
                      כווץ
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 ml-1" />
                      הרחב ({allOverdueRentals.length - 2} נוספות)
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-red-200">
                            <th className="text-right py-2 px-3 font-semibold text-red-800">שם לקוח</th>
                            <th className="text-right py-2 px-3 font-semibold text-red-800">כלי מושכר</th>
                            <th className="text-right py-2 px-3 font-semibold text-red-800">שעת התחלה</th>
                            <th className="text-right py-2 px-3 font-semibold text-red-800">חריגה</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {displayedRentals.map((rental) => (
                                <motion.tr
                                    key={rental.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="border-b border-red-100 last:border-0 hover:bg-red-100/50 cursor-pointer"
                                    onClick={() => setSelectedRental(rental)}
                                >
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-red-500" />
                                            <span className="font-medium text-red-900">{rental.customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <Car className="w-4 h-4 text-red-500" />
                                            <span>
                                                {rental.vehicle?.type === 'bike' ? 'אופניים' : 'קורקינט'} #{rental.vehicle?.serial_number}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 font-mono">{format(new Date(rental.start_date), "HH:mm", { locale: he })}</td>
                                    <td className="py-3 px-3">
                                        <Badge variant="destructive" className="bg-red-500 text-xs px-2 py-1">
                                            <Clock className="w-3 h-3 ml-1" />
                                            {formatDuration(rental.overdueMinutes)}
                                        </Badge>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {selectedRental && (
        <RentalDetailsDialog
          open={!!selectedRental}
          onOpenChange={(isOpen) => !isOpen && setSelectedRental(null)}
          rental={selectedRental}
          customer={selectedRental.customer}
          vehicle={selectedRental.vehicle}
          allActiveRentals={activeRentals}
          vehicles={vehicles}
          onUpdate={() => {
            onUpdate();
            setSelectedRental(null);
          }}
        />
      )}
    </>
  );
}