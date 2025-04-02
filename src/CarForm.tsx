import React, { useState } from 'react';
import Flatpickr from 'react-flatpickr';
import { Car, Calendar, Clock } from 'lucide-react';
import 'flatpickr/dist/l10n/fr.js';
import { French } from 'flatpickr/dist/l10n/fr.js';
import { Toaster, toast } from 'react-hot-toast';
import 'flatpickr/dist/themes/airbnb.css';

function CarForm() {
  const [formData, setFormData] = useState({
    country: '',
    station: '',
    pickupDate: '',
    returnDate: '',
    pickupTime: '09:00',
    returnTime: '09:00'
  });
  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ formData, contact });
    toast.success("Réservation voiture envoyée !");
    // ...traiter l'envoi du formulaire...
  };

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      <h2 className="text-2xl font-bold mb-4"><Car size={24} /> Location de Voiture</h2>
      <form onSubmit={handleSubmit}>
        {/* Pays et Station */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Pays</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Station</label>
            <input
              type="text"
              value={formData.station}
              onChange={(e) => setFormData({...formData, station: e.target.value})}
              required
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        {/* Dates */}
        <div className="mb-4">
          <label className="block mb-1">Dates</label>
          <Flatpickr
            options={{ mode: "range", locale: French, minDate: "today", dateFormat: "d/m/Y" }}
            value={formData.pickupDate && formData.returnDate ? [formData.pickupDate, formData.returnDate] : []}
            onChange={(selectedDates) => {
              if(selectedDates.length === 2){
                setFormData({
                  ...formData,
                  pickupDate: selectedDates[0].toLocaleDateString('fr-FR'),
                  returnDate: selectedDates[1].toLocaleDateString('fr-FR')
                });
              }
            }}
            placeholder="Dates de prise/retour"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Heures */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Heure de départ</label>
            <div className="flex items-center">
              <Clock size={18} className="mr-2 text-gray-400" />
              <input
                type="time"
                value={formData.pickupTime}
                onChange={(e) => setFormData({...formData, pickupTime: e.target.value})}
                required
                className="p-2 border rounded w-full"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1">Heure de retour</label>
            <div className="flex items-center">
              <Clock size={18} className="mr-2 text-gray-400" />
              <input
                type="time"
                value={formData.returnTime}
                onChange={(e) => setFormData({...formData, returnTime: e.target.value})}
                required
                className="p-2 border rounded w-full"
              />
            </div>
          </div>
        </div>
        {/* Informations Contact */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Prénom *"
            value={contact.firstName}
            onChange={(e) => setContact({...contact, firstName: e.target.value})}
            required
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Nom *"
            value={contact.lastName}
            onChange={(e) => setContact({...contact, lastName: e.target.value})}
            required
            className="p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email *"
            value={contact.email}
            onChange={(e) => setContact({...contact, email: e.target.value})}
            required
            className="p-2 border rounded"
          />
          <input
            type="tel"
            placeholder="Téléphone *"
            value={contact.phone}
            onChange={(e) => setContact({...contact, phone: e.target.value})}
            required
            className="p-2 border rounded"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Envoyer ma demande
        </button>
      </form>
    </div>
  );
}

export default CarForm;
