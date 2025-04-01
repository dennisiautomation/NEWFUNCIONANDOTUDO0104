import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('pt-BR');
  
  // Carregar idioma salvo no localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('newcash-language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);
  
  // Salvar idioma no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('newcash-language', language);
  }, [language]);
  
  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'pt-BR' ? 'en-US' : 'pt-BR');
  };
  
  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
