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

## Arquitetura (Feature-Sliced Design)

O app usa Expo Router com organizacao Feature-Sliced Design (FSD):

```text
src/
  app/                    # Somente rotas Expo Router e _layout.tsx
  core/                   # Camada app do FSD: providers, estilos globais, store
    providers/            # AppProviders (estilos globais, StatusBar...)
    styles/global.css     # Diretivas Tailwind
    index.ts              # API publica da camada
  screens/                # Telas completas (camada pages do FSD)
    <tela>/ui/            # Componentes da tela
    <tela>/index.ts       # API publica da tela
  features/               # Funcionalidades de negocio
    auth/
      api/                # Chamadas a API Veronica Lens
      lib/                # Funcoes puras, sem React
      model/              # Tipos, hooks e estado
      index.ts            # API publica da feature
  shared/                 # Codigo reutilizavel sem regra de negocio
    ui/                   # Componentes base (Button, Screen...)
```

- O Expo Router transforma **todo arquivo `.ts`/`.tsx` em `src/app/`** em rota.
  Por isso providers, stores e estilos ficam em `src/core/`, nunca em `src/app/`.
  Mudar a raiz das rotas e desaconselhado pela documentacao do Expo.
- Cada arquivo em `src/app/` apenas reexporta uma tela:
  `export { HomeScreen as default } from '@/screens/home';`.
  O `_layout.tsx` compoe `AppProviders` de `@/core` com o navegador.
- Uma camada importa somente camadas abaixo dela:
  `app -> core -> screens -> features -> shared`.
- Fora da propria fatia, importe sempre pelo `index.ts` publico
  (`@/features/auth`, `@/shared/ui`), nunca por caminhos internos.
- A camada `screens` substitui o nome `pages` do FSD para nao confundir com
  as rotas do Expo Router.

## Estilizacao (NativeWind)

Os componentes usam Tailwind via NativeWind 4 (Tailwind CSS 3), com a prop
`className`. Evite `StyleSheet.create` em codigo novo.

- `tailwind.config.js`: tema (cores `primary`, `background`, `foreground`,
  `muted`, `danger`) e caminhos analisados em `src/`.
- `src/core/styles/global.css`: diretivas Tailwind, importadas por
  `AppProviders`.
- `babel.config.js` e `metro.config.js`: integracao do NativeWind.
- `nativewind-env.d.ts`: tipos da prop `className`.

Prefira as cores do tema (`bg-primary`, `text-foreground`) a valores fixos.
Componentes reutilizaveis ficam em `src/shared/ui`.

O NativeWind depende do Reanimated e do Worklets, que tem codigo nativo.
Depois de instalar ou atualizar essas dependencias, gere uma nova development
build. Ao alterar `tailwind.config.js`, `babel.config.js` ou `metro.config.js`,
reinicie o Metro limpando o cache: `npx expo start --dev-client --clear`.

## Navegacao e deep links e `veronicalens`. Ele so passa a funcionar depois de gerar e

instalar uma nova development build; o Expo Go nao registra esse scheme.

### Recuperacao de senha

O email de recuperacao abre `veronicalens://auth/reset-password`. No fluxo
implicito do Supabase, os tokens da sessao de recuperacao chegam depois do `#`.

- `src/app/auth/reset-password.tsx`: rota.
- `src/screens/reset-password/`: tela.
- `src/features/auth/model/useRecoveryLink.ts`: le a URL com `useLinkingURL()`.
- `src/features/auth/lib/parseRecoveryLink.ts`: valida tokens e erros do link.

Os tokens ficam apenas em memoria: nao os registre em logs, nao os exiba e nao
os grave em armazenamento persistente. A definicao da nova senha, chamando
`PUT /api/v1/auth/password` da API, ainda nao esta implementada.

Para testar sem enviar email, com a development build aberta e conectada ao
servidor local, use tokens ficticios:

```powershell
adb shell "am start -W -a android.intent.action.VIEW -d 'veronicalens://auth/reset-password#access_token=fake&refresh_token=fake&expires_at=1893456000&token_type=bearer&type=recovery' com.bialorenzini.veronicalens"
```

As aspas simples dentro das aspas duplas impedem que o shell do Android
interprete o `&`. Para simular um link expirado, troque o trecho apos `#` por
`error=access_denied&error_code=otp_expired`.

Nunca use tokens reais em comandos, capturas de tela ou issues.
