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

## CI/CD Android

O workflow `.github/workflows/android-build.yml` inicia um build EAS em cada push
para estas branches:

- `qual`: gera um APK de preview para instalar diretamente no Android. Ele nao
  e um APK para abrir dentro do Expo Go.
- `main`: gera um AAB de producao para baixar no painel EAS e enviar manualmente
  ao Google Play Console. O workflow nao publica na loja.

O arquivo tambem e anexado a cada execucao do workflow em
**Actions > Android builds > execucao > Artifacts**, por 30 dias.

### Configuracao inicial

1. Entre na conta Expo e vincule este app a um projeto EAS. Execute
   `npx eas-cli@latest init` na pasta do app e confirme que o `projectId` foi
   gravado em `app.json`; envie essa alteracao ao Git.
2. Execute uma vez `npx eas-cli@latest build --platform android --profile preview`
   localmente e conclua a configuracao das credenciais Android gerenciadas pelo
   EAS.
3. Crie um Personal Access Token no Expo e salve-o no repositorio GitHub em
   **Settings > Secrets and variables > Actions > New repository secret**, com o
   nome `EXPO_TOKEN`.
4. Envie o workflow para GitHub. Cada build concluido fica disponivel na pagina
   Builds do projeto no EAS; o link tambem aparece nos logs do job do GitHub.

Nao sao necessarias GitHub Actions variables nem credenciais do Google Play
enquanto o AAB for enviado manualmente. O `versionCode` de producao e
incrementado remotamente pelo EAS.

## Dependencias

Nao use `npm audit fix --force`: ele pode trocar a versao principal do Expo ou
do React Native sem alinhar as demais dependencias. Revise os alertas antes de
atualizar e use `npx expo install --check` para verificar a compatibilidade.