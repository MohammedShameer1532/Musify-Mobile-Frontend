import { useEffect, useState } from 'react';
import NetInfo from "@react-native-community/netinfo";


export function networkContext() {
  const [isConnected, setIsConnected] = useState(null);

  useEffect(() => {

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
   return () => {
      unsubscribe(); // Correct cleanup
    };
  }, [])

  return isConnected;
}
export default networkContext;