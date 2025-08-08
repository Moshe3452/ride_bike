import React, { useState, useEffect, useRef } from "react";
import { Rental, Customer, Vehicle, CompanySettings } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus,
  Search,
  Clock,
  Users,
  Car,
  TrendingUp,
  Calendar,
  MapPin,
  Zap } from
"lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { he } from "date-fns/locale";
import StatsCard from "../components/dashboard/StatsCard";
import OverdueRentalsTable from "../components/dashboard/OverdueRentalsTable";
import RentalDetailsDialog from "../components/dashboard/RentalDetailsDialog";
import CustomerDetailsModal from "../components/customers/CustomerDetailsModal";
import QuickRentalButton from "../components/dashboard/QuickRentalButton";
import RentedToolsModal from "../components/dashboard/RentedToolsModal";
import ActiveCustomersModal from "../components/dashboard/ActiveCustomersModal";

export default function Dashboard() {
  const [activeRentals, setActiveRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState(null);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState(null);
  const [isRentedToolsModalOpen, setIsRentedToolsModalOpen] = useState(false);
  const [isActiveCustomersModalOpen, setIsActiveCustomersModalOpen] = useState(false);

  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData(); // Initial load
  }, []);

  // Auto-refresh data every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Pause refresh if a modal is open to avoid interrupting user actions
      if (!selectedRental && !isRentedToolsModalOpen && !isActiveCustomersModalOpen && !selectedCustomerForModal) {
        loadData(true); // Perform a background refresh
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [selectedRental, isRentedToolsModalOpen, isActiveCustomersModalOpen, selectedCustomerForModal]); // Rerun effect if modal state changes

  const loadData = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setIsLoading(true);
      }
      const [rentalsData, customersData, vehiclesData, settingsData] = await Promise.all([
      Rental.list("-created_date"),
      Customer.list(),
      Vehicle.list(),
      CompanySettings.list()]
      );

      setActiveRentals(rentalsData.filter((r) => r.status === 'active'));
      setCustomers(customersData);
      setVehicles(vehiclesData);
      setCompanySettings(settingsData[0] || null);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      // Only set loading to false if it was a full page load, not a background refresh
      if (!isBackgroundRefresh) {
        setIsLoading(false);
      }
    }
  };

  const handleQuickRentalCreated = () => {
    loadData(); // Refresh the data after quick rental creation
  };

  const filteredRentals = activeRentals.filter((rental) => {
    const customer = customers.find((c) => c.id === rental.customer_id);
    const vehicle = vehicles.find((v) => v.id === rental.vehicle_id);
    const searchTerm = searchQuery.toLowerCase();

    return customer?.name.toLowerCase().includes(searchTerm) ||
    customer?.phone.includes(searchTerm) ||
    vehicle?.serial_number.toLowerCase().includes(searchTerm);
  });

  const groupedActiveRentals = filteredRentals.reduce((acc, rental) => {
    const customer = customers.find((c) => c.id === rental.customer_id);
    if (!customer) return acc;
    if (!acc[customer.id]) {
      acc[customer.id] = {
        customer: customer,
        rentals: []
      };
    }
    acc[customer.id].rentals.push(rental);
    return acc;
  }, {});

  const activeCustomerIds = new Set(activeRentals.map(r => r.customer_id));

  const stats = {
    rentedTools: activeRentals.length,
    activeCustomers: activeCustomerIds.size,
    availableVehicles: vehicles.filter((v) => v.status === "available").length
  };

  const currentTime = new Date();

  const vehicleTypeLabels = {
    bike: "אופניים",
    electric_bike: "אופניים חשמליים",
    scooter: "קורקינט",
    electric_scooter: "קורקינט חשמלי"
  };

  const formatTimeLeft = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const sign = minutes < 0 ? "-" : "";
    return `${sign}${Math.abs(hours).toString()}:${Math.abs(mins).toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              {/* Company Info - Mobile First */}
              <div className="flex items-center gap-3">
                <Link to={createPageUrl("")} className="flex items-center gap-3">
                  {companySettings?.logo_url &&
                  <img
                    src={companySettings.logo_url}
                    alt="לוגו החברה"
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover shadow-lg" />

                  }
                  <div>
                    <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      {companySettings?.company_name || "השכרה בקליק"}
                    </h1>
                  </div>
                </Link>
              </div>
              
              {/* Date & Time - Mobile Below Company Name */}
              <div className="flex flex-row items-center gap-3 sm:gap-4 text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="text-base lg:text-lg font-semibold">
                    {format(currentTime, "EEEE, d MMMM yyyy", { locale: he })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="text-xl lg:text-2xl font-bold font-mono bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {format(currentTime, "HH:mm")}
                  </span>
                </div>
              </div>
            </div>
            
            <Link to={createPageUrl("NewRental")}>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl">
                <Plus className="w-4 h-4 ml-2" />
                השכרה חדשה
              </Button>
            </Link>
          </div>

          {/* Overdue Rentals Table */}
          <OverdueRentalsTable
            activeRentals={activeRentals}
            customers={customers}
            vehicles={vehicles}
            onUpdate={loadData}
          />

          {/* Stats Cards - Single Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            <StatsCard
              title="כלים בהשכרה"
              value={stats.rentedTools}
              icon={Car}
              color="blue"
              trend="לחץ לצפייה"
              onClick={() => setIsRentedToolsModalOpen(true)}
            />

            <StatsCard
              title="לקוחות פעילים"
              value={stats.activeCustomers}
              icon={Users}
              color="green"
              trend="לחץ לצפייה"
              onClick={() => setIsActiveCustomersModalOpen(true)}
            />

            <StatsCard
              title="כלים זמינים"
              value={stats.availableVehicles}
              icon={Car}
              color="purple"
              trend={`מתוך ${vehicles.length}`}
              onClick={() => navigate(createPageUrl("Vehicles?status=available"))}
            />
          </div>

          {/* Search Bar */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Search className="w-5 h-5 text-slate-600" />
                    חיפוש מהיר
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  ref={searchRef}
                  placeholder="חיפוש לפי שם לקוח, טלפון או מספר כלי..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/60 px-3 py-2 text-lg flex w-full rounded-md border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-slate-200 focus:border-blue-300 focus:ring-blue-200 h-12 pr-12"
                />
              </div>
            </CardContent>
          </Card>

          {/* Active Rentals Table */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader className="flex flex-col space-y-1.5 p-6 border-b border-slate-200/60">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="w-5 h-5 text-blue-600" />
                <Link
                  to={createPageUrl("ActiveRentals")}
                  className="hover:text-blue-600 transition-colors cursor-pointer">
                  השכרות פעילות ({filteredRentals.length})
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
                        <div className="space-y-1">
                          <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
                          <div className="w-20 h-3 bg-slate-200 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-slate-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-sm table-fixed">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-right py-3 px-4 font-medium text-slate-600 w-1/3">שם לקוח</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600 w-1/3">כלי מושכר</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600 w-1/4">תאריך פתיחה</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600 w-1/4">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(groupedActiveRentals)
                        .sort((a, b) => new Date(a.rentals[0]?.start_date) - new Date(b.rentals[0]?.start_date))
                        .map(({ customer, rentals }) =>
                        rentals.map((rental, index) => {
                          const vehicle = vehicles.find((v) => v.id === rental.vehicle_id);
                          const startTime = new Date(rental.start_date);
                          const elapsedMinutes = differenceInMinutes(currentTime, startTime);
                          const plannedMinutes = rental.planned_duration;
                          const isOverdue = elapsedMinutes > plannedMinutes;
                          const timeLeft = plannedMinutes - elapsedMinutes;

                          return (
                            <tr
                              key={rental.id}
                              onClick={() => setSelectedRental(rental)}
                              className="border-b border-slate-100 last:border-0 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-4 truncate">
                                <div className="font-medium text-slate-800">
                                  {customer.name}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                  {customer.phone}
                                </div>
                              </td>
                              <td className="py-3 px-4 truncate">
                                <div className="font-medium text-slate-800">
                                  {vehicleTypeLabels[vehicle?.type] || "לא ידוע"} #{vehicle?.serial_number}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {vehicle?.hourly_rate}₪ לשעה
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono text-sm">
                                {format(startTime, "dd/MM HH:mm", { locale: he })}
                              </td>
                              <td className="py-3 px-4">
                                <Badge 
                                  className={`text-xs px-2 py-1 whitespace-nowrap h-fit ${
                                    isOverdue 
                                      ? "bg-red-100 text-red-800 border-red-200" 
                                      : "bg-green-100 text-green-800 border-green-200"
                                  }`}
                                >
                                  <Clock className="w-3 h-3 ml-1" />
                                  {isOverdue ? 
                                    `חריגה של ${formatTimeLeft(timeLeft)}` : 
                                    `נותרו ${formatTimeLeft(timeLeft)}`
                                  }
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {!isLoading && filteredRentals.length === 0 && (
                <div className="text-center py-16">
                  <Clock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600">אין השכרות פעילות</h3>
                  <p className="text-slate-500 mt-2">
                    {searchQuery.trim() ? "לא נמצאו תוצאות לחיפוש שלך." : "כל הכלים זמינים כעת!"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Quick Rental Button */}
      <QuickRentalButton onRentalCreated={handleQuickRentalCreated} />

      {selectedRental &&
        <RentalDetailsDialog
          open={!!selectedRental}
          onOpenChange={(isOpen) => !isOpen && setSelectedRental(null)}
          rental={selectedRental}
          customer={customers.find((c) => c.id === selectedRental.customer_id)}
          vehicle={vehicles.find((v) => v.id === selectedRental.vehicle_id)}
          allActiveRentals={activeRentals}
          vehicles={vehicles}
          onUpdate={() => {
            loadData();
            setSelectedRental(null);
          }}
        />
      }
      
      {selectedCustomerForModal &&
        <CustomerDetailsModal
          open={!!selectedCustomerForModal}
          onOpenChange={(isOpen) => !isOpen && setSelectedCustomerForModal(null)}
          customer={selectedCustomerForModal}
          rentals={activeRentals.filter(r => r.customer_id === selectedCustomerForModal.id)}
          vehicles={vehicles}
          onUpdate={loadData}
        />
      }

      <RentedToolsModal
        open={isRentedToolsModalOpen}
        onOpenChange={setIsRentedToolsModalOpen}
        rentals={activeRentals}
        customers={customers}
        vehicles={vehicles}
        onSelectRental={(rental) => {
          setIsRentedToolsModalOpen(false);
          setSelectedRental(rental);
        }}
      />
      
      <ActiveCustomersModal
        open={isActiveCustomersModalOpen}
        onOpenChange={setIsActiveCustomersModalOpen}
        rentals={activeRentals}
        customers={customers}
        onSelectCustomer={(customer) => {
          setIsActiveCustomersModalOpen(false);
          setSelectedCustomerForModal(customer);
        }}
      />
    </>
  );
}