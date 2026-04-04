/* =============================================
   INOV INTRANET — MOCK DATA
   All simulated content for the platform
   v2.1 — 2026-04-04
   ============================================= */

// Versão dos utilizadores seed — incrementar para forçar re-seed
const USERS_VERSION = 'v2';

// =============================================
// USERS
// =============================================
const INOV_USERS = [
  { id:1, name:'Marco Sanches',   email:'marco.sanches@factoryideas.ao',  password:'Inov@2026!', role:'admin', company:'Factory Ideas',   dept:'Direcção',              job:'Director Executivo',                      avatar:'MS', joined:'2024-01-15' },
  { id:2, name:'Arnaldo Miapia',  email:'arnaldo.miapia@inov.ao',          password:'Inov@2026!', role:'admin', company:'INOV Holding',    dept:'Presidência',           job:'Presidente do Conselho de Administração', avatar:'AM', joined:'2024-01-15' },
  { id:3, name:'Helder Maiato',   email:'helder.maiato@hexa.ao',           password:'Inov@2026!', role:'admin', company:'Hexa Seguros',    dept:'Direcção',              job:'Director Executivo',                      avatar:'HM', joined:'2024-03-01' },
  { id:4, name:'Nilson Filipe',   email:'nilson.filipe@factoryideas.ao',   password:'Inov@2026!', role:'admin', company:'Factory Ideas',   dept:'Direcção Operacional',  job:'Director Operacional',                    avatar:'NF', joined:'2024-03-01' },
  { id:5, name:'Joel Pascoal',    email:'joel.pascoal@andala.ao',          password:'Inov@2026!', role:'admin', company:'Anda-lá',         dept:'Direcção',              job:'Director Executivo',                      avatar:'JP', joined:'2024-04-01' },
  { id:6, name:'Hansa Sardinha',  email:'hansa.sardinha@adventure.ao',     password:'Inov@2026!', role:'admin', company:'Adventure Media', dept:'Direcção',              job:'Directora Executiva',                     avatar:'HS', joined:'2024-04-01' },
];

// =============================================
// COMPANIES
// =============================================
var COMPANIES = [
  {
    id: 'inov',
    name: 'INOV Holding',
    shortName: 'INOV',
    tagline: 'Ecossistema empresarial integrado para Angola e além',
    description: 'A INOV Holding é o centro estratégico de um ecossistema empresarial diversificado, construído com a visão de criar valor sustentável e transformar sectores-chave da economia angolana. Fundada com propósito de longo prazo, a INOV agrega empresas complementares que partilham cultura, valores e missão.',
    sector: 'Holding / Investimento',
    founded: '2023',
    location: 'Luanda, Angola',
    employees: '50+',
    color: '#0C1A35',
    accentColor: '#C9A24C',
    coverGradient: 'linear-gradient(135deg, #0C1A35 0%, #1E3A6E 100%)',
    services: ['Gestão de Participadas','Estratégia Corporativa','Investimento','Governança','ESG e Sustentabilidade'],
    values: ['Inovação','Integridade','Excelência','Impacto','Parceria'],
    contacts: { email:'geral@inov.ao', tel:'+244 923 000 000', web:'https://www.inov.ao' },
    docs: [1,2,3],
    news: [1,2,3,4],
  },
  {
    id: 'factory',
    name: 'Factory Ideas',
    shortName: 'FI',
    tagline: 'Comunicação visual B2B de excelência em Angola',
    description: 'A Factory Ideas é a empresa de comunicação visual do grupo, especializada em soluções B2B completas — desde stands para feiras até impressão de grande formato, brindes corporativos, têxteis personalizados e eventos. Com parque gráfico próprio de 300m², serve as principais empresas de Angola.',
    sector: 'Comunicação Visual & Marketing',
    founded: '2024',
    location: 'Alvalade, Luanda',
    employees: '12',
    color: '#0A0A0A',
    accentColor: '#F5C800',
    coverGradient: 'linear-gradient(135deg, #0A0A0A 0%, #2A2A2A 100%)',
    services: ['Stands para Feiras','Impressão Grande Formato','Brindes Corporativos','Têxteis Personalizados','Eventos Corporativos','Serviços Audiovisuais','EPI Personalizado'],
    values: ['Agilidade','Qualidade','Criatividade','Compromisso'],
    contacts: { email:'geral@factoryideas.ao', tel:'+244 922 698 044', web:'https://www.factoryideas.ao' },
    docs: [4,5],
    news: [3,5,6],
  },
  {
    id: 'adventure',
    name: 'Adventure Media',
    shortName: 'AM',
    tagline: 'Agência criativa de comunicação e conteúdo',
    description: 'A Adventure Media é a agência criativa do grupo, especializada em estratégia de comunicação, criação de conteúdo digital, branding, design e gestão de presença nas redes sociais para marcas com ambição.',
    sector: 'Agência de Comunicação Digital',
    founded: '2023',
    location: 'Luanda, Angola',
    employees: '8',
    color: '#1A1A2E',
    accentColor: '#E94560',
    coverGradient: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    services: ['Branding & Identidade','Social Media Management','Criação de Conteúdo','Estratégia Digital','Design Gráfico','Fotografia & Vídeo'],
    values: ['Criatividade','Autenticidade','Impacto','Colaboração'],
    contacts: { email:'geral@adventuremedia.ao', tel:'+244 923 111 111', web:'https://www.adventure.ao' },
    docs: [5],
    news: [7,8],
  },
  {
    id: 'andala',
    name: 'Anda-lá',
    shortName: 'AL',
    tagline: 'Plataforma de mobilidade e logística urbana',
    description: 'A Anda-lá é a empresa de mobilidade do grupo, com foco em soluções de transporte, logística urbana e serviços de entrega para empresas e particulares em Angola. Uma plataforma tech-driven que responde à crescente necessidade de mobilidade eficiente.',
    sector: 'Mobilidade & Logística',
    founded: '2024',
    location: 'Luanda, Angola',
    employees: '20+',
    color: '#064E3B',
    accentColor: '#34D399',
    coverGradient: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
    services: ['Transporte Executivo','Logística Urbana','Entrega de Encomendas','Transfer Aeroporto','Serviços de Frota'],
    values: ['Pontualidade','Segurança','Eficiência','Inovação'],
    contacts: { email:'geral@andala.ao', tel:'+244 924 222 222', web:'https://www.andala.ao' },
    docs: [6],
    news: [9],
  },
  {
    id: 'meteoro',
    name: 'Meteoro24',
    shortName: 'M24',
    tagline: 'Jornalismo digital de referência em Angola',
    description: 'O Meteoro24 é o portal de notícias do grupo, com cobertura jornalística abrangente de economia, política, negócios, desporto e cultura em Angola. Um meio digital moderno, rigoroso e independente com crescente audiência nacional.',
    sector: 'Media & Jornalismo Digital',
    founded: '2023',
    location: 'Luanda, Angola',
    employees: '15',
    color: '#7C2D12',
    accentColor: '#FB923C',
    coverGradient: 'linear-gradient(135deg, #7C2D12 0%, #9A3412 100%)',
    services: ['Portal de Notícias','Jornalismo Investigativo','Cobertura de Eventos','Publicidade Digital','Newsletter','Podcasts'],
    values: ['Rigor','Independência','Rapidez','Credibilidade'],
    contacts: { email:'redaccao@meteoro24.ao', tel:'+244 925 333 333', web:'https://www.meteoro24.ao' },
    docs: [7],
    news: [10,11],
  },
  {
    id: 'ziv',
    name: 'Ziv Petroleum',
    shortName: 'ZP',
    tagline: 'Serviços de engenharia e suporte ao sector petrolífero',
    description: 'A Ziv Petroleum actua no sector de energia e petróleo em Angola, prestando serviços especializados de engenharia, manutenção industrial, suporte logístico e consultoria técnica a operadores do sector.',
    sector: 'Energia & Petróleo',
    founded: '2023',
    location: 'Luanda, Angola',
    employees: '25',
    color: '#1C1917',
    accentColor: '#EAB308',
    coverGradient: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
    services: ['Engenharia Industrial','Manutenção de Equipamentos','Suporte Logístico','Consultoria Técnica','HSE','Fornecimento de Materiais'],
    values: ['Segurança','Excelência Técnica','Fiabilidade','Responsabilidade'],
    contacts: { email:'geral@zivpetroleum.ao', tel:'+244 926 444 444', web:'https://www.zivpetroleum.ao' },
    docs: [8,9],
    news: [12],
  },
  {
    id: 'hexa',
    name: 'Hexa Seguros',
    shortName: 'HS',
    tagline: 'Soluções de seguros e protecção financeira',
    description: 'A Hexa Seguros é a empresa de seguros e protecção financeira do grupo, oferecendo soluções personalizadas para empresas e particulares em Angola — desde seguros empresariais, de saúde, automóvel, vida e responsabilidade civil.',
    sector: 'Seguros & Protecção Financeira',
    founded: '2024',
    location: 'Luanda, Angola',
    employees: '18',
    color: '#1E3A5F',
    accentColor: '#60A5FA',
    coverGradient: 'linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 100%)',
    services: ['Seguros Empresariais','Seguros de Saúde','Seguros Automóvel','Seguros de Vida','Responsabilidade Civil','Gestão de Sinistros'],
    values: ['Confiança','Transparência','Protecção','Rapidez'],
    contacts: { email:'geral@hexaseguros.ao', tel:'+244 927 555 555', web:'https://www.hexa.ao' },
    docs: [10],
    news: [13],
  },
];

// =============================================
// NEWS
// =============================================
var NEWS = [
  {
    id:1, companyId:'inov', category:'Estratégia',
    title:'INOV Holding anuncia expansão do ecossistema com dois novos projectos para 2026',
    summary:'O grupo INOV Holding revelou a sua estratégia de crescimento para 2026, incluindo dois novos projectos empresariais que vão reforçar a presença do grupo em sectores estratégicos da economia angolana.',
    body:`<p>A INOV Holding deu um passo estratégico relevante ao anunciar oficialmente a expansão do seu ecossistema empresarial com dois novos projectos previstos para arrancar no segundo semestre de 2026.</p><p>De acordo com a administração do grupo, os novos projectos irão actuar nas áreas de tecnologia de informação e serviços financeiros — dois sectores com elevado potencial de crescimento em Angola.</p><p>"Estamos a construir um ecossistema que se complementa, que partilha recursos e que cria valor de forma integrada", afirmou o CEO do grupo, Marco Sanches. "Cada empresa participada é uma peça de um puzzle maior."</p><p>A expansão faz parte do plano estratégico 2025-2028 do grupo, que prevê um crescimento de 40% na facturação consolidada.</p>`,
    image:'news-inov-expansion.jpg',
    author:'Equipa de Comunicação INOV',
    date:'2026-03-15', readTime:'4 min', featured:true,
  },
  {
    id:2, companyId:'inov', category:'Recursos Humanos',
    title:'INOV lança programa de desenvolvimento interno "Futuros Líderes" para colaboradores do grupo',
    summary:'O grupo INOV anuncia o lançamento de um programa de formação e desenvolvimento de liderança destinado a colaboradores de todas as empresas participadas.',
    body:`<p>A INOV Holding lançou o programa "Futuros Líderes", uma iniciativa de desenvolvimento interno que visa identificar e preparar os colaboradores com maior potencial de liderança em todo o ecossistema do grupo.</p><p>O programa tem duração de 12 meses e inclui formação presencial, mentoring com membros da administração, rotação por diferentes empresas do grupo e um projecto final de impacto real.</p><p>As candidaturas estão abertas a todos os colaboradores do grupo com mais de 6 meses de antiguidade.</p>`,
    image:'news-lideranca.jpg',
    author:'Departamento de RH — INOV',
    date:'2026-03-10', readTime:'3 min', featured:true,
  },
  {
    id:3, companyId:'factory', category:'Projecto',
    title:'Factory Ideas conclui stand de destaque para a Sika na FILDA 2026',
    summary:'A Factory Ideas entregou um stand imponente de 80m² para a Sika na Feira Internacional de Luanda 2026, consolidando a parceria com um dos maiores clientes do grupo.',
    body:`<p>A equipa da Factory Ideas concluiu com sucesso a produção e montagem do stand da Sika na FILDA 2026, um dos projectos mais ambiciosos da empresa desde a sua fundação.</p><p>Com uma área de 80m² e um design tridimensional de impacto, o stand foi produzido integralmente no parque gráfico da Factory Ideas em Alvalade, incluindo todos os elementos de impressão, estrutura e acabamentos.</p><p>O projecto envolveu 8 profissionais durante 3 semanas de produção e 4 dias de montagem em recinto de feira.</p>`,
    image:'news-filda.jpg',
    author:'Factory Ideas',
    date:'2026-03-05', readTime:'3 min', featured:false,
  },
  {
    id:4, companyId:'inov', category:'Cultura',
    title:'Grupo INOV celebra 2 anos com jantar de gala e reconhecimento de colaboradores',
    summary:'A INOV Holding celebrou o segundo aniversário do grupo com uma cerimónia de gala que reuniu todos os colaboradores e parceiros estratégicos.',
    body:`<p>O grupo INOV celebrou o segundo aniversário do ecossistema com um jantar de gala que reuniu mais de 80 pessoas, entre colaboradores, parceiros e convidados especiais.</p><p>A noite incluiu a cerimónia de reconhecimento "Stars of INOV", onde foram distinguidos colaboradores com desempenho exemplar em cada empresa do grupo.</p>`,
    image:'news-aniversario.jpg',
    author:'Comunicação INOV',
    date:'2026-02-28', readTime:'2 min', featured:false,
  },
  {
    id:5, companyId:'factory', category:'Cliente',
    title:'Factory Ideas integra lista de fornecedores preferenciais da Sonangol E&P',
    summary:'A empresa foi reconhecida como fornecedor preferencial da Sonangol E&P na área de comunicação visual e equipamento corporativo personalizado.',
    body:`<p>Num importante reconhecimento institucional, a Factory Ideas foi integrada na lista de fornecedores preferencias da Sonangol E&P, a maior empresa do sector petrolífero em Angola.</p><p>A parceria abrange fornecimento de brindes corporativos, material de escritório personalizado, têxteis e impressão de grande formato para as instalações da empresa.</p>`,
    image:'news-sonangol.jpg',
    author:'Factory Ideas',
    date:'2026-02-20', readTime:'2 min', featured:false,
  },
  {
    id:6, companyId:'factory', category:'Evento',
    title:'Factory Ideas presente na Angola Manufacturing Summit com exposição de capacidades',
    summary:'A empresa marcou presença no summit de manufactura nacional com uma área de exposição demonstrando as suas capacidades produtivas e portfólio.',
    body:`<p>A Factory Ideas marcou presença no Angola Manufacturing Summit 2026, o maior encontro de empresas do sector industrial em Angola, com uma área de exposição de 30m².</p><p>O stand demonstrou as capacidades produtivas da empresa, desde impressão de grande formato até personalização de têxteis e EPI, atraindo interesse de novos potenciais clientes B2B.</p>`,
    image:'news-summit.jpg',
    author:'Factory Ideas',
    date:'2026-02-10', readTime:'2 min', featured:false,
  },
  {
    id:7, companyId:'adventure', category:'Projecto',
    title:'Adventure Media lança serviço de rebranding completo para PMEs angolanas',
    summary:'A agência criativa do grupo INOV lança um pacote completo de rebranding especialmente desenhado para pequenas e médias empresas em Angola.',
    body:`<p>A Adventure Media anunciou o lançamento do "Brand Restart", um pacote de rebranding completo especialmente desenvolvido para PMEs que pretendem renovar a sua imagem corporativa.</p><p>O serviço inclui estratégia de marca, design de identidade visual, sistema de identidade, templates digitais e formação da equipa interna do cliente.</p>`,
    image:'news-adventure.jpg',
    author:'Adventure Media',
    date:'2026-01-25', readTime:'3 min', featured:false,
  },
  {
    id:8, companyId:'adventure', category:'Parceria',
    title:'Adventure Media fecha parceria estratégica com agência de publicidade internacional',
    summary:'A agência criativa do grupo INOV estabelece parceria com uma das maiores redes de publicidade do continente africano.',
    body:`<p>A Adventure Media fechou uma parceria estratégica com uma das maiores redes de comunicação do continente africano, abrindo portas para projectos de maior escala e acesso a mercados regionais.</p><p>A parceria prevê colaboração em campanhas de âmbito regional, partilha de recursos criativos e co-desenvolvimento de propostas para grandes contas multinacionais.</p>`,
    image:'news-parceria.jpg',
    author:'Adventure Media',
    date:'2026-01-15', readTime:'2 min', featured:false,
  },
  {
    id:9, companyId:'andala', category:'Lançamento',
    title:'Anda-lá expande serviço para 3 novos municípios de Luanda',
    summary:'A plataforma de mobilidade do grupo INOV anuncia expansão do serviço de transporte e entrega para os municípios de Cacuaco, Viana e Cazenga.',
    body:`<p>A Anda-lá anunciou a expansão do seu serviço de mobilidade e logística para três novos municípios da província de Luanda: Cacuaco, Viana e Cazenga.</p><p>Com esta expansão, a plataforma passa a cobrir 6 municípios de Luanda e estima crescer a sua base de clientes em 60% no próximo trimestre.</p>`,
    image:'news-andala.jpg',
    author:'Anda-lá',
    date:'2026-01-10', readTime:'2 min', featured:false,
  },
  {
    id:10, companyId:'meteoro', category:'Milestone',
    title:'Meteoro24 atinge marca histórica de 500.000 leitores mensais',
    summary:'O portal de notícias do grupo INOV celebra o marco de meio milhão de leitores únicos mensais, tornando-se um dos mais lidos de Angola.',
    body:`<p>O Meteoro24 atingiu em Janeiro de 2026 a marca histórica de 500.000 leitores únicos mensais, consolidando a sua posição entre os portais de notícias mais consultados em Angola.</p><p>O crescimento de 80% face ao mesmo período do ano anterior é atribuído à qualidade editorial, rapidez na publicação de notícias e forte presença nas redes sociais.</p>`,
    image:'news-meteoro.jpg',
    author:'Redacção Meteoro24',
    date:'2026-01-05', readTime:'3 min', featured:false,
  },
  {
    id:11, companyId:'meteoro', category:'Produto',
    title:'Meteoro24 lança aplicação móvel para iOS e Android',
    summary:'O portal estreia a sua aplicação oficial, disponível gratuitamente nas principais lojas de aplicações, com notificações em tempo real.',
    body:`<p>O Meteoro24 lançou a sua aplicação oficial para iOS e Android, tornando-se o primeiro portal de notícias angolano com app nativa de alta qualidade.</p><p>A aplicação inclui notificações push, modo offline, leitura personalizada e tema escuro.</p>`,
    image:'news-app.jpg',
    author:'Meteoro24',
    date:'2025-12-20', readTime:'2 min', featured:false,
  },
  {
    id:12, companyId:'ziv', category:'Contrato',
    title:'Ziv Petroleum assina contrato de manutenção com operador petrolífero internacional',
    summary:'A empresa de engenharia e suporte ao sector petrolífero fecha um contrato de prestação de serviços com duração de 3 anos.',
    body:`<p>A Ziv Petroleum assinou um contrato plurianual de prestação de serviços de manutenção industrial com um operador petrolífero internacional activo no offshore angolano.</p><p>O contrato, com vigência de 3 anos, abrange serviços de manutenção preventiva e correctiva de equipamentos, suporte técnico e fornecimento de materiais especializados.</p>`,
    image:'news-ziv.jpg',
    author:'Ziv Petroleum',
    date:'2025-12-15', readTime:'2 min', featured:false,
  },
  {
    id:13, companyId:'hexa', category:'Produto',
    title:'Hexa Seguros lança seguro de saúde corporativo com cobertura hospitalar ampliada',
    summary:'A empresa apresenta uma nova solução de seguro de saúde para empresas, com rede alargada de prestadores e cobertura diferenciada.',
    body:`<p>A Hexa Seguros lançou o "Hexa Saúde Empresarial Premium", um seguro de saúde corporativo com a maior rede de cobertura hospitalar do mercado angolano.</p><p>O produto inclui consultas, internamentos, meios complementares de diagnóstico, medicina dentária e assistência no exterior, com planos adaptáveis ao número de colaboradores e budget de cada empresa.</p>`,
    image:'news-hexa.jpg',
    author:'Hexa Seguros',
    date:'2025-12-10', readTime:'3 min', featured:false,
  },
];

// =============================================
// COMUNICADOS
// =============================================
var COMUNICADOS = [
  {
    id:1, priority:'high', companyId:'inov',
    title:'Implementação da nova política de segurança informática — acção obrigatória',
    body:`<p>Informamos que a partir do dia 1 de Abril de 2026, entra em vigor a nova Política de Segurança Informática do Grupo INOV.</p><p><strong>Acção obrigatória:</strong> Todos os colaboradores devem proceder à actualização das suas passwords de acesso aos sistemas internos até ao dia 31 de Março de 2026.</p><p>A password deve ter no mínimo 12 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.</p><p>Em caso de dúvidas, contactar a equipa de TI através do email: ti@inov.ao</p>`,
    author:'Departamento de TI — INOV Holding',
    date:'2026-03-20', read:false,
  },
  {
    id:2, priority:'medium', companyId:'inov',
    title:'Horários de trabalho durante a Semana Santa 2026',
    body:`<p>Informamos os colaboradores de todas as empresas do grupo sobre os horários de trabalho durante a Semana Santa 2026.</p><p><strong>Quinta-feira Santa (2 Abril):</strong> Encerramento às 13h00<br/><strong>Sexta-feira Santa (3 Abril):</strong> Feriado — encerrado<br/><strong>Sábado (4 Abril):</strong> Encerrado<br/><strong>Segunda de Páscoa (6 Abril):</strong> Encerrado</p><p>Os serviços de urgência serão assegurados pelas equipas de permanência de cada empresa.</p>`,
    author:'Administração — INOV Holding',
    date:'2026-03-18', read:false,
  },
  {
    id:3, priority:'low', companyId:'factory',
    title:'Aviso de manutenção do parque gráfico — suspensão parcial de serviços',
    body:`<p>Informamos os clientes internos e colaboradores que o parque gráfico da Factory Ideas estará em manutenção programada nos dias 28 e 29 de Março de 2026.</p><p>Durante este período, os serviços de impressão de grande formato e corte de vinil estarão temporariamente suspensos.</p><p>Os pedidos urgentes devem ser comunicados até ao dia 27 para que possamos programar a produção antecipadamente.</p>`,
    author:'Factory Ideas — Departamento de Produção',
    date:'2026-03-15', read:true,
  },
  {
    id:4, priority:'high', companyId:'inov',
    title:'Reunião geral do grupo — Resultados Q1 2026 e planeamento Q2',
    body:`<p>Convocamos todos os directores e gestores de topo do grupo para a Reunião Geral de Resultados do 1.º Trimestre de 2026.</p><p><strong>Data:</strong> 5 de Abril de 2026<br/><strong>Hora:</strong> 09h00<br/><strong>Local:</strong> Sede da INOV Holding — Sala de Reuniões Principal</p><p>A presença é obrigatória. Para colaboradores de outras empresas, a participação será por videoconferência.</p>`,
    author:'Gabinete da Presidência — INOV',
    date:'2026-03-12', read:false,
  },
  {
    id:5, priority:'medium', companyId:'inov',
    title:'Lembrete: Submissão de relatórios de despesas — prazo final 31 Março',
    body:`<p>Lembramos todos os colaboradores que o prazo para submissão dos relatórios de despesas referentes ao mês de Março é dia 31 de Março de 2026.</p><p>Os relatórios devem ser submetidos através da plataforma interna de gestão, com todos os comprovativos anexados.</p><p>Relatórios submetidos após o prazo não poderão ser processados no ciclo de pagamentos de Abril.</p>`,
    author:'Departamento Financeiro — INOV Holding',
    date:'2026-03-10', read:true,
  },
  {
    id:6, priority:'low', companyId:'hexa',
    title:'Hexa Seguros — Renovação dos seguros de saúde do grupo para 2026/2027',
    body:`<p>Informamos que o processo de renovação dos seguros de saúde do grupo para o período 2026/2027 está em curso.</p><p>Todos os colaboradores devem confirmar os seus dados pessoais e os do agregado familiar através do formulário disponível na intranet até ao dia 15 de Abril.</p>`,
    author:'Hexa Seguros — Gestão de Apólices',
    date:'2026-03-08', read:true,
  },
];

// =============================================
// DOCUMENTS
// =============================================
var DOCUMENTS = [
  { id:1,  companyId:'inov',    category:'Governança',      title:'Manual de Governança Corporativa INOV 2026',                  file:'manual-governanca-2026.pdf',  type:'pdf', size:'2.4 MB', date:'2026-01-15', downloads:34, desc:'Políticas e princípios de governança do grupo' },
  { id:2,  companyId:'inov',    category:'RH',              title:'Regulamento Interno de Trabalho — Grupo INOV',                 file:'rit-grupo-inov.pdf',           type:'pdf', size:'1.8 MB', date:'2026-01-10', downloads:89, desc:'Regulamento aplicável a todas as empresas participadas' },
  { id:3,  companyId:'inov',    category:'Estratégia',      title:'Plano Estratégico INOV 2025–2028',                             file:'plano-estrategico.pdf',        type:'pdf', size:'5.1 MB', date:'2025-12-01', downloads:45, desc:'Visão, missão e objectivos estratégicos do grupo' },
  { id:4,  companyId:'factory', category:'Comercial',       title:'Portfólio de Serviços Factory Ideas 2026',                    file:'portfolio-fi-2026.pdf',        type:'pdf', size:'8.3 MB', date:'2026-02-01', downloads:22, desc:'Catálogo completo de serviços e preçário' },
  { id:5,  companyId:'factory', category:'Qualidade',       title:'Manual de Qualidade e Processos de Produção',                  file:'manual-qualidade-fi.pdf',      type:'pdf', size:'3.2 MB', date:'2026-01-20', downloads:15, desc:'Procedimentos internos de controlo de qualidade' },
  { id:6,  companyId:'andala',  category:'Operacional',     title:'Manual de Operações Anda-lá — Condutores e Parceiros',         file:'manual-ops-andala.pdf',        type:'pdf', size:'2.1 MB', date:'2026-01-25', downloads:38, desc:'Procedimentos para parceiros e condutores' },
  { id:7,  companyId:'meteoro', category:'Editorial',       title:'Guia de Estilo Editorial Meteoro24',                           file:'guia-editorial-m24.pdf',       type:'pdf', size:'1.5 MB', date:'2025-11-15', downloads:20, desc:'Normas de escrita, estilo e ética jornalística' },
  { id:8,  companyId:'ziv',     category:'HSE',             title:'Manual de Segurança e Saúde no Trabalho — Ziv Petroleum',     file:'manual-hse-ziv.pdf',           type:'pdf', size:'4.8 MB', date:'2025-12-10', downloads:12, desc:'Procedimentos de HSE para operações de campo' },
  { id:9,  companyId:'ziv',     category:'Técnico',         title:'Catálogo de Serviços Técnicos Ziv Petroleum',                  file:'catalogo-ziv.pdf',             type:'pdf', size:'6.2 MB', date:'2026-01-05', downloads:9,  desc:'Capacidades técnicas e equipamentos disponíveis' },
  { id:10, companyId:'hexa',    category:'Produto',         title:'Guia de Produtos e Coberturas Hexa Seguros 2026',              file:'produtos-hexa-2026.pdf',       type:'pdf', size:'3.7 MB', date:'2026-02-15', downloads:31, desc:'Descrição detalhada de todos os produtos de seguro' },
  { id:11, companyId:'inov',    category:'Formulários',     title:'Formulário de Requisição de Material Interno',                 file:'form-requisicao.docx',         type:'doc', size:'0.3 MB', date:'2026-02-20', downloads:67, desc:'Formulário para pedido de material de escritório' },
  { id:12, companyId:'inov',    category:'Formulários',     title:'Modelo de Relatório de Despesas',                              file:'form-despesas.xlsx',           type:'xls', size:'0.5 MB', date:'2026-02-18', downloads:55, desc:'Template mensal de reporte de despesas' },
  { id:13, companyId:'adventure',category:'Apresentações',  title:'Apresentação Institucional Adventure Media 2026',              file:'apresentacao-adventure.pptx',  type:'ppt', size:'12.4 MB',date:'2026-02-05', downloads:18, desc:'Deck de apresentação para novos clientes' },

  // ── Pasta Confidencial — acesso exclusivo à administração ──
  { id:14, companyId:'inov',    category:'Confidencial', title:'Relatório Financeiro Consolidado — Grupo INOV Q1 2026',        file:'financeiro-q1-2026.pdf',       type:'pdf', size:'4.2 MB', date:'2026-03-31', downloads:3,  desc:'Resultados financeiros consolidados do 1.º trimestre 2026', confidencial:true },
  { id:15, companyId:'inov',    category:'Confidencial', title:'Pactos Parassociais e Acordos de Accionistas',                 file:'pactos-parassociais.pdf',      type:'pdf', size:'2.8 MB', date:'2026-01-10', downloads:1,  desc:'Documentos legais de estrutura accionista do grupo', confidencial:true },
  { id:16, companyId:'inov',    category:'Confidencial', title:'Avaliação de Activos e Participações — 2025',                  file:'avaliacao-activos-2025.pdf',   type:'pdf', size:'6.1 MB', date:'2025-12-31', downloads:2,  desc:'Relatório de avaliação independente das participadas', confidencial:true },
  { id:17, companyId:'inov',    category:'Confidencial', title:'Pipeline de Novos Negócios e Due Diligence 2026',              file:'pipeline-negocios-2026.pdf',   type:'pdf', size:'3.5 MB', date:'2026-02-28', downloads:4,  desc:'Análise de oportunidades e processos de due diligence em curso', confidencial:true },
  { id:18, companyId:'inov',    category:'Confidencial', title:'Tabela Salarial e Estrutura de Remunerações — Direcção',       file:'salarios-direccao-2026.xlsx',  type:'xls', size:'0.9 MB', date:'2026-01-15', downloads:2,  desc:'Remunerações e benefícios da equipa de direcção executiva', confidencial:true },
  { id:19, companyId:'inov',    category:'Confidencial', title:'Memorando Estratégico — Expansão para Mercados SADC',         file:'memo-expansao-sadc.pdf',       type:'pdf', size:'2.3 MB', date:'2026-03-10', downloads:3,  desc:'Análise confidencial de oportunidades de expansão regional', confidencial:true },
  { id:20, companyId:'inov',    category:'Confidencial', title:'Contrato de Financiamento Bancário — Linha de Crédito 2026',   file:'contrato-financiamento.pdf',   type:'pdf', size:'1.7 MB', date:'2026-02-15', downloads:1,  desc:'Condições e termos do financiamento bancário vigente', confidencial:true },
];

// =============================================
// BRAND ASSETS
// =============================================
var BRAND_ASSETS = [
  { id:1,  companyId:'inov',    name:'INOV Holding — Logo Principal',       format:'SVG + PNG',  version:'v3.0', bg:'dark',  initials:'INOV', color:'#C9A24C',  colorBg:'#0C1A35',  date:'2026-01-01' },
  { id:2,  companyId:'inov',    name:'INOV Holding — Logo Branco',          format:'SVG + PNG',  version:'v3.0', bg:'dark',  initials:'INOV', color:'#FFFFFF',  colorBg:'#0C1A35',  date:'2026-01-01' },
  { id:3,  companyId:'inov',    name:'INOV Holding — Favicon / Ícone',      format:'SVG + ICO',  version:'v2.0', bg:'light', initials:'IN',   color:'#C9A24C',  colorBg:'#F5F7FB',  date:'2026-01-01' },
  { id:4,  companyId:'inov',    name:'Manual de Identidade Visual INOV',    format:'PDF',        version:'v2.1', bg:'light', initials:'MIV',  color:'#0C1A35',  colorBg:'#EEF2F8',  date:'2026-01-15' },
  { id:5,  companyId:'factory', name:'Factory Ideas — Logo Principal',      format:'SVG + PNG',  version:'v2.0', bg:'dark',  initials:'FI',   color:'#F5C800',  colorBg:'#0A0A0A',  date:'2026-01-01' },
  { id:6,  companyId:'factory', name:'Factory Ideas — Logo Branco',         format:'SVG + PNG',  version:'v2.0', bg:'dark',  initials:'FI',   color:'#FFFFFF',  colorBg:'#0A0A0A',  date:'2026-01-01' },
  { id:7,  companyId:'factory', name:'Factory Ideas — Logo Negro',          format:'SVG + PNG',  version:'v2.0', bg:'light', initials:'FI',   color:'#0A0A0A',  colorBg:'#F5F7FB',  date:'2026-01-01' },
  { id:8,  companyId:'adventure',name:'Adventure Media — Logo Principal',   format:'SVG + PNG',  version:'v1.5', bg:'dark',  initials:'AM',   color:'#E94560',  colorBg:'#1A1A2E',  date:'2025-12-01' },
  { id:9,  companyId:'andala',  name:'Anda-lá — Logo Principal',           format:'SVG + PNG',  version:'v1.2', bg:'dark',  initials:'AL',   color:'#34D399',  colorBg:'#064E3B',  date:'2025-11-01' },
  { id:10, companyId:'meteoro', name:'Meteoro24 — Logo Principal',          format:'SVG + PNG',  version:'v2.0', bg:'dark',  initials:'M24',  color:'#FB923C',  colorBg:'#7C2D12',  date:'2026-01-01' },
  { id:11, companyId:'ziv',     name:'Ziv Petroleum — Logo Principal',      format:'SVG + PNG',  version:'v1.0', bg:'dark',  initials:'ZP',   color:'#EAB308',  colorBg:'#1C1917',  date:'2025-10-01' },
  { id:12, companyId:'hexa',    name:'Hexa Seguros — Logo Principal',       format:'SVG + PNG',  version:'v1.3', bg:'dark',  initials:'HS',   color:'#60A5FA',  colorBg:'#1E3A5F',  date:'2025-11-15' },
];

// =============================================
// GALLERY
// =============================================
var GALLERY = [
  { id:1,  companyId:'inov',    project:'Jantar de Gala INOV 2025',          category:'Evento',       color:'#0C1A35' },
  { id:2,  companyId:'inov',    project:'Reunião Estratégica Q4 2025',       category:'Interno',      color:'#152744' },
  { id:3,  companyId:'factory', project:'Stand Sika — FILDA 2026',           category:'Stand',        color:'#1A1A1A' },
  { id:4,  companyId:'factory', project:'Stand Cognito — Angotic 2025',      category:'Stand',        color:'#111111' },
  { id:5,  companyId:'factory', project:'Lona Corporativa TIS Suntech',      category:'Impressão',    color:'#222222' },
  { id:6,  companyId:'factory', project:'Kit Brindes Toyota CFAO',           category:'Brindes',      color:'#2D2D2D' },
  { id:7,  companyId:'adventure',project:'Campanha Digital Keve 2025',       category:'Campanha',     color:'#1A1A2E' },
  { id:8,  companyId:'adventure',project:'Sessão Fotográfica BFA',           category:'Fotografia',   color:'#16213E' },
  { id:9,  companyId:'andala',  project:'Frota Anda-lá — Apresentação',      category:'Produto',      color:'#064E3B' },
  { id:10, companyId:'meteoro', project:'Newsroom Meteoro24',                category:'Interno',      color:'#7C2D12' },
  { id:11, companyId:'ziv',     project:'Operações de Campo — Cabinda',      category:'Operacional',  color:'#1C1917' },
  { id:12, companyId:'hexa',    project:'Lançamento Hexa Saúde Premium',     category:'Evento',       color:'#1E3A5F' },
];

// =============================================
// ACTIVITY FEED
// =============================================
const ACTIVITY = [
  { id:1, user:'Ana Ferreira',   action:'publicou a notícia',   target:'"Stand Sika na FILDA 2026"',  time:'há 2 horas',  icon:'📰', company:'Factory Ideas' },
  { id:2, user:'Marco Sanches',  action:'adicionou o comunicado',target:'"Reunião Geral Q1 2026"',    time:'há 4 horas',  icon:'📢', company:'INOV Holding' },
  { id:3, user:'Pedro Neto',     action:'carregou o documento',  target:'"Portfólio Adventure 2026"', time:'há 6 horas',  icon:'📄', company:'Adventure Media' },
  { id:4, user:'Diana Costa',    action:'actualizou a página de',target:'Hexa Seguros',               time:'há 1 dia',    icon:'🏢', company:'Hexa Seguros' },
  { id:5, user:'João Lopes',     action:'submeteu o relatório',  target:'Despesas Março 2026',        time:'há 1 dia',    icon:'📊', company:'INOV Holding' },
  { id:6, user:'Sofia Cardoso',  action:'publicou a notícia',    target:'"500k leitores Meteoro24"',  time:'há 2 dias',   icon:'📰', company:'Meteoro24' },
];

// =============================================
// QUICK LINKS
// =============================================
const QUICK_LINKS = [
  { label:'Notícias',     page:'news',      icon:'newspaper', color:'blue' },
  { label:'Comunicados',  page:'comunicados',icon:'megaphone', color:'amber' },
  { label:'Documentos',   page:'docs',      icon:'folder',    color:'green' },
  { label:'Logótipos',    page:'brands',    icon:'bookmark',  color:'purple' },
  { label:'Galeria',      page:'gallery',   icon:'image',     color:'navy' },
  { label:'Empresas',     page:'companies', icon:'building',  color:'gold' },
  { label:'Perfil',       page:'profile',   icon:'user',      color:'green' },
  { label:'Admin',        page:'admin',     icon:'shield',    color:'navy' },
];

// =============================================
// HELPERS
// =============================================
function getCompany(id) { return COMPANIES.find(c => String(c.id) === String(id)); }
function getNewsByCompany(id) { return NEWS.filter(n => String(n.companyId ?? n.company_id) === String(id)); }
function getDocsByCompany(id) { return DOCUMENTS.filter(d => String(d.companyId ?? d.company_id) === String(id)); }
function getBrandsByCompany(id) { return BRAND_ASSETS.filter(b => String(b.companyId ?? b.company_id) === String(id)); }
function getGalleryByCompany(id) { return GALLERY.filter(g => String(g.companyId ?? g.company_id) === String(id)); }
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-AO', { day:'2-digit', month:'short', year:'numeric' });
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `${days} dias atrás`;
  if (days < 30) return `${Math.floor(days/7)} sem. atrás`;
  return formatDate(dateStr);
}

// =============================================
// PERSISTÊNCIA DE CONTEÚDO
// =============================================
const CONTENT_VERSION = 'v1';

function seedContent() {
  if (localStorage.getItem('inov_content_ver') !== CONTENT_VERSION) {
    localStorage.setItem('inov_news',         JSON.stringify(NEWS));
    localStorage.setItem('inov_comunicados',  JSON.stringify(COMUNICADOS));
    localStorage.setItem('inov_docs',         JSON.stringify(DOCUMENTS));
    localStorage.setItem('inov_companies',    JSON.stringify(COMPANIES));
    localStorage.setItem('inov_brands',       JSON.stringify(BRAND_ASSETS));
    localStorage.setItem('inov_gallery',      JSON.stringify(GALLERY));
    localStorage.setItem('inov_content_ver',  CONTENT_VERSION);
  }
  NEWS         = JSON.parse(localStorage.getItem('inov_news'))         || NEWS;
  COMUNICADOS  = JSON.parse(localStorage.getItem('inov_comunicados'))  || COMUNICADOS;
  DOCUMENTS    = JSON.parse(localStorage.getItem('inov_docs'))         || DOCUMENTS;
  COMPANIES    = JSON.parse(localStorage.getItem('inov_companies'))    || COMPANIES;
  BRAND_ASSETS = JSON.parse(localStorage.getItem('inov_brands'))       || BRAND_ASSETS;
  GALLERY      = JSON.parse(localStorage.getItem('inov_gallery'))      || GALLERY;
}

function saveNews(arr)          { NEWS = arr;         localStorage.setItem('inov_news', JSON.stringify(arr)); }
function saveComunicados(arr)   { COMUNICADOS = arr;  localStorage.setItem('inov_comunicados', JSON.stringify(arr)); }
function saveCompanies(arr)     { COMPANIES = arr;    localStorage.setItem('inov_companies', JSON.stringify(arr)); }
function saveBrandAssets(arr)   { BRAND_ASSETS = arr; localStorage.setItem('inov_brands', JSON.stringify(arr)); }
function saveGallery(arr)       { GALLERY = arr;      localStorage.setItem('inov_gallery', JSON.stringify(arr)); }
function saveDocuments(arr)     { DOCUMENTS = arr;    localStorage.setItem('inov_docs', JSON.stringify(arr)); }
