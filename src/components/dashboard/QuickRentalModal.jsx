import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  User, 
  Phone, 
  Car, 
  Clock, 
  Zap,
  AlertTriangle,
  Check,
  Plus,
  Minus,
  Bike
} from "lucide-react";
import { Customer, Vehicle, Rental } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";

const vehicleTypes = [
  { 
    type: 'scooter', 
    label: 'קורקינט רגיל', 
    icon: Car, 
    color: 'text-purple-600' 
  },
  { 
    type: 'electric_scooter', 
    label: 'קורקינט חשמלי', 
    icon: Zap, 
    color: 'text-orange-600' 
  },
  { 
    type: 'bike', 
    label: 'אופניים רגילים', 
    icon: Bike, 
    color: 'text-blue-600' 
  },
  { 
    type: 'electric_bike', 
    label: 'אופניים חשמליים', 
    icon: Zap, 
    color: 'text-green-600' 
  }
];

export default function QuickRentalModal({ open, onOpenChange, onRentalCreated }) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    isAnonymous: false
  });
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forceOverride, setForceOverride] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
      // Reset quantities when modal opens
      setSelectedQuantities({});
      setForceOverride(false);
    }
  }, [open]);

  useEffect(() => {
    if (formData.customerName.trim() && !formData.isAnonymous) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(formData.customerName.toLowerCase()) ||
        customer.phone.includes(formData.customerName)
      );
      setFilteredCustomers(filtered);
      setShowCustomerSuggestions(filtered.length > 0 && formData.customerName.length > 1);
    } else {
      setShowCustomerSuggestions(false);
    }
  }, [formData.customerName, customers, formData.isAnonymous]);

  const loadData = async () => {
    try {
      const [customersData, vehiclesData] = await Promise.all([
        Customer.list(),
        Vehicle.list()
      ]);
      setCustomers(customersData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const getAvailableCount = (type) => {
    return vehicles.filter(v => v.type === type && v.status === 'available').length;
  };

  const getTotalCount = (type) => {
    return vehicles.filter(v => v.type === type).length;
  };

  const handleQuantityChange = (type, quantity) => {
    const availableCount = getAvailableCount(type);
    const totalCount = getTotalCount(type);
    const maxAllowed = forceOverride ? totalCount : availableCount;
    
    const validQuantity = Math.max(0, Math.min(quantity, maxAllowed));
    
    setSelectedQuantities(prev => ({
      ...prev,
      [type]: validQuantity
    }));
  };

  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone
    }));
    setShowCustomerSuggestions(false);
  };

  const getSelectedVehicles = () => {
    const selectedVehicles = [];
    
    Object.entries(selectedQuantities).forEach(([type, quantity]) => {
      if (quantity > 0) {
        const availableVehicles = vehicles.filter(v => 
          v.type === type && (forceOverride || v.status === 'available')
        );
        
        // Take the requested quantity from available vehicles
        const vehiclesToAdd = availableVehicles.slice(0, quantity);
        selectedVehicles.push(...vehiclesToAdd);
      }
    });
    
    return selectedVehicles;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedVehicles = getSelectedVehicles();
    
    if (selectedVehicles.length === 0) return;

    setIsLoading(true);
    try {
      let customerId;
      
      // יצירת או איתור לקוח
      if (formData.isAnonymous) {
        const tempCustomer = await Customer.create({
          name: formData.customerName || `לקוח מזדמן ${Date.now()}`,
          phone: "000-0000000"
        });
        customerId = tempCustomer.id;
      } else {
        let existingCustomer = customers.find(c => 
          c.name.toLowerCase() === formData.customerName.toLowerCase() &&
          c.phone === formData.customerPhone
        );
        
        if (!existingCustomer) {
          existingCustomer = await Customer.create({
            name: formData.customerName,
            phone: formData.customerPhone
          });
        }
        customerId = existingCustomer.id;
      }

      // יצירת השכרות לכלים הנבחרים
      const startDateTime = new Date();
      const plannedDuration = 60; // ברירת מחדל של שעה אחת

      const rentalPromises = selectedVehicles.map(async (vehicle) => {
        const rental = await Rental.create({
          customer_id: customerId,
          vehicle_id: vehicle.id,
          start_date: startDateTime.toISOString(),
          planned_duration: plannedDuration,
          status: "active"
        });

        await Vehicle.update(vehicle.id, { status: "rented" });
        return rental;
      });

      await Promise.all(rentalPromises);
      
      // איפוס הטופס
      setFormData({
        customerName: "",
        customerPhone: "",
        isAnonymous: false
      });
      setSelectedQuantities({});
      setForceOverride(false);
      
      onRentalCreated();
    } catch (error) {
      console.error("Error creating quick rental:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSelectedVehicles = Object.values(selectedQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
  const totalCost = getSelectedVehicles().reduce((sum, vehicle) => sum + vehicle.hourly_rate, 0);
  const hasAnyUnavailable = vehicleTypes.some(vt => getAvailableCount(vt.type) === 0 && getTotalCount(vt.type) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-auto bg-white/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            השכרה מהירה
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* פרטי לקוח */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  isAnonymous: checked,
                  customerPhone: checked ? "" : prev.customerPhone
                }))}
              />
              <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                לקוח מזדמן (ללא פרטים)
              </Label>
            </div>

            <div className="space-y-2 relative">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                שם לקוח
              </Label>
              <Input
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder={formData.isAnonymous ? "לקוח מזדמן (אופציונלי)" : "הזן שם לקוח"}
                required={!formData.isAnonymous}
                className="h-12"
              />
              
              {/* הצעות לקוחות */}
              <AnimatePresence>
                {showCustomerSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg max-h-32 overflow-y-auto"
                  >
                    {filteredCustomers.slice(0, 5).map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <p className="font-medium text-slate-800">{customer.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{customer.phone}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!formData.isAnonymous && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  טלפון
                </Label>
                <Input
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="050-1234567"
                  required
                  className="h-12 font-mono"
                />
              </div>
            )}
          </div>

          {/* בחירת כלים לפי סוג וכמות */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              בחירת כלים ({totalSelectedVehicles} נבחרו)
            </Label>

            {/* Force Override Option */}
            {hasAnyUnavailable && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-orange-800 font-medium mb-2">
                      חלק מהכלים אינם זמינים כעת.
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="force-override"
                        checked={forceOverride}
                        onCheckedChange={setForceOverride}
                      />
                      <Label
                        htmlFor="force-override"
                        className="text-sm text-orange-700 cursor-pointer"
                      >
                        אילוץ – אפשר השכרה גם ללא זמינות בפועל
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Type Selection */}
            <div className="space-y-3 border rounded-lg p-4">
              {vehicleTypes.map(({ type, label, icon: Icon, color }) => {
                const availableCount = getAvailableCount(type);
                const totalCount = getTotalCount(type);
                const maxAllowed = forceOverride ? totalCount : availableCount;
                const currentQuantity = selectedQuantities[type] || 0;
                const isDisabled = maxAllowed === 0;

                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <div>
                        <p className="font-medium text-slate-800">{label}</p>
                        <p className="text-sm text-slate-500">
                          {forceOverride ? 
                            `${availableCount} זמינים, ${totalCount} סה״כ` : 
                            `${availableCount} זמינים`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(type, currentQuantity - 1)}
                        disabled={currentQuantity === 0 || isDisabled}
                        className="h-8 w-8"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className={`min-w-[2rem] text-center font-bold ${isDisabled ? 'text-slate-400' : 'text-slate-800'}`}>
                        {currentQuantity}
                      </span>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(type, currentQuantity + 1)}
                        disabled={currentQuantity >= maxAllowed || isDisabled}
                        className="h-8 w-8"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* סיכום ואישור */}
          {totalSelectedVehicles > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-800">עלות משוערת</p>
                    <p className="text-xl font-bold text-blue-900">{totalCost}₪</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-blue-800">{totalSelectedVehicles} כלים</p>
                    <p className="text-sm text-blue-600">שעה אחת</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* כפתורי פעולה */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={isLoading || totalSelectedVehicles === 0 || (!formData.isAnonymous && (!formData.customerName.trim() || !formData.customerPhone.trim()))}
              className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isLoading ? "יוצר השכרה..." : "אשר השכרה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}