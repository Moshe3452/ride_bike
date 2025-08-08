
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
import { UploadFile } from "@/api/integrations";
import { Upload, Bike, Zap } from "lucide-react";

const vehicleTypeIcons = {
  bike: { icon: Bike, label: "אופניים רגילים", color: "text-blue-600" },
  electric_bike: { icon: Zap, label: "אופניים חשמליים", color: "text-green-600" },
  scooter: { icon: Bike, label: "קורקינט רגיל", color: "text-purple-600" },
  electric_scooter: { icon: Zap, label: "קורקינט חשמלי", color: "text-orange-600" }
};

export default function NewVehicleDialog({ open, onOpenChange, onVehicleCreated }) {
  const [formData, setFormData] = useState({
    serial_number: "",
    type: "bike",
    hourly_rate: "",
    daily_rate: "",
    barcode: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      let imageUrl = null;
      
      if (imageFile) {
        const uploadResult = await UploadFile({ file: imageFile });
        imageUrl = uploadResult.file_url;
      }

      const vehicleData = {
        ...formData,
        hourly_rate: parseFloat(formData.hourly_rate),
        daily_rate: parseFloat(formData.daily_rate) || 0,
        image_url: imageUrl
      };
      
      const newVehicle = await Vehicle.create(vehicleData);
      onVehicleCreated(newVehicle);
      onOpenChange(false);
      setFormData({ serial_number: "", type: "bike", hourly_rate: "", daily_rate: "", barcode: "" });
      setImageFile(null);
    } catch (error) {
      console.error("Error creating vehicle:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedVehicleType = vehicleTypeIcons[formData.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-white/95 backdrop-blur-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <selectedVehicleType.icon className={`w-5 h-5 ${selectedVehicleType.color}`} />
            הוספת כלי חדש
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="serial_number">מספר סידורי</Label>
            <Input 
              id="serial_number" 
              value={formData.serial_number} 
              onChange={(e) => setFormData(prev => ({...prev, serial_number: e.target.value}))} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">סוג כלי</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}>
              <SelectTrigger id="type">
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">מחיר לשעה (₪)</Label>
              <Input 
                id="hourly_rate" 
                type="number" 
                value={formData.hourly_rate} 
                onChange={(e) => setFormData(prev => ({...prev, hourly_rate: e.target.value}))} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_rate">מחיר ליום (₪)</Label>
              <Input 
                id="daily_rate" 
                type="number" 
                value={formData.daily_rate} 
                onChange={(e) => setFormData(prev => ({...prev, daily_rate: e.target.value}))} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="barcode">ברקוד (אופציונלי)</Label>
            <Input 
              id="barcode" 
              value={formData.barcode} 
              onChange={(e) => setFormData(prev => ({...prev, barcode: e.target.value}))} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              תמונת כלי (אופציונלי)
            </Label>
            <Input
              id="image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "מוסיף..." : "הוסף כלי"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
