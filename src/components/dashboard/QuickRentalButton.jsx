import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Plus } from "lucide-react";
import QuickRentalModal from "./QuickRentalModal";

export default function QuickRentalButton({ onRentalCreated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Quick Rental Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-110 rounded-full px-6 py-4 text-lg font-bold"
        >
          <Zap className="w-6 h-6 ml-2" />
          השכרה מהירה
        </Button>
      </div>

      <QuickRentalModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onRentalCreated={(rental) => {
          onRentalCreated(rental);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}