
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, Calendar, Clock, CreditCard, Save, Edit, Bike, Zap, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Vehicle, Rental } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import ConfirmDialog from '../shared/ConfirmDialog';

const vehicleTypeIcons = {
  bike: { icon: Bike, label: "אופניים רגילים", color: "text-blue-600" },
  electric_bike: { icon: Zap, label: "אופניים חשמליים", color: "text-green-600" },
  scooter: { icon: Bike, label: "קורקינט רגיל", color: "text-purple-600" },
  electric_scooter: { icon: Zap, label: "קורקינט חשמלי", color: "text-orange-600" }
};

export default function VehicleDetailsModal({
  vehicle,
  rentals,
  open,
  onOpenChange,
  onUpdate
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [rentalToDelete, setRentalToDelete] = useState(null);

  React.useEffect(() => {
    if (vehicle) {
      setEditData({
        serial_number: vehicle.serial_number,
        type: vehicle.type,
        hourly_rate: vehicle.hourly_rate,
        daily_rate: vehicle.daily_rate || 0,
        status: vehicle.status,
        barcode: vehicle.barcode || '',
        image_url: vehicle.image_url || ''
      });
      setIsEditing(false); // Reset editing state when vehicle changes
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const vehicleTypeData = vehicleTypeIcons[vehicle.type] || vehicleTypeIcons.bike;

  const statusMap = {
    available: { label: "זמין", color: "bg-green-100 text-green-800 border-green-200" },
    rented: { label: "בהשכרה", color: "bg-red-100 text-red-800 border-red-200" },
    maintenance: { label: "בתיקון", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    disabled: { label: "מושבת", color: "bg-gray-100 text-gray-800 border-gray-200" },
  };

  const activeRentals = rentals.filter(r => r.status === 'active');
  const completedRentals = rentals.filter(r => r.status === 'completed');
  const totalRevenue = completedRentals.reduce((sum, r) => sum + (r.total_cost || 0), 0);
  const totalHours = completedRentals.reduce((sum, r) => sum + (r.actual_duration || 0), 0) / 60;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let updatedData = {
        ...editData,
        hourly_rate: parseFloat(editData.hourly_rate),
        daily_rate: parseFloat(editData.daily_rate)
      };

      if (imageFile) {
        const uploadResult = await UploadFile({ file: imageFile });
        updatedData.image_url = uploadResult.file_url;
      }

      await Vehicle.update(vehicle.id, updatedData);
      setIsEditing(false);
      setImageFile(null);
      onUpdate();
    } catch (error) {
      console.error("Error updating vehicle:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRental = async () => {
    if (!rentalToDelete) return;
    try {
      await Rental.delete(rentalToDelete.id);
      onUpdate(); // Trigger a re-fetch of rentals or update parent state
      setRentalToDelete(null); // Close the confirmation dialog
    } catch (error) {
      console.error("Error deleting rental:", error);
      // Handle error, e.g., show a toast notification
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                  <vehicleTypeData.icon className={`w-6 h-6 ${vehicleTypeData.color}`} />
                </div>
                פרטי כלי
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? 'ביטול' : 'עריכה'}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Vehicle Info */}
            <Card className="bg-slate-50/50">
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>מספר סידורי</Label>
                      <Input
                        value={editData.serial_number}
                        onChange={(e) => setEditData(prev => ({ ...prev, serial_number: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>סוג כלי</Label>
                      <Select
                        value={editData.type}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, type: value }))}
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
                    <div className="space-y-2">
                      <Label>מחיר לשעה (₪)</Label>
                      <Input
                        type="number"
                        value={editData.hourly_rate}
                        onChange={(e) => setEditData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>מחיר ליום (₪)</Label>
                      <Input
                        type="number"
                        value={editData.daily_rate}
                        onChange={(e) => setEditData(prev => ({ ...prev, daily_rate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>סטטוס</Label>
                      <Select
                        value={editData.status}
                        onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">זמין</SelectItem>
                          <SelectItem value="rented">בהשכרה</SelectItem>
                          <SelectItem value="maintenance">בתיקון</SelectItem>
                          <SelectItem value="disabled">מושבת</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>ברקוד</Label>
                      <Input
                        value={editData.barcode}
                        onChange={(e) => setEditData(prev => ({ ...prev, barcode: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="image" className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        תמונת כלי
                      </Label>
                      <Input
                        id="image"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        className="file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {vehicle.image_url && (
                        <div className="mt-2">
                          <img
                            src={vehicle.image_url}
                            alt="תמונת כלי"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        ביטול
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4 ml-2" />
                        {isSaving ? 'שומר...' : 'שמור'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
                          <vehicleTypeData.icon className={`w-5 h-5 ${vehicleTypeData.color}`} />
                          {vehicleTypeData.label} #{vehicle.serial_number}
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">סטטוס:</span>
                            <Badge className={statusMap[vehicle.status]?.color}>
                              {statusMap[vehicle.status]?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">מחיר לשעה:</span>
                            <span className="font-semibold">{vehicle.hourly_rate}₪</span>
                          </div>
                          {vehicle.daily_rate && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">מחיר ליום:</span>
                              <span className="font-semibold">{vehicle.daily_rate}₪</span>
                            </div>
                          )}
                          {vehicle.barcode && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">ברקוד:</span>
                              <span className="font-mono text-sm">{vehicle.barcode}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {vehicle.image_url && (
                        <div className="text-center">
                          <img
                            src={vehicle.image_url}
                            alt="תמונת כלי"
                            className="w-32 h-32 object-cover rounded-lg border mx-auto shadow-sm"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{rentals.length}</p>
                          <p className="text-sm text-blue-800">השכרות</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{totalRevenue}₪</p>
                          <p className="text-sm text-green-800">הכנסות</p>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{Math.round(totalHours)}</p>
                        <p className="text-sm text-purple-800">שעות השכרה</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rental History Card - NEW */}
            {!isEditing && (
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
                        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                        .map(rental => (
                          <div key={rental.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="text-sm text-slate-500">
                                {format(new Date(rental.start_date), 'dd/MM/yy HH:mm', { locale: he })}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                                <span>משך: {Math.floor(rental.actual_duration / 60)}:{(rental.actual_duration % 60).toString().padStart(2, '0')}</span>
                                <span>עלות: {rental.total_cost}₪</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                הושלם
                              </Badge>
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
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">אין היסטוריית השכרות</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Active Rentals */}
            {activeRentals.length > 0 && !isEditing && (
              <Card className="bg-red-50/50 border-red-200">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    השכרות פעילות ({activeRentals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {activeRentals.map(rental => (
                      <div key={rental.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium text-red-900">לקוח #{rental.customer_id}</p>
                          <p className="text-xs text-red-600">
                            התחיל: {format(new Date(rental.start_date), 'dd/MM HH:mm', { locale: he })}
                          </p>
                        </div>
                        <Badge variant="destructive" className="bg-red-500">
                          פעיל
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex justify-end">
                <Button onClick={() => onOpenChange(false)} className="px-8">
                  סגור
                </Button>
              </div>
            )}
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
