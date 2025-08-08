import React, { useState, useEffect } from "react";
import { Rental, Customer, Vehicle } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Clock, 
  User, 
  Car,
  IdCard,
  Phone,
  Calendar,
  ArrowRight
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RentalDetailsDialog from "../components/dashboard/RentalDetailsDialog";
import { AnimatePresence, motion } from "framer-motion";

export default function ActiveRentalsPage() {
  const navigate = useNavigate();
  const [activeRentals, setActiveRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rentalsData, customersData, vehiclesData] = await Promise.all([
        Rental.list("-created_date"),
        Customer.list(),
        Vehicle.list()
      ]);
      
      setActiveRentals(rentalsData.filter(r => r.status === 'active'));
      setCustomers(customersData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTime = new Date();
  
  const vehicleTypeLabels = {
    bike: "אופניים",
    electric_bike: "אופניים חשמליים", 
    scooter: "קורקינט",
    electric_scooter: "קורקינט חשמלי",
  };

  // Group rentals by customer
  const groupedRentals = activeRentals.reduce((acc, rental) => {
    const customer = customers.find(c => c.id === rental.customer_id);
    if (!customer) return acc;
    
    if (!acc[customer.id]) {
      acc[customer.id] = {
        customer,
        rentals: []
      };
    }
    acc[customer.id].rentals.push(rental);
    return acc;
  }, {});

  // Filter based on search
  const filteredGroups = Object.values(groupedRentals).filter(group => {
    const searchTerm = searchQuery.toLowerCase();
    return group.customer.name.toLowerCase().includes(searchTerm) ||
           group.customer.phone.includes(searchTerm) ||
           group.customer.id_number.includes(searchTerm);
  });

  const formatTimeLeft = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString()}:${mins.toString().padStart(2, '0')}`;
  };

  const handlePhoneClick = (phone) => {
    if (window.confirm(`האם לחייג ל-${phone}?`)) {
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <>
      <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
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
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">השכרות פעילות</h1>
              <p className="text-slate-500 mt-1">צפייה בכל ההשכרות הפעילות במערכת</p>
            </div>
          </div>

          {/* Search */}
          <Card className="mb-6 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="חיפוש לפי שם לקוח, טלפון או ת״ז..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-12 h-12 text-base bg-white/80"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Cards */}
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
                <h3 className="text-xl font-semibold text-slate-600">
                  {searchQuery ? "לא נמצאו לקוחות" : "אין השכרות פעילות"}
                </h3>
                <p className="text-slate-500 mt-2">
                  {searchQuery ? "נסה מילת חיפוש אחרת" : "כל ההשכרות הוחזרו בהצלחה"}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredGroups.map(({ customer, rentals }) => {
                  const hasOverdue = rentals.some(rental => {
                    const startTime = new Date(rental.start_date);
                    const elapsedMinutes = differenceInMinutes(currentTime, startTime);
                    return elapsedMinutes > rental.planned_duration;
                  });

                  return (
                    <motion.div
                      key={customer.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`bg-white/70 backdrop-blur-sm border rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ${
                        hasOverdue ? 'border-red-300' : 'border-slate-200/60'
                      }`}
                    >
                      <div 
                        className="p-6 cursor-pointer"
                        onClick={() => setSelectedCustomer({ customer, rentals })}
                      >
                        {/* Customer Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center ${hasOverdue ? 'from-red-100 to-orange-100' : ''}`}>
                              <User className={`w-6 h-6 ${hasOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-800">{customer.name}</h3>
                              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePhoneClick(customer.phone);
                                  }}
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <Phone className="w-4 h-4" />
                                  <span className="font-mono text-sm">{customer.phone}</span>
                                </button>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <IdCard className="w-4 h-4" />
                                  <span className="font-mono text-sm">{customer.id_number}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center p-3 bg-slate-100 rounded-lg w-full sm:w-auto">
                            <p className="text-xl font-bold text-slate-700">{rentals.length}</p>
                            <p className="text-xs text-slate-600">כלים מושכרים</p>
                          </div>
                        </div>

                        {/* Rentals Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {rentals.map(rental => {
                            const vehicle = vehicles.find(v => v.id === rental.vehicle_id);
                            if (!vehicle) return null;

                            const startTime = new Date(rental.start_date);
                            const elapsedMinutes = differenceInMinutes(currentTime, startTime);
                            const plannedMinutes = rental.planned_duration;
                            const isOverdue = elapsedMinutes > plannedMinutes;
                            const timeLeft = plannedMinutes - elapsedMinutes;

                            return (
                              <div key={rental.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-slate-500" />
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">
                                      {format(startTime, "dd/MM HH:mm", { locale: he })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Car className="w-3 h-3 text-slate-500" />
                                      <span className="text-xs text-slate-600">
                                        {vehicleTypeLabels[vehicle.type]} #{vehicle.serial_number}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Badge 
                                  className={`text-xs px-2 py-1 ${
                                    isOverdue 
                                      ? "bg-red-100 text-red-800 border-red-200" 
                                      : "bg-green-100 text-green-800 border-green-200"
                                  }`}
                                >
                                  <Clock className="w-3 h-3 ml-1" />
                                  {isOverdue ? 
                                    `חריגה ${formatTimeLeft(Math.abs(timeLeft))}` : 
                                    `נותרו ${formatTimeLeft(timeLeft)}`
                                  }
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {selectedCustomer && (
        <RentalDetailsDialog
          open={!!selectedCustomer}
          onOpenChange={(isOpen) => !isOpen && setSelectedCustomer(null)}
          rental={selectedCustomer.rentals[0]}
          customer={selectedCustomer.customer}
          vehicle={vehicles.find(v => v.id === selectedCustomer.rentals[0]?.vehicle_id)}
          allActiveRentals={activeRentals}
          vehicles={vehicles}
          onUpdate={() => {
            loadData();
            setSelectedCustomer(null);
          }}
        />
      )}
    </>
  );
}