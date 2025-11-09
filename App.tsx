import React, { useRef, useState } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import { SmoothSheet, SmoothSheetRef } from 'react-native-smooth-sheet';

export default function App() {
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<SmoothSheetRef>(null);

  return (
    <View style={{ flex: 1 }}>
      <Button title="Open Sheet" onPress={() => setVisible(true)} />

      <SmoothSheet
        ref={sheetRef}
        isVisible={visible}
        onClose={() => setVisible(false)}
        snapPoint={0.25} // default
        paddingHorizontal={15} // default
        borderTopLeftRadius={50} // default
        borderTopRightRadius={50} // default
        theme="#fff" // default
        disableDrag={false} // default
        maxTopSnapPoint={Platform.OS ==="ios" ? 0.93 : 1} optional
        //dragIndicatorColor="#ccc" --optional  //#ff9800  //#666
        flattenOnFullOpen={false}  optional
      >
        <Text style={{ fontSize: 18, marginBottom: 20, fontWeight: "bold", color: 'white' }}>
          Hello from Smooth Sheet 🎉
        </Text>
        <Button title="Close" onPress={() => sheetRef.current?.close()} />
      </SmoothSheet>
    </View>
  );
}