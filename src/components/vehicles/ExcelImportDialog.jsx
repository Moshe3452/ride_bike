
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Vehicle } from "@/api/entities";
import { ExtractDataFromUploadedFile, UploadFile } from "@/api/integrations";
import { Upload, FileText, AlertCircle, CheckCircle, Bike, Zap } from "lucide-react"; 
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const vehicleTypeMap = {
  "אופניים": "bike",
  "אופניים רגילים": "bike",
  "bike": "bike",
  "אופניים חשמליים": "electric_bike", 
  "electric_bike": "electric_bike",
  "קורקינט": "scooter",
  "קורקינט רגיל": "scooter",
  "scooter": "scooter",
  "קורקינט חשמלי": "electric_scooter",
  "electric_scooter": "electric_scooter"
};

const statusMap = {
  "זמין": "available",
  "פנוי": "available", 
  "available": "available",
  "בהשכרה": "rented",
  "rented": "rented",
  "בתיקון": "maintenance",
  "maintenance": "maintenance",
  "מושבת": "disabled",
  "disabled": "disabled"
};

const vehicleTypeIcons = {
  bike: { icon: Bike, label: "אופניים רגילים", color: "text-blue-600" },
  electric_bike: { icon: Zap, label: "אופניים חשמליים", color: "text-green-600" },
  scooter: { icon: Bike, label: "קורקינט רגיל", color: "text-purple-600" },
  electric_scooter: { icon: Zap, label: "קורקינט חשמלי", color: "text-orange-600" }
};

export default function ExcelImportDialog({ open, onOpenChange, onVehiclesCreated }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: confirm

  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);

    try {
      // Upload file first
      const uploadResult = await UploadFile({ file: selectedFile });
      
      // Extract data with expected schema
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              serial_number: { type: "string" },
              type: { type: "string" },
              hourly_rate: { type: ["string", "number"] },
              status: { type: "string" }
            }
          }
        }
      });

      if (extractResult.status === "success" && extractResult.output) {
        const processedData = extractResult.output.map((row, index) => {
          const errors = [];
          
          // Validate and normalize data
          const serial_number = row.serial_number?.toString().trim() || "";
          if (!serial_number) errors.push("חסר מספר סידורי");

          const normalizedType = vehicleTypeMap[row.type?.toLowerCase()?.trim()] || row.type;
          if (!vehicleTypeIcons[normalizedType]) {
            errors.push("סוג כלי לא תקין");
          }

          let hourly_rate = 0;
          if (typeof row.hourly_rate === 'string') {
            hourly_rate = parseFloat(row.hourly_rate.replace(/[₪,]/g, ''));
          } else {
            hourly_rate = parseFloat(row.hourly_rate) || 0;
          }
          if (hourly_rate <= 0) errors.push("מחיר לא תקין");

          const normalizedStatus = statusMap[row.status?.toLowerCase()?.trim()] || "available";

          return {
            index: index + 1,
            serial_number,
            type: normalizedType,
            hourly_rate,
            status: normalizedStatus,
            errors,
            isValid: errors.length === 0
          };
        });

        setPreviewData(processedData);
        setStep(2);
      } else {
        setErrors(["שגיאה בקריאת הקובץ. וודא שהקובץ תקין ומכיל את העמודות הנדרשות"]);
      }
    } catch (error) {
      setErrors(["שגיאה בעיבוד הקובץ: " + error.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    
    try {
      const validVehicles = previewData.filter(v => v.isValid);
      
      if (validVehicles.length === 0) {
        setErrors(["אין כלים תקינים לייבוא"]);
        return;
      }

      const vehiclePromises = validVehicles.map(vehicleData => 
        Vehicle.create({
          serial_number: vehicleData.serial_number,
          type: vehicleData.type,
          hourly_rate: vehicleData.hourly_rate,
          status: vehicleData.status,
          daily_rate: 0
        })
      );
      
      const createdVehicles = await Promise.all(vehiclePromises);
      onVehiclesCreated(createdVehicles);
      onOpenChange(false);
      resetDialog();
    } catch (error) {
      setErrors(["שגיאה ביצירת הכלים: " + error.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            ייבוא כלים מקובץ Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <FileText className="w-16 h-16 mx-auto text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">בחר קובץ Excel או CSV</h3>
                    <p className="text-slate-600 mb-4">
                      הקובץ צריך לכלול את העמודות הבאות: מזהה, סוג, מחיר לשעה, סטטוס
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    disabled={isProcessing}
                    className="max-w-md mx-auto file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {isProcessing && (
                    <p className="text-blue-600">מעבד קובץ...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Preview */}
          {step === 2 && previewData.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">תצוגה מקדימה</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {previewData.filter(v => v.isValid).length} תקינים
                      </Badge>
                      {previewData.filter(v => !v.isValid).length > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          {previewData.filter(v => !v.isValid).length} עם שגיאות
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-96 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-right py-2 px-3">#</th>
                          <th className="text-right py-2 px-3">מזהה</th>
                          <th className="text-right py-2 px-3">סוג</th>
                          <th className="text-right py-2 px-3">מחיר לשעה</th>
                          <th className="text-right py-2 px-3">סטטוס</th>
                          <th className="text-right py-2 px-3">סטטוס</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((vehicle, index) => {
                          const typeData = vehicleTypeIcons[vehicle.type];
                          return (
                            <tr 
                              key={index} 
                              className={`border-b ${vehicle.isValid ? 'bg-white' : 'bg-red-50'}`}
                            >
                              <td className="py-2 px-3">{vehicle.index}</td>
                              <td className="py-2 px-3 font-mono">{vehicle.serial_number}</td>
                              <td className="py-2 px-3">
                                {typeData && (
                                  <div className="flex items-center gap-2">
                                    <typeData.icon className={`w-4 h-4 ${typeData.color}`} />
                                    {typeData.label}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3">{vehicle.hourly_rate}₪</td>
                              <td className="py-2 px-3">
                                {vehicle.status === 'available' && 'זמין'}
                                {vehicle.status === 'maintenance' && 'בתיקון'}
                                {vehicle.status === 'disabled' && 'מושבת'}
                              </td>
                              <td className="py-2 px-3">
                                {vehicle.isValid ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-xs text-red-600">
                                      {vehicle.errors.join(", ")}
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800">שגיאות:</h4>
                    <ul className="text-red-700 text-sm space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {step === 2 && (
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                disabled={isProcessing}
              >
                חזור
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              ביטול
            </Button>
            {step === 2 && previewData.filter(v => v.isValid).length > 0 && (
              <Button 
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "מייבא..." : `ייבא ${previewData.filter(v => v.isValid).length} כלים`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
