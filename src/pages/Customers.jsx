import React, { useState, useEffect } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    const mockCustomers = [
      { id: 1, name: "משה זנזורי", phone: "050-0000000" },
      { id: 2, name: "נירית זנזורי", phone: "052-0000000" }
    ];
    setCustomers(mockCustomers);
  };

  const filtered = customers.filter(c => c.name.includes(searchQuery));

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">רשימת לקוחות</h1>
      <input
        type="text"
        placeholder="חפש לפי שם..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 rounded mb-4 w-full"
      />
      <ul>
        {filtered.map((c) => (
          <li key={c.id} className="border-b py-2">
            {c.name} - {c.phone}
          </li>
        ))}
      </ul>
    </div>
  );
}
