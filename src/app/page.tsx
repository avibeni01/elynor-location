import BookingForm from '@/components/forms/BookingForm'
import Link from 'next/link'
import { Car, Hotel, Umbrella, Phone, Star, Check, ArrowRight, Users, Shield, Clock } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <section className="relative h-[70vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40 z-10" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://elynortours.com/wp-content/uploads/2023/05/eleynor-tour-voyage-location.webp)' }} />
        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Voyagez au meilleur prix avec <span className="text-orange-500">Elynor Tours</span>
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8">Spécialiste Location Voiture & Hôtels depuis 2015</p>
              <p className="text-lg text-gray-200 mb-8">
                ElynorTours vous garantit les meilleurs tarifs hôtels et location de voiture principalement en Europe mais aussi ailleurs dans le monde.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/location-voiture" className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                  Réserver une voiture
                  <Car className="ml-2" size={20} />
                </Link>
                <Link href="/hotels" className="inline-flex items-center justify-center px-6 py-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors">
                  Trouver un hôtel
                  <Hotel className="ml-2" size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Réservation en ligne</h2>
            <p className="text-gray-600 mt-2">Réservez votre hébergement et vos services en quelques clics</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <BookingForm />
          </div>
        </div>
      </section>
    </>
  )
}
