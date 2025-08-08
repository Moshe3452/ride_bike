import React, { useState, useEffect } from "react";
import { Customer } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, IdCard, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NewCustomerDialog from "./NewCustomerDialog";

export default function CustomerSearch({ onCustomerSelect }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = customers.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(lowercasedQuery)) ||
        (customer.id_number && customer.id_number.includes(searchQuery)) ||
        (customer.phone && customer.phone.includes(searchQuery))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    try {
      const data = await Customer.list("-created_date");
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const handleNewCustomer = (customer) => {
    setCustomers(prev => [customer, ...prev]);
    onCustomerSelect(customer);
  };

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            בחירת לקוח
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="חיפוש לפי שם, תעודת זהות או טלפון..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 text-lg"
            />
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {filteredCustomers.length > 0 ? (
                  <>
                    <p className="text-sm text-slate-600 font-medium">
                      נמצאו {filteredCustomers.length} לקוחות
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <motion.div
                          key={customer.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          onClick={() => onCustomerSelect(customer)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="font-semibold">{customer.name}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <IdCard className="w-3 h-3" />
                                  <span className="font-mono">{customer.id_number}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span className="font-mono">{customer.phone}</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              לקוח קיים
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">
                      לא נמצא לקוח
                    </h3>
                    <p className="text-slate-500 mb-4">
                      לא נמצא לקוח עם הפרטים שחיפשת
                    </p>
                    <Button
                      onClick={() => setShowNewCustomer(true)}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      צור לקוח חדש
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!searchQuery.trim() && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                חפש לקוח קיים
              </h3>
              <p className="text-slate-500 mb-6">
                הקלד שם, תעודת זהות או מספר טלפון כדי לחפש לקוח במערכת
              </p>
              <Button
                onClick={() => setShowNewCustomer(true)}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 ml-2" />
                או צור לקוח חדש
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <NewCustomerDialog
        open={showNewCustomer}
        onOpenChange={setShowNewCustomer}
        onCustomerCreated={handleNewCustomer}
        initialData={searchQuery.trim() ? { searchQuery } : {}}
      />
    </>
  );
}