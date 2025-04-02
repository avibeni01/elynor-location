import React, { useState } from 'react';
import Flatpickr from 'react-flatpickr';
import { Hotel, Search, Calendar, Users, Star, Plus, Minus } from 'lucide-react';
import 'flatpickr/dist/l10n/fr.js';
import { French } from 'flatpickr/dist/l10n/fr.js';
import { Toaster, toast } from 'react-hot-toast';
import 'flatpickr/dist/themes/airbnb.css';

function HotelForm() {
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState<string[]>([]);
  const [occupants, setOccupants] = useState({ rooms: 1, adults: 2, children: 0, babies: 0 });
  const [rating, setRating] = useState(0);
  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // New helper function for occupant change
  const handleOccupantChange = (
    field: 'rooms' | 'adults' | 'children' | 'babies',
    delta: number
  ) => {
    setOccupants(prev => ({
      ...prev,
      [field]:
        field === 'rooms' || field === 'adults'
          ? Math.max(1, prev[field] + delta)
          : Math.max(0, prev[field] + delta)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({destination, dates, occupants, rating, contact});
    toast.success("Réservation hôtel envoyée !");
    // ...traiter l'envoi du formulaire...
  };

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      <h2 className="text-2xl font-bold mb-4">
        <Hotel size={24} /> Réservation Hôtel
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Destination */}
        <div className="mb-4">
          <label className="block mb-1">Destination</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ville, hôtel, etc."
              required
              className="w-full pl-10 pr-4 py-2 border rounded"
            />
          </div>
        </div>
        {/* Dates */}
        <div className="mb-4">
          <label className="block mb-1">Dates</label>
          <Flatpickr
            options={{ mode: "range", locale: French, minDate: "today", dateFormat: "d/m/Y" }}
            value={dates}
            onChange={(selectedDates) =>
              setDates(selectedDates.map(d => d.toLocaleDateString('fr-FR')))
            }
            placeholder="Sélectionnez vos dates"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        {/* Occupants */}
        <div className="mb-4">
          <label className="block mb-1">Occupants</label>
          <div className="p-2 border rounded space-y-2">
            <div className="flex justify-between items-center">
              <span>Chambres: {occupants.rooms}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleOccupantChange('rooms', -1)} className="p-1 border rounded" disabled={occupants.rooms <= 1}>
                  <Minus size={16} />
                </button>
                <button type="button" onClick={() => handleOccupantChange('rooms', 1)} className="p-1 border rounded">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Adultes: {occupants.adults}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleOccupantChange('adults', -1)} className="p-1 border rounded" disabled={occupants.adults <= 1}>
                  <Minus size={16} />
                </button>
                <button type="button" onClick={() => handleOccupantChange('adults', 1)} className="p-1 border rounded">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Enfants: {occupants.children}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleOccupantChange('children', -1)} className="p-1 border rounded" disabled={occupants.children <= 0}>
                  <Minus size={16} />
                </button>
                <button type="button" onClick={() => handleOccupantChange('children', 1)} className="p-1 border rounded">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Bébés: {occupants.babies}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleOccupantChange('babies', -1)} className="p-1 border rounded" disabled={occupants.babies <= 0}>
                  <Minus size={16} />
                </button>
                <button type="button" onClick={() => handleOccupantChange('babies', 1)} className="p-1 border rounded">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Étoiles */}
        <div className="mb-4">
          <label className="block mb-1">Nombre d'étoiles</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                onClick={() => setRating(star)}
                className={`cursor-pointer transition-colors ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
        </div>
        {/* Informations Contact */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Prénom *"
            value={contact.firstName}
            onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
            required
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Nom *"
            value={contact.lastName}
            onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
            required
            className="p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email *"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            required
            className="p-2 border rounded"
          />
          <input
            type="tel"
            placeholder="Téléphone *"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
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

export default HotelForm;
