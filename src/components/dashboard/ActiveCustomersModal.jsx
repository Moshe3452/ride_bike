import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Car, AlertTriangle } from "lucide-react";
import { differenceInMinutes, format } from "date-fns";
import { he } from "date-fns/locale";

export default function ActiveCustomersModal({ open, onOpenChange, rentals, customers, onSelectCustomer }) {
  const currentTime = new Date();

  const groupedData = React.useMemo(() => {
    if (!customers.length || !rentals.length) return [];
    
    const activeCustomerIds = new Set(rentals.map(r => r.customer_id));
    
    return customers
      .filter(c => activeCustomerIds.has(c.id))
      .map(customer => {
        const customerRentals = rentals.filter(r => r.customer_id === customer.id);
        const hasOverdue = customerRentals.some(r => {
          const elapsedMinutes = differenceInMinutes(currentTime, new Date(r.start_date));
          return elapsedMinutes > r.planned_duration;
        });
        const earliestStartDate = new Date(Math.min(...customerRentals.map(r => new Date(r.start_date).getTime())));

        return {
          customer,
          rentalsCount: customerRentals.length,
          hasOverdue,
          earliestStartDate,
        };
      })
      .sort((a,b) => a.earliestStartDate - b.earliestStartDate);
  }, [rentals, customers, currentTime]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            לקוחות פעילים ({groupedData.length})
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-2">
          {groupedData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">אין לקוחות עם השכרות פעילות כרגע.</p>
          ) : (
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 font-medium text-slate-600">שם לקוח</th>
                  <th className="py-2 px-3 font-medium text-slate-600">כלים מושכרים</th>
                  <th className="py-2 px-3 font-medium text-slate-600">תחילת השכרה</th>
                  <th className="py-2 px-3 font-medium text-slate-600">חריגות</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map(({ customer, rentalsCount, hasOverdue, earliestStartDate }) => (
                  <tr
                    key={customer.id}
                    onClick={() => onSelectCustomer(customer)}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-green-50 cursor-pointer"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-800">{customer.name}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-mono">{rentalsCount}</span>
                        <Car className="w-4 h-4 text-slate-500" />
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {format(earliestStartDate, "dd/MM HH:mm", { locale: he })}
                    </td>
                    <td className="py-3 px-3">
                      {hasOverdue ? (
                        <Badge variant="destructive" className="bg-red-500">
                          <AlertTriangle className="w-3 h-3 ml-1" />
                          קיימת חריגה
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700">ללא חריגות</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}