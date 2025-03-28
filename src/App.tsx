import React, { useState, useEffect } from 'react';
import { Hotel, Car, Search, Calendar, Users, Star, Plus, Minus, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/fr.js';
import 'flatpickr/dist/themes/airbnb.css';
import { French } from 'flatpickr/dist/l10n/fr.js';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { Toaster, toast } from 'react-hot-toast';


// Liste des pays pour la location de voiture
import RENTAL_COUNTRIES from './liste-pays.json';
import vehicles from './liste_vehicules_images.json';
import stations from './resultatsStations.json';

const PrevArrow = (props: any) => (
  <button
    {...props}
    type="button"
    onClick={(e) => {
      e.preventDefault();
      props.onClick && props.onClick(e);
    }}
    className="slick-prev z-20 absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center"
  >
    <div className="text-black text-3xl leading-none bg-white/70 rounded-full w-8 h-8 flex items-center justify-center">
      ‹
    </div>
  </button>
);

const NextArrow = (props: any) => (
  <button
    {...props}
    type="button"
    onClick={(e) => {
      e.preventDefault();
      props.onClick && props.onClick(e);
    }}
    className="slick-next z-20 absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center"
  >
    <div className="text-black text-3xl leading-none bg-white/70 rounded-full w-8 h-8 flex items-center justify-center">
      ›
    </div>
  </button>
);

const sliderSettings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 4,
  swipeToSlide: true,
  nextArrow: <NextArrow />,
  prevArrow: <PrevArrow />,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } }
  ]
};

const formatStationName = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.startsWith("red_")) {
    let cleaned = lower.slice(4);
    cleaned = cleaned.replace(/\b(airport|apt|ap)\b/gi, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    return `aeroport de ${cleaned}`;
  }
  return name;
};

function App() {
  const [activeTab, setActiveTab] = useState('hotel');
  const [currentStep, setCurrentStep] = useState(1);
  
  // États pour la réservation d'hôtel
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState<Date[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showOccupants, setShowOccupants] = useState(false);
  const [occupants, setOccupants] = useState({
    rooms: 1,
    adults: 1,
    children: 0,
    childrenAges: [] as number[]
  });
  const [selectedOptions, setSelectedOptions] = useState({
    pool: false,
    breakfast: false,
    nearBeach: false,
    specificHotel: null as boolean | null
  });
  
  // États pour la location de véhicule et les informations de contact
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    country: '',
    station: '',
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    returnTime: '',
    driverAge: '',
    hasVisa: false,
    shabbatRestriction: false,
    promoCode: '',
  });
  
  const [selectedVehicle, setSelectedVehicle] = useState<{ "Nom du véhicule": string; "Image URL": string } | null>(null);

  // Filtrage des stations en fonction du pays sélectionné
  const selectedCountry = RENTAL_COUNTRIES.find(country => country.Item1 === formData.country);
  const stationsToDisplay = selectedCountry ? stations[selectedCountry.Item2 as keyof typeof stations]?.data || [] : [];
  const visaLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg";

  useEffect(() => {

    const loadGoogleMapsScript = () => {
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    };
  
    const initializeAutocomplete = () => {
      const input = document.getElementById('destination') as HTMLInputElement;
      if (input && window.google) {
        new window.google.maps.places.Autocomplete(input, {
          types: ['(cities)']
        });
      }
    };
  
    loadGoogleMapsScript();
    
    // Réessaye l'initialisation toutes les 500ms jusqu'à ce que Google Maps soit chargé
    const interval = setInterval(() => {
      if (window.google) {
        initializeAutocomplete();
        clearInterval(interval);
      }
    }, 500);
  
    return () => clearInterval(interval);
  }, []);

  const handleOccupantChange = (type: 'rooms' | 'adults' | 'children', increment: number) => {
    setOccupants(prev => {
      const newValue = Math.max(0, prev[type] + increment);
      if (type === 'children') {
        const ages = [...prev.childrenAges];
        if (increment > 0) {
          ages.push(0);
        } else if (increment < 0) {
          ages.pop();
        }
        return { ...prev, [type]: newValue, childrenAges: ages };
      }
      return { ...prev, [type]: type === 'rooms' || type === 'adults' ? Math.max(1, newValue) : newValue };
    });
  };

  const getOccupantsSummary = () => {
    return `${occupants.adults} adulte${occupants.adults > 1 ? 's' : ''}, ${occupants.children} enfant${occupants.children > 1 ? 's' : ''}, ${occupants.rooms} chambre${occupants.rooms > 1 ? 's' : ''}`;
  };

  // Validation des étapes
  const validateFirstStep = () => {
    if (activeTab === 'hotel') {
      return destination && dates.length === 2;
    } else {
      return formData.country && formData.station && formData.pickupDate && formData.returnDate;
    }
  };

  const validateSecondStep = () => {
    return formData.firstName && formData.lastName && formData.email && formData.phone;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateFirstStep()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!validateSecondStep()) return;
  
    const {
      firstName,
      lastName,
      email,
      phone,
      notes,
      hasVisa,
      shabbatRestriction,
      driverAge,
      country,
    } = formData;
  
    try {
      // Créer d'abord le contact
      const contactRes = await fetch('/api/createContact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          preferences_client: notes,
          le_v_hicule_ne_roule_pas_le_chabat: shabbatRestriction,
          avez_vous_une_visa_premi_re_: hasVisa,
          age: driverAge,
          nationalite: country === "FR;" ? "Français" : "Israélien"
        })
      });
  
      const contactData = await contactRes.json();
  
      if (!contactRes.ok) throw new Error(`Erreur création contact: ${contactData.detail}`);
  
      const contactId = contactData.contactId;
  
      // Créer ensuite le deal
      const dealRes = await fetch('/api/createDeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          firstName,
          lastName,
          activeTab,
          destination,
          dates,
          selectedVehicle
        })
      });
  
      const dealData = await dealRes.json();
  
      if (!dealRes.ok) throw new Error(`Erreur création deal: ${dealData.detail}`);
  
      toast.success("Votre demande a bien été envoyée !");
      setCurrentStep(1);
  
      // Ouvrir WhatsApp avec le message
      const message = generateWhatsAppMessage();
      const whatsappUrl = `https://wa.me/972585800707?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  
    } catch (error) {
      console.error('Erreur HubSpot:', {
        error: error instanceof Error ? error.message : error,
        formData,
        timestamp: new Date().toISOString()
      });
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    }
  };
  
  
  
  const generateWhatsAppMessage = () => {
    let message = '';
    if (activeTab === 'hotel') {
      message = `Réservation Hôtel:\n
  Destination: ${destination}\n
  Dates: ${dates.map(d => d.toLocaleDateString('fr-FR')).join(' - ')}\n
  Occupants: ${getOccupantsSummary()}\n
  Étoiles: ${rating}⭐\n
  Options:\n
  - Piscine: ${selectedOptions.pool ? 'Oui' : 'Non'}\n
  - Petit-déjeuner: ${selectedOptions.breakfast ? 'Oui' : 'Non'}\n
  - Proche de la mer: ${selectedOptions.nearBeach ? 'Oui' : 'Non'}\n
  Hôtel particulier: ${selectedOptions.specificHotel === true ? 'Oui' : 'Non'}\n`;
    } else {
      message = `Location Voiture:\n
  Pays: ${formData.country}\n
  Station: ${formData.station}\n
  Dates: Du ${formData.pickupDate} ${formData.pickupTime} au ${formData.returnDate} ${formData.returnTime}\n
  Âge conducteur: ${formData.driverAge}\n
  Visa Premier: ${formData.hasVisa ? 'Oui' : 'Non'}\n
  Restriction Shabbat: ${formData.shabbatRestriction ? 'Oui' : 'Non'}\n`;
      message += `\nVéhicule sélectionné: ${selectedVehicle ? selectedVehicle["Nom du véhicule"] : 'Aucun'}\n`;
    }
    message += `\nContact:\n
  Nom: ${formData.firstName} ${formData.lastName}\n
  Email: ${formData.email}\n
  Téléphone: ${formData.phone}\n
  Notes: ${formData.notes}`;
  
    return message;
  };

  // Réinitialiser l'étape lors du changement d'onglet
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentStep(1);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-start justify-center pt-20"
    >
      <div className="w-full max-w-screen-xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex gap-6 mb-6">
            <button
              className={`flex items-center gap-2 pb-2 px-1 font-medium ${
                activeTab === 'hotel'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => handleTabChange('hotel')}
            >
              <Hotel size={20} />
              Réserver un hôtel
            </button>
            <button
              className={`flex items-center gap-2 pb-2 px-1 font-medium ${
                activeTab === 'car'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => handleTabChange('car')}
            >
              <Car size={20} />
              Louer un véhicule
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <>
                            {activeTab === 'hotel' ? (
              <>
                <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                {/* Champ Destination */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="destination"
                    type="text"
                    placeholder="Destination (ville, hôtel...)"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>

                {/* Sélecteur de dates */}
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Flatpickr
                    options={{
                      mode: "range",
                      locale: French,
                      minDate: "today",
                      showMonths: 2,
                      dateFormat: "d/m/Y",
                      disableMobile: true 
                    }}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Sélectionnez vos dates"
                    value={dates}
                    onChange={(dates) => setDates(dates)}
                  />
                </div>
                
                {/* Sélecteur d'occupants */}
                <div className="relative flex-1">
                  <div
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer"
                    onClick={() => setShowOccupants(!showOccupants)}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={20} className="text-gray-400" />
                      <span>{getOccupantsSummary()}</span>
                    </div>
                    <span className="text-gray-400">{showOccupants ? '▼' : '▲'}</span>
                  </div>
                  {showOccupants && (
                    <div className="absolute top-full left-0 right-0 bg-white border rounded-lg mt-2 p-4 shadow-lg z-10">
                      <div className="space-y-4">
                        {/* Chambres */}
                        <div className="flex items-center justify-between">
                          <span>Chambres</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="p-1 border rounded hover:bg-gray-100"
                              onClick={() => handleOccupantChange('rooms', -1)}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center">{occupants.rooms}</span>
                            <button
                              type="button"
                              className="p-1 border rounded hover:bg-gray-100"
                              onClick={() => handleOccupantChange('rooms', 1)}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Adultes */}
                        <div className="flex items-center justify-between">
                          <span>Adultes (18+)</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="p-1 border rounded hover:bg-gray-100"
                              onClick={() => handleOccupantChange('adults', -1)}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center">{occupants.adults}</span>
                            <button
                              type="button"
                              className="p-1 border rounded hover:bg-gray-100"
                              onClick={() => handleOccupantChange('adults', 1)}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Enfants */}
                        <div className="flex items-center justify-between">
                          <span>Enfants (0-17)</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="p-1 border rounded hover:bg-gray-100"
                              onClick={() => handleOccupantChange('children', -1)}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center">{occupants.children}</span>
                            <button
                              type="button"
                              className="p-1 border rounded hover:bg-gray-100"
                              onClick={() => handleOccupantChange('children', 1)}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Âges des enfants */}
                        {occupants.children > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Âge des enfants</p>
                            <div className="grid grid-cols-2 gap-2">
                              {occupants.childrenAges.map((age, index) => (
                                <select
                                  key={index}
                                  className="p-2 border rounded"
                                  value={age}
                                  onChange={(e) => {
                                    const newAges = [...occupants.childrenAges];
                                    newAges[index] = parseInt(e.target.value);
                                    setOccupants(prev => ({ ...prev, childrenAges: newAges }));
                                  }}
                                >
                                  {Array.from({ length: 18 }, (_, i) => (
                                    <option key={i} value={i}>
                                      {i} {i === 0 ? "an" : "ans"}
                                    </option>
                                  ))}
                                </select>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <br />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative md:col-span-1 col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre d’étoiles
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={24}
                        className={`cursor-pointer transition-colors ${
                          star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative md:col-span-2 col-span-1">
                  <p className="text-sm font-medium text-gray-700 mb-2">Options de l'hôtel</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOptions.pool}
                        onChange={(e) => setSelectedOptions(prev => ({ ...prev, pool: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span>Piscine</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOptions.breakfast}
                        onChange={(e) => setSelectedOptions(prev => ({ ...prev, breakfast: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span>Petit-déjeuner</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOptions.nearBeach}
                        onChange={(e) => setSelectedOptions(prev => ({ ...prev, nearBeach: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span>Proche de la mer</span>
                    </label>
                  </div>
                </div>

                <div className="relative md:col-span-1 col-span-1">
                  <p className="text-sm font-medium text-gray-700 mb-2">Souhaitez-vous un hôtel particulier ?</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="specificHotel"
                        checked={selectedOptions.specificHotel === true}
                        onChange={() => setSelectedOptions(prev => ({ ...prev, specificHotel: true }))}
                        className="text-blue-600"
                      />
                      <span>Oui</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="specificHotel"
                        checked={selectedOptions.specificHotel === false}
                        onChange={() => setSelectedOptions(prev => ({ ...prev, specificHotel: false }))}
                        className="text-blue-600"
                      />
                      <span>Non</span>
                    </label>
                  </div>
                </div>
                </div>
              </>
            ) : (
                  // Contenu de la première étape pour la location de véhicule
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="form-group">
                        <select 
                          className="w-full p-3 border rounded-lg"
                          value={formData.country}
                          onChange={(e) => {
                            // Réinitialiser la station lors du changement de pays
                            setFormData({...formData, country: e.target.value, station: ''});
                          }}
                        >
                          <option value="">Sélectionnez un pays</option>
                          {RENTAL_COUNTRIES.sort((a, b) => 
                            ['Israel', 'France', 'États-Unis'].includes(b.Item2) ? 1 : -1
                          ).map((country) => (
                            <option key={country.Item1} value={country.Item1}>
                              {country.Item2}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <select 
                          className="w-full p-3 border rounded-lg"
                          value={formData.station}
                          onChange={(e) => setFormData({...formData, station: e.target.value})}
                        >
                          <option value="">Sélectionnez une station</option>
                          {stationsToDisplay.map(station => (
                            <option 
                              key={station.Item1} 
                              value={station.Item1}
                              style={station.Item2.startsWith("red_") ? { color: 'red' } : {}}
                            >
                              {station.Item2.startsWith("red_")
                                ? formatStationName(station.Item2)
                                : station.Item2
                              }
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="relative md:col-span-2 col-span-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Flatpickr
                          options={{
                            mode: "range",
                            locale: French,
                            minDate: "today",
                            showMonths: 2,
                            dateFormat: "d/m/Y"
                          }}
                          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Dates de prise en charge / retour"
                          value={
                            formData.pickupDate && formData.returnDate
                              ? [formData.pickupDate, formData.returnDate]
                              : []
                          }
                          onChange={(selectedDates) => {
                            if (selectedDates.length === 2) {
                              setFormData({
                                ...formData,
                                pickupDate: selectedDates[0].toLocaleDateString('fr-FR'),
                                returnDate: selectedDates[1].toLocaleDateString('fr-FR')
                              });
                            }
                          }}
                        />
                      </div>

                      <div className="relative md:col-span-1 col-span-1">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Flatpickr
                          options={{
                            enableTime: true,
                            noCalendar: true,
                            dateFormat: "H:i",
                            time_24hr: true,
                            minuteIncrement: 15
                          }}
                          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Heure départ"
                          value={formData.pickupTime}
                          onChange={(selectedTime) => {
                            if (selectedTime.length > 0) {
                              setFormData({
                                ...formData,
                                pickupTime: selectedTime[0].toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })
                              });
                            }
                          }}
                        />
                      </div>

                      <div className="relative md:col-span-1 col-span-1">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Flatpickr
                          options={{
                            enableTime: true,
                            noCalendar: true,
                            dateFormat: "H:i",
                            time_24hr: true,
                            minuteIncrement: 15
                          }}
                          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Heure retour"
                          value={formData.returnTime}
                          onChange={(selectedTime) => {
                            if (selectedTime.length > 0) {
                              setFormData({
                                ...formData,
                                returnTime: selectedTime[0].toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })
                              });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="flex flex-col md:flex-row gap-4 md:col-span-2 col-span-1">
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, hasVisa: !formData.hasVisa })}
                          className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                            formData.hasVisa ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                          }`}
                        >
                          <img src={visaLogoUrl} alt="Visa Logo" className="w-8 h-8" />
                          <span>Avez-vous une Visa Première</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, shabbatRestriction: !formData.shabbatRestriction })}
                          className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                            formData.shabbatRestriction ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                          }`}
                        >
                          <img src="/chabbat.png" alt="Shabbat" className="w-8 h-8" />
                          <span>Le véhicule roule le Chabat</span>
                        </button>
                      </div>

                      <div className="relative md:col-span-1 col-span-1">
                        <select
                          name="age"
                          className="w-full p-3 border rounded-lg"
                          value={formData.driverAge}
                          onChange={(e) => setFormData({...formData, driverAge: e.target.value})}
                        >
                          <option value="">Âge du conducteur</option>
                          {Array.from({ length: 8 }, (_, i) => (
                            <option key={i} value={i + 18}>
                              {i + 18}
                            </option>
                          ))}
                          <option value="25+">25+</option>
                        </select>
                      </div>

                      <div className="relative md:col-span-1 col-span-1">
                        <input
                          type="text"
                          className="w-full p-3 border rounded-lg"
                          placeholder="Code Promo (facultatif)"
                          value={formData.promoCode}
                          onChange={(e) => setFormData({...formData, promoCode: e.target.value})}
                        />
                      </div>
                    </div>

                    {activeTab === 'car' && (
                      <div className="w-full relative">
                        <h3 className="text-lg font-semibold mb-4">Sélectionnez votre véhicule</h3>
                        <Slider {...sliderSettings}>
                          {vehicles.map((vehicle) => (
                            <div 
                              key={vehicle["Nom du véhicule"]} 
                              className={`vehicle-card cursor-pointer transition-all duration-300 
                                ${selectedVehicle === vehicle 
                                  ? 'border-blue-500 border-2 bg-blue-50 scale-105' 
                                  : 'border-gray-200 hover:border-blue-300'}`}
                              onClick={() => setSelectedVehicle(selectedVehicle === vehicle ? null : vehicle)}
                            >
                              <img 
                                src={vehicle["Image URL"]} 
                                alt={vehicle["Nom du véhicule"]}
                                className="vehicle-image"
                              />
                              <div className="vehicle-info text-center mt-2">
                                <p className="text-gray-700 font-medium">
                                  {vehicle["Nom du véhicule"]}
                                </p>
                              </div>
                            </div>
                          ))}
                        </Slider>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className={`flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                      ${!validateFirstStep() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!validateFirstStep()}
                  >
                    Suivant <ArrowRight size={20} />
                  </button>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                {/* Contenu de la deuxième étape (informations de contact) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <input
                    type="text"
                    className="p-3 border rounded-lg"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    className="p-3 border rounded-lg"
                    placeholder="Nom"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <input
                    type="email"
                    className="p-3 border rounded-lg"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <input
                    type="tel"
                    className="p-3 border rounded-lg"
                    placeholder="Téléphone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="mb-6">
                  <textarea
                    className="w-full p-3 border rounded-lg"
                    placeholder="Notes ou remarques"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex items-center gap-2 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <ArrowLeft size={20} /> Précédent
                  </button>
                  <button
                    type="submit"
                    className={`flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                      ${!validateSecondStep() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!validateSecondStep()}
                  >
                    Réserver maintenant
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;