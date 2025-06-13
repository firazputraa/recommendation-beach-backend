import React, { createContext, useState } from 'react';

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [minRating, setMinRating] = useState(0);

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        selectedTags,
        setSelectedTags,
        minRating,
        setMinRating,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
