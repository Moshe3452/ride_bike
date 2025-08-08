הimport React, { useState, useEffect } from "react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const mockVehicles = [
      { id: 1, model: "קורקינט X", available: true },
      { id: 2, model: "אופניים חשמליים Y", available: false }
    ];
    setVehicles(mockVehicles);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">רשימת כלי רכב</h1>
      <ul>
        {vehicles.map((v) => (
          <li key={v.id} className="border-b py-2">
            {v.model} - {v.available ? "זמין" : "בתוך השכרה"}
          </li>
        ))}
      </ul>
    </div>
  );
}
