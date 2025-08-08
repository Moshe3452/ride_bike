import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, IdCard, Phone, Upload, Car, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function CustomerDetails({ customer, rentals, vehicles }) {
  if (!customer) return null;

  const vehicleTypeLabel = (type) => type === 'bike' ? 'אופניים' : 'קורקינט';

  return (
    <div className="p-1 space-y-6 overflow-y-auto h-full pb-16">
      {/* Customer Info */}
      <Card className="bg-slate-50/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">{customer.name}</h3>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-slate-600">
              <IdCard className="w-4 h-4" />
              <span className="font-mono text-sm">{customer.id_number}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4" />
              <span className="font-mono text-sm">{customer.phone}</span>
            </div>
            {customer.document_url && (
              <div className="flex items-center gap-2 text-blue-600 hover:underline">
                <Upload className="w-4 h-4" />
                <a href={customer.document_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium">
                  צפה במסמך
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rental History */}
      <Card className="bg-slate-50/50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-700 mb-4">היסטוריית השכרות ({rentals.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {rentals.length > 0 ? rentals.map(rental => {
              const vehicle = vehicles.find(v => v.id === rental.vehicle_id);
              return (
                <div key={rental.id} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800 flex items-center gap-2">
                        <Car className="w-4 h-4 text-slate-500" />
                        {vehicle ? `${vehicleTypeLabel(vehicle.type)} #${vehicle.serial_number}` : 'כלי לא ידוע'}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(rental.start_date), 'dd/MM/yy HH:mm', { locale: he })}
                      </p>
                    </div>
                    <Badge variant={rental.status === 'completed' ? 'outline' : 'default'}>
                      {rental.status === 'completed' ? 'הושלמה' : 'פעילה'}
                    </Badge>
                  </div>
                  {rental.status === 'completed' && (
                    <div className="mt-2 text-xs text-slate-600 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>משך: {Math.floor(rental.actual_duration / 60)}:{(rental.actual_duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <span>עלות: {rental.total_cost}₪</span>
                    </div>
                  )}
                </div>
              )
            }) : (
              <p className="text-sm text-slate-500 text-center py-4">אין היסטוריית השכרות</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}