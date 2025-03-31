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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [hotelName, setHotelName] = useState(''); // State for specific hotel name input

  // États pour la réservation d'hôtel
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState<string[]>([]); // Store dates as 'dd/mm/yyyy' strings
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
    specificHotel: null as boolean | null // Changed to track specific hotel input
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

  // --- Step Validation ---
  const validateStep1 = () => {
    if (activeTab === 'hotel') {
      // Hotel Step 1: Destination and Dates
      return destination && dates.length === 2;
    } else { // Car Step 1: Country, Station, Dates, Times, Age
      return formData.country && formData.station && formData.pickupDate && formData.returnDate && formData.pickupTime && formData.returnTime && formData.driverAge;
    }
  };

  const validateStep2Car = () => {
    // Car Step 2: Vehicle Selection (currently optional)
    // return selectedVehicle !== null; // Uncomment if vehicle selection becomes mandatory
    return true; // Always allow proceeding for now
  };

  const validateFinalStep = () => {
    // Hotel Step 2 / Car Step 3: Contact Info
    return formData.firstName && formData.lastName && formData.email && formData.phone;
  };

  // --- Navigation ---
  const handleNextStep = () => {
    if (activeTab === 'hotel') {
      if (currentStep === 1 && validateStep1()) {
        setCurrentStep(2); // Move Hotel 1 -> 2 (Contact)
      }
    } else { // car tab
      if (currentStep === 1 && validateStep1()) {
        setCurrentStep(2); // Move Car 1 -> 2 (Vehicle Selection)
      } else if (currentStep === 2 && validateStep2Car()) {
        setCurrentStep(3); // Move Car 2 -> 3 (Contact Info)
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1); // Go back one step
    }
  };

  // --- Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate final step based on active tab and current step
    const isFinalStepValid = (activeTab === 'hotel' && currentStep === 2 && validateFinalStep()) ||
                             (activeTab === 'car' && currentStep === 3 && validateFinalStep());

    if (!isFinalStepValid || isSubmitting) return; // Prevent submission if not valid or already submitting

    setIsSubmitting(true);

    const {
      firstName,
      lastName,
      email,
      phone,
      notes,
      hasVisa,
      shabbatRestriction,
      driverAge,
      country, // Needed for contact creation
    } = formData;

    try {
      // Create Contact
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
          nationalite: "Francais" // Assuming default, adjust if needed
        })
      });
      const contactData = await contactRes.json();
      if (!contactRes.ok) throw new Error(`Erreur création contact: ${contactData.detail}`);
      const contactId = contactData.contactId;

      // Helper function to format dd/mm/yyyy to yyyy-mm-dd
      const formatDDMMYYYYToYYYYMMDD = (dateStr: string | null | undefined): string | null => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      };

      // Prepare Deal Payload
      let dealPayload: any = {
        contactId,
        firstName,
        lastName,
        activeTab,
      };

      if (activeTab === 'hotel') {
        dealPayload = {
          ...dealPayload,
          destination,
          check_in_date_str: formatDDMMYYYYToYYYYMMDD(dates?.[0]),
          check_out_date_str: formatDDMMYYYYToYYYYMMDD(dates?.[1]),
          occupants,
          rating,
          // Remove specificHotel boolean from selectedOptions
          selectedOptions: { 
            pool: selectedOptions.pool, 
            breakfast: selectedOptions.breakfast, 
            nearBeach: selectedOptions.nearBeach 
          }, 
          // Send hotel name to the new CRM field
          souhaite_hotel_en_particulier: hotelName || null // Send null if empty, or adjust if CRM prefers ""
        };
      } else { // 'car'
        const selectedStationObject = stationsToDisplay.find(s => s.Item1 === formData.station);
        const stationName = selectedStationObject ? selectedStationObject.Item2 : formData.station;

        dealPayload = {
          ...dealPayload,
          selectedVehicle,
          stationName: stationName,
          check_in_date_str: formatDDMMYYYYToYYYYMMDD(formData.pickupDate),
          check_out_date_str: formatDDMMYYYYToYYYYMMDD(formData.returnDate),
          pickupTime: formData.pickupTime,
          returnTime: formData.returnTime,
          driverAge: formData.driverAge,
          hasVisa: formData.hasVisa,
          shomer_shabbat: formData.shabbatRestriction
        };
      }

      // Create Deal
      const dealRes = await fetch('/api/createDeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealPayload)
      });
      const dealData = await dealRes.json();
      if (!dealRes.ok) throw new Error(`Erreur création deal: ${dealData.detail}`);

      toast.success("Votre demande a bien été envoyée !");
      setCurrentStep(1); // Reset to first step
      setFormSubmitted(true); // Show success message

      // Open WhatsApp
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
    } finally {
      setIsSubmitting(false); // Reset submitting state regardless of outcome
    }
  };

  const generateWhatsAppMessage = () => {
    let message = '';
    if (activeTab === 'hotel') {
      message = `Réservation Hôtel:\n
  Destination: ${destination}\n
  Dates: ${dates.join(' - ')}\n
  Occupants: ${getOccupantsSummary()}\n
  Étoiles: ${rating}⭐\n
  Options:\n
  - Piscine: ${selectedOptions.pool ? 'Oui' : 'Non'}\n
  - Petit-déjeuner: ${selectedOptions.breakfast ? 'Oui' : 'Non'}\n
  - Proche de la mer: ${selectedOptions.nearBeach ? 'Oui' : 'Non'}\n
  Hôtel particulier: ${hotelName ? hotelName : 'Non spécifié'}\n`; // Use hotelName state
    } else { // 'car'
      const selectedStationObject = stationsToDisplay.find(s => s.Item1 === formData.station);
      const stationName = selectedStationObject ? formatStationName(selectedStationObject.Item2) : formData.station;
      message = `Location Voiture:\n
  Pays: ${formData.country}\n
  Station: ${stationName}\n
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

  // Reset step on tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentStep(1);
    // Optionally reset form data here if needed
  };

  // --- Render Logic ---
  const renderStepContent = () => {
    if (activeTab === 'hotel') {
      // --- HOTEL ---
      if (currentStep === 1) {
        // Hotel Step 1: Destination, Dates, Occupants, Options
        return (
          <>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 mb-6">
              {/* Destination */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="destination"
                  type="text"
                  placeholder="Destination (ville, hôtel...)"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>
              {/* Dates */}
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <div className="w-full pl-10 pr-4 py-3 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <Flatpickr
                    options={{
                      mode: "range", locale: French, minDate: "today", showMonths: 2,
                      dateFormat: "d/m/Y", disableMobile: true, static: true,
                    }}
                    className="w-full flatpickr-input bg-transparent outline-none"
                    placeholder="Sélectionnez vos dates"
                    value={dates}
                    onChange={(selectedDates) => {
                      setDates(selectedDates.map(d => d.toLocaleDateString('fr-FR')));
                    }}
                    required
                  />
                </div>
              </div>
              {/* Occupants */}
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
                    {/* Occupant controls */}
                    <div className="space-y-4">
                      {/* Rooms */}
                      <div className="flex items-center justify-between">
                        <span>Chambres</span>
                        <div className="flex items-center gap-3">
                          <button type="button" className="p-1 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('rooms', -1)}><Minus size={16} /></button>
                          <span className="w-8 text-center">{occupants.rooms}</span>
                          <button type="button" className="p-1 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('rooms', 1)}><Plus size={16} /></button>
                        </div>
                      </div>
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <span>Adultes (18+)</span>
                        <div className="flex items-center gap-3">
                          <button type="button" className="p-1 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('adults', -1)}><Minus size={16} /></button>
                          <span className="w-8 text-center">{occupants.adults}</span>
                          <button type="button" className="p-1 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('adults', 1)}><Plus size={16} /></button>
                        </div>
                      </div>
                      {/* Children */}
                      <div className="flex items-center justify-between">
                        <span>Enfants (0-17)</span>
                        <div className="flex items-center gap-3">
                          <button type="button" className="p-1 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('children', -1)}><Minus size={16} /></button>
                          <span className="w-8 text-center">{occupants.children}</span>
                          <button type="button" className="p-1 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('children', 1)}><Plus size={16} /></button>
                        </div>
                      </div>
                      {/* Children Ages */}
                      {occupants.children > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Âge des enfants</p>
                          <div className="grid grid-cols-2 gap-2">
                            {occupants.childrenAges.map((age, index) => (
                              <select key={index} className="p-2 border rounded" value={age}
                                onChange={(e) => {
                                  const newAges = [...occupants.childrenAges];
                                  newAges[index] = parseInt(e.target.value);
                                  setOccupants(prev => ({ ...prev, childrenAges: newAges }));
                                }}>
                                {Array.from({ length: 18 }, (_, i) => (<option key={i} value={i}>{i} {i === 0 ? "an" : "ans"}</option>))}
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

            {/* Hotel Options */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Rating */}
              <div className="relative md:col-span-1 col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d’étoiles</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={24}
                      className={`cursor-pointer transition-colors ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
              {/* Checkbox Options */}
              <div className="relative md:col-span-2 col-span-1">
                <p className="text-sm font-medium text-gray-700 mb-2">Options de l'hôtel</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedOptions.pool} onChange={(e) => setSelectedOptions(prev => ({ ...prev, pool: e.target.checked }))} className="rounded text-blue-600" />
                    <span>Piscine</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedOptions.breakfast} onChange={(e) => setSelectedOptions(prev => ({ ...prev, breakfast: e.target.checked }))} className="rounded text-blue-600" />
                    <span>Petit-déjeuner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedOptions.nearBeach} onChange={(e) => setSelectedOptions(prev => ({ ...prev, nearBeach: e.target.checked }))} className="rounded text-blue-600" />
                    <span>Proche de la mer</span>
                  </label>
                </div>
              </div>
              {/* Specific Hotel */}
              <div className="relative md:col-span-1 col-span-1">
                <p className="text-sm font-medium text-gray-700 mb-2">Avez-vous une idée d'hôtel en particulier ?</p>
                <input type="text" placeholder="Nom de l'hôtel (facultatif)"
                  className="w-full p-2 border rounded-md"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                />
              </div>
            </div>
          </>
        );
      } else if (currentStep === 2) {
        // Hotel Step 2: Contact Information
        return renderContactInfoStep();
      }
    } else {
      // --- CAR ---
      if (currentStep === 1) {
        // Car Step 1: Country, Station, Dates, Times, Options, Age
        return (
          <>
            {/* Country & Station */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="form-group">
                <select className="w-full p-3 border rounded-lg" value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value, station: ''})} required>
                  <option value="">Sélectionnez un pays *</option>
                  {RENTAL_COUNTRIES.sort((a, b) => ['Israel', 'France', 'États-Unis'].includes(b.Item2) ? 1 : -1)
                    .map((country) => (<option key={country.Item1} value={country.Item1}>{country.Item2}</option>))}
                </select>
              </div>
              <div className="form-group">
                <select className="w-full p-3 border rounded-lg" value={formData.station}
                  onChange={(e) => setFormData({...formData, station: e.target.value})} required disabled={!formData.country}>
                  <option value="">Sélectionnez une station *</option>
                  {stationsToDisplay.map(station => (
                    <option key={station.Item1} value={station.Item1} style={station.Item2.startsWith("red_") ? { color: 'red' } : {}}>
                      {station.Item2.startsWith("red_") ? formatStationName(station.Item2) : station.Item2}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Dates & Times */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative md:col-span-2 col-span-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <div className="w-full pl-10 pr-4 py-3 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <Flatpickr
                    options={{ mode: "range", locale: French, minDate: "today", showMonths: 2, dateFormat: "d/m/Y" }}
                    className="w-full flatpickr-input bg-transparent outline-none"
                    placeholder="Dates prise en charge / retour *"
                    value={formData.pickupDate && formData.returnDate ? [formData.pickupDate, formData.returnDate] : []}
                    onChange={(selectedDates) => {
                      if (selectedDates.length === 2) {
                        setFormData({ ...formData, pickupDate: selectedDates[0].toLocaleDateString('fr-FR'), returnDate: selectedDates[1].toLocaleDateString('fr-FR') });
                      }
                    }}
                    required
                  />
                </div>
              </div>
              <div className="relative md:col-span-1 col-span-1">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <div className="w-full pl-10 pr-4 py-3 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <Flatpickr
                    options={{ enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, minuteIncrement: 15 }}
                    className="w-full flatpickr-input bg-transparent outline-none"
                    placeholder="Heure départ *"
                    value={formData.pickupTime}
                    onChange={(selectedTime) => {
                      if (selectedTime.length > 0) {
                        setFormData({ ...formData, pickupTime: selectedTime[0].toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }) });
                      }
                    }}
                    required
                  />
                </div>
              </div>
              <div className="relative md:col-span-1 col-span-1">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                 <div className="w-full pl-10 pr-4 py-3 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <Flatpickr
                    options={{ enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true, minuteIncrement: 15 }}
                    className="w-full flatpickr-input bg-transparent outline-none"
                    placeholder="Heure retour *"
                    value={formData.returnTime}
                    onChange={(selectedTime) => {
                      if (selectedTime.length > 0) {
                        setFormData({ ...formData, returnTime: selectedTime[0].toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }) });
                      }
                    }}
                    required
                  />
                </div>
              </div>
            </div>
            {/* Options, Age, Promo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 md:col-span-2 col-span-1">
                <button type="button" onClick={() => setFormData({ ...formData, hasVisa: !formData.hasVisa })}
                  className={`flex items-center gap-2 p-3 border rounded-lg transition-colors w-full justify-center ${formData.hasVisa ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
                  <img src={visaLogoUrl} alt="Visa Logo" className="w-8 h-auto" />
                  <span>Visa Première ?</span>
                </button>
                <button type="button" onClick={() => setFormData({ ...formData, shabbatRestriction: !formData.shabbatRestriction })}
                  className={`flex items-center gap-2 p-3 border rounded-lg transition-colors w-full justify-center ${formData.shabbatRestriction ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
                  <img src="/chabbat.png" alt="Shabbat" className="w-8 h-auto" />
                  <span>Restriction Chabat ?</span>
                </button>
              </div>
              <div className="relative md:col-span-1 col-span-1">
                <select name="age" className="w-full p-3 border rounded-lg" value={formData.driverAge}
                  onChange={(e) => setFormData({...formData, driverAge: e.target.value})} required>
                  <option value="">Âge conducteur *</option>
                  {Array.from({ length: 8 }, (_, i) => (<option key={i} value={i + 18}>{i + 18}</option>))}
                  <option value="25+">25+</option>
                </select>
              </div>
              <div className="relative md:col-span-1 col-span-1">
                <input type="text" className="w-full p-3 border rounded-lg" placeholder="Code Promo"
                  value={formData.promoCode} onChange={(e) => setFormData({...formData, promoCode: e.target.value})} />
              </div>
            </div>
          </>
        );
      } else if (currentStep === 2) {
        // Car Step 2: Vehicle Selection
        return (
          <div className="w-full relative">
            <h3 className="text-lg font-semibold mb-4">Sélectionnez votre véhicule (facultatif)</h3>
            <Slider {...sliderSettings}>
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle["Nom du véhicule"]}
                  className={`vehicle-card cursor-pointer transition-all duration-300 p-2 border rounded-lg mx-2 flex flex-col items-center ${
                    selectedVehicle === vehicle
                      ? 'border-blue-500 border-2 bg-blue-50 scale-105 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedVehicle(selectedVehicle === vehicle ? null : vehicle)}
                >
                  <img
                    src={vehicle["Image URL"]}
                    alt={vehicle["Nom du véhicule"]}
                    className="vehicle-image h-24 w-auto object-contain mb-2" // Adjusted styling
                  />
                  <div className="vehicle-info text-center mt-auto"> {/* Pushes text down */}
                    <p className="text-gray-700 font-medium text-sm"> {/* Smaller text */}
                      {vehicle["Nom du véhicule"]}
                    </p>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        );
      } else if (currentStep === 3) {
        // Car Step 3: Contact Information
        return renderContactInfoStep();
      }
    }
    return null; // Should not happen
  };

  // --- Reusable Contact Info Step ---
  const renderContactInfoStep = () => (
    <>
      <h3 className="text-lg font-semibold mb-4">Vos informations de contact</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input type="text" className="p-3 border rounded-lg" placeholder="Prénom *" value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
        <input type="text" className="p-3 border rounded-lg" placeholder="Nom *" value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input type="email" className="p-3 border rounded-lg" placeholder="Email *" value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})} required />
        <input type="tel" className="p-3 border rounded-lg" placeholder="Téléphone *" value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
      </div>
      <div className="mb-6">
        <textarea className="w-full p-3 border rounded-lg" placeholder="Notes ou remarques (facultatif)"
          value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
      </div>
    </>
  );

  // --- Determine Button States ---
  const isNextDisabled = () => {
    if (activeTab === 'hotel') {
      return currentStep === 1 && !validateStep1();
    } else { // car
      if (currentStep === 1) return !validateStep1();
      if (currentStep === 2) return !validateStep2Car(); // Currently always true
    }
    return true; // Disable if step logic is wrong
  };

  const isSubmitDisabled = () => {
    const isFinalContactStep = (activeTab === 'hotel' && currentStep === 2) || (activeTab === 'car' && currentStep === 3);
    return !isFinalContactStep || !validateFinalStep() || isSubmitting;
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-start justify-center pt-10 md:pt-20 pb-10">
      <div className="w-full max-w-screen-xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          {formSubmitted ? (
            // --- Success Message ---
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold mb-4 text-green-600">Merci !</h2>
              <p className="text-lg text-gray-700">
                Votre demande a bien été transmise.<br />
                Vous recevrez une réponse sous 48H.
              </p>
              {/* Optional: Add a button to start a new request */}
              {/* <button onClick={() => setFormSubmitted(false)} className="mt-6 p-3 bg-blue-600 text-white rounded-lg">Nouvelle demande</button> */}
            </div>
          ) : (
            // --- Form ---
            <>
              {/* Tabs */}
              <div className="flex gap-6 mb-6 border-b">
                <button
                  className={`flex items-center gap-2 pb-2 px-1 font-medium transition-colors duration-200 ${activeTab === 'hotel' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => handleTabChange('hotel')}>
                  <Hotel size={20} /> Réserver un hôtel
                </button>
                <button
                  className={`flex items-center gap-2 pb-2 px-1 font-medium transition-colors duration-200 ${activeTab === 'car' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => handleTabChange('car')}>
                  <Car size={20} /> Louer un véhicule
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit}>
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className={`flex items-center gap-2 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-opacity ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} // Hide on first step
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft size={20} /> Précédent
                  </button>

                  {/* Next Button (shown on non-final steps) */}
                  {((activeTab === 'hotel' && currentStep === 1) || (activeTab === 'car' && currentStep < 3)) && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className={`flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-opacity ${isNextDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isNextDisabled()}
                    >
                      Suivant <ArrowRight size={20} />
                    </button>
                  )}

                  {/* Submit Button (shown on final step) */}
                  {((activeTab === 'hotel' && currentStep === 2) || (activeTab === 'car' && currentStep === 3)) && (
                    <button
                      type="submit"
                      className={`flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-opacity min-w-[180px] ${isSubmitDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isSubmitDisabled()}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Envoi en cours...
                        </>
                      ) : (
                        'Envoyer ma demande'
                      )}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
