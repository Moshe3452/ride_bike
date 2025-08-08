
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Vehicle } from "@/api/entities";
import { Plus, Save, Trash2, Bike, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const vehicleTypeIcons = {
  bike: { icon: Bike, label: "אופניים רגילים", color: "text-blue-600" },
  electric_bike: { icon: Zap, label: "אופניים חשמליים", color: "text-green-600" },
  scooter: { icon: Bike, label: "קורקינט רגיל", color: "text-purple-600" },
  electric_scooter: { icon: Zap, label: "קורקינט חשמלי", color: "text-orange-600" }
};

export default function BulkAddVehiclesDialog({ open, onOpenChange, onVehiclesCreated }) {
  const [vehicles, setVehicles] = useState([
    { serial_number: "", type: "bike", hourly_rate: "", status: "available" }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const addRow = () => {
    setVehicles([...vehicles, { serial_number: "", type: "bike", hourly_rate: "", status: "available" }]);
  };

  const removeRow = (index) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, i) => i !== index));
    }
  };

  const updateVehicle = (index, field, value) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const validVehicles = vehicles.filter(v => 
        v.serial_number.trim() && v.hourly_rate && parseFloat(v.hourly_rate) > 0
      );
      
      if (validVehicles.length === 0) {
        alert("יש להזין לפחות כלי אחד תקין");
        return;
      }

      const vehiclePromises = validVehicles.map(vehicleData => 
        Vehicle.create({
          ...vehicleData,
          hourly_rate: parseFloat(vehicleData.hourly_rate),
          daily_rate: 0
        })
      );
      
      const createdVehicles = await Promise.all(vehiclePromises);
      onVehiclesCreated(createdVehicles);
      onOpenChange(false);
      setVehicles([{ serial_number: "", type: "bike", hourly_rate: "", status: "available" }]);
    } catch (error) {
      console.error("Error creating vehicles:", error);
      alert("שגיאה ביצירת הכלים. נסה שוב.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            הוספה מרובה של כלים
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-200 font-medium text-slate-700">
                  <div className="col-span-3">מזהה</div>
                  <div className="col-span-3">סוג</div>
                  <div className="col-span-2">מחיר לשעה</div>
                  <div className="col-span-2">סטטוס</div>
                  <div className="col-span-2">פעולות</div>
                </div>

                {/* Vehicle Rows */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {vehicles.map((vehicle, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center p-3 bg-slate-50 rounded-lg">
                      <div className="col-span-3">
                        <Input
                          value={vehicle.serial_number}
                          onChange={(e) => updateVehicle(index, 'serial_number', e.target.value)}
                          placeholder="מספר סידורי"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <Select 
                          value={vehicle.type} 
                          onValueChange={(value) => updateVehicle(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(vehicleTypeIcons).map(([value, { icon: Icon, label, color }]) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  <Icon className={`w-4 h-4 ${color}`} />
                                  {label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={vehicle.hourly_rate}
                          onChange={(e) => updateVehicle(index, 'hourly_rate', e.target.value)}
                          placeholder="₪"
                          min="1"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Select 
                          value={vehicle.status} 
                          onValueChange={(value) => updateVehicle(index, 'status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">זמין</SelectItem>
                            <SelectItem value="maintenance">בתיקון</SelectItem>
                            <SelectItem value="disabled">מושבת</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRow(index)}
                          disabled={vehicles.length === 1}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Row Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRow}
                  className="w-full border-dashed border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף שורה
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isCreating}>
              <Save className="w-4 h-4 ml-2" />
              {isCreating ? "שומר..." : `שמור ${vehicles.filter(v => v.serial_number.trim()).length} כלים`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
