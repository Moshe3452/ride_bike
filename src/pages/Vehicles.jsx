
import React, { useState, useEffect } from "react";
import { Vehicle, Rental } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Car,
  Filter,
  ArrowRight,
  Search,
  Settings,
  Bike,
  Zap,
  Upload,
  List,
  Trash2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import NewVehicleDialog from "../components/vehicles/NewVehicleDialog";
import VehicleDetailsModal from "../components/vehicles/VehicleDetailsModal";
import BulkAddVehiclesDialog from "../components/vehicles/BulkAddVehiclesDialog";
import ExcelImportDialog from "../components/vehicles/ExcelImportDialog";
import ConfirmDialog from "../components/shared/ConfirmDialog";

export default function VehiclesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ status: "all", type: "all" });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Define vehicle type icons and labels
  const vehicleTypeIcons = {
    bike: { icon: Bike, label: "אופניים רגילים", color: "text-blue-600" },
    electric_bike: { icon: Zap, label: "אופניים חשמליים", color: "text-green-600" },
    scooter: { icon: Bike, label: "קורקינט רגיל", color: "text-purple-600" },
    electric_scooter: { icon: Zap, label: "קורקינט חשמלי", color: "text-orange-600" }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status && ['available', 'rented', 'maintenance', 'disabled'].includes(status)) {
      setFilters(f => ({ ...f, status: status }));
    }
  }, [location]);

  useEffect(() => {
    let tempVehicles = [...vehicles];

    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      tempVehicles = tempVehicles.filter(v => {
        const typeLabel = vehicleTypeIcons[v.type]?.label;
        return v.serial_number.toLowerCase().includes(lowerCaseQuery) ||
               (typeLabel && typeLabel.toLowerCase().includes(lowerCaseQuery));
      });
    }

    if (filters.status !== "all") {
      tempVehicles = tempVehicles.filter(v => v.status === filters.status);
    }
    if (filters.type !== "all") {
      tempVehicles = tempVehicles.filter(v => v.type === filters.type);
    }
    setFilteredVehicles(tempVehicles);
  }, [filters, vehicles, searchQuery, vehicleTypeIcons]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vehiclesData, rentalsData] = await Promise.all([
        Vehicle.list("-created_date"),
        Rental.list()
      ]);
      setVehicles(vehiclesData);
      setRentals(rentalsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleCreated = (newVehicle) => {
    setVehicles(prev => [newVehicle, ...prev]);
  };

  const handleBulkVehiclesCreated = (newVehicles) => {
    setVehicles(prev => [...newVehicles, ...prev]);
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      await Vehicle.delete(vehicleToDelete.id);
      setVehicleToDelete(null); // Close the dialog
      await loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const statusMap = {
    available: { label: "זמין", color: "bg-green-100 text-green-800 border-green-200" },
    rented: { label: "בהשכרה", color: "bg-red-100 text-red-800 border-red-200" },
    maintenance: { label: "בתיקון", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    disabled: { label: "מושבת", color: "bg-gray-100 text-gray-800 border-gray-200" },
  };

  return (
    <>
      <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
               <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(createPageUrl("Dashboard"))}
               >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">ניהול כלים</h1>
                <p className="text-slate-500 mt-1">צפייה, סינון וניהול צי הכלים</p>
              </div>
            </div>
            {/* Updated buttons for adding vehicles */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setIsExcelImportOpen(true)}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Upload className="w-4 h-4 ml-2" />
                ייבוא מקובץ Excel
              </Button>
              <Button
                onClick={() => setIsBulkAddOpen(true)}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <List className="w-4 h-4 ml-2" />
                הוספה מרובה
              </Button>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 ml-2" />
                הוסף כלי חדש
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="חיפוש לפי מספר סידורי או סוג..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-12 h-12 text-base bg-white/80"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <Select onValueChange={(value) => setFilters(f => ({ ...f, status: value }))} value={filters.status}>
                      <SelectTrigger className="w-[140px] h-12 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל הסטטוסים</SelectItem>
                        <SelectItem value="available">זמין</SelectItem>
                        <SelectItem value="rented">בהשכרה</SelectItem>
                        <SelectItem value="maintenance">בתיקון</SelectItem>
                        <SelectItem value="disabled">מושבת</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Select onValueChange={(value) => setFilters(f => ({ ...f, type: value }))} value={filters.type}>
                    <SelectTrigger className="w-[120px] h-12 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הסוגים</SelectItem>
                      {/* Updated SelectItems for vehicle types */}
                      <SelectItem value="bike">{vehicleTypeIcons.bike.label}</SelectItem>
                      <SelectItem value="electric_bike">{vehicleTypeIcons.electric_bike.label}</SelectItem>
                      <SelectItem value="scooter">{vehicleTypeIcons.scooter.label}</SelectItem>
                      <SelectItem value="electric_scooter">{vehicleTypeIcons.electric_scooter.label}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Vehicle Table */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">
                כלים ({filteredVehicles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4">
                  {[...Array(6)].map((_, i) => (
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
                <div className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {filteredVehicles.map(vehicle => {
                      const vehicleTypeData = vehicleTypeIcons[vehicle.type] || { icon: Car, label: "לא ידוע", color: "text-gray-500" };
                      const IconComponent = vehicleTypeData.icon;

                      return (
                        <motion.div
                          key={vehicle.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="flex items-center justify-between p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                              <IconComponent className={`w-4 h-4 ${vehicleTypeData.color}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {vehicleTypeData.label} #{vehicle.serial_number}
                              </p>
                              <p className="text-sm text-slate-500">
                                {vehicle.hourly_rate}₪ לשעה
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusMap[vehicle.status]?.color}>
                              {statusMap[vehicle.status]?.label}
                            </Badge>
                            <Settings className="w-4 h-4 text-slate-400 hover:text-slate-600" title="פתח פרטים"/>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening VehicleDetailsModal
                                if (vehicle.status !== 'available') {
                                  alert('לא ניתן למחוק כלי שאינו זמין. יש לשנות את סטטוס הכלי ל"זמין" תחילה.');
                                } else {
                                  setVehicleToDelete(vehicle);
                                }
                              }}
                              className={`text-red-500 hover:bg-red-100 ${vehicle.status !== 'available' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={vehicle.status !== 'available' ? "לא ניתן למחוק כלי שאינו זמין" : "מחק כלי"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {!isLoading && filteredVehicles.length === 0 && (
                <div className="text-center py-16">
                  <Car className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600">לא נמצאו כלים</h3>
                  <p className="text-slate-500 mt-2">נסה לשנות את הסינון או להוסיף כלי חדש.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <VehicleDetailsModal
        vehicle={selectedVehicle}
        rentals={rentals.filter(r => r.vehicle_id === selectedVehicle?.id)}
        open={!!selectedVehicle}
        onOpenChange={(isOpen) => !isOpen && setSelectedVehicle(null)}
        onUpdate={loadData}
      />

      <NewVehicleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onVehicleCreated={handleVehicleCreated}
      />

      <BulkAddVehiclesDialog
        open={isBulkAddOpen}
        onOpenChange={setIsBulkAddOpen}
        onVehiclesCreated={handleBulkVehiclesCreated}
      />

      <ExcelImportDialog
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        onVehiclesCreated={handleBulkVehiclesCreated}
      />

      <ConfirmDialog
        open={!!vehicleToDelete}
        onOpenChange={() => setVehicleToDelete(null)}
        onConfirm={handleDeleteVehicle}
        title={`מחיקת כלי: #${vehicleToDelete?.serial_number}`}
        description="האם אתה בטוח שברצונך למחוק את הכלי? כל היסטוריית ההשכרות שלו תימחק גם כן. הפעולה אינה ניתנת לשחזור."
      />
    </>
  );
}
