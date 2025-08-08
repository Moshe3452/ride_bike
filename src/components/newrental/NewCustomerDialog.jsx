import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Customer, CompanySettings, User } from "@/api/entities";
import { UploadFile, SendEmail } from "@/api/integrations";
import { User as UserIcon, IdCard, Phone, Upload, Edit } from "lucide-react";
import SignatureCanvas from "../signature/SignatureCanvas";

export default function NewCustomerDialog({ 
  open, 
  onOpenChange, 
  onCustomerCreated, 
  initialData = {} 
}) {
  const [formData, setFormData] = useState({
    name: "",
    id_number: "",
    phone: "",
    ...initialData
  });
  const [document, setDocument] = useState(null);
  const [signature, setSignature] = useState(null);
  const [showSignature, setShowSignature] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      let documentUrl = null;
      let signatureUrl = null;
      
      if (document) {
        const uploadResult = await UploadFile({ file: document });
        documentUrl = uploadResult.file_url;
      }

      if (signature) {
        const uploadResult = await UploadFile({ file: signature });
        signatureUrl = uploadResult.file_url;
      }

      const customer = await Customer.create({
        ...formData,
        document_url: documentUrl,
        signature_url: signatureUrl
      });

      if (documentUrl || signatureUrl) {
        try {
          const [settingsData, currentUser] = await Promise.all([
            CompanySettings.list(),
            User.me()
          ]);
          
          const adminEmail = settingsData[0]?.admin_email || currentUser.email;
          
          await SendEmail({
            to: adminEmail,
            subject: `לקוח חדש - ${formData.name}`,
            body: `
נוסף לקוח חדש למערכת:

פרטי לקוח:
שם: ${formData.name}
טלפון: ${formData.phone}
${formData.id_number ? `ת"ז: ${formData.id_number}` : ''}

${documentUrl ? `המסמך זמין בקישור: ${documentUrl}` : ''}
${signatureUrl ? `החתימה זמינה בקישור: ${signatureUrl}` : ''}
            `
          });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      }

      onCustomerCreated(customer);
      onOpenChange(false);
      setFormData({ name: "", id_number: "", phone: "" });
      setDocument(null);
      setSignature(null);
      setShowSignature(false);
      setFocusedField(null);
    } catch (error) {
      console.error("Error creating customer:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignatureSaved = (signatureBlob) => {
    setSignature(signatureBlob);
    setShowSignature(false);
  };

  return (
    <>
      <Dialog open={open && !showSignature} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md mx-auto bg-white/95 backdrop-blur-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              לקוח חדש
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                <UserIcon className="w-4 h-4" />
                שם מלא *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder={focusedField === 'name' ? "הכנס שם מלא" : ""}
                className="h-12 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4" />
                טלפון *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                placeholder={focusedField === 'phone' ? "050-1234567" : ""}
                className="h-12 text-base font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_number" className="flex items-center gap-2 text-sm font-medium">
                <IdCard className="w-4 h-4" />
                תעודת זהות (אופציונלי)
              </Label>
              <Input
                id="id_number"
                value={formData.id_number}
                onChange={(e) => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                onFocus={() => setFocusedField('id_number')}
                onBlur={() => setFocusedField(null)}
                placeholder={focusedField === 'id_number' ? "123456789" : ""}
                className="h-12 text-base font-mono"
                maxLength="9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document" className="flex items-center gap-2 text-sm font-medium">
                <Upload className="w-4 h-4" />
                מסמך (אופציונלי)
              </Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDocument(e.target.files[0])}
                className="h-12 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Edit className="w-4 h-4" />
                חתימה (אופציונלי)
              </Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSignature(true)}
                className="w-full h-12 border-dashed"
              >
                {signature ? "עדכן חתימה" : "הוסף חתימה"}
              </Button>
              {signature && (
                <p className="text-xs text-green-600 text-center">
                  ✓ חתימה נשמרה
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12"
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {isCreating ? "יוצר..." : "צור לקוח"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SignatureCanvas
        open={showSignature}
        onSave={handleSignatureSaved}
        onCancel={() => setShowSignature(false)}
      />
    </>
  );
}