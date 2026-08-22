import { createContext, useEffect, useState } from "react";
export const SearchContext = createContext({});

export const SearchProvider = ({ children }) => {
  const [dataSearch, setDataSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [songsList, setSongsList] = useState([]);
  const [songsuggest, setSongsuggest] = useState([]);
  const [poddata, setPoddata] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [playlistDatas, setPlaylistDatas] = useState([]);
  const [outerdata, setOuterdata] = useState([]);
  const [addtoplaylist, setAddtoplaylist] = useState([]);
  const [qrdata, setQrdata] = useState(null);
  const [scaneddata, setScaneddata] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

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
      poddata,
      setPoddata,
      tokens,
      setTokens,
      playlistDatas,
      setPlaylistDatas,
      outerdata,
      setOuterdata,
      addtoplaylist,
      setAddtoplaylist,
      qrdata,
      setQrdata,
      scaneddata,
      setScaneddata,
      selectedLanguage,
      setSelectedLanguage,
    }}>
      {children}
    </SearchContext.Provider>
  );
};
export default SearchProvider;
