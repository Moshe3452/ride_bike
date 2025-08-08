
import React, { useState, useEffect } from "react";
import { CompanySettings, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadFile } from "@/api/integrations";
import { Upload, Building, Mail, Users, Save, ArrowRight, Edit, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ company_name: "", admin_email: "", logo_url: "" });
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsData, usersData, currentUserData] = await Promise.all([
        CompanySettings.list(),
        User.list(),
        User.me(),
      ]);
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
      setUsers(usersData);
      setCurrentUser(currentUserData);
    } catch (error) {
      console.error("Failed to load settings data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let updatedSettings = { ...settings };
    try {
      if (logoFile) {
        const { file_url } = await UploadFile({ file: logoFile });
        updatedSettings.logo_url = file_url;
      }

      if (settings.id) {
        await CompanySettings.update(settings.id, updatedSettings);
      } else {
        const newSettings = await CompanySettings.create(updatedSettings);
        setSettings(newSettings);
      }
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
      setLogoFile(null);
    }
  };

  const handleEditUser = (userId, currentRole) => {
    setEditingUserId(userId);
    setEditingRole(currentRole);
  };

  const handleUpdateUserRole = async (userId) => {
    if (editingRole === users.find(u => u.id === userId)?.role) {
      setEditingUserId(null);
      return;
    }

    setIsUpdatingUser(true);
    try {
      await User.update(userId, { role: editingRole });
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: editingRole } : user
      ));
      setEditingUserId(null);
    } catch (error) {
      console.error("Failed to update user role", error);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingRole("");
  };

  const isMainAdmin = currentUser?.role === 'admin';

  if (isLoading) {
    return (
      <div className="p-8">
         <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-200 h-16 w-1/2 rounded-lg animate-pulse" />
            <div className="bg-slate-200 h-64 w-full rounded-xl animate-pulse" />
            <div className="bg-slate-200 h-48 w-full rounded-xl animate-pulse" />
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">ניהול ותפעול</h1>
            <p className="text-slate-500 mt-1">הגדרות כלליות של המערכת</p>
          </div>
        </div>

        {/* Company Settings */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              פרטי החברה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-medium">שם החברה</label>
                <Input
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  placeholder="הזן את שם החברה"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">מייל מנהל לדיווחים</label>
                <Input
                  type="email"
                  value={settings.admin_email}
                  onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
               <label className="font-medium">לוגו החברה</label>
               <div className="flex items-center gap-4">
                  {settings.logo_url && !logoFile && <img src={settings.logo_url} alt="לוגו" className="w-16 h-16 rounded-lg object-cover" />}
                  <Input
                     type="file"
                     onChange={(e) => setLogoFile(e.target.files[0])}
                     className="file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
               </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 ml-2" />
                {isSaving ? "שומר..." : "שמור שינויים"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        {isMainAdmin && (
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                ניהול משתמשים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                 <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                       <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">שם</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">אימייל</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">תפקיד</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">פעולות</th>
                       </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                       {users.map(user => (
                          <tr key={user.id}>
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                               {user.full_name}
                               {user.id === currentUser?.id && (
                                 <span className="mr-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">אתה</span>
                               )}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                               {editingUserId === user.id ? (
                                 <div className="flex items-center gap-2">
                                   <Select 
                                     value={editingRole} 
                                     onValueChange={setEditingRole}
                                     disabled={isUpdatingUser}
                                   >
                                     <SelectTrigger className="w-32">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="admin">מנהל</SelectItem>
                                       <SelectItem value="user">משתמש רגיל</SelectItem>
                                     </SelectContent>
                                   </Select>
                                   <Button
                                     size="sm"
                                     onClick={() => handleUpdateUserRole(user.id)}
                                     disabled={isUpdatingUser}
                                     className="p-1 h-8 w-8"
                                   >
                                     <Check className="w-4 h-4" />
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={handleCancelEdit}
                                     disabled={isUpdatingUser}
                                     className="p-1 h-8 w-8"
                                   >
                                     <X className="w-4 h-4" />
                                   </Button>
                                 </div>
                               ) : (
                                 <span className={`px-2 py-1 rounded-full text-xs ${
                                   user.role === 'admin' 
                                     ? 'bg-green-100 text-green-800' 
                                     : 'bg-gray-100 text-gray-800'
                                 }`}>
                                   {user.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}
                                 </span>
                               )}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                 {editingUserId !== user.id && user.id !== currentUser?.id && (
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => handleEditUser(user.id, user.role)}
                                     className="flex items-center gap-1"
                                   >
                                     <Edit className="w-3 h-3" />
                                     ערוך
                                   </Button>
                                 )}
                               </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
               <p className="text-xs text-slate-500 mt-4">
                 הערה: ניתן להזמין משתמשים חדשים דרך סביבת העבודה של הפלטפורמה.
               </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
