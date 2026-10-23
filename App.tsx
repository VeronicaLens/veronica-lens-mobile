import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Veronica Lens</Text>
      <Text>Observações: {count}</Text>
      <Button
        title="Registrar observação"
        onPress={() => setCount(current => current + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
    backgroundColor: '#f3f7fa',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#174b42' },
});