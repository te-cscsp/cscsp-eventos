# Roadmap – Plataforma de Reservas do Teatro CSCSP

> Colégio Santa Catarina – Mooca/SP · **Versão 1.2** · 17/11/2026 · Stack: **Firebase** · Documento vivo: atualize os checkboxes a cada entrega.
>
> **Fontes de verdade:**
> - Visual e comportamento da gestão: `DASHBOARD_GESTAO.md` (gerado pelo Figma)
> - Layout físico do teatro: mapa real (398 lugares) + `layout-teatro.json`
> - Escopo, dados, fases e prazos: este roadmap
>
> Em conflito: o Figma manda no **visual**; o mapa real manda no **layout**; este roadmap manda nos **dados e na ordem de entrega**.

---

## 0. Situação das entradas

| Entrada | Situação |
|---|---|
| Layout real do teatro (mapa com 398 lugares) | Recebido e convertido em `layout-teatro.json` (conferido: 398) |
| Especificação do Figma (`DASHBOARD_GESTAO.md`) | Recebida |
| Ingressos gratuitos | Confirmado: **sem pagamento online** |
| Aprovação da TI | Confirmado: **não necessária** |
| Código gerado pelo Figma (`src/App.tsx`, `src/index.css`, `package.json`) | **Pendente** (reaproveitar acelera o projeto) |
| Design da área pública (landing page) | Pendente: o Figma entregue cobre só a Área de Gestão |
| Logo em vetor (SVG) e imagens do colégio | Pendente |
| Perfis iniciais de usuários (nomes e e-mails) | Pendente |
| Contato do encarregado de dados (DPO) | Pendente |

---

## 0.1 Status da implementação (17/11/2026)

Código entregue em `teatro-cscsp-gestao.zip`. As Fases 0 a 5 da **área de gestão** foram implementadas em código. Foram validados: checagem de tipos (com bibliotecas simuladas) e testes das funções de cálculo, formatação e CSV. **Ainda não foram testados contra o Firebase** (nem no emulador), porque o ambiente de desenvolvimento não tem internet. Use o checklist do `README.md`.

| Implementado | Pendente |
|---|---|
| Login, perfis e regras de segurança (3 papéis) | Testar as regras no emulador (teste automatizado) |
| Visão geral com números reais, setores, mapa de calor e Story em PNG | Renomear/renumerar assentos |
| Eventos: lista, filtros, criar/editar, publicar, encerrar, cancelar, duplicar, excluir rascunho, capa | Trocar assento de uma reserva |
| Mapa real (398 lugares): reservar por modal, detalhe, editar, check-in, cancelar | Tela de gestão de usuários (hoje: script `admin:criar`) |
| Editor do mapa: classes, fileira, desfazer/refazer, salvamento em transação | Reservas por período; menu em gaveta no celular (hoje: barra compacta do Figma) |
| Tabela de reservas: busca, filtros, paginação, CSV, auditoria | Revisão do DPO, deploy e piloto (Fase 6); landing page (Fase 7) |

---

## 1. Objetivo

Substituir o controle manual de reservas do teatro por um sistema digital com mapa de assentos.

**Agora (uso interno):** a equipe organizadora reserva assentos pelo mapa, registra quem reservou e acompanha a ocupação.
**Depois (público):** landing page para pais e alunos reservarem sozinhos, usando a mesma base de dados e as mesmas regras.

Princípio de projeto: **o protótipo interno já nasce com o modelo de dados e as regras do sistema público**, para que a landing page seja uma nova "porta de entrada", e não uma reescrita.

---

## 2. Stack decidida: Firebase

**Decisão:** todo o sistema (interno e, depois, público) será desenvolvido e implantado no Firebase (Google Cloud).

### 2.1 Serviços e uso

| Serviço | Para quê | Fase |
|---|---|---|
| Firebase Authentication | Login da equipe (e-mail/senha) e, depois, login dos pais por link no e-mail | 1 e 7 |
| Cloud Firestore | Banco de dados com atualização em tempo real do mapa | 0 em diante |
| Security Rules | Controle de quem lê e escreve cada dado (principal barreira de LGPD) | 1 em diante |
| Firebase Hosting | Publicar o sistema interno e, depois, a landing page | 6 e 7 |
| Emulator Suite | Desenvolver e testar localmente com dados fictícios | 0 em diante |
| Cloud Functions | Reserva pública validada no servidor, contadores, e-mail de confirmação | 7 |
| App Check | Reduzir uso abusivo da API pelo público | 7 |

### 2.2 Escolhas que não podem ser desfeitas (acertar na Fase 0)

- **Região do Firestore: São Paulo (`southamerica-east1`).** Não dá para mudar depois de criada.
- **Dois projetos Firebase separados:** `dev` (emulador e dados fictícios) e `interno` (dados reais). Nunca usar dados reais no projeto de desenvolvimento.
- **Firestore em modo de produção** desde o início (regras negam tudo por padrão).

### 2.3 Custos e planos

- **Spark (gratuito, sem cartão):** Fases 0 a 6. Suficiente para uso interno, com poucos usuários.
- **Blaze (pago por uso, exige cartão):** necessário na Fase 7 (Cloud Functions e e-mail por extensão) e provavelmente para backups agendados. As cotas gratuitas continuam valendo no Blaze. **Configurar alerta de orçamento antes de ativar.**
- **Cloud Storage: não usar na fase interna.** Desde 2026 exige o plano Blaze. Consequência para a imagem do evento: ver Seção 7, Fase 4.
- **Não usar verificação por SMS/telefone no Auth** (cobrada por verificação).
- **Consumo de leituras:** o mapa lê um documento por assento (398 leituras por carga). No uso interno isso cabe no Spark. Na abertura de reservas ao público o volume sobe, por isso a Fase 7 inclui Blaze, alerta de orçamento e teste de carga. Mitigações: cache offline do SDK e um único *listener* por evento.
- **Cotas e preços mudam:** conferir firebase.google.com/pricing antes de ativar o Blaze.

### 2.4 Camada de dados isolada

Todo acesso ao Firebase fica em `src/data/`. A interface nunca chama o SDK diretamente. Isso facilita testes com o emulador e mantém a interface simples de manter.

---

## 3. Stack técnica

- **Front-end:** React + Vite + TypeScript, React Router. Estilos e componentes **seguem o código do Figma** (CSS com os tokens abaixo); Tailwind só se simplificar a manutenção.
- **Tokens do Figma:** `--ink #123d41`, `--teal #006f68`, `--teal-dark #073f41`, `--mint #e8f5f2`, `--gold #d5a738`, `--surface #ffffff`, `--background #f4f7f6`, `--border #dbe6e2`, `--muted #687d7c`, `--danger #b8544b`. Fontes: DM Sans (texto) e Manrope (títulos e números). Ícones: `lucide-react`.
- **Mapa:** SVG renderizado por componentes (um componente por assento), com zoom e arraste.
- **Back-end:** Firebase Auth, Firestore, Hosting; Cloud Functions só na Fase 7.
- **Testes:** Vitest + Emulator Suite (regras de segurança e reserva concorrente).
- **Ambientes:** projeto `dev` (emulador local, dados fictícios) e projeto `interno` (dados reais). Configurações em variáveis de ambiente, nunca no repositório.

Estrutura de pastas prevista:

```
src/
  data/        # acesso ao Firestore/Auth (única camada que fala com o provedor)
  features/
    auth/      # login, rotas protegidas, PermissionGate
    map/       # SeatMap, Seat, SeatLegend, editor
    reservas/  # modal, tabela, detalhe
    eventos/   # lista, formulário, duplicar
    dashboard/ # cards, ocupação, mini mapa, Story
  components/  # AdminShell, Sidebar, Topbar, StatCard, DataTable, etc. (conforme Figma, seção 16)
  lib/         # utilidades, tipos
```

---

## 4. Layout real do teatro

Fonte: mapa real do teatro. Arquivo pronto: **`layout-teatro.json`** (398 assentos, validado).

| Item | Valor |
|---|---|
| Total de lugares | **398** |
| Fileiras | 15 (A a O), de A (junto ao palco) até O (fundo) |
| Lado esquerdo | Números **pares**, **204** lugares (setor `plateia-esquerda`) |
| Lado direito | Números **ímpares**, **194** lugares (setor `plateia-direita`) |
| Corredor central | Entre o 02 (esquerda) e o 01 (direita) |
| Fileira A | 10 lugares por lado (esq. 02–20, dir. 01–19) |
| Fileira B | 12 lugares por lado (esq. 02–24, dir. 01–23) |
| Fileiras C a N | 14 lugares por lado (esq. 02–28, dir. 01–27) |
| Fileira O | Esq. 02–28 (14 lugares); dir. **apenas 01, 03, 05, 07 (PcD)** |
| Prioritários (vermelho no mapa real) | **8:** J02, L02, M28, O28, K27, L01, M27, N01 |
| PcD / cadeirante (ícone no mapa real) | **4:** O01, O03, O05, O07 |
| Comuns | 386 |

Pontos de atenção:

- **Não existe setor de balcão** no teatro real (o Figma citou balcão como exemplo). Setores do sistema: *plateia esquerda* e *plateia direita*.
- O Figma descreveu o mapa inicial como "fileiras A–L com 20 assentos". **O mapa real prevalece** (A–O, 398 lugares, tamanhos diferentes por fileira).
- Identificador de assento = rótulo da fileira + número (ex.: `C10`). Rótulo visível e identificador interno são campos separados, como pede o Figma (seção 8.7).
- `distanciaCorredor` (1 = junto ao corredor) define a posição horizontal de cada assento e alinha as fileiras A e B, que são mais curtas.

---

## 5. Papéis e permissões (conforme o Figma)

| Papel | Pode |
|---|---|
| `administrator` | Tudo: eventos, mapa, classificação dos assentos, reservas, dados pessoais, exportação, usuários |
| `operator` (operador de eventos) | Acompanhar reservas e ocupação, consultar participantes, reservar/cancelar, fazer check-in; sem alterar configurações sensíveis |
| `production` (produção) | Consultar mapas e ocupação, ver assentos de equipe e acessibilidade; **sem dados pessoais** (também serve à comunicação, que só precisa dos números) |

- Não há cadastro aberto na versão interna: o administrador cria as contas no console do Firebase e libera o acesso pelo documento `users/{uid}` (`ativo: true` e `papel`). Mesmo que alguém crie uma conta no Auth, as regras negam acesso sem esse documento.
- Na fase sem Cloud Functions, as regras leem o papel em `users/{uid}`; na Fase 7 isso migra para *custom claims*.
- Permissão é validada nas **Security Rules**, nunca só escondendo botões no front-end.

---

## 6. Modelo de dados (ajustado ao Figma e ao teatro real)

**Ideia central:** o *layout* do teatro é fixo; o que muda por evento é a **classe** de cada assento (normal, preferencial, PcD, equipe, bloqueado) e a **ocupação** (tem reserva ou não).

```
users/{uid}                        nome, email, papel(administrator|operator|production), ativo
venues/{venueId}                   nome, versaoLayout, totalAssentos
venues/{venueId}/seats/{seatId}    label, fileira, ordemFileira, numero, lado, setor,
                                   distanciaCorredor, tipo(normal|preferencial|pcd)
events/{eventId}                   titulo, descricao, data, horario, abertura?, local, venueId,
                                   status(draft|published|closed|cancelled), gratuito(true),
                                   limitePorPessoa, reservasAbrem?, reservasFecham?, layoutVersao
events/{eventId}/media/capa        imagem comprimida (documento separado, ver Fase 4)
events/{eventId}/seats/{seatId}    classe(normal|preferencial|pcd|equipe|bloqueado), motivo?,
                                   ocupado(bool), reservaId?, holdUntil?, atualizadoPor, atualizadoEm
reservations/{reservaId}           codigo(único), eventId, seatIds[], nome, ra,
                                   tipoUsuario(aluno|responsavel), telefone?, email?, observacao?,
                                   status(pending|confirmed|cancelled|expired|checked_in),
                                   origem(interno|publico), criadoPor, criadoEm, atualizadoEm, checkedInEm?
reservations/{id}/historico/{h}    acao, uid, quando, resumo
auditLog/{id}                      uid, acao, entidade, quando, resumo
```

Regras de negócio que o modelo precisa sustentar (do Figma, seções 5.3 e 12):

```
totalConfigurado = assentos do layout
bloqueados       = assentos com classe bloqueado ou equipe
reservados       = reservas confirmadas (e check-in realizado)
disponiveis      = totalConfigurado − bloqueados − reservados
% ocupado        = reservados / (totalConfigurado − bloqueados)
```

Notas:

- **Um documento por assento por evento**, para evitar gargalo de escrita em reservas simultâneas.
- **Dashboard interno** calcula os números a partir dos mesmos documentos de assento que o mapa já carregou (mesma fonte de verdade, sem números escritos à mão). Um documento de contadores públicos só entra na Fase 7, mantido por Cloud Function, sem dados pessoais.
- **Reserva em transação:** ler os assentos, confirmar que estão livres e classe reservável, gravar assentos + reserva + histórico juntos.
- **Reserva temporária (`holdUntil`):** a expiração é conferida dentro da própria transação (um hold vencido conta como livre), sem precisar de função agendada.
- **Salvar o layout do evento em lote atômico** (`writeBatch`, limite de 500 operações; o teatro tem 398 assentos, então cabe).
- **Conflito entre dois administradores:** guardar `atualizadoEm` e recusar a gravação se o assento mudou desde a leitura.
- **Renumerar não quebra reservas:** o `id` do assento é imutável; só o `label` muda.
- No uso interno, a reserva nasce como `confirmed`. `pending` e `expired` passam a existir na Fase 7.
- **Ingressos gratuitos:** `gratuito: true`, sem campos de preço ou pagamento.
- Dados mínimos: R.A. e nome só onde necessário. Telefone e e-mail são opcionais na versão interna.
- Dados pessoais **nunca** em URLs ou em logs do navegador.

---

## 7. Fases

### Fase 0 – Fundação
- [x] Layout real do teatro recebido e convertido (`layout-teatro.json`, 398 assentos)
- [x] `DASHBOARD_GESTAO.md` do Figma recebido
- [ ] Receber o código gerado pelo Figma (`src/App.tsx`, `src/index.css`, `package.json`) para reaproveitar telas e estilos
- [ ] Criar os projetos Firebase `dev` e `interno` (Firestore em **São Paulo**, modo de produção) e o repositório
- [ ] Ativar Authentication (e-mail/senha), Firestore e Hosting; **não** ativar Storage
- [ ] Configurar alerta de orçamento no Google Cloud (mesmo no Spark)
- [ ] Configurar Vite + TS + Emulator Suite e importar os tokens do Figma
- [ ] Definir os tipos TypeScript do modelo de dados (Seção 6)
- [ ] Script de *seed* que cria o teatro (venue + 398 assentos) a partir de `layout-teatro.json`

### Fase 1 – Login, estrutura da área de gestão e permissões
- [ ] Tela de login (conforme Figma)
- [ ] Firebase Auth e-mail/senha; desativar auto-cadastro no console e conferir a configuração de ações do usuário
- [ ] Criar o primeiro administrador e o documento `users/{uid}` por script
- [ ] `AdminShell`: sidebar fixa, topbar, drawer no celular, rota preservada ao atualizar a página
- [ ] `PermissionGate` e tela de "permissão insuficiente"
- [ ] Sessão expirada redireciona para o login
- [ ] Security Rules iniciais (negar tudo por padrão; acesso só com `users/{uid}` ativo)
- [ ] Testes das regras por papel

### Fase 2 – Mapa do teatro
- [ ] Renderizar o mapa real: palco no topo, plateia esquerda e direita, corredor central, fileiras A–O
- [ ] Zoom, arraste e redefinição de zoom
- [ ] Cores por classe e ocupação, **sempre com ícone ou padrão** (PcD com ícone; equipe hachurado)
- [ ] Legenda sempre acessível
- [ ] Acessibilidade: cada assento anuncia nome e estado (ex.: "Assento C10, preferencial, disponível")
- [ ] Atualização em tempo real
- [ ] Seletor de evento controlando todo o mapa

### Fase 3 – Reserva pelo mapa (modal)
- [ ] Clique em assento livre abre modal: nome, R.A., tipo (aluno/responsável), telefone, e-mail, observação
- [ ] Mais de um assento por reserva, respeitando o limite por pessoa (administrador pode confirmar exceção)
- [ ] Reserva em transação, com código único
- [ ] Clique em assento reservado: detalhe da reserva (código, evento, participante, assentos, status, histórico), editar e cancelar com confirmação
- [ ] Cancelar devolve o assento à disponibilidade
- [ ] Bloquear/liberar assento para a equipe (não sobrescrever reserva ativa sem resolver)
- [ ] Mensagens claras (ex.: "Este assento acabou de ser reservado")
- [ ] Estados de carregando, vazio, erro e sucesso; nenhum "sucesso" antes de a gravação terminar

### Fase 4 – Eventos e tabela de reservas
- [ ] Lista de eventos: busca por título, filtros por status e período, ordenação, limpar filtros
- [ ] Criar/editar evento com os campos do Figma (título, descrição, data, horário, local, limite por pessoa, período de reservas, status inicial, indicação de gratuito)
- [ ] Salvar rascunho, publicar, encerrar, cancelar (com confirmação), duplicar (copia dados e layout, não copia reservas), excluir rascunho
- [ ] Avisar sobre alterações não salvas e evitar envio duplicado
- [ ] **Imagem do evento sem Storage:** comprimir no navegador (JPG, até ~200 KB) e guardar em `events/{id}/media/capa`, com prévia, trocar, remover e texto alternativo. Se virar limitação, migrar para Cloud Storage junto com o Blaze (Fase 7)
- [ ] Tabela de reservas: nome, R.A., tipo, contato (conforme permissão), assento, setor, status, data, ações
- [ ] Busca (nome, R.A., e-mail, código, assento) e filtros (status, tipo, setor, evento)
- [ ] Exportar CSV (UTF-8, cabeçalhos em português, escopo explícito, só administrador, registrado na auditoria)

> **Marco 1: protótipo interno utilizável** (Fases 0 a 4)

### Fase 5 – Dashboard, editor completo do mapa e check-in
- [ ] Dashboard: seletor de evento, cards (total, reservados, disponíveis, bloqueados), % de ocupação, ocupação por setor, horário da última atualização
- [ ] Mini mapa de ocupação com atalho "Abrir editor"
- [ ] Gerador de arte para Stories (9:16, PNG/JPG): "Restam X lugares!", logo, data e horário, estado "Ingressos esgotados"; **nunca** nomes, R.A., contatos ou códigos
- [ ] Editor do mapa: selecionar assento, vários (Shift), fileira (clique na letra) e setor; aplicar preferencial, equipe, bloqueado, PcD ou disponível; contador de selecionados
- [ ] Renomear fileira, renumerar assentos (só o rótulo), desfazer e refazer
- [ ] Salvar layout do evento em lote atômico, com aviso de conflito e registro de quem alterou
- [ ] Bloquear assento ocupado exige resolução da reserva
- [ ] Check-in manual (e desfazer, com permissão) e trocar assento
- [ ] Tela para ativar/desativar usuários e trocar papel (a criação da conta continua no console até a Fase 7)

### Fase 6 – Endurecimento (LGPD e segurança) e implantação interna
- [ ] Revisar Security Rules com testes (cada papel, cada coleção) e teste de reserva concorrente
- [ ] Auditoria completa: login/logout, eventos, alterações no mapa, cancelamentos, troca de assento, exportação de CSV, mudança de permissão
- [ ] Mascarar contatos para perfis sem permissão
- [ ] Política de retenção: apagar/anonimizar dados após o evento
- [ ] Aviso de privacidade interno e registro das finalidades
- [ ] Revisão pelo DPO/encarregado do colégio **antes de usar dados reais**
- [ ] Validar responsividade (desktop, tablet, celular) e acessibilidade (teclado, foco, contraste)
- [ ] Alertas de orçamento e monitoramento de uso no console do Firebase
- [ ] Backup do Firestore (exportação agendada ou recuperação a um ponto no tempo; confirmar exigência de plano)
- [ ] Domínio/subdomínio do colégio no Hosting e domínios autorizados no Auth
- [ ] Publicar no Firebase Hosting (ambiente `interno`)
- [ ] Treinamento curto com a equipe e manual de 1 página
- [ ] Piloto em 1 evento real, com conferência das cotas do Spark e coleta de feedback

> **Marco 2: gestão completa em uso interno** (Fases 5 e 6)

### Fase 7 – Landing page e reserva pública
- [ ] Design da área pública (pendente de definição/Figma)
- [ ] Migrar para o plano Blaze com alerta de orçamento ativo
- [ ] Lista de eventos publicados (somente leitura) e página do evento
- [ ] Cadastro e login de pais/alunos (campos do projeto, consentimento LGPD, link por e-mail)
- [ ] Reserva pública via Cloud Function (validação no servidor, limite por pessoa, *rate limit*), com `pending` e expiração (`holdUntil`)
- [ ] Ativar App Check no front-end público
- [ ] Migrar papéis para *custom claims* e criar a gestão de usuários via Function
- [ ] Reservas com `origem: publico` aparecendo na mesma tabela e no mesmo mapa
- [ ] E-mail de confirmação e "reenviar confirmação" (extensão de e-mail do Firebase ou SendGrid; confirmar condições atuais do SendGrid)
- [ ] Cancelamento pelo próprio usuário
- [ ] Contador público de lugares restantes (sem dados pessoais)
- [ ] Teste de carga simulando a abertura de reservas
- [ ] Política de privacidade e termos publicados; cuidado reforçado com dados de menores (art. 14 da LGPD)

> **Marco 3: sistema completo, público e interno**

---

## 8. Cronograma e prazo

**Premissas:** ritmo de trabalho regular, sem o plano Pro (limite de mensagens), início em 18/11/2026 e as pendências da Seção 0 resolvidas no começo. Estimativa, não promessa.

| Fase | Duração estimada | Acumulado |
|---|---|---|
| 0 – Fundação | 2 a 3 dias úteis | 2 a 3 dias |
| 1 – Login, estrutura e permissões | 2 a 3 dias úteis | 4 a 6 dias |
| 2 – Mapa do teatro | 4 a 5 dias úteis | 8 a 11 dias |
| 3 – Reserva pelo mapa | 3 a 4 dias úteis | 11 a 15 dias |
| 4 – Eventos e tabela de reservas | 3 a 4 dias úteis | 14 a 19 dias |
| **Marco 1: protótipo interno utilizável** | | **cerca de 3 a 4 semanas** |
| 5 – Dashboard, editor completo e check-in | 8 a 10 dias úteis | |
| 6 – Endurecimento, LGPD e implantação interna | 5 a 7 dias úteis | |
| **Marco 2: gestão completa interna** | | **cerca de 5,5 a 7 semanas** |
| 7 – Landing page e reserva pública | 10 a 15 dias úteis | |
| **Marco 3: sistema completo + implementação** | | **cerca de 8 a 10 semanas** |

Datas aproximadas se começar em 18/11/2026:

- **Marco 1:** meados de dezembro de 2026
- **Marco 2:** início a meados de janeiro de 2027
- **Marco 3:** meados de janeiro a início de fevereiro de 2027 (com folga para o recesso escolar e aprovações)

**Como o Figma e o mapa real mudam o prazo:**
- A Fase 5 cresceu em relação à versão anterior (desfazer/refazer, seleção múltipla, Story em PNG, duplicar evento, check-in e troca de assento estão no Figma).
- Se o código gerado pelo Figma for compartilhado, as Fases 1 a 4 podem encurtar (telas e estilos prontos; o trabalho passa a ser ligar tudo ao Firebase).
- Ingressos gratuitos e sem aprovação da TI tiram dois possíveis atrasos.

**O que mais pode atrasar (e não é código):**
- Aprovação do DPO/jurídico e o recesso escolar de dezembro/janeiro
- Falta do design da área pública antes da Fase 7
- Mudanças de escopo no meio de uma fase
- Limite de mensagens do plano gratuito
- Migração para o plano Blaze (cartão e aprovação de orçamento) antes da Fase 7

**Como encurtar:** usar o Marco 1 já no próximo evento; deixar o editor da Fase 5 simples (por fileira) antes do ajuste fino por assento.

---

## 9. Preparação para a landing page (regras desde o dia 1)

- Mesmo modelo de dados e mesma regra de reserva (transação) para interno e público.
- Campo `origem` na reserva e `status: published` no evento já existem.
- O público **nunca** lê `reservations`; só eventos publicados e o contador público.
- Reserva pública passa por Cloud Function (validação no servidor), não direto pelo navegador.
- `SeatMap` reutilizável em dois modos: "edição da equipe" e "escolha pelo público".
- Textos e rótulos em arquivo central, para facilitar ajustes.

---

## 10. Pendências e decisões em aberto

- [ ] **Nome e cor dos assentos especiais.** O mapa real usa **vermelho = prioritário** e ícone de cadeira de rodas = PcD; o Figma usa **dourado = preferencial** e reserva o vermelho para erro/cancelamento. Proposta: rótulo visível "Prioritário" (termo do colégio), cor dourada (Figma), PcD com ícone; confirmar.
- [ ] Finalidade dos 8 assentos prioritários (mobilidade reduzida, convidados, outro?). O Figma pede que seja configurável.
- [ ] Limite padrão de assentos por pessoa
- [ ] Perfis e contas iniciais (quem é administrador, operador, produção)
- [ ] Contato do DPO e prazo de retenção dos dados
- [ ] Design da área pública (landing page)
- [ ] Logo em SVG e domínio/subdomínio do colégio

---

## 11. LGPD e segurança (checklist contínuo)

- [ ] Coletar o mínimo (nome, R.A., tipo; telefone e e-mail opcionais no interno)
- [ ] Nunca armazenar senha própria (usar Firebase Auth)
- [ ] Regras de segurança: cada papel vê só o que precisa (menor privilégio)
- [ ] Dashboard e Stories só com números agregados
- [ ] Banco na região de São Paulo
- [ ] Auditoria de ações sensíveis (`auditLog`)
- [ ] Retenção definida e rotina para apagar dados após o evento
- [ ] Chaves e segredos fora do repositório
- [ ] Nenhum dado real em testes: usar dados fictícios
- [ ] Validação do DPO antes de usar dados reais; dados de menores com cuidado reforçado
- [ ] Dados pessoais fora de URLs e de logs do navegador

---

## 12. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Duas pessoas reservarem o mesmo assento | Alto | Transação + teste de concorrência |
| Regras de segurança mal configuradas | Alto (vazamento) | Testes automáticos com emulador, revisão na Fase 6 |
| Estourar cota gratuita no pico de reservas | Médio | Um doc por assento, um *listener* por evento, alertas de orçamento, teste de carga |
| Escopo crescer (QR code, relatórios, etc.) | Médio | Congelar escopo por marco; novas ideias vão para o backlog |
| Dados reais usados antes da aprovação do DPO | Alto | Só dados fictícios até o fim da Fase 6 |
| Dependência de uma pessoa para manter o sistema | Médio | Documentação, manual de 1 página, código simples |
| Região do Firestore escolhida errada | Alto (não dá para mudar) | Conferir na Fase 0: São Paulo |
| Custo inesperado ao ativar o Blaze | Médio | Alerta de orçamento antes de ativar; revisar uso semanal |
| Cota do Spark acabar com o serviço parado | Baixo no interno | Acompanhar uso no piloto; migrar para Blaze se necessário |
| Layout do Figma divergir do teatro real | Médio | Mapa real e `layout-teatro.json` prevalecem; conferir contagem (398) a cada mudança |
| Imagem do evento pesada demais sem Storage | Baixo | Compressão no navegador (~200 KB); migrar para Storage no Blaze se preciso |

---

## 13. Definição de pronto (por fase)

1. Funcionalidade funciona conforme o Figma e este roadmap.
2. Estados de carregando, vazio, erro, sucesso e permissão insuficiente tratados.
3. Regras de segurança testadas para a fase.
4. Nenhum controle "solto": todo botão, filtro e número ligado a dados reais (Figma, seção 18).
5. Sem dados reais nem chaves no repositório.
6. Checkboxes da fase marcados neste arquivo.
7. Demonstração rápida para a equipe, com feedback anotado.

---

## 14. Backlog (fora do escopo por enquanto)

- Pagamento online (não necessário: ingressos gratuitos)
- QR code com leitura na entrada
- Lista de espera
- Relatórios históricos entre eventos
- Aplicativo instalável (PWA)
- Notificações administrativas

---

## 15. Registro de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 17/11/2026 | Protótipo primeiro para uso interno; público depois | Reduz risco de LGPD e valida o fluxo com a equipe |
| 17/11/2026 | **Firebase definido como stack** (Auth, Firestore, Hosting; Functions na Fase 7) | Tempo real nativo, rapidez, custo inicial zero |
| 17/11/2026 | Spark até a Fase 6; Blaze só na Fase 7, com alerta de orçamento | Manter o custo zero no uso interno |
| 17/11/2026 | Sem Cloud Storage na versão interna | Exige Blaze; imagem do evento comprimida no próprio Firestore |
| 17/11/2026 | Ingressos gratuitos; sem pagamento online | Confirmado pelo colégio |
| 17/11/2026 | Aprovação da TI não necessária | Confirmado pelo colégio |
| 17/11/2026 | Layout real (398 lugares, 2 setores, sem balcão) substitui o exemplo do Figma | Mapa real do teatro |
| 17/11/2026 | Papéis: administrator, operator, production | Definidos no Figma |

---

## 16. Mapa Figma → Fases

| `DASHBOARD_GESTAO.md` | Onde entra |
|---|---|
| 4 Estrutura global (sidebar, topbar, cabeçalho) | Fase 1 |
| 5 Visão geral / dashboard, Story | Fase 5 |
| 6 Gestão de eventos | Fase 4 |
| 7 Criar e editar evento | Fase 4 |
| 8 Editor do mapa | Fases 2 (visualização), 3 (bloqueio) e 5 (editor completo) |
| 9 Lista de reservas | Fase 4 (check-in e troca de assento na Fase 5) |
| 10 Detalhe da reserva | Fases 3 e 4 |
| 11 Estados da interface | Todas |
| 12 Regras de negócio | Fases 3 e 4 |
| 13 Segurança e LGPD | Fases 1 e 6 |
| 14 Acessibilidade e 15 Responsividade | Todas; validação final na Fase 6 |
| 16 Componentes | Fases 0 e 1 em diante |
| 17 Estrutura de dados | Seção 6 (adaptada) |
| 18 a 20 Critérios de aceite e checklist | Seção 13 |
