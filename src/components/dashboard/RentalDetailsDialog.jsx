import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Phone, 
  Car, 
  Clock,
  Plus,
  CheckCircle,
  Calendar,
  CreditCard,
  IdCard
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { Rental, Vehicle } from "@/api/entities";
import CompleteRentalDialog from "./CompleteRentalDialog";

export default function RentalDetailsDialog({ 
  open, 
  onOpenChange, 
  rental, 
  customer, 
  vehicle,
  allActiveRentals,
  vehicles,
  onUpdate 
}) {
  const [extensionMinutes, setExtensionMinutes] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleteSummaryOpen, setIsCompleteSummaryOpen] = useState(false);

  if (!rental || !customer || !vehicle) return null;

  const startTime = new Date(rental.start_date);
  const currentTime = new Date();
  const elapsedMinutes = differenceInMinutes(currentTime, startTime);
  const plannedMinutes = rental.planned_duration;
  
  const isOverdue = elapsedMinutes > plannedMinutes;
  const timeLeft = plannedMinutes - elapsedMinutes;

  const vehicleTypeLabel = {
    bike: "אופניים",
    electric_bike: "אופניים חשמליים",
    scooter: "קורקינט",
    electric_scooter: "קורקינט חשמלי",
  }[vehicle.type] || vehicle.type;


  const handleExtendRental = async () => {
    setIsProcessing(true);
    try {
      await Rental.update(rental.id, {
        planned_duration: rental.planned_duration + extensionMinutes
      });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error extending rental:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteRentalClick = () => {
    setIsCompleteSummaryOpen(true);
  };
  
  const rentalsForThisCustomer = allActiveRentals?.filter(r => r.customer_id === customer.id) || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md mx-auto bg-white/95 backdrop-blur-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              פרטי השכרה
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Info */}
            <Card className="bg-slate-50/50">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-slate-700 mb-3">פרטי לקוח</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">{customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-slate-500" />
                    <span className="font-mono text-sm">{customer.id_number}</span>
                  </div>
                  <button
                    onClick={() => {
                        if (window.confirm(`האם לחייג ל-${customer.phone}?`)) {
                          window.location.href = `tel:${customer.phone}`;
                        }
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 w-full text-right"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="font-mono text-sm">{customer.phone}</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Rental Info */}
            <Card className="bg-slate-50/50">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-slate-700 mb-3">פרטי השכרה</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-slate-500" />
                    <span>{vehicleTypeLabel} #{vehicle.serial_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{format(startTime, "dd/MM/yyyy HH:mm", { locale: he })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>משך בפועל: {Math.floor(elapsedMinutes / 60)}:{(elapsedMinutes % 60).toString().padStart(2, '0')} שעות</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <span>מחיר: {vehicle.hourly_rate}₪ לשעה</span>
                  </div>
                </div>
                
                <Badge variant={isOverdue ? "destructive" : "default"} className="mt-3">
                  {isOverdue ? 
                    `איחור ${Math.abs(timeLeft)} דקות` : 
                    `נותרו ${timeLeft} דקות`
                  }
                </Badge>
              </CardContent>
            </Card>

            {/* Extension */}
            <Card className="bg-blue-50/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-700 mb-3">הארכת זמן</h3>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={extensionMinutes}
                    onChange={(e) => setExtensionMinutes(parseInt(e.target.value) || 0)}
                    placeholder="דקות"
                    className="flex-1"
                    min="15"
                    step="15"
                  />
                  <Button
                    onClick={handleExtendRental}
                    disabled={isProcessing || extensionMinutes <= 0}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    הארך
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1"
              >
                סגור
              </Button>
              <Button
                onClick={handleCompleteRentalClick}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <CheckCircle className="w-4 h-4 ml-1" />
                סיום השכרה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {isCompleteSummaryOpen && (
        <CompleteRentalDialog
          open={isCompleteSummaryOpen}
          onOpenChange={setIsCompleteSummaryOpen}
          customer={customer}
          rentalsToComplete={rentalsForThisCustomer}
          vehicles={vehicles}
          onUpdate={() => {
            onUpdate(); // Refresh parent data
            onOpenChange(false); // Close this details dialog
          }}
        />
      )}
    </>
  );
}