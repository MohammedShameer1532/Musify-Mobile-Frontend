import { useEffect, useState } from 'react';
import NetInfo from "@react-native-community/netinfo";


export function networkContext() {
  const [isConnected, setIsConnected] = useState(null);

  useEffect(() => {

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      console.log("Connection type", state.type);
      console.log("Is connected?", state.isConnected);
    });
   return () => {
      unsubscribe(); // Correct cleanup
    };
  }, [])

  return isConnected;
}
export default networkContext;