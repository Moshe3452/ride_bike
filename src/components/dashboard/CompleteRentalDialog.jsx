import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, IdCard, Phone, Clock, AlertTriangle, CheckCircle, X } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { Rental, Vehicle, CompanySettings, User as UserEntity } from "@/api/entities";
import { SendEmail } from "@/api/integrations";

export default function CompleteRentalDialog({
  open,
  onOpenChange,
  customer,
  rentalsToComplete,
  vehicles,
  onUpdate,
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!customer || !rentalsToComplete || rentalsToComplete.length === 0) {
    return null;
  }

  const currentTime = new Date();

  const summaryDetails = rentalsToComplete.map((rental) => {
    const vehicle = vehicles.find((v) => v.id === rental.vehicle_id);
    if (!vehicle) return null;
    const startTime = new Date(rental.start_date);
    const actualDuration = differenceInMinutes(currentTime, startTime);
    const plannedDuration = rental.planned_duration;
    const overdueMinutes = Math.max(0, actualDuration - plannedDuration);
    // Ensure at least one hour is charged if rental is shorter
    const costDurationHours = Math.max(1, Math.ceil(actualDuration / 60));
    const totalCost = costDurationHours * vehicle.hourly_rate;
    const vehicleTypeLabel =
      {
        bike: "אופניים",
        electric_bike: "אופניים חשמליים",
        scooter: "קורקינט",
        electric_scooter: "קורקינט חשמלי",
      }[vehicle.type] || vehicle.type;

    return {
      rental,
      vehicle,
      startTime,
      actualDuration,
      plannedDuration,
      overdueMinutes,
      totalCost,
      vehicleTypeLabel,
    };
  }).filter(Boolean); // Filter out nulls if vehicle not found

  const totalCostAllRentals = summaryDetails.reduce(
    (sum, item) => sum + item.totalCost,
    0
  );
  const totalOverdue = summaryDetails.some(item => item.overdueMinutes > 0);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString()}:${mins.toString().padStart(2, "0")}`;
  };

  const handleConfirmCompletion = async () => {
    setIsProcessing(true);
    try {
      const updatePromises = summaryDetails.flatMap(
        ({ rental, vehicle, actualDuration, totalCost }) => [
          Rental.update(rental.id, {
            end_date: currentTime.toISOString(),
            actual_duration: actualDuration,
            total_cost: totalCost,
            status: "completed",
          }),
          Vehicle.update(vehicle.id, { status: "available" }),
        ]
      );

      await Promise.all(updatePromises);

      // Send email
      const [settingsData, currentUser] = await Promise.all([
        CompanySettings.list(),
        UserEntity.me(),
      ]);
      const adminEmail = settingsData[0]?.admin_email || currentUser.email;
      const companyName = settingsData[0]?.company_name || "השכרה בקליק";
      const companyLogo = settingsData[0]?.logo_url || "";

      const itemsHtml = summaryDetails
        .map(
          (item) => `
        <tr style="border-bottom: 1px solid #eaeaea;">
            <td style="padding: 12px 15px;">${item.vehicleTypeLabel} #${item.vehicle.serial_number}</td>
            <td style="padding: 12px 15px;">${formatDuration(item.actualDuration)}</td>
            <td style="padding: 12px 15px;">${item.vehicle.hourly_rate}₪</td>
            <td style="padding: 12px 15px; text-align: left; font-weight: bold;">${item.totalCost}₪</td>
        </tr>
      `
        )
        .join("");

      const emailBody = `
<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; text-align: right;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4A90E2; color: white; padding: 20px; text-align: center;">
            ${companyLogo ? `<img src="${companyLogo}" alt="לוגו" style="max-width: 100px; margin-bottom: 10px;"><br>` : ''}
            <h1 style="margin: 0; font-size: 24px;">סיכום השכרה - ${companyName}</h1>
        </div>
        <div style="padding: 25px;">
            <h2 style="font-size: 18px; color: #4A90E2; border-bottom: 2px solid #4A90E2; padding-bottom: 5px; margin-bottom: 15px;">פרטי לקוח</h2>
            <p><strong>שם:</strong> ${customer.name}</p>
            <p><strong>טלפון:</strong> <a href="tel:${customer.phone}" style="color: #4A90E2;">${customer.phone}</a></p>
            <p><strong>ת.ז:</strong> ${customer.id_number}</p>
            
            <h2 style="font-size: 18px; color: #4A90E2; border-bottom: 2px solid #4A90E2; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">פירוט חיוב</h2>
            <table style="width: 100%; border-collapse: collapse; text-align: right;">
                <thead style="background-color: #f2f2f2;">
                    <tr>
                        <th style="padding: 12px 15px; text-align: right;">כלי</th>
                        <th style="padding: 12px 15px; text-align: right;">זמן בפועל</th>
                        <th style="padding: 12px 15px; text-align: right;">תעריף שעתי</th>
                        <th style="padding: 12px 15px; text-align: left;">סה"כ</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div style="text-align: left; margin-top: 20px; padding-top: 20px; border-top: 2px solid #4A90E2;">
                <strong style="font-size: 22px; color: #d9534f;">סה"כ לתשלום: ${totalCostAllRentals}₪</strong>
            </div>
        </div>
        <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            תודה שבחרתם ב${companyName}!
        </div>
    </div>
</div>`;

      await SendEmail({
        to: adminEmail,
        subject: `✅ סיום השכרה - ${customer.name}`,
        body: emailBody,
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error completing rental:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onOpenChange(false)}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            סיכום השכרה
          </DialogTitle>
          <DialogDescription>
            נא לאשר את הפרטים לפני סיום וחיוב ההשכרה.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Info */}
          <Card className="bg-slate-50/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-lg text-slate-800">{customer.name}</p>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><IdCard className="w-4 h-4"/>{customer.id_number}</span>
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4"/>{customer.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Table */}
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="border-b">
                  <tr className="text-slate-600">
                    <th className="py-2 px-3 font-medium">כלי</th>
                    <th className="py-2 px-3 font-medium">זמן בפועל</th>
                    <th className="py-2 px-3 font-medium">חריגה</th>
                    <th className="py-2 px-3 font-medium">עלות</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryDetails.map((item) => (
                    <tr key={item.rental.id} className="border-b last:border-0">
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800">{item.vehicleTypeLabel}</p>
                        <p className="text-xs text-slate-500">#{item.vehicle.serial_number}</p>
                      </td>
                      <td className="py-3 px-3">{formatDuration(item.actualDuration)}</td>
                      <td className="py-3 px-3">
                        {item.overdueMinutes > 0 ? (
                          <span className="text-red-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {formatDuration(item.overdueMinutes)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold">{item.totalCost}₪</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Total */}
          <div className="bg-blue-900 text-white rounded-lg p-6 text-center shadow-lg">
            <p className="text-lg font-medium opacity-80">סה"כ לתשלום</p>
            <p className="text-5xl font-bold tracking-tight">
              {totalCostAllRentals}₪
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            <X className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button
            onClick={handleConfirmCompletion}
            disabled={isProcessing}
            className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
          >
            {isProcessing ? "מעבד..." : "אישור וסיום השכרה"}
            <CheckCircle className="w-4 h-4 mr-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}