import React, { useState, useEffect } from "react";
import { Customer, Vehicle, Rental } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CustomerSearch from "../components/newrental/CustomerSearch";
import VehicleSelector from "../components/newrental/VehicleSelector";
import RentalForm from "../components/newrental/RentalForm";

export default function NewRental() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [rentalData, setRentalData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    plannedHours: 1,
    plannedMinutes: 0
  });

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setStep(2);
  };

  const handleVehicleSelect = (vehicles) => {
    // Handle both single vehicle (backward compatibility) and multiple vehicles
    const vehiclesList = Array.isArray(vehicles) ? vehicles : [vehicles];
    setSelectedVehicles(vehiclesList);
    setStep(3);
  };

  const handleRentalSubmit = async (data) => {
    try {
      const startDateTime = new Date(`${data.date}T${data.time}`);
      const plannedDuration = (data.plannedHours * 60) + data.plannedMinutes;

      // Create separate rental for each vehicle
      const rentalPromises = selectedVehicles.map(async (vehicle) => {
        // Create rental
        const rental = await Rental.create({
          customer_id: selectedCustomer.id,
          vehicle_id: vehicle.id,
          start_date: startDateTime.toISOString(),
          planned_duration: plannedDuration,
          status: "active"
        });

        // Update vehicle status
        await Vehicle.update(vehicle.id, { 
          status: "rented" 
        });

        return rental;
      });

      await Promise.all(rentalPromises);
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error creating rentals:", error);
    }
  };

  const steps = [
    { number: 1, title: "בחירת לקוח", completed: selectedCustomer !== null },
    { number: 2, title: "בחירת כלים", completed: selectedVehicles.length > 0 },
    { number: 3, title: "פרטי השכרה", completed: false }
  ];

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">השכרה חדשה</h1>
            <p className="text-slate-500 mt-1">יצירת השכרה חדשה במערכת</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {steps.map((stepItem, index) => (
              <React.Fragment key={stepItem.number}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step === stepItem.number
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                        : stepItem.completed
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {stepItem.number}
                  </div>
                  <span
                    className={`hidden sm:block text-sm font-medium ${
                      step === stepItem.number || stepItem.completed
                        ? "text-slate-800"
                        : "text-slate-500"
                    }`}
                  >
                    {stepItem.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-slate-200" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {step === 1 && (
            <CustomerSearch onCustomerSelect={handleCustomerSelect} />
          )}
          
          {step === 2 && (
            <VehicleSelector 
              onVehicleSelect={handleVehicleSelect}
              onBack={() => setStep(1)}
            />
          )}
          
          {step === 3 && (
            <RentalForm
              customer={selectedCustomer}
              vehicles={selectedVehicles}
              rentalData={rentalData}
              setRentalData={setRentalData}
              onSubmit={handleRentalSubmit}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}