'use client'

import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import Flatpickr from 'react-flatpickr'
import Slider from 'react-slick'
import { 
  Hotel, Car, Search, Calendar, Users, Star, 
  ArrowRight, ArrowLeft, MapPin, Clock, Plus, Minus,
  Phone, Mail, MessageSquare, Check, X
} from 'lucide-react'
import 'flatpickr/dist/themes/airbnb.css'
import 'flatpickr/dist/l10n/fr.js'
import 'flatpickr/dist/l10n/he.js'
import { French } from 'flatpickr/dist/l10n/fr.js'
import { Hebrew } from 'flatpickr/dist/l10n/he.js'
import { toast, Toaster } from 'react-hot-toast'
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"

import rawCountries from '@/data/countries.json'
import rawStations from '@/data/stations.json'
import rawVehicles from '@/data/vehicules.json'

interface Country {
  code: string
  name: string
}

interface Station {
  id: string
  label: string
  isAirport: boolean
}

interface Vehicle {
  name: string
  image: string
}

const COUNTRIES: Country[] = (rawCountries as any[])
  .filter(c => c.Item1 && c.Item1.split(';')[0].length === 2)
  .map(({ Item1, Item2 }) => ({
    code: Item1.split(';')[0],
    name: Item2.trim(),
  }))

const getStations = (countryName: string): Station[] =>
  (rawStations as Record<string, any>)[countryName]?.data
    ?.filter((s: any) => s.Item1)
    .map((s: any) => ({
      id: s.Item1,
      label: formatStationName(s.Item2),
      isAirport: s.Item2.startsWith('red_'),
    })) ?? []

const VEHICLES: Vehicle[] = (rawVehicles as any[]).map((v: any) => ({
  name: (v['Nom du véhicule'] as string).trim(),
  image: v['Image URL'],
}))

const trackFbEvent = (eventName: string, params = {}) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    ;(window as any).fbq('track', eventName, params)
  }
}

declare global {
  interface Window {
    fbq: any
    google: any
  }
}

const PrevArrow = (props: any) => (
  <button
    {...props}
    type="button"
    onClick={(e) => {
      e.preventDefault()
      props.onClick && props.onClick(e)
    }}
    className="slick-prev z-30 absolute left-1 md:left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center"
    aria-label="Précédent"
  >
    <div className="text-black text-3xl leading-none bg-white/80 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-white">
      ‹
    </div>
  </button>
)

const NextArrow = (props: any) => (
  <button
    {...props}
    type="button"
    onClick={(e) => {
      e.preventDefault()
      props.onClick && props.onClick(e)
    }}
    className="slick-next z-30 absolute right-1 md:right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center"
    aria-label="Suivant"
  >
    <div className="text-black text-3xl leading-none bg-white/80 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-white">
      ›
    </div>
  </button>
)

const sliderSettings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 4,
  slidesToScroll: 1,
  swipeToSlide: true,
  nextArrow: <NextArrow />,
  prevArrow: <PrevArrow />,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
        dots: false,
      },
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
        dots: false,
      },
    },
    {
      breakpoint: 640,
      settings: {
        slidesToShow: 1,
        dots: false,
        swipe: true,
        touchMove: true,
      },
    },
  ],
}

const formatStationName = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.startsWith('red_')) {
    let cleaned = lower.slice(4)
    cleaned = cleaned.replace(/\b(airport|apt|ap)\b/gi, '')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    return `aéroport de ${cleaned}`
  }
  return name
}

const generateTimeOptions = () => {
  const times = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0')
      const minute = m.toString().padStart(2, '0')
      times.push(`${hour}:${minute}`)
    }
  }
  return times
}

const timeOptions = generateTimeOptions()

const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(?:\+|00)?[0-9\s()\-]{10,}$/
  return phoneRegex.test(phone)
}

const countryOptions = COUNTRIES.map((country) => ({ value: country.code, label: country.name })).sort((a, b) => {
  const preferred = ['Israel', 'France', 'États-Unis']
  const aIsPreferred = preferred.includes(a.label)
  const bIsPreferred = preferred.includes(b.label)
  if (aIsPreferred && !bIsPreferred) return -1
  if (!aIsPreferred && bIsPreferred) return 1
  return a.label.localeCompare(b.label)
})

const filterCountryOptions = (option: { label: string; value: string }, inputValue: string) => {
  const lowerInput = inputValue.toLowerCase()
  const lowerLabel = option.label.toLowerCase()

  if (lowerLabel.startsWith(lowerInput)) return true
  if (lowerLabel === 'israel' && lowerInput === 'il') return true
  if (lowerLabel === 'france' && lowerInput === 'fr') return true
  if (lowerLabel === 'états-unis' && lowerInput === 'us') return true

  return false
}

const visaLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg'

interface AppProps {
  initialActiveTab?: string
}

export default function BookingForm({ initialActiveTab = 'hotel' }: AppProps) {
  const [crmSubmitted, setCrmSubmitted] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [hotelName, setHotelName] = useState('')
  const [isMobileView, setIsMobileView] = useState(false)
  const [whatsappLink, setWhatsappLink] = useState('')

  const [destination, setDestination] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [showOccupants, setShowOccupants] = useState(false)
  const [occupants, setOccupants] = useState({
    rooms: 1,
    adults: 2,
    children: 0,
    babies: 0,
    childrenAges: [] as number[],
  })
  const [selectedOptions, setSelectedOptions] = useState({
    pool: false,
    breakfast: false,
    nearBeach: false,
    specificHotel: null as boolean | null,
  })

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
    driverAge: '25+',
    hasVisa: false,
    shabbatRestriction: false,
    promoCode: '',
  })

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)

  const selectedCountry = COUNTRIES.find((country) => country.code === formData.country)
  const stationsToDisplay = selectedCountry ? getStations(selectedCountry.name) : []

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (typeof window !== 'undefined' && !document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_KEY'}&libraries=places`
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
    }

    const initializeAutocomplete = () => {
      if (typeof window !== 'undefined') {
        const input = document.getElementById('destination') as HTMLInputElement
        if (input && window.google && window.google.maps && window.google.maps.places) {
          const autocomplete = new window.google.maps.places.Autocomplete(input)
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (place) {
              if (place.name) {
                setDestination(place.name)
              } else if (place.formatted_address) {
                setDestination(place.formatted_address)
              }
            }
          })
        }
      }
    }

    loadGoogleMapsScript()

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).google) {
        initializeAutocomplete()
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobileView(window.innerWidth < 768)
      }

      window.addEventListener('resize', handleResize)
      handleResize()

      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleOccupantChange = (type: 'rooms' | 'adults' | 'children' | 'babies', increment: number) => {
    setOccupants((prev) => {
      const newValue = Math.max(0, prev[type] + increment)

      if (type === 'children') {
        const ages = [...prev.childrenAges]
        if (increment > 0) {
          ages.push(2)
        } else if (increment < 0 && ages.length > 0) {
          ages.pop()
        }
        return { ...prev, [type]: newValue, childrenAges: ages }
      }

      if (type === 'rooms' || type === 'adults') {
        return { ...prev, [type]: Math.max(1, newValue) }
      }

      return { ...prev, [type]: newValue }
    })
  }

  const getOccupantsSummary = () => {
    const adultText = `${occupants.adults} adulte${occupants.adults > 1 ? 's' : ''}`
    const childText = `${occupants.children} enfant${occupants.children > 1 ? 's' : ''}`
    const babyText = `${occupants.babies} bébé${occupants.babies > 1 ? 's' : ''}`
    const roomText = `${occupants.rooms} chambre${occupants.rooms > 1 ? 's' : ''}`

    return isMobileView ? `${roomText}, ${adultText}\n${childText}, ${babyText}` : `${roomText}, ${adultText}, ${childText}, ${babyText}`
  }

  const validateStep1 = () => {
    if (activeTab === 'hotel') {
      return destination && dates.length === 2
    } else {
      return (
        formData.country &&
        formData.station &&
        formData.pickupDate &&
        formData.returnDate &&
        formData.pickupTime &&
        formData.returnTime &&
        formData.driverAge
      )
    }
  }

  const validateStep2Car = () => {
    return selectedVehicle !== null
  }

  const validateFinalStep = () => {
    return formData.firstName && formData.lastName && formData.email && isValidPhoneNumber(formData.phone)
  }

  const handleNextStep = () => {
    if (activeTab === 'hotel') {
      if (currentStep === 1 && validateStep1()) {
        setCurrentStep(2)
        trackFbEvent('InitiateCheckout', { content_category: 'hotel' })
      }
    } else {
      if (currentStep === 1 && validateStep1()) {
        setCurrentStep(2)
        trackFbEvent('InitiateCheckout', { content_category: 'car' })
      } else if (currentStep === 2 && validateStep2Car()) {
        setCurrentStep(3)
      }
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateWhatsAppMessage = () => {
    let message = ''
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
Hôtel particulier: ${hotelName ? hotelName : 'Non spécifié'}\n`
    } else {
      const selectedStationObject = stationsToDisplay.find((s) => s.id === formData.station)
      const stationName = selectedStationObject ? selectedStationObject.label : formData.station
      message = `Location Voiture:\n
Pays: ${selectedCountry?.name || formData.country}\n
Station: ${stationName}\n
Dates: Du ${formData.pickupDate} ${formData.pickupTime} au ${formData.returnDate} ${formData.returnTime}\n
Âge conducteur: ${formData.driverAge}\n
Visa Premier: ${formData.hasVisa ? 'Oui' : 'Non'}\n
Ne roule pas le chabat : ${formData.shabbatRestriction ? 'Oui' : 'Non'}\n`

      if (selectedVehicle) {
        message += `\nVéhicule sélectionné: ${selectedVehicle.name}\n`
      }
      if (formData.promoCode) {
        message += `Code promo: ${formData.promoCode}\n`
      }
    }

    message += `\nContact:\n
Nom: ${formData.firstName} ${formData.lastName}\n
Email: ${formData.email}\n
Téléphone: ${formData.phone}`

    if (formData.notes) {
      message += `\nNotes: ${formData.notes}`
    }

    return message
  }

  const handleEmailSubmit = async () => {
    if (emailSent) return

    try {
      const emailData = {
        to: 'votre-email@example.com',
        subject: `Nouvelle demande ${activeTab === 'hotel' ? 'Hôtel' : 'Location de voiture'} - ${formData.firstName} ${formData.lastName}`,
        message: generateWhatsAppMessage(),
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          type: activeTab,
        },
      }

      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        setEmailSent(true)
        console.log('Email envoyé avec succès')
      } else {
        throw new Error('Erreur envoi email')
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error)
    }
  }

  const handleCRMSubmit = async () => {
    try {
      const contactRes = await fetch('/api/createContact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          preferences_client: formData.notes,
          nationalite: 'Francais',
          ...(activeTab === 'car' && {
            le_v_hicule_ne_roule_pas_le_chabat: formData.shabbatRestriction,
            avez_vous_une_visa_premi_re_: formData.hasVisa,
            age: formData.driverAge,
          }),
        }),
      })

      const contactData = await contactRes.json()
      if (!contactRes.ok) throw new Error(`Erreur création contact: ${contactData.detail || contactData.error}`)
      const contactId = contactData.contactId

      const dealPayload = {
        contactId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        activeTab,
        ...(activeTab === 'hotel'
          ? {
              destination,
              check_in_date_str: formatDateForAPI(dates?.[0]),
              check_out_date_str: formatDateForAPI(dates?.[1]),
              occupants: {
                rooms: occupants.rooms,
                adults: occupants.adults,
                children: occupants.children,
                babies: occupants.babies,
                childrenAges: occupants.childrenAges,
              },
              rating,
              selectedOptions: {
                pool: selectedOptions.pool,
                breakfast: selectedOptions.breakfast,
                nearBeach: selectedOptions.nearBeach,
              },
              souhaite_hotel_en_particulier: hotelName || null,
            }
          : {
              stationName: getStationName(),
              selectedVehicle,
              check_in_date_str: formatDateForAPI(formData.pickupDate),
              check_out_date_str: formatDateForAPI(formData.returnDate),
              pickupTime: formData.pickupTime,
              returnTime: formData.returnTime,
              driverAge: formData.driverAge,
              hasVisa: formData.hasVisa,
              shomer_shabbat: formData.shabbatRestriction,
            }),
      }

      const dealRes = await fetch('/api/createDeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealPayload),
      })

      const dealData = await dealRes.json()
      if (!dealRes.ok) throw new Error(`Erreur création deal: ${dealData.detail || dealData.error}`)
    } catch (error) {
      console.error('Error submitting to HubSpot:', error)
    }
  }

  const formatDateForAPI = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }
    return dateStr
  }

  const getStationName = (): string => {
    const selectedStationObject = stationsToDisplay.find((s) => s.id === formData.station)
    return selectedStationObject ? selectedStationObject.label : formData.station || 'Non spécifié'
  }

  const handleOpenWhatsApp = async () => {
    if (!validateFinalStep() || isSubmitting) return

    setIsSubmitting(true)

    try {
      await handleEmailSubmit()

      const message = generateWhatsAppMessage()
      const phoneNumber = '972584140489'
      const encodedMessage = encodeURIComponent(message)

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const whatsappUrl = isMobile
        ? `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`
        : `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`

      trackFbEvent('Purchase', {
        content_category: activeTab,
        value: 1,
        currency: 'EUR',
      })

      window.open(whatsappUrl, '_blank')

      setCurrentStep(1)
      setFormSubmitted(true)
      setWhatsappLink(whatsappUrl)

      toast.success('WhatsApp a été ouvert pour finaliser votre demande !')
    } catch (error) {
      console.error("Erreur lors de l'envoi des données ou de l'ouverture de WhatsApp:", error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (validateFinalStep() && !crmSubmitted) {
      setCrmSubmitted(true)
      handleCRMSubmit()
    }
  }, [formData.firstName, formData.lastName, formData.email, formData.phone, crmSubmitted])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentStep(1)
    trackFbEvent('ViewContent', { content_category: tab })
  }

  const renderContactInfoStep = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Prénom *"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
        />
        <input
          type="text"
          className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Nom *"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="tel"
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Téléphone *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="mb-6">
        <div className="relative">
          <MessageSquare className="absolute left-3 top-4 text-gray-400" size={20} />
          <textarea
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            placeholder="Notes ou remarques (facultatif)"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>
    </>
  )

  const renderVehicleSelection = () => (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-6 text-center">Sélectionnez votre véhicule</h3>
      <Slider {...sliderSettings}>
        {VEHICLES.map((vehicle, index) => (
          <div key={index} className="px-2">
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedVehicle?.name === vehicle.name ? 'border-orange-500 ring-2 ring-orange-300 bg-orange-50' : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
              }`}
              onClick={() => {
                setSelectedVehicle(vehicle)
                trackFbEvent('AddToCart', {
                  content_name: vehicle.name,
                  content_category: 'car',
                })
              }}
            >
              <img src={vehicle.image} alt={vehicle.name} className="w-full h-32 object-contain mb-2 rounded" />
              <p className="text-center font-medium text-sm">{vehicle.name}</p>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  )

  const renderStepContent = () => {
    if (activeTab === 'hotel') {
      if (currentStep === 1) {
        return (
          <>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                <input
                  id="destination"
                  type="text"
                  placeholder="Destination (ville, hôtel...)"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>

              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                <div className="w-full pl-10 pr-4 py-3 border rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
                  <Flatpickr
                    options={{
                      mode: 'range',
                      locale: French,
                      minDate: 'today',
                      showMonths: isMobileView ? 1 : 2,
                      dateFormat: 'd/m/Y',
                      static: false,
                      disableMobile: false,
                    }}
                    className="w-full flatpickr-input bg-transparent outline-none border-none"
                    placeholder="Sélectionnez vos dates"
                    value={dates}
                    onChange={(selectedDates) => {
                      setDates(selectedDates.map((d) => d.toLocaleDateString('fr-FR')))
                    }}
                    required
                  />
                </div>
              </div>

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
                      <div className="flex items-center justify-between">
                        <span>Chambres</span>
                        <div className="flex items-center gap-2">
                          <button type="button" className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50" onClick={() => handleOccupantChange('rooms', -1)} disabled={occupants.rooms <= 1}>
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{occupants.rooms}</span>
                          <button type="button" className="p-2 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('rooms', 1)}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Adultes (18+)</span>
                        <div className="flex items-center gap-2">
                          <button type="button" className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50" onClick={() => handleOccupantChange('adults', -1)} disabled={occupants.adults <= 1}>
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{occupants.adults}</span>
                          <button type="button" className="p-2 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('adults', 1)}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Enfants (2-17)</span>
                        <div className="flex items-center gap-2">
                          <button type="button" className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50" onClick={() => handleOccupantChange('children', -1)} disabled={occupants.children <= 0}>
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{occupants.children}</span>
                          <button type="button" className="p-2 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('children', 1)}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Bébés (0-2)</span>
                        <div className="flex items-center gap-2">
                          <button type="button" className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50" onClick={() => handleOccupantChange('babies', -1)} disabled={occupants.babies <= 0}>
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{occupants.babies}</span>
                          <button type="button" className="p-2 border rounded hover:bg-gray-100" onClick={() => handleOccupantChange('babies', 1)}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      {occupants.children > 0 && (
                        <div className="space-y-2 pt-2 border-t mt-3">
                          <p className="text-sm font-medium">Âge des enfants (2-17 ans)</p>
                          <div className="grid grid-cols-2 gap-2">
                            {occupants.childrenAges.map((age, index) => (
                              <select
                                key={index}
                                className="p-2 border rounded text-sm"
                                value={age}
                                onChange={(e) => {
                                  const newAges = [...occupants.childrenAges]
                                  newAges[index] = parseInt(e.target.value)
                                  setOccupants((prev) => ({ ...prev, childrenAges: newAges }))
                                }}
                              >
                                {Array.from({ length: 16 }, (_, i) => i + 2).map((a) => (
                                  <option key={a} value={a}>
                                    {a} ans
                                  </option>
                                ))}
                              </select>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => setShowOccupants(false)} className="mt-3 text-orange-600 text-sm w-full text-center">
                      Terminé
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'étoiles</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={24}
                      className={`cursor-pointer transition-colors ${
                        star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-gray-400'
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Options de l'hôtel</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedOptions.pool} onChange={(e) => setSelectedOptions((prev) => ({ ...prev, pool: e.target.checked }))} className="rounded text-orange-600 focus:ring-orange-500" />
                    <span>Piscine</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedOptions.breakfast} onChange={(e) => setSelectedOptions((prev) => ({ ...prev, breakfast: e.target.checked }))} className="rounded text-orange-600 focus:ring-orange-500" />
                    <span>Petit-déjeuner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedOptions.nearBeach} onChange={(e) => setSelectedOptions((prev) => ({ ...prev, nearBeach: e.target.checked }))} className="rounded text-orange-600 focus:ring-orange-500" />
                    <span>Proche de la mer</span>
                  </label>
                </div>
              </div>
              <div className="md:col-span-1">
                <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700 mb-1">
                  Hôtel en particulier ?
                </label>
                <input
                  id="hotelName"
                  type="text"
                  placeholder="Nom de l'hôtel (facultatif)"
                  className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                />
              </div>
            </div>
          </>
        )
      } else if (currentStep === 2) {
        return renderContactInfoStep()
      }
    } else {
      if (currentStep === 1) {
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 md:gap-4 mb-6 items-end">
              <div className="sm:col-span-1 md:col-span-1">
                <Select
                  inputId="country-select"
                  options={countryOptions}
                  value={countryOptions.find((option) => option.value === formData.country) || null}
                  onChange={(selectedOption) => {
                    setFormData({ ...formData, country: selectedOption ? selectedOption.value : '', station: '' })
                  }}
                  placeholder="Pays *"
                  isSearchable
                  filterOption={filterCountryOptions}
                  noOptionsMessage={() => 'Aucun pays trouvé'}
                  className="react-select-container text-sm md:text-base"
                  classNamePrefix="react-select"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '48px',
                      borderColor: '#d1d5db',
                      borderRadius: '0.5rem',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#9ca3af',
                      },
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: '#6b7280',
                    }),
                    input: (provided) => ({
                      ...provided,
                      margin: '0px',
                      padding: '0px',
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      padding: '0 8px',
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: 'inherit',
                    }),
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999,
                    }),
                  }}
                  required
                />
              </div>
              <div className="sm:col-span-1 md:col-span-2">
                <Select
                  inputId="station-select"
                  options={stationsToDisplay.map((station) => ({
                    value: station.id,
                    label: station.label,
                    isAirport: station.isAirport,
                  }))}
                  value={
                    stationsToDisplay
                      .map((station) => ({ value: station.id, label: station.label, isAirport: station.isAirport }))
                      .find((option) => option.value === formData.station) || null
                  }
                  onChange={(selectedOption) => {
                    setFormData({ ...formData, station: selectedOption ? selectedOption.value : '' })
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
                      minHeight: '48px',
                      borderColor: '#d1d5db',
                      borderRadius: '0.5rem',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#9ca3af' },
                    }),
                    placeholder: (provided) => ({ ...provided, color: '#6b7280' }),
                    input: (provided) => ({ ...provided, margin: '0px', padding: '0px' }),
                    valueContainer: (provided) => ({ ...provided, padding: '0 8px' }),
                    singleValue: (provided) => ({ ...provided, color: 'inherit' }),
                    option: (provided, state) => ({
                      ...provided,
                      color: state.data.isAirport ? '#DC2626' : 'inherit',
                    }),
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 9999,
                    }),
                  }}
                  required
                />
              </div>
              <div className="relative sm:col-span-2 md:col-span-2">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                <div className="w-full pl-10 pr-4 py-3 border rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent relative">
                  <Flatpickr
                    options={{
                      mode: 'range',
                      locale: French,
                      minDate: 'today',
                      showMonths: 1,
                      dateFormat: 'd/m/Y',
                      static: false,
                      disableMobile: false,
                    }}
                    className="w-full flatpickr-input bg-transparent outline-none text-sm md:text-base border-none"
                    placeholder="Dates Prise/Retour*"
                    value={formData.pickupDate && formData.returnDate ? [formData.pickupDate, formData.returnDate] : []}
                    onChange={(selectedDates) => {
                      if (selectedDates.length === 2) {
                        setFormData({
                          ...formData,
                          pickupDate: selectedDates[0].toLocaleDateString('fr-FR'),
                          returnDate: selectedDates[1].toLocaleDateString('fr-FR'),
                        })
                      } else if (selectedDates.length === 0) {
                        setFormData({ ...formData, pickupDate: '', returnDate: '' })
                      }
                    }}
                    required
                  />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-row gap-2 md:gap-4">
                <div className="relative flex-1">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                    <select
                      id="pickupTime"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm md:text-base appearance-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={formData.pickupTime}
                      onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                      required
                    >
                      <option value="">HH:MM *</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="relative flex-1">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
                    <select
                      id="returnTime"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm md:text-base appearance-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      value={formData.returnTime}
                      onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                      required
                    >
                      <option value="">HH:MM *</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-start">
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-800">
                      Avez-vous une Visa Première ? <span className="text-red-500">*</span>
                    </p>
                    <img src={visaLogoUrl} alt="Visa" className="h-4 w-auto" />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="hasVisa"
                        checked={formData.hasVisa === true}
                        onChange={() => setFormData({ ...formData, hasVisa: true })}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2">Oui</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="hasVisa"
                        checked={formData.hasVisa === false}
                        onChange={() => setFormData({ ...formData, hasVisa: false })}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2">Non</span>
                    </label>
                  </div>
                </div>

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
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2">Oui</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shabbatRestriction"
                        checked={formData.shabbatRestriction === true}
                        onChange={() => setFormData({ ...formData, shabbatRestriction: true })}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2">Non</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-row gap-3 md:col-span-2">
                <div className="flex-1">
                  <label htmlFor="driverAge" className="block text-sm font-medium text-gray-700 mb-1">
                    Âge du conducteur *
                  </label>
                  <select
                    id="driverAge"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formData.driverAge}
                    onChange={(e) => setFormData({ ...formData, driverAge: e.target.value })}
                    required
                  >
                    <option value="">Âge conducteur*</option>
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 18} value={i + 18}>
                        {i + 18} ans
                      </option>
                    ))}
                    <option value="25+">25+ ans</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Code promo
                  </label>
                  <input
                    id="promoCode"
                    type="text"
                    placeholder="Code promo (facultatif)"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </>
        )
      } else if (currentStep === 2) {
        return renderVehicleSelection()
      } else if (currentStep === 3) {
        return renderContactInfoStep()
      }
    }
    return null
  }

  const maxSteps = activeTab === 'hotel' ? 2 : 3
  const canGoNext =
    (activeTab === 'hotel' && currentStep === 1 && validateStep1()) ||
    (activeTab === 'car' && currentStep === 1 && validateStep1()) ||
    (activeTab === 'car' && currentStep === 2 && validateStep2Car())
  const isFinalStep = (activeTab === 'hotel' && currentStep === 2) || (activeTab === 'car' && currentStep === 3)

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Toaster position="top-center" />

      <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleTabChange('hotel')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all ${
            activeTab === 'hotel' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Hotel size={20} />Réservation Hôtel
        </button>
        <button
          onClick={() => handleTabChange('car')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all ${
            activeTab === 'car' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Car size={20} />Location de Voiture
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Étape {currentStep} sur {maxSteps}</span>
          <span className="text-sm text-gray-500">
            {activeTab === 'hotel'
              ? currentStep === 1
                ? 'Informations de séjour'
                : 'Vos coordonnées'
              : currentStep === 1
              ? 'Informations de location'
              : currentStep === 2
              ? 'Choix du véhicule'
              : 'Vos coordonnées'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-orange-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / maxSteps) * 100}%` }}></div>
        </div>
      </div>

      {formSubmitted && (
        <div className="mb-6 p-6 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center">
          <div className="flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">Merci ! Votre demande a été envoyée.</h3>
          </div>
          <p className="text-sm mb-4">Nous vous contacterons bientôt pour finaliser votre réservation.</p>
          <div className="mb-4">
            <p className="mb-3 text-sm">Cliquez sur le bouton ci-dessous pour ouvrir WhatsApp et confirmer votre demande :</p>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Ouvrir WhatsApp
            </a>
          </div>
          <button onClick={() => { setFormSubmitted(false); setCurrentStep(1); setWhatsappLink(''); setCrmSubmitted(false); setEmailSent(false); }} className="text-sm text-orange-600 underline hover:text-orange-700">
            Faire une nouvelle demande
          </button>
        </div>
      )}

      {!formSubmitted && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={(e) => e.preventDefault()}>
            {renderStepContent()}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handlePreviousStep}
                className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all ${currentStep > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                disabled={currentStep <= 1}
              >
                <ArrowLeft size={16} />Précédent
              </button>

              {isFinalStep ? (
                <button
                  type="button"
                  className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
                  className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  disabled={!canGoNext || isSubmitting}
                >
                  Suivant <ArrowRight size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>Des questions ? Contactez-nous directement :</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <a href="tel:+972584140489" className="flex items-center gap-1 text-orange-600 hover:text-orange-700">
            <Phone size={16} />+972 58 414 0489
          </a>
          <a href="mailto:contact@example.com" className="flex items-center gap-1 text-orange-600 hover:text-orange-700">
            <Mail size={16} />contact@example.com
          </a>
        </div>
      </div>
    </div>
  )
}
