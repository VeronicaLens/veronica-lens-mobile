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

- `qual`: gera uma development build com `expo-dev-client`. Instale-a no
  Android para testar usando o servidor local; nao precisa do Expo Go.
- `main`: gera um AAB de producao para baixar no painel EAS e enviar manualmente
  ao Google Play Console. O workflow nao publica na loja.

O arquivo tambem e anexado a cada execucao do workflow em
**Actions > Android builds > execucao > Artifacts**, por 30 dias.

### Instalar e testar a development build

No resumo da execucao do GitHub Actions, abra **Open build and installation page**.
O passo **Build Android app with EAS** tambem imprime um QR code que abre essa
pagina no celular. Use a opcao de instalar/baixar no EAS; em projetos privados,
pode ser necessario entrar na conta Expo com acesso ao projeto.

A development build Android continua sendo instalada por um APK, mas inclui o
cliente de desenvolvimento e conecta ao seu computador. Depois de instalar:

```powershell
npm run start:dev
```

Abra o Veronica Lens instalado e conecte-o ao servidor local, com computador e
celular na mesma rede. Se necessario, use `npm run start:dev:tunnel`.
O QR code do Actions instala o cliente; o QR code do servidor local abre a
sessao de desenvolvimento. O Actions nao mantem um servidor Metro rodando.

Mudancas em JavaScript/TypeScript usam o mesmo cliente instalado. Gere e instale
um novo build quando alterar dependencias nativas, configuracao nativa ou SDK.
O perfil `preview` continua disponivel para testes sem servidor local.

### Configuracao inicial

1. Entre na conta Expo e vincule este app a um projeto EAS. Execute
   `npx eas-cli@latest init` na pasta do app e confirme que o `projectId` foi
   gravado em `app.json`; envie essa alteracao ao Git.
2. Execute uma vez `npx eas-cli@latest build --platform android --profile development`
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