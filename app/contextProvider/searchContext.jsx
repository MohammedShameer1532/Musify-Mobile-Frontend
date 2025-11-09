import { createContext, useEffect, useRef, useState } from "react";
import TrackPlayer, { Capability } from "react-native-track-player";

export const SearchContext = createContext({});

export const SearchProvider = ({ children }) => {
  const [dataSearch, setDataSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [songsList, setSongsList] = useState([]);
  const [songsuggest, setSongsuggest] = useState([]);
  


  return (
    <SearchContext.Provider value={{
      dataSearch,
      setDataSearch,
      globalSearch,
      setGlobalSearch,
      currentSong,
      setCurrentSong,
      currentIndex,
      setCurrentIndex,
      songsList,
      setSongsList,
      songsuggest,
      setSongsuggest,
    }}>
      {children}
    </SearchContext.Provider>
  );
};
export default SearchProvider;
