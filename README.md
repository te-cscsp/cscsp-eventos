# Gestão do Teatro CSCSP (uso interno)

Sistema interno para reservar assentos do Teatro do Colégio Santa Catarina – Mooca/SP, com mapa real (398 lugares), reservas com nome e R.A., dashboard e tabela de reservas. Stack: **React + TypeScript + Firebase (Auth, Firestore, Hosting)**. Ingressos gratuitos.

> Documentos de apoio em `docs/`: `roadmap.md` (fases, prazos, decisões), `DASHBOARD_GESTAO.md` (especificação do Figma) e `figma-original/App.tsx` (protótipo original, com as telas públicas para a Fase 7).

## O que já funciona

- Login por e-mail/senha; acesso só para quem tem perfil ativo (`users/{uid}`); papéis **administrator**, **operator** e **production** (permissões na Seção 5 do roadmap).
- **Visão geral:** números reais (total, reservados, disponíveis, bloqueados), % de ocupação por setor, mapa de calor e arte para Stories em PNG (sem dados pessoais).
- **Eventos:** lista com busca e filtro; criar/editar; publicar, encerrar, cancelar, duplicar e excluir rascunho; imagem de capa comprimida no navegador.
- **Mapa de assentos (layout real):** clique para selecionar e reservar em um modal (nome, R.A., tipo, telefone, e-mail, observação); clique em assento reservado para ver, editar, fazer check-in ou cancelar. Reserva em **transação**: dois cliques simultâneos nunca ocupam o mesmo assento.
- **Editar mapa (administrador):** classificar assentos (comum, prioritário, PcD, equipe, bloqueado) por assento ou fileira, com desfazer/refazer e salvamento único.
- **Reservas:** tabela com busca, filtros, paginação e exportação CSV (administrador; fica registrada na auditoria).

## Ainda não incluído

Renomear/renumerar assentos · trocar assento de uma reserva · tela de gestão de usuários (por ora: script `admin:criar`) · reservas por período · landing page pública (Fase 7) · testes automatizados das regras de segurança.

## 1) Testar no seu computador (sem criar nada na nuvem)

Requisitos: Node 22+, Java 11+ (exigido pelo emulador do Firestore) e `npm i -g firebase-tools`.

```bash
npm install
npm run emulators          # terminal 1: Auth + Firestore locais
npm run dados:teste        # terminal 2: usuários, eventos e reservas FICTÍCIOS
npm run dev:emulador       # terminal 3: abre http://localhost:5173
```

Logins de teste (senha `teste1234`): `admin@exemplo.test`, `operador@exemplo.test`, `producao@exemplo.test`.
O painel do emulador (http://localhost:4000) mostra os dados gravados.

## 2) Colocar no Firebase de verdade

1. No [Console do Firebase](https://console.firebase.google.com), crie o projeto (sugestão: um `dev` e um `interno`). **Não ative o Cloud Storage.**
2. **Firestore Database:** crie em **modo de produção** e na região **São Paulo (`southamerica-east1`)**. A região não pode ser alterada depois.
3. **Authentication → Método de login:** ative *E-mail/senha*. Desative o auto-cadastro em *Configurações → Ações do usuário* (confira o nome da opção no console).
4. **Configurações do projeto → Seus apps → Web:** registre um app e copie a configuração. Copie `.env.example` para `.env.local` e preencha.
5. Ajuste o ID do projeto em `.firebaserc` e publique as regras:
   ```bash
   firebase login
   npm run deploy:regras
   ```
6. Crie o primeiro administrador (baixe a chave da conta de serviço em *Configurações → Contas de serviço*; **não versione esse arquivo**):
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/caminho/serviceAccount.json
   export GCLOUD_PROJECT=ID-DO-PROJETO
   node scripts/criar-admin.mjs nome@colegio.com.br "Nome Completo" administrator
   ```
   O script imprime um link para a pessoa definir a senha. Repita com `operator` ou `production` para a equipe.
7. Teste com `npm run dev` e, quando estiver tudo certo, publique: `npm run deploy` (Hosting). Cadastre o domínio do colégio em *Authentication → Configurações → Domínios autorizados*.
8. No Google Cloud, configure **alerta de orçamento** (mesmo no plano gratuito).

## Estrutura

```
src/data/        acesso ao Firebase (única camada que usa o SDK) + regras de reserva
src/lib/         layout do teatro (layout-teatro.json), cálculos, formatação, Story, imagem
src/components/  mapa, modais, shell, toast…       src/pages/  telas
firestore.rules  regras de segurança               scripts/    admin e dados de teste
```

Modelo de dados: o layout do teatro fica **dentro do app**; no Firestore só existem os assentos *fora do padrão* de cada evento (`events/{id}/seats/{assento}`: reservados ou reclassificados). Isso mantém leituras e escritas baixas no plano gratuito.

## Segurança e LGPD (resumo)

- Sem cadastro aberto: sem `users/{uid}` ativo, as regras negam tudo.
- `production` não lê reservas (sem dados pessoais); só `administrator` altera eventos, mapa e exporta CSV.
- Dados pessoais só em `reservations`. O dashboard e a imagem de Stories usam apenas números.
- Auditoria em `auditLog` (somente administrador lê). Horários vêm do relógio do navegador; para auditoria mais forte, migrar para horário do servidor.
- **Antes de usar dados reais:** revisão do encarregado de dados (DPO) do colégio e definição de retenção (apagar/anonimizar após o evento).
- Limitação conhecida: uma regra de segurança não consegue exigir que a reserva e os assentos sejam gravados juntos; isso é garantido pelo app (transação). É aceitável para uso interno com equipe autorizada.

## Checklist de testes manuais (faça no emulador antes de usar dados reais)

- [ ] Login com senha errada mostra erro; conta sem perfil vê "acesso não liberado".
- [ ] `producao@` não vê o menu Reservas e não consegue reservar; `operador@` reserva mas não edita mapa nem eventos.
- [ ] Reservar 2 assentos pelo modal; abrir a reserva; fazer check-in; cancelar (assentos voltam a ficar livres).
- [ ] Em duas abas, reservar o mesmo assento: a segunda recebe a mensagem de assento já reservado.
- [ ] Editor: marcar fileira como equipe, desfazer/refazer, salvar; tentar bloquear assento reservado (deve recusar).
- [ ] Dashboard muda ao reservar/bloquear; Story gera PNG sem nomes.
- [ ] Criar, publicar, duplicar, encerrar e excluir rascunho; CSV abre no Excel com acentos corretos.

## Observações

- O Cloud Storage não é usado: a imagem de capa é reduzida no navegador (~250 KB) e guardada no Firestore.
- Cotas e preços do Firebase mudam: confira em firebase.google.com/pricing.
- As telas públicas do Figma (home, detalhe do evento, reserva pelo público) **não** fazem parte desta entrega; ficam para a Fase 7.
