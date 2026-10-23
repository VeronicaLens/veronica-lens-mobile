# veronica-lens-mobile

Aplicativo Expo SDK 57, com React 19.2.3 e React Native 0.86.3.
Use uma versao do Expo Go compativel com o SDK 57.

## Executar no Android

```powershell
npm ci
npx expo start --go
```

Para conectar fora da rede local, use `npx expo start --go --tunnel`.

Com depuracao USB habilitada e o ADB disponivel:

```powershell
adb reverse tcp:8081 tcp:8081
npx expo start --go --localhost --port 8081
```

Em outro terminal, abra o projeto no Expo Go instalado no aparelho:

```powershell
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" -p host.exp.exponent
```

## Dependencias

Nao use `npm audit fix --force`: ele pode trocar a versao principal do Expo ou
do React Native sem alinhar as demais dependencias. Revise os alertas antes de
atualizar e use `npx expo install --check` para verificar a compatibilidade.