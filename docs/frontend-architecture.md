# Arquitetura frontend

O aplicativo segue Feature-Sliced Design (FSD) com dependências direcionadas das camadas mais
altas para as mais baixas:

```text
app -> core -> screens -> widgets -> features -> shared
```

- `app`: rotas do Expo Router. Cada arquivo apenas re-exporta uma tela ou layout; não contém lógica.
- `core`: inicialização, providers globais e navegação raiz (layout de abas e portão de
  autenticação).
- `screens`: telas completas e containers que ligam rota, sessão e navegação aos componentes.
- `widgets`: blocos de interface compostos e reutilizáveis entre telas.
- `features`: casos de uso do usuário, estado e integrações específicas, como autenticação.
- `shared`: cliente HTTP, contrato gerado, configuração, tokens, hooks utilitários e componentes
  reutilizáveis.

Cada slice expõe uma API pública por `index.ts`. Uma camada não deve importar implementações
internas de outro slice e nunca deve depender de uma camada acima dela. Novas entidades de domínio
compartilhadas entre features devem entrar em `entities` entre `features` e `shared`.

## Estilização

As telas e componentes usam NativeWind com Tailwind CSS. Os nomes semânticos de cor ficam em
`tailwind.config.cjs`; valores necessários por propriedades nativas ficam em
`src/shared/config/theme.ts`. Ao atualizar o design system, ambos devem continuar sincronizados.

O arquivo [VeronicaLens — Brand & Product Design System](https://www.figma.com/design/u9nVzQosIAiWoKP0zkre3G/VeronicaLens-%E2%80%94-Brand---Product-Design-System?node-id=7-2)
é a fonte de verdade visual. O tema padrão é dark e usa os tokens `#080B14`, `#11182B`,
`#171E33`, `#202943`, `#6D5DFC`, `#B5ACFF`, `#70D7FF`, `#F6D47A`, `#F5F7FB` e `#98A2B3`.
Space Grotesk é usada em títulos e Inter em corpo e labels. Espaçamentos seguem a escala
`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40`; raios seguem `10 / 14 / 18 / 24 / 40`.

Não devem ser espalhados valores literais pelas telas. Componentes interativos mantêm área de toque
mínima de 44×44, estados de pressão e desabilitado, contraste de texto de pelo menos 4.5:1 e não
dependem somente de cor para comunicar estado.
