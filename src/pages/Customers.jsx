import React, { useState, useEffect } from "react";
import { Customer, Rental, Vehicle } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  User, 
  ArrowRight,
  Filter,
  Clock,
  Trash2 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NewCustomerDialog from "../components/newrental/NewCustomerDialog";
import CustomerDetailsModal from "../components/customers/CustomerDetailsModal";
import ConfirmDialog from "../components/shared/ConfirmDialog"; 

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [allRentals, setAllRentals] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null); 
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [customersData, rentalsData, vehiclesData] = await Promise.all([
        Customer.list("-created_date"),
        Rental.list(),
        Vehicle.list(),
      ]);
      setCustomers(customersData);
      setAllRentals(rentalsData);
      setAllVehicles(vehiclesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerStatus = (customerId) => {
    return allRentals.some(rental => 
      rental.customer_id === customerId && rental.status === 'active'
    );
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await Customer.delete(customerToDelete.id);
      setCustomerToDelete(null); 
      await loadData(); 
    } catch (error) {
      console.error("Error deleting customer:", error);
      // Optionally, show a toast or alert to the user
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const matchesSearch = 
        (customer.name && customer.name.toLowerCase().includes(lowercasedQuery)) ||
        (customer.id_number && customer.id_number.includes(searchQuery)) ||
        (customer.phone && customer.phone.includes(searchQuery));
    
    if (statusFilter === "all") return matchesSearch;
    
    const isRenting = getCustomerStatus(customer.id);
    return matchesSearch && (
      (statusFilter === "renting" && isRenting) ||
      (statusFilter === "available" && !isRenting)
    );
  });

  const handleCustomerCreated = (newCustomer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
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
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">ניהול לקוחות</h1>
                <p className="text-slate-500 mt-1">צפייה, חיפוש וניהול לקוחות</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsNewCustomerDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 ml-2" />
              לקוח חדש
            </Button>
          </div>
          
          {/* Filters */}
          <Card className="mb-6 bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="חיפוש לפי שם, ת״ז או טלפון..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-12 h-12 text-base bg-white/80"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] h-12 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הלקוחות</SelectItem>
                      <SelectItem value="renting">בהשכרה</SelectItem>
                      <SelectItem value="available">פנויים</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Customer Table */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">
                לקוחות ({filteredCustomers.length})
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
                          <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
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
                    {filteredCustomers.map(customer => {
                      const isRenting = getCustomerStatus(customer.id);
                      return (
                        <motion.div
                          key={customer.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelectedCustomer(customer)}
                          className="flex items-center justify-between p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-600"/>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{customer.name}</p>
                              <p className="text-sm text-slate-500 font-mono">{customer.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isRenting ? (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                <Clock className="w-3 h-3 ml-1" />
                                בהשכרה
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                פנוי
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening customer details modal
                                if (isRenting) {
                                  alert('לא ניתן למחוק לקוח שיש לו השכרות פעילות.');
                                } else {
                                  setCustomerToDelete(customer);
                                }
                              }}
                              className={`text-red-500 hover:bg-red-100`}
                              title={isRenting ? "לא ניתן למחוק לקוח עם השכרה פעילה" : "מחק לקוח"}
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
              
              {!isLoading && filteredCustomers.length === 0 && (
                <div className="text-center py-16">
                  <User className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600">לא נמצאו לקוחות</h3>
                  <p className="text-slate-500 mt-2">נסה מילת חיפוש אחרת או הוסף לקוח חדש.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CustomerDetailsModal
        customer={selectedCustomer}
        rentals={allRentals.filter(r => r.customer_id === selectedCustomer?.id)}
        vehicles={allVehicles}
        open={!!selectedCustomer}
        onOpenChange={(isOpen) => !isOpen && setSelectedCustomer(null)}
        onUpdate={loadData}
      />

      <NewCustomerDialog
        open={isNewCustomerDialogOpen}
        onOpenChange={setIsNewCustomerDialogOpen}
        onCustomerCreated={handleCustomerCreated}
      />

      <ConfirmDialog
        open={!!customerToDelete}
        onOpenChange={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteCustomer}
        title={`מחיקת לקוח: ${customerToDelete?.name}`}
        description="האם אתה בטוח שברצונך למחוק את הלקוח? כל היסטוריית ההשכרות שלו תימחק גם כן. הפעולה אינה ניתנת לשחזור."
      />
    </>
  );
}