# Contrato HTTP consumido

`contracts/openapi.v1.json` é o snapshot do contrato cuja fonte de verdade é o documento
`src/docs/openapi.ts` do repositório `veronica-lens-api` (publicado em `/api/v1/docs/openapi.json`).
O app não edita os tipos gerados e não depende de pacotes do repositório da API.

## Atualização

1. Atualizar primeiro o documento OpenAPI no repositório da API.
2. Com os dois repositórios lado a lado, executar `npm run contract:sync`. Use
   `VERONICA_LENS_API_PATH` se a API estiver em outro caminho.
3. Executar `npm run contract:generate`.
4. Ajustar `src/shared/api/models.ts` (aliases estáveis sobre os tipos gerados) e os módulos de
   `api/` das features afetadas.
5. Versionar o snapshot e `src/shared/api/generated` no mesmo commit.

`npm run contract:check` repete a geração e falha se os arquivos versionados estiverem
desatualizados. Mudanças incompatíveis só podem ser consumidas depois da adoção de uma nova versão
da API ou durante um período explícito de compatibilidade.

## Camada de modelos

As features importam tipos de `src/shared/api` (`index.ts`), nunca de `generated/`. O arquivo
`models.ts` renomeia os tipos gerados para os nomes de domínio usados no app e descreve à mão
apenas o que o OpenAPI documenta de forma genérica (trilhas e lições de aprendizado e histórico de
observações). Quando a API detalhar esses schemas, troque as interfaces manuais por aliases.

## Endpoints usados

Todas as respostas seguem o envelope `{ data, meta? }`; erros seguem `{ error: { code, message } }`.

| Área                     | Endpoint                                                                                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Autenticação             | `POST /auth/sign-up`, `/auth/sign-in`, `/auth/google`, `/auth/refresh`, `/auth/sign-out`, `/auth/password/recovery`; `PUT /auth/password` (exige `refreshToken` do link de recuperação) |
| Perfil e conta           | `GET`/`PATCH /profile`, `PUT`/`DELETE /profile/avatar`, `DELETE /account` (corpo `{ "confirmation": "DELETE" }`)                                                                        |
| Eventos                  | `GET /events`, `GET /events/{id}`                                                                                                                                                       |
| Catálogo e céu           | `GET /catalog/celestial-objects`, `POST /sky-guide/positions`                                                                                                                           |
| Condições e planejamento | `POST /conditions/current`, `POST /conditions/forecast`, `POST /planning/recommendation`                                                                                                |
| Aprendizado              | `GET /learning/tracks`, `GET /learning/tracks/{slug}`, `GET /learning/lessons/{id}`, `PUT /learning/lessons/{id}/progress`                                                              |
| Observações              | `GET /observations`, `PUT`/`DELETE /observations/{id}/photos/{photoId}`, `DELETE /observations/{id}`                                                                                    |
| Notificações             | `PUT /notifications/devices`, `DELETE /notifications/devices/{token}`                                                                                                                   |

A API não oferece preferências de alerta por tipo de evento; o app só controla o interruptor geral
de notificações do perfil.
