import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const colorClasses = {
  blue: {
    bg: "bg-gradient-to-br from-blue-500 to-blue-600",
    icon: "bg-blue-500/20 text-blue-600",
    text: "text-blue-600"
  },
  green: {
    bg: "bg-gradient-to-br from-green-500 to-green-600", 
    icon: "bg-green-500/20 text-green-600",
    text: "text-green-600"
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-500 to-purple-600",
    icon: "bg-purple-500/20 text-purple-600", 
    text: "text-purple-600"
  },
  orange: {
    bg: "bg-gradient-to-br from-orange-500 to-orange-600",
    icon: "bg-orange-500/20 text-orange-600",
    text: "text-orange-600"
  }
};

export default function StatsCard({ title, value, icon: Icon, color, trend, onClick }) {
  const colors = colorClasses[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer' : ''}`}
    >
      <Card className={`bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-32 flex flex-col ${onClick ? 'hover:-translate-y-1' : ''}`}>
        <div className={`absolute top-0 left-0 w-full h-1 ${colors.bg}`} />
        <CardContent className="p-3 sm:p-4 flex-grow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600 leading-tight">{title}</p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-800">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${colors.icon} hidden sm:flex`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          {trend && (
            <p className={`text-[10px] sm:text-xs font-medium ${colors.text} mt-2 leading-tight`}>{trend}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}