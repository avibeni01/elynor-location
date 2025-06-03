import React, { useState } from 'react';
import AppFR from './App';
import AppEN from './App_en';

const AppRoot: React.FC = () => {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');

  const toggleLang = () => {
    setLang(prev => (prev === 'fr' ? 'en' : 'fr'));
  };

  return (
    <div className="relative">
      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 z-50 px-3 py-1 bg-gray-200 text-black rounded"
      >
        {lang === 'fr' ? 'EN' : 'FR'}
      </button>
      {lang === 'fr' ? <AppFR /> : <AppEN />}
    </div>
  );
};

export default AppRoot;
