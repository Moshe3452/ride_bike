import React, { useState, useEffect } from "react";
import { Vehicle } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Car, Barcode, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function VehicleSelector({ onVehicleSelect, onBack }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forceOverride, setForceOverride] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    const availableVehicles = vehicles.filter(v => v.status === 'available');
    if (searchQuery.trim()) {
      const filtered = availableVehicles.filter(vehicle =>
        vehicle.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.type === 'bike' ? 'אופניים' : 'קורקינט').includes(searchQuery.toLowerCase())
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(availableVehicles);
    }
  }, [searchQuery, vehicles]);

  const loadVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await Vehicle.list("-created_date");
      setVehicles(data);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const vehicleTypeLabel = (type) => type === 'bike' ? 'אופניים' : 'קורקינט';

  const toggleVehicleSelection = (vehicle) => {
    setSelectedVehicles(prev => {
      const isSelected = prev.some(v => v.id === vehicle.id);
      if (isSelected) {
        return prev.filter(v => v.id !== vehicle.id);
      } else {
        return [...prev, vehicle];
      }
    });
  };

  const handleContinue = () => {
    if (selectedVehicles.length > 0) {
      onVehicleSelect(selectedVehicles);
    }
  };

  const hasAvailableVehicles = filteredVehicles.length > 0;
  const canShowForceOption = !hasAvailableVehicles && searchQuery.trim();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-600" />
          בחירת כלים ({selectedVehicles.length} נבחרו)
        </CardTitle>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 ml-2" />
          חזור
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search & Scan */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="חיפוש לפי מספר סידורי או סוג..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 text-lg"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button variant="outline" className="h-12 text-lg w-full sm:w-auto" disabled>
                    <Barcode className="w-5 h-5 ml-2" />
                    סרוק ברקוד
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>פונקציונליות סריקת ברקודים אינה זמינה כעת.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Force Override Option */}
        {canShowForceOption && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border border-orange-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-orange-800 font-medium mb-2">
                  אין כלים זמינים מסוג זה במלאי.
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="force-override"
                    checked={forceOverride}
                    onCheckedChange={setForceOverride}
                  />
                  <label
                    htmlFor="force-override"
                    className="text-sm text-orange-700 cursor-pointer"
                  >
                    אילוץ – אפשר השכרה גם ללא זמינות בפועל
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Continue Button */}
        {selectedVehicles.length > 0 && (
          <div className="flex justify-end">
            <Button 
              onClick={handleContinue}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              המשך עם {selectedVehicles.length} כלים
            </Button>
          </div>
        )}

        {/* Vehicles List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          <AnimatePresence>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200 h-20 rounded-xl" />
              ))
            ) : (hasAvailableVehicles || forceOverride) ? (
              (forceOverride ? vehicles : filteredVehicles).map((vehicle) => {
                const isSelected = selectedVehicles.some(v => v.id === vehicle.id);
                const isUnavailable = vehicle.status !== 'available';
                
                return (
                  <motion.div
                    key={vehicle.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 border rounded-xl transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : isUnavailable && forceOverride
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                    onClick={() => toggleVehicleSelection(vehicle)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-slate-500" />
                          <span className="font-semibold">{vehicleTypeLabel(vehicle.type)} #{vehicle.serial_number}</span>
                          {isSelected && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {isUnavailable && forceOverride && (
                            <Badge variant="destructive" className="text-xs">
                              לא זמין
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>{vehicle.hourly_rate}₪ לשעה</span>
                          {!isUnavailable ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              זמין להשכרה
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {vehicle.status === 'rented' ? 'מושכר' : 
                               vehicle.status === 'maintenance' ? 'בתיקון' : 'מושבת'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className={`w-6 h-6 border-2 rounded transition-colors ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-600' 
                          : 'border-slate-300'
                      }`}>
                        {isSelected && (
                          <Check className="w-full h-full text-white p-0.5" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600">
                  לא נמצאו כלים זמינים
                </h3>
                <p className="text-slate-500 mt-2">
                  נסה חיפוש אחר או השתמש באילוץ זמינות
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}