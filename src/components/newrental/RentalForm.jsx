import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, User, Car, Clock, Calendar, Hash } from "lucide-react";
import { motion } from "framer-motion";

export default function RentalForm({ customer, vehicles, rentalData, setRentalData, onSubmit, onBack }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle both single vehicle (backward compatibility) and multiple vehicles
  const vehiclesList = Array.isArray(vehicles) ? vehicles : [vehicles];
  
  const totalDurationMinutes = (rentalData.plannedHours * 60) + rentalData.plannedMinutes;
  const totalCost = vehiclesList.reduce((sum, vehicle) => {
    return sum + (Math.ceil(totalDurationMinutes / 60) * vehicle.hourly_rate);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(rentalData);
    setIsSubmitting(false);
  };

  const vehicleTypeLabel = (type) => type === 'bike' ? 'אופניים' : 'קורקינט';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            אישור פרטי השכרה
          </CardTitle>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            חזור
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-4 h-4" /> לקוח
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-slate-800">{customer.name}</p>
                  <p className="text-sm text-slate-600 font-mono">{customer.phone}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-4 h-4" /> כלים ({vehiclesList.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {vehiclesList.map((vehicle, index) => (
                    <div key={vehicle.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{vehicleTypeLabel(vehicle.type)}</p>
                        <p className="text-sm text-slate-600 font-mono">#{vehicle.serial_number}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {vehicle.hourly_rate}₪/ש׳
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> תאריך
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={rentalData.date}
                    onChange={(e) => setRentalData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> שעת התחלה
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={rentalData.time}
                    onChange={(e) => setRentalData(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4" /> זמן מתוכנן
                </Label>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Input
                      type="number"
                      min="0"
                      value={rentalData.plannedHours}
                      onChange={(e) => setRentalData(prev => ({ ...prev, plannedHours: parseInt(e.target.value) || 0 }))}
                      required
                    />
                    <Label className="text-xs text-slate-500">שעות</Label>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      step="15"
                      value={rentalData.plannedMinutes}
                      onChange={(e) => setRentalData(prev => ({ ...prev, plannedMinutes: parseInt(e.target.value) || 0 }))}
                      required
                    />
                    <Label className="text-xs text-slate-500">דקות</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Cost & Submit */}
            <div className="bg-blue-50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-right">
                <p className="text-sm text-blue-800">עלות משוערכת כוללת</p>
                <p className="text-2xl font-bold text-blue-900">{totalCost}₪</p>
                <p className="text-xs text-blue-600">{vehiclesList.length} כלים</p>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || totalDurationMinutes <= 0}
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl text-lg px-8 py-6"
              >
                {isSubmitting ? "יוצר השכרות..." : "התחל השכרות"}
                <CheckCircle className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}