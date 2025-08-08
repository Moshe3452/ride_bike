import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Clock, User, Car, IdCard, Phone, Calendar, ArrowRight
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ActiveRentalsPage() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLocalData = () => {
      setIsLoading(true);
      try {
        const rentalsData = JSON.parse(localStorage.getItem("rentals")) || [];
        const customersData = JSON.parse(localStorage.getItem("customers")) || [];
        const vehiclesData = JSON.parse(localStorage.getItem("vehicles")) || [];
        setRentals(rentalsData.filter(r => r.status === "active"));
        setCustomers(customersData);
        setVehicles(vehiclesData);
      } catch (e) {
        console.error("שגיאה בטעינת הנתונים מהדפדפן", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocalData();
  }, []);

  const vehicleTypeLabels = {
    bike: "אופניים",
    electric_bike: "אופניים חשמליים",
    scooter: "קורקינט",
    electric_scooter: "קורקינט חשמלי",
  };

  const groupedRentals = rentals.reduce((acc, rental) => {
    const customer = customers.find(c => c.id === rental.customer_id);
    if (!customer) return acc;
    if (!acc[customer.id]) {
      acc[customer.id] = { customer, rentals: [] };
    }
    acc[customer.id].rentals.push(rental);
    return acc;
  }, {});

  const filteredGroups = Object.values(groupedRentals).filter(group => {
    const searchTerm = searchQuery.toLowerCase();
    return group.customer.name.toLowerCase().includes(searchTerm) ||
      group.customer.phone.includes(searchTerm) ||
      group.customer.id_number.includes(searchTerm);
  });

  const formatTimeLeft = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const handlePhoneClick = (phone) => {
    if (window.confirm(`האם לחייג ל-${phone}?`)) {
      window.location.href = `tel:${phone}`;
    }
  };

  const currentTime = new Date();

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Dashboard"))}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">השכרות פעילות</h1>
            <p className="text-slate-500 mt-1">צפייה בכל ההשכרות הפעילות במערכת</p>
          </div>
        </div>

        <Card className="mb-6 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="חיפוש לפי שם לקוח, טלפון או ת\"ז..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 h-12 text-base bg-white/80"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200 h-36 rounded-xl" />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-20 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600">{searchQuery ? "לא נמצאו לקוחות" : "אין השכרות פעילות"}</h3>
              <p className="text-slate-500 mt-2">{searchQuery ? "נסה מילת חיפוש אחרת" : "כל ההשכרות הוחזרו"}</p>
            </div>
          ) : (
            filteredGroups.map(({ customer, rentals }) => (
              <div key={customer.id} className="bg-white/70 backdrop-blur-sm border rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{customer.name}</h3>
                    <div className="flex gap-4 mt-1 text-sm">
                      <button onClick={() => handlePhoneClick(customer.phone)} className="text-blue-600 hover:underline">
                        <Phone className="w-4 h-4 inline" /> {customer.phone}
                      </button>
                      <span className="text-slate-500">
                        <IdCard className="w-4 h-4 inline" /> {customer.id_number}
                      </span>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-slate-100 rounded-lg">
                    <p className="text-xl font-bold text-slate-700">{rentals.length}</p>
                    <p className="text-xs text-slate-600">כלים מושכרים</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rentals.map(rental => {
                    const vehicle = vehicles.find(v => v.id === rental.vehicle_id);
                    if (!vehicle) return null;
                    const startTime = new Date(rental.start_date);
                    const elapsed = differenceInMinutes(currentTime, startTime);
                    const isOverdue = elapsed > rental.planned_duration;
                    const timeLeft = rental.planned_duration - elapsed;
                    return (
                      <div key={rental.id} className="p-3 bg-white rounded-lg border flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{format(startTime, "dd/MM HH:mm", { locale: he })}</p>
                          <p className="text-xs text-slate-500">
                            <Car className="w-3 h-3 inline" /> {vehicleTypeLabels[vehicle.type]} #{vehicle.serial_number}
                          </p>
                        </div>
                        <Badge className={`text-xs ${isOverdue ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                          <Clock className="w-3 h-3 ml-1" />
                          {isOverdue ? `חריגה ${formatTimeLeft(Math.abs(timeLeft))}` : `נותרו ${formatTimeLeft(timeLeft)}`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
