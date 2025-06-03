import React, { useState, useEffect } from 'react';
import Select from 'react-select'; // Import react-select
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
import RENTAL_COUNTRIES from './data/countries.json';
import vehicles from './data/vehicules.json';
import stations from './data/stations.json';

// Fonction utilitaire pour le suivi des événements Facebook Pixel
const trackFbEvent = (eventName: string, params = {}) => {
  if (window.fbq) {
    window.fbq('track', eventName, params);
  } else {
    console.warn('Facebook Pixel not loaded');
  }
};

// Déclaration pour TypeScript
declare global {
  interface Window {
    fbq: any;
    google: any;
  }
}

const PrevArrow = (props: any) => (
  <button
    {...props}
    type="button"
    onClick={(e) => {
      e.preventDefault(); 
      props.onClick && props.onClick(e);
    }}
    className="slick-prev z-30 absolute left-1 md:left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center"
    aria-label="Précédent" // Pour l'accessibilité
  >
    <div className="text-black text-3xl leading-none bg-white/80 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-white">
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
    className="slick-next z-30 absolute right-1 md:right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center"
    aria-label="Suivant" // Pour l'accessibilité
  >
    <div className="text-black text-3xl leading-none bg-white/80 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-white">
      ›
    </div>
  </button>
);

const sliderSettings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 4, // ou 1 a verifier si c'est mieux
  slidesToScroll: 1, // Défiler 1 slide à la fois / yavais pas de défilement avant
  swipeToSlide: true,
  nextArrow: <NextArrow />,
  prevArrow: <PrevArrow />,
  // Points de rupture pour écrans plus grands
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
        dots: false // cacher les points 
      }
    },
    {
      breakpoint: 768, // Pour tablettes
      settings: {
        slidesToShow: 2,
        dots: false
      }
    },
    {
      breakpoint: 640, // Pour grands téléphones
      settings: {
        slidesToShow: 1,
        dots: false,
        swipe: true,      // Ajout explicite pour cette breakpoint
        touchMove: true // Ajout explicite pour cette breakpoint
      }
    }
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

// Function to generate time options every 30 minutes
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};
const timeOptions = generateTimeOptions();

// Prepare country options for react-select
const countryOptions = RENTAL_COUNTRIES
  .map(country => ({ value: country.Item1, label: country.Item2 }))
  .sort((a, b) => {
    const preferred = ['Israel', 'France', 'États-Unis'];
    // Prioritize preferred countries, then sort alphabetically
    const aIsPreferred = preferred.includes(a.label);
    const bIsPreferred = preferred.includes(b.label);
    if (aIsPreferred && !bIsPreferred) return -1;
    if (!aIsPreferred && bIsPreferred) return 1;
    // If both are preferred or both are not, sort alphabetically
    return a.label.localeCompare(b.label);
  });


function App() {

  // Custom filter function for react-select
  const filterCountryOptions = (option: { label: string; value: string }, inputValue: string) => {
    const lowerInput = inputValue.toLowerCase();
    const lowerLabel = option.label.toLowerCase();

    // Check for standard prefix match
    if (lowerLabel.startsWith(lowerInput)) {
      return true;
    }

    // Check for specific abbreviations
    if (lowerLabel === 'israel' && lowerInput === 'il') {
      return true;
    }
    if (lowerLabel === 'france' && lowerInput === 'fr') {
      return true;
    }
    if (lowerLabel === 'U.S.A' && lowerInput === 'us') {
      return true;
    }

    return false;
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    // Validation basique: au moins 10 chiffres, avec possibilité d'avoir des espaces, tirets, parenthèses, etc.
    const phoneRegex = /^(?:\+|00)?[0-9\s()\-]{10,}$/;
    return phoneRegex.test(phone);
  };

  // Fonction pour vérifier si un email est valide
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const [crmSubmitted, setCrmSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('hotel');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [hotelName, setHotelName] = useState(''); 
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // États pour la réservation d'hôtel
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState<string[]>([]); 
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showOccupants, setShowOccupants] = useState(false);
  const [occupants, setOccupants] = useState({
    rooms: 1,
    adults: 2, 
    children: 0, 
    babies: 0,   
    childrenAges: [] as (number | string)[] 
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
    pickupTime: '09:00', 
    returnDate: '',
    returnTime: '09:00',
    driverAge: '25+', // tester si ca marche
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
      if (input && window.google && window.google.maps && window.google.maps.places) {
        const autocomplete = new window.google.maps.places.Autocomplete(input);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place) { // Vérification générale que place existe
            if (place.name) {
              setDestination(place.name); // Prioriser le nom du lieu
            } else if (place.formatted_address) {
              // N'utiliser l'adresse formatée que si le nom n'est pas disponible
              setDestination(place.formatted_address);
            }
            // Optionnel : vous pouvez ajouter un else pour gérer le cas où ni nom ni adresse ne sont trouvés
             else {
               console.log('Place sélectionnée sans nom ni adresse formatée:', place);
             }
          }
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

  // Effect to handle window resize for responsive Flatpickr options (still needed for date picker)
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768); // md breakpoint
    };

    window.addEventListener('resize', handleResize);
    // Call handler right away so state is correct initiall
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures effect is only run on mount and unmount

  const handleOccupantChange = (type: 'rooms' | 'adults' | 'children' | 'babies', increment: number) => {
    setOccupants(prev => {
      const newValue = Math.max(0, prev[type] + increment);

      // Handle children (2-17) ages specifically
      if (type === 'children') {
        const ages = [...prev.childrenAges];
        if (increment > 0) {
          ages.push(""); // Changer ici de 2 à ""
        } else if (increment < 0 && ages.length > 0) {
          ages.pop();
        }
        return { ...prev, [type]: newValue, childrenAges: ages };
      }

      // Handle rooms and adults minimum value
      if (type === 'rooms' || type === 'adults') {
        return { ...prev, [type]: Math.max(1, newValue) };
      }

      // Handle babies or other types
      return { ...prev, [type]: newValue };
    });
  };

  const getOccupantsSummary = () => {
    // Always show adults, children, babies, and rooms
    const adultText = `${occupants.adults} adulte${occupants.adults > 1 ? 's' : ''}`;
    const childText = `${occupants.children} enfant${occupants.children > 1 ? 's' : ''}`;
    const babyText = `${occupants.babies} bébé${occupants.babies > 1 ? 's' : ''}`;
    const roomText = `${occupants.rooms} chambre${occupants.rooms > 1 ? 's' : ''}`;

    return isMobileView 
      ? `${roomText}, ${adultText}\n${childText}, ${babyText}` 
      : `${roomText}, ${adultText}, ${childText}, ${babyText}`;
  };

  const [whatsappLink, setWhatsappLink] = useState('');
  
  // --- Step Validation ---
  const validateStep1 = () => {
    if (activeTab === 'hotel') {
    // Vérifier si tous les âges des enfants sont remplis
    const allChildrenAgesSelected = occupants.children === 0 || 
      (occupants.childrenAges.length === occupants.children && 
      occupants.childrenAges.every(age => age !== ""));
      
    // Hotel Step 1: Destination and Dates
    return destination && dates.length === 2 && allChildrenAgesSelected;
    } else { // Car Step 1: Country, Station, Dates, Times, Age
      return formData.country && formData.station && formData.pickupDate && formData.returnDate && formData.pickupTime && formData.returnTime && formData.driverAge;
    }
  };

  const validateStep2Car = () => {
    // Car Step 2: Vehicle Selection is now required
    return selectedVehicle !== null;
  };

  const validateFinalStep = () => {
    return formData.firstName && formData.lastName && formData.email && isValidPhoneNumber(formData.phone);
  };

  // --- Navigation ---
  const handleNextStep = () => {
    if (activeTab === 'hotel') {
      if (currentStep === 1) {
        // Vérifications pour l'onglet Hôtel étape 1
        if (!destination) {
          toast.error("Veuillez saisir une destination");
          return;
        }
        
        if (dates.length !== 2) {
          toast.error("Veuillez sélectionner les dates d'arrivée et de départ");
          return;
        }
        
        // Vérifier si tous les âges des enfants sont remplis
        if (occupants.children > 0 && 
            (occupants.childrenAges.length !== occupants.children || 
             occupants.childrenAges.some(age => age === ""))) {
          toast.error("Veuillez sélectionner l'âge de chaque enfant");
          return;
        }
        
        setCurrentStep(2); // Tout est validé, on passe à l'étape suivante
      }
    } else { // car tab
      if (currentStep === 1) {
        // Vérifications pour l'onglet Voiture étape 1
        if (!formData.country) {
          toast.error("Veuillez sélectionner un pays");
          return;
        }
        
        if (!formData.station) {
          toast.error("Veuillez sélectionner une station");
          return;
        }
        
        if (!formData.pickupDate || !formData.returnDate) {
          toast.error("Veuillez sélectionner les dates de prise et de retour");
          return;
        }
        
        if (!formData.pickupTime) {
          toast.error("Veuillez sélectionner l'heure de prise du véhicule");
          return;
        }
        
        if (!formData.returnTime) {
          toast.error("Veuillez sélectionner l'heure de retour du véhicule");
          return;
        }
        
        if (!formData.driverAge) {
          toast.error("Veuillez sélectionner l'âge du conducteur");
          return;
        }
        
        setCurrentStep(2); // Tout est validé, on passe à l'étape suivante
      } else if (currentStep === 2) {
        if (!selectedVehicle) {
          toast.error("Veuillez sélectionner un véhicule");
          return;
        }
        
        setCurrentStep(3); // Véhicule sélectionné, on passe à l'étape suivante
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1); // Go back one step
    }
  };

  // Fonction pour générer le message WhatsApp
  const generateWhatsAppMessage = () => {
    let message = '';
    if (activeTab === 'hotel') {
      message = `Réservation Hôtel:\n
Destination: ${destination}\n
Dates: ${dates.join(' - ')}\n
Occupants: ${getOccupantsSummary().replace(/\n/g, ', ')}\n
Étoiles: ${rating}⭐\n
Options:\n
- Piscine: ${selectedOptions.pool ? 'Oui' : 'Non'}\n
- Petit-déjeuner: ${selectedOptions.breakfast ? 'Oui' : 'Non'}\n
- Proche de la mer: ${selectedOptions.nearBeach ? 'Oui' : 'Non'}\n
Hôtel particulier: ${hotelName ? hotelName : 'Non spécifié'}\n`;
    } else { // 'car'
      const selectedStationObject = stationsToDisplay.find(s => s.Item1 === formData.station);
      const stationName = selectedStationObject ? formatStationName(selectedStationObject.Item2) : formData.station;
      message = `Location Voiture:\n
Pays: ${formData.country}\n
Station: ${stationName}\n
Dates: Du ${formData.pickupDate} ${formData.pickupTime} au ${formData.returnDate} ${formData.returnTime}\n
Âge conducteur: ${formData.driverAge}\n
Visa Premier: ${formData.hasVisa ? 'Oui' : 'Non'}\n
Roulez-vous le Chabbat : ${formData.shabbatRestriction ? 'Non' : 'Oui'}\n`;
      
      if (selectedVehicle) {
        message += `\nVéhicule sélectionné: ${selectedVehicle["Nom du véhicule"]}\n`;
      }
    }
    
    message += `\nContact:\n
Nom: ${formData.firstName} ${formData.lastName}\n
Email: ${formData.email}\n
Téléphone: ${formData.phone}`;
    
    if (formData.notes) {
      message += `\nNotes: ${formData.notes}`;
    }

    return message;
  };

  // Fonction pour générer le lien WhatsApp
  const generateWhatsAppLink = () => {
    const message = generateWhatsAppMessage();
    const phoneNumber = "972584140489";
    const encodedMessage = encodeURIComponent(message);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile 
      ? `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`
      : `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
  };

  // fonction de soumission crm
  const handleCRMSubmit = async () => {
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

    if (window.fbq) {
      window.fbq('track', 'Contact', {
        content_category: activeTab === 'hotel' ? 'hotel_reservation' : 'car_rental',
        content_name: activeTab === 'hotel' ? destination : formData.country
      });
    }
      
    // Convertir l'âge en nombre valide pour le CRM
      let ageValue = driverAge;
      if (driverAge === "25+") {
        ageValue = "25"; // Convertir "25+" en "25" pour que le CRM l'accepte
      }
        
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
          age: ageValue,
          nationalite: "Francais"
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
          occupants: {
            rooms: occupants.rooms,
            adults: occupants.adults,
            children: occupants.children,
            babies: occupants.babies,
            childrenAges: occupants.childrenAges
          },
          rating,
          selectedOptions: {
            pool: selectedOptions.pool,
            breakfast: selectedOptions.breakfast,
            nearBeach: selectedOptions.nearBeach
          },
          souhaite_hotel_en_particulier: hotelName || null
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
  };

  // Remplacer la fonction handleSubmitAndOpenWhatsApp par celle-ci :
  const handleOpenWhatsApp = async () => {
    if (!validateFinalStep()) {
      if (!formData.firstName) {
        toast.error("Veuillez saisir votre prénom");
        return;
      }
      
      if (!formData.lastName) {
        toast.error("Veuillez saisir votre nom");
        return;
      }
      
      if (!formData.email) {
        toast.error("Veuillez saisir votre email");
        return;
      }
      
      if (!isValidEmail(formData.email)) {
        toast.error("Le format de l'email n'est pas valide");
        return;
      }
      
      if (!formData.phone) {
        toast.error("Veuillez saisir votre numéro de téléphone");
        return;
      }
      
      if (!isValidPhoneNumber(formData.phone)) {
        toast.error("Le format du numéro de téléphone n'est pas valide");
        return;
      }
      
      // Si on arrive ici, c'est qu'il y a une erreur de validation mais qu'on n'a pas identifié la cause spécifique
      toast.error("Veuillez remplir tous les champs obligatoires correctement");
      return;
    }
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Générer le message WhatsApp
      const message = generateWhatsAppMessage();
      const phoneNumber = "972584140489";
      const encodedMessage = encodeURIComponent(message);
      
      // Créer le lien WhatsApp en fonction du device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const whatsappUrl = isMobile 
        ? `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`
        : `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
      
      // Ouvrir WhatsApp directement
      window.open(whatsappUrl, '_blank');
      
      // Réinitialiser les états
      setCurrentStep(1);
      setFormSubmitted(true);
      setWhatsappLink(whatsappUrl);
      
      // Notification de succès 
      toast.success("WhatsApp a été ouvert pour finaliser votre demande !");
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi des données ou de l\'ouverture de WhatsApp:', error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (validateFinalStep() && !crmSubmitted) {
      console.log("Contact info complete with valid phone - submitting to CRM once");
      setCrmSubmitted(true);
      handleCRMSubmit();
    }
  }, [formData.firstName, formData.lastName, formData.email, formData.phone, crmSubmitted]);

  // Reset step on tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentStep(1);
  };

  // --- Render Logic ---
  const renderStepContent = () => {
    if (activeTab === 'hotel') {
      // --- HOTEL ---
      if (currentStep === 1) {
        // Hotel Step 1: Destination, Dates, Occupants, Options
        return (
          <>
            {/* Section Destination / Dates / Occupants */}
            {/* Utilise flex-col par défaut (mobile), passe à flex-row sur écrans moyens */}
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 mb-6">
              {/* Destination */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                <input
                  id="destination"
                  type="text"
                  placeholder="Destination (ville, hôtel...)"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={destination} onChange={(e) => setDestination(e.target.value)} required
                />
              </div>
              {/* Dates */}
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                <div className="w-full pl-10 pr-4 py-3 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <Flatpickr
                    options={{
                      mode: "range", locale: French, minDate: "today", showMonths: isMobileView ? 1 : 2, 
                      dateFormat: "d/m/Y",
                      static: false,
                      disableMobile: false
                    }}
                    className="w-full flatpickr-input bg-transparent outline-none border-none"
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
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer min-h-[4rem] md:min-h-0"
                  onClick={() => setShowOccupants(!showOccupants)}
                  aria-expanded={showOccupants}
                >
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate whitespace-pre-line">{getOccupantsSummary()}</span>
                  </div>
                  <span className="text-gray-400 ml-2">{showOccupants ? '▲' : '▼'}</span>
                </div>
                {showOccupants && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-lg mt-1 p-4 shadow-lg z-20">
                    <div className="space-y-3">
                      {/* Chambres */}
                      <div className="flex items-center justify-between">
                        <span>Chambres</span>
                        <div className="flex items-center gap-2">
                          <button type="button" className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50" onClick={() => handleOccupantChange('rooms', -1)} disabled={occupants.rooms <= 1}><Minus size={16} /></button>
                          <span className="w-8 text-center font-medium">{occupants.rooms}</span>
                          <button type="button" className="p-2 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('rooms', 1)}><Plus size={16} /></button>
                        </div>
                      </div>
                      {/* Adultes */}
                       <div className="flex items-center justify-between">
                        <span>Adultes (18+)</span>
                        <div className="flex items-center gap-2">
                          <button type="button" className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50" onClick={() => handleOccupantChange('adults', -1)} disabled={occupants.adults <= 1}><Minus size={16} /></button>
                          <span className="w-8 text-center font-medium">{occupants.adults}</span>
                          <button type="button" className="p-2 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('adults', 1)}><Plus size={16} /></button>
                        </div>
                      </div>
                      {/* Enfants */}
                       <div className="flex items-center justify-between">
                        <span>Enfants (2-17)</span>
                        <div className="flex items-center gap-2">
                          <button type="button" className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50" onClick={() => handleOccupantChange('children', -1)} disabled={occupants.children <= 0}><Minus size={16} /></button>
                          <span className="w-8 text-center font-medium">{occupants.children}</span>
                          <button type="button" className="p-2 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('children', 1)}><Plus size={16} /></button>
                        </div>
                      </div>
                      {/* Bébés */}
                      <div className="flex items-center justify-between">
                        <span>Bébés (0-2)</span>
                        <div className="flex items-center gap-2">
                           <button type="button" className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50" onClick={() => handleOccupantChange('babies', -1)} disabled={occupants.babies <= 0}><Minus size={16} /></button>
                          <span className="w-8 text-center font-medium">{occupants.babies}</span>
                          <button type="button" className="p-2 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('babies', 1)}><Plus size={16} /></button>
                        </div>
                      </div>
                      {/* Ages Enfants */}
                      {occupants.children > 0 && (
                        <div className="space-y-2 pt-2 border-t mt-3">
                          <p className="text-sm font-medium">Âge des enfants (2-17 ans)</p>
                          <div className="grid grid-cols-2 gap-2">
                            {occupants.childrenAges.map((age, index) => (
                              <div key={index} className="relative">
                                <select
                                  className={`p-2 border rounded text-sm w-full ${age === "" ? "border-red-500" : "border-gray-300"}`}
                                  value={age || ""}
                                  onChange={(e) => {
                                    const newAges = [...occupants.childrenAges];
                                    newAges[index] = e.target.value === "" ? "" : parseInt(e.target.value);
                                    setOccupants(prev => ({ ...prev, childrenAges: newAges }));
                                  }}
                                  required
                                >
                                  <option value="">Veuillez sélectionner</option>
                                  {Array.from({ length: 16 }, (_, i) => i + 2).map(a => (
                                    <option key={a} value={a}>{a} ans</option>
                                  ))}
                                </select>
                                {age === "" && (
                                  <p className="text-red-500 text-xs mt-1">Âge requis</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )} 
                    </div> 
                     {/* Bouton pour fermer le popup sur mobile */}
                     <button type="button" onClick={() => setShowOccupants(false)} className="mt-3 text-blue-600 text-sm w-full text-center">Terminé</button>
                  </div> 
                )}
              </div> 
            </div> 

            {/* Section Options Hôtel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Étoiles */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'étoiles</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={24}
                      className={`cursor-pointer transition-colors ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
              {/* Checkbox Options */}
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Options de l'hôtel</p>
                {/* Utilise flex-wrap pour passer à la ligne si besoin sur mobile */}
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedOptions.pool} onChange={(e) => setSelectedOptions(prev => ({ ...prev, pool: e.target.checked }))} className="rounded text-blue-
                    600 focus:ring-blue-500" />
                    <span>Piscine</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedOptions.breakfast} onChange={(e) => setSelectedOptions(prev => ({ ...prev, breakfast: e.target.checked }))} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span>Petit-déjeuner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedOptions.nearBeach} onChange={(e) => setSelectedOptions(prev => ({ ...prev, nearBeach: e.target.checked }))} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span>Proche de la mer</span>
                  </label>
                </div>
              </div>
              {/* Specific Hotel */}
              <div className="md:col-span-1"> {/* Prend 1 colonne sur md */}
                <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700 mb-1">Avez-vous une idée d'hôtel en particulier ?</label>
                <input id="hotelName" type="text" placeholder="Nom de l'hôtel (facultatif)"
                  className="w-full p-2 border rounded-md text-sm"
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
        // Car Step 1: Location, Dates, Options
        return (
          <>
            {/* Ligne Pays/Station/Dates/Heures */}
            {/* Grid 1 colonne mobile -> 7 colonnes md. Vérifier si c'est lisible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 md:gap-4 mb-6 items-end">
              {/* Pays */}
              <div className="sm:col-span-1 md:col-span-1">
                <Select
                  inputId="country-select"
                  options={countryOptions}
                  value={countryOptions.find(option => option.value === formData.country) || null}
                  onChange={(selectedOption) => {
                    setFormData({ ...formData, country: selectedOption ? selectedOption.value : '', station: '' });
                  }}
                  placeholder="Pays *"
                  isSearchable
                  filterOption={filterCountryOptions} // Add custom filter
                  noOptionsMessage={() => 'Aucun pays trouvé'}
                  className="react-select-container text-sm md:text-base" // Basic container class
                  classNamePrefix="react-select" // Prefix for internal elements (e.g., react-select__control)
                  styles={{ // Basic styling to match height - adjust as needed
                    control: (provided) => ({
                      ...provided,
                      minHeight: '48px', // Match p-3 roughly (padding + line height)
                      borderColor: '#d1d5db', // Match border-gray-300
                      borderRadius: '0.5rem', // Match rounded-lg
                      boxShadow: 'none', // Remove default focus shadow
                      '&:hover': {
                        borderColor: '#9ca3af', // Match border-gray-400 on hover
                      }
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#6b7280', // Match text-gray-500
                    }),
                    input: (provided) => ({
                      ...provided,
                      margin: '0px',
                      padding: '0px',
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      padding: '0 8px' // Adjust padding inside control
                    }),
                    singleValue: (provided) => ({
                       ...provided,
                       color: 'inherit' // Inherit text color
                    }),
                    menu: (provided) => ({ // Ensure menu is on top
                      ...provided,
                      zIndex: 9999
                    }),
                  }}
                  required // Note: react-select doesn't use HTML5 required; validation is handled in JS
                />
              </div>
              {/* Station */}
              <div className="sm:col-span-1 md:col-span-2">
                <Select
                  inputId="station-select"
                  options={stationsToDisplay.map(station => ({
                    value: station.Item1,
                    label: formatStationName(station.Item2),
                    isAirport: station.Item2.startsWith("red_") // Add a flag for styling
                  }))}
                  value={stationsToDisplay.map(station => ({ value: station.Item1, label: formatStationName(station.Item2), isAirport: station.Item2.startsWith("red_") })).find(option => option.value === formData.station) || null}
                  onChange={(selectedOption) => {
                    setFormData({ ...formData, station: selectedOption ? selectedOption.value : '' });
                  }}
                  placeholder="Station *"
                  isDisabled={!formData.country}
                  isSearchable
                  noOptionsMessage={() => 'Aucune station trouvée'}
                  className="react-select-container text-sm md:text-base"
                  classNamePrefix="react-select"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '48px', // Match p-3 roughly
                      borderColor: '#d1d5db',
                      borderRadius: '0.5rem',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#9ca3af' }
                    }),
                    placeholder: (provided) => ({ ...provided, color: '#6b7280' }),
                    input: (provided) => ({ ...provided, margin: '0px', padding: '0px' }),
                    valueContainer: (provided) => ({ ...provided, padding: '0 8px' }),
                    singleValue: (provided) => ({ ...provided, color: 'inherit' }),
                    option: (provided, state) => ({ // Style individual options
                      ...provided,
                      color: state.data.isAirport ? '#DC2626' : 'inherit', // Red text for airports
                      // Add other styles like background on hover/select if needed
                    }),
                    menu: (provided) => ({ // Ensure menu is on top
                      ...provided,
                      zIndex: 9999
                    }),
                  }}
                  required // For semantic meaning, validation is JS based
                />
              </div>
              {/* Dates */}
              <div className="relative sm:col-span-2 md:col-span-2">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                <div className="w-full pl-10 pr-4 py-3 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent relative">
                  <Flatpickr
                    options={{
                      mode: "range", locale: French, minDate: "today", showMonths: 1, // 1 mois pour mobile peut être mieux
                      dateFormat: "d/m/Y",
                      static: false, // Ensure overlay on mobile
                      disableMobile: false // Use native mobile picker if available
                    }}
                    className="w-full flatpickr-input bg-transparent outline-none text-sm md:text-base border-none"
                    placeholder="Dates Prise/Retour*"
                    value={formData.pickupDate && formData.returnDate ? [formData.pickupDate, formData.returnDate] : []}
                    onChange={(selectedDates) => {
                      if (selectedDates.length === 2) {
                        setFormData({ ...formData, pickupDate: selectedDates[0].toLocaleDateString('fr-FR'), returnDate: selectedDates[1].toLocaleDateString('fr-FR') });
                      } else if (selectedDates.length === 0) { // Permet de vider
                         setFormData({ ...formData, pickupDate: '', returnDate: '' });
                      }
                    }}
                    required
                  />
                </div>
              </div>
              {/* Wrapper for Time Pickers - Spans full width on mobile, 2 cols on sm/md */}
              <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-row gap-2 md:gap-4">
                {/* Heure Départ */}
                <div className="relative flex-1"> {/* Use flex-1 to take available space */}
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                   <select
                     id="pickupTime"
                     className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm md:text-base appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     value={formData.pickupTime}
                     onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                     required
                   >
                     <option value="">HH:MM *</option>
                     {timeOptions.map(time => (
                       <option key={time} value={time}>{time}</option>
                     ))}
                   </select>
                   {/* Custom arrow */}
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                     <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                {/* Heure Retour */}
                <div className="relative flex-1"> {/* Use flex-1 to take available space */}
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                   <select
                     id="returnTime"
                     className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm md:text-base appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     value={formData.returnTime}
                     onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                     required
                   >
                     <option value="">HH:MM *</option>
                     {timeOptions.map(time => (
                       <option key={time} value={time}>{time}</option>
                     ))}
                   </select>
                   {/* Custom arrow */}
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                     <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              </div> {/* End Time Pickers Wrapper */}
            </div> {/* Fin Ligne Pays/Station/Dates/Heures */}
            {/* Ligne Options / Age / Promo */}
            {/* Grid 1 colonne mobile -> 4 colonnes md */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-start">
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
            {/* Question Visa */}
            <div className="col-span-1">
              <p className="text-sm font-medium text-gray-800 mb-2">
                Avez-vous une Visa Première ? <span className="text-red-500">*</span>
              </p>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasVisa"
                    checked={formData.hasVisa === true}
                    onChange={() => setFormData({ ...formData, hasVisa: true })}
                  />
                  <span className="ml-2">Oui</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasVisa"
                    checked={formData.hasVisa === false}
                    onChange={() => setFormData({ ...formData, hasVisa: false })}
                  />
                  <span className="ml-2">Non</span>
                </label>
              </div>
            </div>
            
            {/* Question Shabbat */}
            <div className="col-span-1">
              <p className="text-sm font-medium text-gray-800 mb-2">
                Roulez-vous pendant Chabbat ? <span className="text-red-500">*</span>
              </p>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="shabbatRestriction"
                    checked={formData.shabbatRestriction === false}
                    onChange={() => setFormData({ ...formData, shabbatRestriction: false })}
                  />
                  <span className="ml-2">Oui</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="shabbatRestriction"
                    checked={formData.shabbatRestriction === true}
                    onChange={() => setFormData({ ...formData, shabbatRestriction: true })}
                  />
                  <span className="ml-2">Non</span>
                </label>
              </div>
            </div>
          </div>

              {/* Age Conducteur and Promo Code - Now flex container on mobile */}
              <div className="flex flex-row gap-3 md:col-span-2">
                {/* Age Conducteur */}
                <div className="flex-1 md:w-1/2 flex items-center gap-2">
                    <label htmlFor="driverAge" className="text-sm font-medium text-gray-700 text-center">Âge du conducteur</label>
                  <select id="driverAge" name="age" className="w-full p-3 border rounded-lg" value={formData.driverAge}
                  onChange={(e) => setFormData({...formData, driverAge: e.target.value})} required>
                  <option value="">Âge conducteur*</option>
                  {Array.from({ length: 8 }, (_, i) => (<option key={i} value={i + 18}>{i + 18}</option>))}
                  <option value="25+">25+</option>
                  </select>
                </div>
                {/* Code Promo */}
                <div className="flex-1 md:w-1/2">
                  <input id="promoCode" type="text" placeholder="Code promo"
                    className="w-full p-2 border rounded-md"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                   />
                </div>
              </div>
            </div>
          </>
        );
      } else if (currentStep === 2) {
        // Car Step 2: Vehicle Selection
        return (
          <div className="mb-6">
            <h3 className="text-base font-semibold mb-4">Sélectionnez votre véhicule</h3>
            {/* Le slider est maintenant configuré pour être responsive */}
            <Slider {...sliderSettings}>
              {vehicles.map((vehicle, index) => (
                <div key={index} className="px-2"> {/* Ajout de padding horizontal pour espacer les slides */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedVehicle?.["Nom du véhicule"] === vehicle["Nom du véhicule"] ? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'}`}
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <img src={vehicle["Image URL"]} alt={vehicle["Nom du véhicule"]} className="w-full h-32 object-contain mb-2 rounded" />
                    <p className="text-center font-medium text-sm">{vehicle["Nom du véhicule"]}</p>
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

  // --- Fonction de Rendu pour l'étape Contact (Partagée et Adaptée) ---
  const renderContactInfoStep = () => (
<>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <input
            type="text"
            className={`p-3 border rounded-lg w-full ${!formData.firstName ? "border-red-500" : "border-gray-300"}`}
            placeholder="Prénom *"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            required
          />
          {!formData.firstName && (
            <p className="text-red-500 text-xs mt-1">Prénom requis</p>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            className={`p-3 border rounded-lg w-full ${!formData.lastName ? "border-red-500" : "border-gray-300"}`}
            placeholder="Nom *"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required
          />
          {!formData.lastName && (
            <p className="text-red-500 text-xs mt-1">Nom requis</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <input
            type="email"
            className={`p-3 border rounded-lg w-full ${!formData.email || !isValidEmail(formData.email) ? "border-red-500" : "border-gray-300"}`}
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          {!formData.email ? (
            <p className="text-red-500 text-xs mt-1">Email requis</p>
          ) : !isValidEmail(formData.email) && (
            <p className="text-red-500 text-xs mt-1">Email invalide</p>
          )}
        </div>
        <div className="relative">
          <input
            type="tel"
            className={`p-3 border rounded-lg w-full ${!formData.phone || !isValidPhoneNumber(formData.phone) ? "border-red-500" : "border-gray-300"}`}
            placeholder="Téléphone *"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
          {!formData.phone ? (
            <p className="text-red-500 text-xs mt-1">Téléphone requis</p>
          ) : !isValidPhoneNumber(formData.phone) && (
            <p className="text-red-500 text-xs mt-1">Numéro de téléphone invalide</p>
          )}
        </div>
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

  // --- Rendu Principal (Adapté de votre exemple) ---
  const maxSteps = activeTab === 'hotel' ? 2 : 3;
  const canGoNext = (activeTab === 'hotel' && currentStep === 1 && validateStep1()) ||
                    (activeTab === 'car' && currentStep === 1 && validateStep1()) ||
                    (activeTab === 'car' && currentStep === 2 && validateStep2Car());
   const isFinalStep = (activeTab === 'hotel' && currentStep === 2) || (activeTab === 'car' && currentStep === 3);

   return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-2 md:pt-4 pb-10">
      <div className="w-full max-w-screen-xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <Toaster position="top-center" />
  
          {/* Message de succès avec bouton WhatsApp */}
          {formSubmitted && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-md text-center">
              <p className="font-semibold">Merci ! Votre demande a été envoyée.</p>
              <p className="text-sm">Nous vous contacterons bientôt.</p>
              
              {/* Bouton WhatsApp */}
              <div className="mt-4">
                <p className="mb-2 text-sm">Cliquez sur le bouton ci-dessous pour ouvrir WhatsApp et confirmer votre demande :</p>
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Ouvrir WhatsApp
                </a>
                
                {/* Conteneur pour liens alternatifs */}
                <div id="whatsapp-links-container" className="mt-2"></div>
              </div>
              
              {/* Bouton pour recommencer */}
              <button 
                onClick={() => { 
                  setFormSubmitted(false); 
                  setCurrentStep(1);
                  setWhatsappLink('');
                }} 
                className="mt-4 text-sm text-blue-600 underline"
              >
                Faire une nouvelle demande
              </button>
            </div>
          )}
  
          {!formSubmitted && (
            <>
              {/* Onglets */}
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
  
              {/* Contenu de l'étape */}
              <form onSubmit={(e) => e.preventDefault()}>
                {renderStepContent()}
  
                {/* Boutons de Navigation / Soumission */}
                <div className="flex justify-between items-center mt-8 pt-4 border-t">
                  {/* Bouton Précédent */}
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className={`flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-opacity ${currentStep > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    disabled={currentStep <= 1}
                  >
                     <ArrowLeft size={16} /> Précédent
                  </button>
  
                  {/* Bouton Suivant / Soumettre */}

                  {isFinalStep ? (
                    <button
                    type="button"
                    className="flex items-center gap-2 px-6 py-2 bg-[#EA580C] text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                    disabled={!validateFinalStep() || isSubmitting}
                    onClick={handleOpenWhatsApp}
                    >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {isSubmitting ? 'Ouverture de WhatsApp...' : 'Envoyer la demande'}
                    </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={!canGoNext || isSubmitting}
                  >
                    Suivant <ArrowRight size={16} />
                  </button>
                )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
