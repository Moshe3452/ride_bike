
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, IdCard, Phone, Upload, Car, Calendar, Clock, CreditCard, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import ConfirmDialog from '../shared/ConfirmDialog';
import { Rental } from '@/api/entities';

export default function CustomerDetailsModal({ 
  customer, 
  rentals, 
  vehicles, 
  open, 
  onOpenChange,
  onUpdate 
}) {
  const [rentalToDelete, setRentalToDelete] = useState(null);

  if (!customer) return null;

  const vehicleTypeLabel = (type) => type === 'bike' ? 'אופניים' : 'קורקינט';
  
  const activeRentals = rentals.filter(r => r.status === 'active');
  const completedRentals = rentals.filter(r => r.status === 'completed');
  const totalSpent = completedRentals.reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const handlePhoneClick = (phone) => {
    if (window.confirm(`האם לחייג ל-${phone}?`)) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleDeleteRental = async () => {
    if (!rentalToDelete) return;
    try {
      await Rental.delete(rentalToDelete.id);
      onUpdate(); // Trigger data refresh
      setRentalToDelete(null); // Close confirm dialog
    } catch (error) {
      console.error("Error deleting rental:", error);
      // Optionally, show a toast notification for the error
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              פרטי לקוח
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Info */}
            <Card className="bg-slate-50/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-xl text-slate-800 mb-4">{customer.name}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-600">
                          <IdCard className="w-4 h-4" />
                          <span className="font-mono text-sm">{customer.id_number}</span>
                        </div>
                        <button
                          onClick={() => handlePhoneClick(customer.phone)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          <span className="font-mono text-sm">{customer.phone}</span>
                        </button>
                        {customer.document_url && (
                          <div className="flex items-center gap-2 text-blue-600 hover:underline">
                            <Upload className="w-4 h-4" />
                            <a href={customer.document_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium">
                              צפה במסמך
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{rentals.length}</p>
                        <p className="text-sm text-blue-800">השכרות</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{totalSpent}₪</p>
                        <p className="text-sm text-green-800">סה״כ הוצאות</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Rentals */}
            {activeRentals.length > 0 && (
              <Card className="bg-red-50/50 border-red-200">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    השכרות פעילות ({activeRentals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {activeRentals.map(rental => {
                      const vehicle = vehicles.find(v => v.id === rental.vehicle_id);
                      return (
                        <div key={rental.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                          <div className="flex items-center gap-3">
                            <Car className="w-4 h-4 text-red-500" />
                            <div>
                              <p className="font-medium text-red-900">
                                {vehicle ? `${vehicleTypeLabel(vehicle.type)} #${vehicle.serial_number}` : 'כלי לא ידוע'}
                              </p>
                              <p className="text-xs text-red-600">
                                התחיל: {format(new Date(rental.start_date), 'dd/MM HH:mm', { locale: he })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive" className="bg-red-500">
                            פעיל
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rental History */}
            <Card className="bg-slate-50/50">
              <CardHeader className="py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  היסטוריית השכרות ({completedRentals.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {completedRentals.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {completedRentals
                      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                      .map(rental => {
                        const vehicle = vehicles.find(v => v.id === rental.vehicle_id);
                        return (
                          <div key={rental.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Car className="w-4 h-4 text-slate-500" />
                              <div>
                                <p className="font-medium text-slate-800">
                                  {vehicle ? `${vehicleTypeLabel(vehicle.type)} #${vehicle.serial_number}` : 'כלי לא ידוע'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span>{format(new Date(rental.start_date), 'dd/MM/yy HH:mm', { locale: he })}</span>
                                  {rental.actual_duration && (
                                    <span>משך: {Math.floor(rental.actual_duration / 60)}:{(rental.actual_duration % 60).toString().padStart(2, '0')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-left">
                                <p className="font-semibold text-slate-800 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" />
                                  {rental.total_cost}₪
                                </p>
                                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                  הושלם
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setRentalToDelete(rental)}
                                className="text-red-500 hover:bg-red-100"
                                title="מחק רשומה"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">אין היסטוריית השכרות</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)} className="px-8">
                סגור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!rentalToDelete}
        onOpenChange={() => setRentalToDelete(null)}
        onConfirm={handleDeleteRental}
        title="מחיקת היסטוריית השכרה"
        description="האם אתה בטוח שברצונך למחוק את רשומת ההשכרה הזו? הפעולה אינה ניתנת לשחזור."
      />
    </>
  );
}
