import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus, Search, Clock, Users, Car,
  TrendingUp, Calendar, MapPin, Zap
} from "lucide-react";
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedRental && !isRentedToolsModalOpen && !isActiveCustomersModalOpen && !selectedCustomerForModal) {
        loadData(true); // Background refresh
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [selectedRental, isRentedToolsModalOpen, isActiveCustomersModalOpen, selectedCustomerForModal]);

  const loadData = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setIsLoading(true);
      }

      // נתונים מדומים במקום BASE44
      const rentalsData = [
        { id: 1, customerName: "משה זנזורי", status: "active" }
      ];
      const customersData = [
        { id: 1, name: "משה זנזורי", phone: "050-0000000" }
      ];
      const vehiclesData = [
        { id: 1, model: "קורקינט חשמלי", available: true }
      ];
      const settingsData = [{ name: "RideBike" }];

      setActiveRentals(rentalsData);
      setCustomers(customersData);
      setVehicles(vehiclesData);
      setCompanySettings(settingsData[0] || null);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">ברוך הבא לאפליקציית השכרות</h1>
      {/* תוכל להוסיף כאן תצוגת רכיבים */}
      {/* לדוגמה: <StatsCard />, <OverdueRentalsTable />, וכו' */}
    </div>
  );
}
