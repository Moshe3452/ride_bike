import React, { useState } from "react";

export default function NewRental() {
  const [customer, setCustomer] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [rentals, setRentals] = useState([]);

  const handleSubmit = () => {
    const newRental = {
      id: rentals.length + 1,
      customer,
      vehicle,
      date: new Date().toLocaleString()
    };
    setRentals([...rentals, newRental]);
    setCustomer("");
    setVehicle("");
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">השכרה חדשה</h1>
      <input
        placeholder="שם לקוח"
        value={customer}
        onChange={(e) => setCustomer(e.target.value)}
        className="border p-2 rounded mb-2 w-full"
      />
      <input
        placeholder="דגם רכב"
        value={vehicle}
        onChange={(e) => setVehicle(e.target.value)}
        className="border p-2 rounded mb-2 w-full"
      />
      <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">
        הוסף השכרה
      </button>

      <ul className="mt-4">
        {rentals.map((rental) => (
          <li key={rental.id} className="border-b py-2">
            {rental.customer} השכיר {rental.vehicle} ב־{rental.date}
          </li>
        ))}
      </ul>
    </div>
  );
}
