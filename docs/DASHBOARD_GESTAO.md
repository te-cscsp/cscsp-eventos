# Especificação da Dashboard / Área de Gestão — Teatro CSCSP

## 1. Objetivo do documento

Este documento descreve tudo que deve existir visualmente e logicamente na Área de Gestão da plataforma de reserva de assentos do Teatro do Colégio Santa Catarina — Mooca/SP (CSCSP).

Ele deve ser usado como referência por agentes de IA, designers e desenvolvedores para:

- preservar a identidade visual da plataforma;
- entender a arquitetura de navegação;
- implementar telas e componentes de forma consistente;
- conectar controles visuais às regras reais do sistema;
- evitar fluxos incompletos, botões sem ação e dados desconectados;
- manter privacidade, acessibilidade e segurança no tratamento das reservas.

A Área de Gestão é destinada exclusivamente à equipe autorizada do colégio. Ela deve funcionar prioritariamente em desktop, mas continuar utilizável em tablets e celulares.

---

## 2. Contexto do produto

A plataforma permite que pais e alunos reservem assentos numerados para eventos do teatro. A equipe de gestão precisa criar eventos, publicar a agenda, editar o mapa, classificar assentos e acompanhar as reservas.

### Perfis administrativos previstos

1. **Administrador**
   - acesso completo;
   - cria, edita, publica, duplica e encerra eventos;
   - altera mapas e classificações dos assentos;
   - visualiza e exporta dados pessoais das reservas;
   - gerencia outros usuários administrativos, caso esse recurso seja implementado.

2. **Operador de eventos**
   - acompanha reservas e ocupação;
   - consulta participantes;
   - pode fazer check-in;
   - não altera configurações sensíveis sem permissão.

3. **Produção**
   - consulta mapas;
   - identifica assentos reservados para equipe, convidados e acessibilidade;
   - pode ter acesso restrito aos dados pessoais dos participantes.

O protótipo atual pode apresentar apenas uma usuária administradora, mas a estrutura lógica deve considerar autorização por função.

---

## 3. Princípios visuais

### 3.1. Personalidade

A interface deve ser:

- limpa;
- institucional;
- acolhedora;
- eficiente;
- confiável;
- semelhante, em nível de usabilidade, a ferramentas como Sympla e plataformas de gestão de cinemas;
- menos promocional que a área pública e mais orientada a dados e tarefas.

### 3.2. Identidade visual

Usar como referência a identidade do Colégio Santa Catarina.

#### Cores principais

- **Verde-petróleo escuro:** navegação, títulos importantes e superfícies institucionais.
- **Verde institucional:** ações primárias, gráficos e estados positivos.
- **Dourado:** destaques, assentos preferenciais e elementos de atenção moderada.
- **Verde-claro:** fundos auxiliares e estados selecionados suaves.
- **Branco:** cartões, tabelas e formulários.
- **Cinza esverdeado:** textos secundários, bordas e áreas neutras.
- **Vermelho moderado:** erros, cancelamentos e ações destrutivas.

Referência aproximada:

```css
--ink: #123d41;
--teal: #006f68;
--teal-dark: #073f41;
--mint: #e8f5f2;
--gold: #d5a738;
--surface: #ffffff;
--background: #f4f7f6;
--border: #dbe6e2;
--muted: #687d7c;
--danger: #b8544b;
```

#### Tipografia

- Fonte sem serifa e legível.
- Preferência atual: **DM Sans** para textos e **Manrope** para títulos e números.
- Títulos devem ter peso forte e espaçamento compacto.
- Números de indicadores podem usar peso 700 ou 800.
- Textos nunca devem ficar pequenos demais para acomodar mais informações.

#### Ícones

- Usar uma única família de ícones lineares, atualmente `lucide-react`.
- Não usar emojis como ícones.
- Todo ícone isolado deve ter `aria-label`, `title` ou texto visual associado.

### 3.3. Densidade e layout

- Fundo principal levemente acinzentado ou esverdeado.
- Informações agrupadas em cartões brancos com bordas discretas.
- Cantos entre 8 e 14 px.
- Sombras leves; evitar aparência de elementos flutuantes excessivos.
- Espaçamento consistente em múltiplos de 4 ou 8 px.
- Ações primárias sempre visualmente distintas das secundárias.
- Tabelas devem priorizar leitura, escaneabilidade e ações rápidas.

---

## 4. Estrutura global da Área de Gestão

### 4.1. Sidebar

No desktop, a navegação principal deve ficar em uma sidebar fixa à esquerda.

#### Cabeçalho da sidebar

- logo do CSCSP;
- nome “Teatro CSCSP”;
- subtítulo “Gestão de eventos”.

#### Itens principais

1. **Visão geral**
2. **Eventos**
3. **Mapa de assentos**
4. **Reservas**

Itens futuros possíveis:

- Check-in;
- Relatórios;
- Usuários e permissões;
- Configurações;
- Auditoria.

#### Comportamento

- item ativo destacado;
- estado de hover;
- ícone e texto;
- navegação sem recarregar a página;
- rota ou estado deve permanecer consistente ao atualizar a aplicação;
- em desktop, a sidebar permanece visível;
- em telas estreitas, deve virar drawer ou menu recolhível;
- o menu móvel não pode ser apenas visual: deve abrir e permitir navegação.

#### Rodapé da sidebar

- avatar ou iniciais;
- nome do usuário;
- função;
- ação de sair.

### 4.2. Topbar

Deve conter:

- nome ou contexto da área atual;
- botão “Ver site”, abrindo a área pública;
- avatar do usuário;
- menu móvel quando necessário;
- opcionalmente notificações administrativas.

### 4.3. Cabeçalho de página

Toda página administrativa deve possuir:

- título;
- descrição curta;
- ação principal alinhada à direita quando aplicável;
- breadcrumb quando houver níveis internos, como edição de evento;
- feedback de salvamento, carregamento ou erro.

---

## 5. Visão geral / Dashboard

### 5.1. Objetivo

Oferecer uma leitura rápida da situação do evento selecionado e atalhos para as tarefas mais importantes.

### 5.2. Seletor de evento

Deve aparecer antes dos indicadores.

Exibir:

- data resumida;
- título do evento;
- data e horário completos;
- status;
- ação “Trocar evento”.

#### Regras

- todos os dados da dashboard devem corresponder ao evento selecionado;
- ao trocar o evento, cards, gráficos, mapa e arte de divulgação devem atualizar;
- não misturar dados de eventos diferentes;
- se nenhum evento estiver selecionado, exibir estado vazio com ação para selecionar ou criar evento.

### 5.3. Cards de indicadores

Exibir pelo menos:

1. **Total de lugares**
2. **Reservados**
3. **Disponíveis**
4. **Bloqueados**

Cada card deve conter:

- ícone;
- rótulo;
- valor principal;
- texto auxiliar;
- comparação ou tendência somente se houver dado real.

#### Fórmulas

```text
totalConfigurado = total de assentos existentes no layout ativo

bloqueados = assentos com status:
- bloqueado
- reservado para equipe

reservados = reservas ativas e confirmadas

disponiveis = totalConfigurado - bloqueados - reservados

percentualOcupado = reservados / (totalConfigurado - bloqueados) * 100
```

Assentos bloqueados não devem ser tratados como reservas de público.

### 5.4. Ocupação do evento

Exibir:

- percentual de ocupação;
- número reservado em relação à capacidade disponível;
- barra geral de progresso;
- ocupação por setor;
- horário da última atualização.

Setores previstos:

- plateia esquerda;
- plateia direita;
- balcão;
- outros setores configuráveis futuramente.

O gráfico não deve depender apenas de cor. Valores e nomes devem estar visíveis.

### 5.5. Mapa de ocupação resumido

Exibir uma miniatura simplificada do mapa:

- fileiras identificadas;
- assentos disponíveis;
- ocupados;
- preferenciais;
- bloqueados;
- reservados para equipe.

Deve conter o atalho **“Abrir editor”**, levando ao editor do mapa do evento atualmente selecionado.

### 5.6. Gerador de arte para Stories

Deve mostrar uma prévia vertical em proporção 9:16.

Conteúdo mínimo:

- imagem do evento;
- logo do colégio;
- título ou chamada;
- texto “Restam X lugares!”;
- data e horário;
- identidade visual institucional.

#### Regras de privacidade

- nunca exibir nomes;
- nunca exibir R.A.;
- nunca exibir e-mails ou telefones;
- nunca exibir códigos de reserva;
- o número de lugares deve ser calculado a partir do evento selecionado;
- a arte deve atualizar conforme a disponibilidade;
- o arquivo final deve ser exportável em PNG ou JPG.

#### Estados

- gerando;
- pronto para baixar;
- erro ao gerar;
- evento sem imagem;
- evento esgotado, usando uma chamada apropriada, como “Ingressos esgotados”.

---

## 6. Gestão de eventos

### 6.1. Lista de eventos

Apresentar uma tabela com:

- título;
- local;
- data;
- horário;
- status;
- ocupação;
- ações.

### 6.2. Status possíveis

1. **Rascunho**
   - não aparece para o público;
   - pode ser editado livremente.

2. **Publicado**
   - aparece na agenda pública;
   - aceita reservas se a data e as regras permitirem.

3. **Encerrado**
   - não aceita novas reservas;
   - permanece disponível para relatórios e histórico.

4. **Cancelado**
   - não aceita reservas;
   - reservas existentes devem receber tratamento e comunicação;
   - exige confirmação administrativa antes da mudança.

5. **Esgotado**
   - pode ser calculado automaticamente;
   - ocorre quando não há assentos públicos disponíveis;
   - o evento continua publicado, mas o CTA público muda.

### 6.3. Ações por linha

- editar;
- publicar ou despublicar;
- duplicar;
- abrir dashboard;
- abrir mapa;
- encerrar;
- cancelar;
- excluir rascunho, se permitido.

Ações destrutivas devem solicitar confirmação.

### 6.4. Busca e filtros

- busca por título;
- filtro por status;
- filtro por período;
- ordenação por data;
- paginação ou carregamento progressivo;
- opção de limpar os filtros.

### 6.5. Estados

- carregando;
- nenhuma ocorrência encontrada;
- nenhum evento cadastrado;
- erro de carregamento;
- erro ao alterar status;
- sucesso após publicação ou duplicação.

---

## 7. Criar e editar evento

### 7.1. Campos obrigatórios

- título;
- descrição;
- data;
- horário;
- local;
- imagem;
- limite de assentos por pessoa;
- layout de assentos;
- status inicial.

### 7.2. Campos recomendados

- horário de abertura dos portões;
- duração estimada;
- regras e orientações;
- categoria;
- período de abertura e encerramento das reservas;
- contato responsável;
- texto de acessibilidade;
- indicação de evento gratuito;
- mensagem de confirmação;
- configurações de cancelamento.

### 7.3. Imagem

- aceitar PNG e JPG;
- validar tamanho e peso;
- oferecer prévia;
- permitir substituir e remover;
- recomendar proporção 16:9;
- fornecer texto alternativo.

### 7.4. Limite de assentos

- deve ser número inteiro;
- mínimo de 1;
- máximo definido pela gestão;
- o público não pode ultrapassar o limite;
- alterações em eventos já publicados não podem invalidar silenciosamente reservas existentes.

### 7.5. Salvamento

Possibilidades:

- salvar rascunho;
- salvar e continuar;
- publicar;
- cancelar edição.

#### Regras

- indicar campos obrigatórios;
- validar antes de publicar;
- preservar dados preenchidos em caso de erro;
- evitar submissão duplicada;
- exibir carregamento;
- exibir confirmação de sucesso;
- avisar sobre alterações não salvas ao sair.

---

## 8. Editor do mapa de assentos

### 8.1. Objetivo

Permitir que a gestão configure o mapa visual e a disponibilidade dos assentos de um evento.

### 8.2. Estrutura do mapa

Configuração inicial:

- palco no topo;
- plateia com fileiras A–L;
- 20 assentos por fileira;
- lado esquerdo com números pares;
- lado direito com números ímpares;
- corredor central;
- setor de balcão;
- layout editável.

O mapa deve ser orientado pela perspectiva do público olhando para o palco. Qualquer inversão precisa ser comunicada claramente.

### 8.3. Estados dos assentos

1. **Disponível**
   - pode ser reservado pelo público.

2. **Selecionado**
   - estado temporário dentro do editor.

3. **Ocupado**
   - possui reserva ativa;
   - não pode ser liberado sem tratamento da reserva vinculada.

4. **Preferencial**
   - destacado em dourado;
   - usado para mobilidade reduzida, convidados ou regras institucionais;
   - a finalidade precisa ser configurável.

5. **Reservado para equipe**
   - indisponível ao público;
   - visual hachurado;
   - usado por produção e colaboradores.

6. **Bloqueado**
   - removido temporariamente da capacidade pública;
   - deve permitir motivo opcional.

7. **PcD**
   - identificado com ícone e texto;
   - não pode depender apenas da cor;
   - pode representar espaço para cadeira de rodas ou assento acompanhante.

### 8.4. Barra de ferramentas lateral

Deve oferecer:

- marcar como disponível;
- marcar como preferencial;
- reservar para equipe;
- bloquear;
- selecionar assento;
- selecionar múltiplos assentos;
- selecionar fileira;
- selecionar setor;
- limpar seleção;
- renomear fileira;
- renumerar assentos;
- desfazer;
- refazer;
- salvar layout.

### 8.5. Interações

- clique seleciona um assento;
- `Shift` ou modo de seleção permite múltiplos;
- clique na letra seleciona a fileira;
- ferramentas aplicam uma classificação aos assentos selecionados;
- zoom;
- arraste;
- redefinição de zoom;
- legenda sempre acessível;
- contagem de assentos selecionados;
- feedback após aplicar alterações.

### 8.6. Regras de segurança do mapa

- não sobrescrever uma reserva confirmada sem aviso;
- se um assento ocupado for bloqueado, exigir uma resolução;
- registrar quem alterou o mapa;
- registrar data e hora da alteração;
- alterações em evento publicado devem refletir na disponibilidade pública;
- salvar de forma transacional para evitar layout parcialmente atualizado;
- conflitos entre dois administradores devem gerar aviso;
- nenhuma mudança deve desaparecer silenciosamente.

### 8.7. Numeração

- IDs dos assentos devem ser únicos no evento;
- nome visual e identificador interno devem ser separados;
- renumerar assentos não deve quebrar reservas existentes;
- se necessário, manter um identificador imutável e apenas mudar o rótulo.

Exemplo:

```ts
type Seat = {
  id: string; // imutável
  label: string; // exemplo: "C10"
  rowId: string;
  sectorId: string;
  number: number;
  status: "available" | "occupied" | "preferred" | "team" | "blocked";
  accessibilityType?: "wheelchair" | "companion" | "reduced_mobility";
};
```

---

## 9. Lista de reservas

### 9.1. Tabela

Colunas mínimas:

- nome;
- R.A.;
- tipo de usuário;
- e-mail ou telefone, conforme permissão;
- assento;
- setor;
- status;
- data da reserva;
- ações.

### 9.2. Tipos de usuário

- aluno;
- responsável.

### 9.3. Status da reserva

1. **Pendente**
2. **Confirmada**
3. **Cancelada**
4. **Expirada**
5. **Utilizada / Check-in realizado**

### 9.4. Busca e filtros

- busca por nome;
- busca por R.A.;
- busca por e-mail;
- busca por código;
- busca por assento;
- filtro por status;
- filtro por tipo;
- filtro por setor;
- filtro por evento;
- limpar filtros.

### 9.5. Ações

- abrir detalhes;
- reenviar confirmação;
- cancelar reserva;
- trocar assento, se autorizado;
- realizar check-in;
- desfazer check-in com permissão;
- exportar CSV.

### 9.6. Exportação CSV

Deve:

- exportar o evento selecionado;
- respeitar os filtros aplicados ou deixar isso explícito;
- usar codificação UTF-8;
- manter cabeçalhos em português;
- registrar a exportação para auditoria;
- ser restrita a usuários autorizados;
- evitar colunas desnecessárias com dados pessoais.

### 9.7. Privacidade

- dados pessoais não devem aparecer para perfis sem permissão;
- telefone e e-mail podem ser parcialmente mascarados;
- acessos e exportações devem ser auditáveis;
- não exibir dados de um evento dentro de outro;
- aplicar o princípio de menor privilégio.

---

## 10. Detalhe da reserva

Mesmo que seja aberto em modal ou página lateral, deve apresentar:

- código da reserva;
- evento;
- data e horário;
- participante;
- tipo de usuário;
- R.A.;
- contato;
- assentos;
- status;
- data da criação;
- histórico de alterações;
- quem realizou cada ação;
- opção de reenvio;
- opção de cancelamento;
- opção de check-in.

Ações irreversíveis precisam de confirmação e justificativa quando apropriado.

---

## 11. Estados obrigatórios da interface

Cada página ou componente que carrega dados deve prever:

### 11.1. Carregando

- skeleton ou indicador discreto;
- preservar o layout para evitar saltos;
- desabilitar ações duplicadas;
- usar texto quando a operação puder demorar.

### 11.2. Vazio

Exemplos:

- “Nenhum evento cadastrado.”
- “Ainda não há reservas para este evento.”
- “Nenhum resultado encontrado com estes filtros.”
- “Selecione um evento para acompanhar a ocupação.”

Todo estado vazio deve possuir uma próxima ação útil.

### 11.3. Erro

Exemplos:

- falha ao carregar;
- falha ao salvar;
- conflito de edição;
- sessão expirada;
- assento alterado por outro administrador;
- indisponibilidade de exportação.

O erro deve:

- explicar o que ocorreu em linguagem simples;
- informar se algo foi salvo;
- oferecer “Tentar novamente” quando aplicável;
- nunca apagar silenciosamente dados preenchidos.

### 11.4. Sucesso

- confirmação visual após salvar, publicar, duplicar, exportar ou cancelar;
- mensagens curtas;
- feedback próximo da ação ou toast acessível;
- evitar mostrar sucesso antes da conclusão real da operação.

### 11.5. Permissão insuficiente

- explicar que o acesso é restrito;
- não renderizar dados protegidos antes da validação;
- fornecer caminho de retorno seguro.

---

## 12. Regras de negócio essenciais

### Eventos

- somente eventos publicados aparecem para o público;
- eventos encerrados, cancelados ou fora do período não recebem novas reservas;
- evento esgotado não permite confirmação;
- duplicar evento não duplica reservas;
- duplicar pode copiar informações e layout.

### Assentos

- um assento não pode ter duas reservas ativas;
- seleção temporária deve expirar;
- a confirmação precisa revalidar a disponibilidade;
- assentos bloqueados ou de equipe não entram na seleção pública;
- assentos preferenciais devem seguir a regra definida pelo colégio;
- alterações do mapa devem manter integridade com reservas existentes.

### Reservas

- respeitar o limite por pessoa;
- cancelar devolve o assento à disponibilidade, salvo regra contrária;
- reservas expiradas não contam como ocupação;
- check-in não deve alterar o assento;
- códigos precisam ser únicos.

### Atualização de dados

- indicadores devem vir da mesma fonte de verdade;
- a dashboard não deve usar números escritos manualmente;
- mudanças em reservas devem atualizar os indicadores;
- considerar atualização em tempo real ou botão de recarregar;
- informar o horário da última atualização.

---

## 13. Segurança e LGPD

### Autenticação

- todas as rotas administrativas devem ser protegidas;
- sessão expirada deve redirecionar para login;
- não confiar apenas em ocultação visual;
- permissões devem ser validadas no servidor.

### Dados pessoais

- coletar e exibir apenas o necessário;
- mascarar dados quando possível;
- restringir exportações;
- registrar ações administrativas sensíveis;
- não inserir dados pessoais em URLs;
- não expor informações em logs do navegador.

### Auditoria recomendada

Registrar:

- login e logout;
- criação e publicação de evento;
- alterações no mapa;
- cancelamentos;
- troca de assento;
- exportação de CSV;
- alterações de permissão.

Cada registro deve conter:

- usuário;
- ação;
- entidade;
- data e hora;
- resumo da alteração.

---

## 14. Acessibilidade

- contraste compatível com WCAG AA;
- foco visível;
- navegação completa por teclado;
- formulários com `label`;
- erros associados ao campo;
- ícones com descrição;
- status não dependentes apenas de cor;
- tabelas com cabeçalhos semânticos;
- modais com foco preso e retorno de foco;
- mapa com nome e status de cada assento;
- regiões de feedback com `aria-live`;
- áreas clicáveis com tamanho adequado;
- respeito a preferências de movimento reduzido.

No mapa, um leitor de tela deve conseguir identificar algo como:

> “Assento C10, preferencial, disponível, selecionável.”

---

## 15. Responsividade

### Desktop

- sidebar fixa;
- indicadores em quatro colunas;
- gráficos lado a lado quando houver espaço;
- editor com ferramentas à esquerda e mapa à direita;
- tabelas completas.

### Tablet

- sidebar compacta;
- indicadores em duas colunas;
- editor ainda utilizável com mapa rolável;
- gráficos empilhados quando necessário.

### Mobile

- menu administrativo em drawer;
- cards empilhados;
- tabelas com rolagem horizontal ou visualização em cartões;
- ações principais preservadas;
- editor simplificado, sem remover funções essenciais;
- mapa com zoom e arraste;
- nenhuma ação pode ficar inacessível fora da tela.

---

## 16. Componentes reutilizáveis recomendados

- `AdminShell`
- `AdminSidebar`
- `AdminTopbar`
- `PageHeader`
- `EventSelector`
- `StatCard`
- `ProgressBar`
- `SectorOccupancyChart`
- `OccupancyMiniMap`
- `StoryGenerator`
- `DataTable`
- `SearchInput`
- `FilterBar`
- `StatusBadge`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `ConfirmDialog`
- `Toast`
- `EventForm`
- `SeatMap`
- `Seat`
- `SeatLegend`
- `SeatEditorToolbar`
- `ReservationDetails`
- `PermissionGate`

Componentes visuais não devem conter regras de negócio críticas que deveriam estar em serviços, hooks ou no backend.

---

## 17. Estrutura de dados sugerida

```ts
type EventStatus = "draft" | "published" | "closed" | "cancelled";

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  doorsOpenAt?: string;
  venue: string;
  imageUrl?: string;
  status: EventStatus;
  seatLimitPerUser: number;
  reservationStartsAt?: string;
  reservationEndsAt?: string;
  layoutId: string;
  createdAt: string;
  updatedAt: string;
};

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "expired"
  | "checked_in";

type Reservation = {
  id: string;
  code: string;
  eventId: string;
  userId: string;
  seatIds: string[];
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  checkedInAt?: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "administrator" | "operator" | "production";
};
```

---

## 18. Comportamentos que não podem ser apenas simulados

Em uma implementação final com backend, os seguintes elementos precisam estar conectados a dados reais:

- seletor de evento;
- indicadores;
- gráficos;
- ocupação por setor;
- mapa;
- status dos assentos;
- publicação;
- limite de assentos;
- salvamento do layout;
- busca de reservas;
- filtros;
- cancelamentos;
- exportação CSV;
- geração da arte;
- permissões;
- auditoria.

Não é aceitável:

- botão de salvar sem persistência;
- filtro que não altera os resultados;
- card com número fixo;
- exportação com dados fictícios;
- alteração visual de assento sem atualizar a disponibilidade;
- mostrar sucesso antes de concluir a operação;
- permitir acesso administrativo apenas escondendo links no frontend.

---

## 19. Critérios de aceite por fluxo

### Dashboard → Editor do mapa

1. Usuário entra na dashboard.
2. Seleciona um evento.
3. Todos os indicadores são atualizados.
4. Clica em “Abrir editor”.
5. O editor abre com o mesmo evento.
6. Seleciona assentos ou fileiras.
7. Define uma classificação.
8. Salva.
9. Recebe confirmação.
10. A dashboard reflete a nova capacidade e os bloqueios.

### Eventos → Criar evento

1. Usuário abre “Eventos”.
2. Clica em “Criar evento”.
3. Preenche os campos.
4. Define limite de assentos.
5. Envia uma imagem.
6. Escolhe ou configura um layout.
7. Salva como rascunho.
8. Valida e publica.
9. O evento aparece na área pública.

### Reservas → Exportar

1. Usuário seleciona um evento.
2. Aplica filtros.
3. A tabela atualiza.
4. Clica em “Exportar CSV”.
5. O sistema confirma o escopo da exportação.
6. O arquivo é gerado.
7. A ação é registrada na auditoria.

---

## 20. Checklist final para implementação

### Visual

- [ ] Identidade do CSCSP aplicada.
- [ ] Sidebar e topbar consistentes.
- [ ] Hierarquia tipográfica clara.
- [ ] Cards com alinhamento e espaçamento consistentes.
- [ ] Tabelas legíveis.
- [ ] Status com cor, texto e/ou ícone.
- [ ] Mapa com palco, plateia, corredor e balcão.
- [ ] Prévia de Story em 9:16.
- [ ] Responsividade validada.
- [ ] Foco e contraste acessíveis.

### Lógica

- [ ] Área protegida por autenticação.
- [ ] Permissões validadas.
- [ ] Evento selecionado controla toda a dashboard.
- [ ] Indicadores calculados com dados reais.
- [ ] Estados de carregamento, vazio, erro e sucesso.
- [ ] CRUD de eventos funcional.
- [ ] Publicação e encerramento funcionais.
- [ ] Editor persiste alterações.
- [ ] Conflitos de assentos tratados.
- [ ] Busca e filtros funcionais.
- [ ] Exportação CSV funcional e auditada.
- [ ] Arte para Stories usa disponibilidade real.
- [ ] Cancelamentos atualizam a ocupação.
- [ ] Nenhum controle exposto está desconectado.
- [ ] Dados pessoais seguem as regras de LGPD.

---

## 21. Referência da implementação atual

Na aplicação atual, a Área de Gestão está concentrada em `src/App.tsx`, com estilos em `src/index.css`.

As telas disponíveis são:

- `dashboard`;
- `admin-events`;
- `admin-event-form`;
- `editor`;
- `admin-reservations`.

O protótipo atual demonstra visualmente os fluxos e interações principais. Dados e ações ainda podem estar simulados no frontend. Ao evoluir para produção, seguir obrigatoriamente as regras de persistência, autorização, concorrência, privacidade e auditoria descritas neste documento.
