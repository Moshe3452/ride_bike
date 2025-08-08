import React, { useState, useEffect } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    company_name: "",
    admin_email: "",
    logo_url: ""
  });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    // טען הגדרות מה-localStorage אם קיימות
    const saved = localStorage.getItem("company_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    let updatedSettings = { ...settings };

    if (logoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatedSettings.logo_url = reader.result;
        localStorage.setItem("company_settings", JSON.stringify(updatedSettings));
        setSettings(updatedSettings);
        setLogoFile(null);
        alert("הגדרות נשמרו!");
      };
      reader.readAsDataURL(logoFile);
    } else {
      localStorage.setItem("company_settings", JSON.stringify(updatedSettings));
      alert("הגדרות נשמרו!");
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">הגדרות מערכת</h1>

        <div className="space-y-4 bg-white shadow p-6 rounded-lg border">
          <div className="space-y-2">
            <label className="font-medium">שם החברה</label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="border p-2 rounded w-full"
              placeholder="לדוגמה: רייד בייק בע״מ"
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium">מייל מנהל</label>
            <input
              type="email"
              value={settings.admin_email}
              onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
              className="border p-2 rounded w-full"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium">לוגו החברה</label>
            <div className="flex items-center gap-4">
              {settings.logo_url && !logoFile && (
                <img src={settings.logo_url} alt="לוגו" className="w-16 h-16 rounded object-cover" />
              )}
              <input
                type="file"
                onChange={(e) => setLogoFile(e.target.files[0])}
                accept="image/*"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              שמור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
