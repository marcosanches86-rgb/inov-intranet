-- ================================================================
--  INOV INTRANET — Seed Data
--
--  Run AFTER schema.sql
--  Users are created separately via database/setup.php
--  (passwords require PHP's password_hash — cannot be done in SQL)
--
--  Order:
--    1. Companies
--    2. News
--    3. Announcements
--    4. Documents (metadata, no actual files)
--    5. Brand Assets (metadata)
--    6. Gallery Albums
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================
-- 1. COMPANIES (7 empresas do grupo INOV)
-- ================================================================
INSERT INTO `companies`
  (`id`,`slug`,`name`,`short_name`,`tagline`,`description`,`sector`,`founded_year`,
   `location`,`employees`,`color`,`accent_color`,`cover_gradient`,
   `email`,`phone`,`website`,
   `services`,`values_list`,`is_active`,`sort_order`)
VALUES

(1,
 'inov-holding',
 'INOV Holding',
 'INOV',
 'Ecossistema empresarial integrado para Angola e além',
 'A INOV Holding é o centro estratégico de um ecossistema empresarial diversificado, construído com a visão de criar valor sustentável e transformar sectores-chave da economia angolana. Fundada com propósito de longo prazo, a INOV agrega empresas complementares que partilham cultura, valores e missão.',
 'Holding / Investimento',
 2023,
 'Luanda, Angola',
 '50+',
 '#0C1A35',
 '#C9A24C',
 'linear-gradient(135deg, #0C1A35 0%, #1E3A6E 100%)',
 'geral@inov.ao',
 '+244 923 000 000',
 'https://www.inov.ao',
 '["Gestão de Participadas","Estratégia Corporativa","Investimento","Governança","ESG e Sustentabilidade"]',
 '["Inovação","Integridade","Excelência","Impacto","Parceria"]',
 1, 1),

(2,
 'factory-ideas',
 'Factory Ideas',
 'FI',
 'Comunicação visual B2B de excelência em Angola',
 'A Factory Ideas é a empresa de comunicação visual do grupo, especializada em soluções B2B completas — desde stands para feiras até impressão de grande formato, brindes corporativos, têxteis personalizados e eventos. Com parque gráfico próprio de 300m², serve as principais empresas de Angola.',
 'Comunicação Visual & Marketing',
 2024,
 'Alvalade, Luanda',
 '12',
 '#0A0A0A',
 '#F5C800',
 'linear-gradient(135deg, #0A0A0A 0%, #2A2A2A 100%)',
 'geral@factoryideas.ao',
 '+244 922 698 044',
 'https://www.factoryideas.ao',
 '["Stands para Feiras","Impressão Grande Formato","Brindes Corporativos","Têxteis Personalizados","Eventos Corporativos","Serviços Audiovisuais","EPI Personalizado"]',
 '["Agilidade","Qualidade","Criatividade","Compromisso"]',
 1, 2),

(3,
 'adventure-media',
 'Adventure Media',
 'AM',
 'Agência criativa de comunicação e conteúdo',
 'A Adventure Media é a agência criativa do grupo, especializada em estratégia de comunicação, criação de conteúdo digital, branding, design e gestão de presença nas redes sociais para marcas com ambição.',
 'Agência de Comunicação Digital',
 2023,
 'Luanda, Angola',
 '8',
 '#1A1A2E',
 '#E94560',
 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
 'geral@adventuremedia.ao',
 '+244 923 111 111',
 'https://www.adventure.ao',
 '["Branding & Identidade","Social Media Management","Criação de Conteúdo","Estratégia Digital","Design Gráfico","Fotografia & Vídeo"]',
 '["Criatividade","Autenticidade","Impacto","Colaboração"]',
 1, 3),

(4,
 'anda-la',
 'Anda-lá',
 'AL',
 'Plataforma de mobilidade e logística urbana',
 'A Anda-lá é a empresa de mobilidade do grupo, com foco em soluções de transporte, logística urbana e serviços de entrega para empresas e particulares em Angola. Uma plataforma tech-driven que responde à crescente necessidade de mobilidade eficiente.',
 'Mobilidade & Logística',
 2024,
 'Luanda, Angola',
 '20+',
 '#064E3B',
 '#34D399',
 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
 'geral@andala.ao',
 '+244 924 222 222',
 'https://www.andala.ao',
 '["Transporte Executivo","Logística Urbana","Entrega de Encomendas","Transfer Aeroporto","Serviços de Frota"]',
 '["Pontualidade","Segurança","Eficiência","Inovação"]',
 1, 4),

(5,
 'meteoro24',
 'Meteoro24',
 'M24',
 'Jornalismo digital de referência em Angola',
 'O Meteoro24 é o portal de notícias do grupo, com cobertura jornalística abrangente de economia, política, negócios, desporto e cultura em Angola. Um meio digital moderno, rigoroso e independente com crescente audiência nacional.',
 'Media & Jornalismo Digital',
 2023,
 'Luanda, Angola',
 '15',
 '#7C2D12',
 '#FB923C',
 'linear-gradient(135deg, #7C2D12 0%, #9A3412 100%)',
 'redaccao@meteoro24.ao',
 '+244 925 333 333',
 'https://www.meteoro24.ao',
 '["Portal de Notícias","Jornalismo Investigativo","Cobertura de Eventos","Publicidade Digital","Newsletter","Podcasts"]',
 '["Rigor","Independência","Rapidez","Credibilidade"]',
 1, 5),

(6,
 'ziv-petroleum',
 'Ziv Petroleum',
 'ZP',
 'Serviços de engenharia e suporte ao sector petrolífero',
 'A Ziv Petroleum actua no sector de energia e petróleo em Angola, prestando serviços especializados de engenharia, manutenção industrial, suporte logístico e consultoria técnica a operadores do sector.',
 'Energia & Petróleo',
 2023,
 'Luanda, Angola',
 '25',
 '#1C1917',
 '#EAB308',
 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
 'geral@zivpetroleum.ao',
 '+244 926 444 444',
 'https://www.zivpetroleum.ao',
 '["Engenharia Industrial","Manutenção de Equipamentos","Suporte Logístico","Consultoria Técnica","HSE","Fornecimento de Materiais"]',
 '["Segurança","Excelência Técnica","Fiabilidade","Responsabilidade"]',
 1, 6),

(7,
 'hexa-seguros',
 'Hexa Seguros',
 'HS',
 'Soluções de seguros e protecção financeira',
 'A Hexa Seguros é a empresa de seguros e protecção financeira do grupo, oferecendo soluções personalizadas para empresas e particulares em Angola — desde seguros empresariais, de saúde, automóvel, vida e responsabilidade civil.',
 'Seguros & Protecção Financeira',
 2024,
 'Luanda, Angola',
 '18',
 '#1E3A5F',
 '#60A5FA',
 'linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 100%)',
 'geral@hexaseguros.ao',
 '+244 927 555 555',
 'https://www.hexa.ao',
 '["Seguros Empresariais","Seguros de Saúde","Seguros Automóvel","Seguros de Vida","Responsabilidade Civil","Gestão de Sinistros"]',
 '["Confiança","Transparência","Protecção","Rapidez"]',
 1, 7);


-- ================================================================
-- 2. NEWS  (author_id = 1 → Marco Sanches, created via setup.php)
-- ================================================================
INSERT INTO `news`
  (`id`,`slug`,`company_id`,`author_id`,`category`,`title`,`summary`,`body`,
   `status`,`is_featured`,`read_time`,`views`,`published_at`)
VALUES

(1,
 'inov-anuncia-expansao-ecossistema-2026',
 1, 1, 'Estratégia',
 'INOV Holding anuncia expansão do ecossistema com dois novos projectos para 2026',
 'O grupo INOV Holding revelou a sua estratégia de crescimento para 2026, incluindo dois novos projectos empresariais que vão reforçar a presença do grupo em sectores estratégicos da economia angolana.',
 '<p>A INOV Holding deu um passo estratégico relevante ao anunciar oficialmente a expansão do seu ecossistema empresarial com dois novos projectos previstos para arrancar no segundo semestre de 2026.</p><p>De acordo com a administração do grupo, os novos projectos irão actuar nas áreas de tecnologia de informação e serviços financeiros — dois sectores com elevado potencial de crescimento em Angola.</p><p>"Estamos a construir um ecossistema que se complementa, que partilha recursos e que cria valor de forma integrada", afirmou o CEO do grupo, Marco Sanches.</p>',
 'published', 1, '4 min', 142, '2026-03-15 09:00:00'),

(2,
 'inov-programa-futuros-lideres-2026',
 1, 1, 'Recursos Humanos',
 'INOV lança programa de desenvolvimento interno "Futuros Líderes" para colaboradores do grupo',
 'O grupo INOV anuncia o lançamento de um programa de formação e desenvolvimento de liderança destinado a colaboradores de todas as empresas participadas.',
 '<p>A INOV Holding lançou o programa "Futuros Líderes", uma iniciativa de desenvolvimento interno que visa identificar e preparar os colaboradores com maior potencial de liderança em todo o ecossistema do grupo.</p><p>O programa tem duração de 12 meses e inclui formação presencial, mentoring com membros da administração, rotação por diferentes empresas do grupo e um projecto final de impacto real.</p>',
 'published', 1, '3 min', 98, '2026-03-10 10:00:00'),

(3,
 'factory-ideas-stand-sika-filda-2026',
 2, 1, 'Projecto',
 'Factory Ideas conclui stand de destaque para a Sika na FILDA 2026',
 'A Factory Ideas entregou um stand imponente de 80m² para a Sika na Feira Internacional de Luanda 2026, consolidando a parceria com um dos maiores clientes do grupo.',
 '<p>A equipa da Factory Ideas concluiu com sucesso a produção e montagem do stand da Sika na FILDA 2026, um dos projectos mais ambiciosos da empresa desde a sua fundação.</p><p>Com uma área de 80m² e um design tridimensional de impacto, o stand foi produzido integralmente no parque gráfico da Factory Ideas em Alvalade.</p>',
 'published', 1, '3 min', 76, '2026-03-05 09:30:00'),

(4,
 'inov-celebra-2-anos-jantar-gala',
 1, 1, 'Cultura',
 'Grupo INOV celebra 2 anos com jantar de gala e reconhecimento de colaboradores',
 'A INOV Holding celebrou o segundo aniversário do grupo com uma cerimónia de gala que reuniu todos os colaboradores e parceiros estratégicos.',
 '<p>O grupo INOV celebrou o segundo aniversário do ecossistema com um jantar de gala que reuniu mais de 80 pessoas, entre colaboradores, parceiros e convidados especiais.</p><p>A noite incluiu a cerimónia de reconhecimento "Stars of INOV", onde foram distinguidos colaboradores com desempenho exemplar em cada empresa do grupo.</p>',
 'published', 0, '2 min', 54, '2026-02-28 18:00:00'),

(5,
 'factory-ideas-fornecedor-sonangol-ep',
 2, 1, 'Cliente',
 'Factory Ideas integra lista de fornecedores preferenciais da Sonangol E&P',
 'A empresa foi reconhecida como fornecedor preferencial da Sonangol E&P na área de comunicação visual e equipamento corporativo personalizado.',
 '<p>Num importante reconhecimento institucional, a Factory Ideas foi integrada na lista de fornecedores preferenciais da Sonangol E&P, a maior empresa do sector petrolífero em Angola.</p><p>A parceria abrange fornecimento de brindes corporativos, material de escritório personalizado, têxteis e impressão de grande formato para as instalações da empresa.</p>',
 'published', 0, '2 min', 89, '2026-02-20 09:00:00'),

(6,
 'adventure-media-campanha-keve-2025',
 3, 1, 'Projecto',
 'Adventure Media conclui campanha digital para Keve com resultados acima do esperado',
 'A agência criativa do grupo entregou uma campanha digital completa para a Keve, com crescimento de 340% no engagement e 120k impressões em 30 dias.',
 '<p>A Adventure Media concluiu com sucesso a campanha digital para a Keve, superando todos os indicadores definidos no briefing inicial.</p><p>A campanha incluiu produção de conteúdo para Instagram e Facebook, gestão de anúncios pagos e produção de vídeo para os formatos Reels e Stories.</p>',
 'published', 0, '3 min', 43, '2026-02-15 11:00:00'),

(7,
 'meteoro24-500-mil-leitores-mensais',
 5, 1, 'Conquista',
 'Meteoro24 ultrapassa 500 mil leitores mensais e consolida posição no digital angolano',
 'O portal de notícias do grupo atingiu a marca histórica de 500 mil leitores únicos mensais, reforçando a sua posição como um dos principais meios digitais de Angola.',
 '<p>O Meteoro24 atingiu em Fevereiro de 2026 a marca histórica de 500 mil leitores únicos mensais, um crescimento de 180% face ao mesmo período do ano anterior.</p><p>O crescimento é atribuído à aposta na cobertura de economia e negócios, uma área com crescente procura pelos leitores angolanos.</p>',
 'published', 1, '2 min', 201, '2026-02-10 08:00:00'),

(8,
 'ziv-petroleum-contrato-cabinda-2026',
 6, 1, 'Negócio',
 'Ziv Petroleum assina contrato de manutenção industrial em Cabinda',
 'A empresa de engenharia do grupo INOV celebrou um contrato de serviços de manutenção com um operador do sector petrolífero em Cabinda, reforçando a presença no sector energético.',
 '<p>A Ziv Petroleum assinou um contrato de prestação de serviços de manutenção industrial com um operador do sector petrolífero em Cabinda, num acordo válido por 24 meses.</p><p>O contrato abrange inspecção e manutenção preventiva de equipamentos de produção, com equipa técnica permanente no terreno.</p>',
 'published', 0, '3 min', 38, '2026-02-05 10:00:00'),

(9,
 'hexa-seguros-saude-premium-lancamento',
 7, 1, 'Produto',
 'Hexa Seguros lança produto Saúde Premium com cobertura alargada para executivos',
 'O novo produto de seguro de saúde da Hexa Seguros oferece cobertura completa incluindo assistência internacional, medicina preventiva e plano de saúde familiar.',
 '<p>A Hexa Seguros lançou o produto Saúde Premium, uma solução de seguro de saúde destinada a executivos e quadros superiores de empresas, com cobertura abrangente que inclui assistência médica internacional.</p>',
 'published', 0, '2 min', 67, '2026-01-28 09:00:00'),

(10,
 'inov-parceria-estrategica-angola-telecom',
 1, 1, 'Parceria',
 'INOV Holding fecha parceria estratégica com Angola Telecom para digitalização de serviços',
 'O grupo INOV formalizou uma parceria estratégica com a Angola Telecom para desenvolvimento conjunto de soluções de comunicação digital para empresas.',
 '<p>A INOV Holding e a Angola Telecom formalizaram uma parceria estratégica com o objectivo de desenvolver soluções digitais integradas para o segmento empresarial angolano.</p>',
 'draft', 0, '3 min', 0, NULL);


-- ================================================================
-- 3. ANNOUNCEMENTS
-- ================================================================
INSERT INTO `announcements`
  (`id`,`company_id`,`author_id`,`title`,`body`,`priority`,`visibility`,`is_pinned`,`is_active`)
VALUES

(1,
 NULL, 1,
 'Reunião Geral do Grupo INOV — Q1 2026 — 15 de Abril',
 '<p>Todos os colaboradores do grupo INOV estão convidados para a Reunião Geral do Primeiro Trimestre de 2026, que decorrerá no dia 15 de Abril, às 14h00, nas instalações da INOV Holding em Luanda.</p><p>A presença é obrigatória para todos os directores e gestores. Os restantes colaboradores são encorajados a participar.</p><p>A agenda inclui: resultados do Q1, lançamentos previstos para o Q2, reconhecimentos e apresentações das áreas de negócio.</p>',
 'high', 'global', 1, 1),

(2,
 NULL, 1,
 'Novo processo de submissão de relatórios de despesas — efectivo a partir de 1 de Abril',
 '<p>A partir de 1 de Abril de 2026, todos os relatórios de despesas deverão ser submetidos exclusivamente através da intranet do grupo, utilizando o formulário disponível na secção Documentos.</p><p>Os relatórios em papel ou enviados por email deixarão de ser aceites. Para dúvidas, contacte o Departamento Financeiro da INOV Holding.</p>',
 'medium', 'global', 0, 1),

(3,
 2, 1,
 'Novo horário de produção — Factory Ideas — Época FILDA',
 '<p>Durante o período da FILDA 2026 (22 a 28 de Maio), a Factory Ideas irá operar em regime de produção alargado, das 07h00 às 22h00, de segunda a domingo.</p><p>Toda a equipa de produção deverá confirmar disponibilidade com o Director Operacional até ao dia 15 de Abril.</p>',
 'high', 'company', 0, 1),

(4,
 NULL, 1,
 'Actualização da política de utilização de recursos tecnológicos do grupo',
 '<p>O Departamento de TI da INOV Holding publicou a versão actualizada da Política de Utilização de Recursos Tecnológicos do Grupo.</p><p>Todos os colaboradores devem ler e reconhecer o documento disponível na secção Documentos da intranet.</p>',
 'low', 'global', 0, 1),

(5,
 NULL, 1,
 'Processo de candidatura ao Programa Futuros Líderes — prazo: 30 de Abril',
 '<p>As candidaturas ao programa de desenvolvimento "Futuros Líderes" estão abertas até ao dia 30 de Abril de 2026.</p><p>Para candidatar-se, preencha o formulário disponível na intranet e submeta com uma carta de motivação e o aval do seu director.</p>',
 'medium', 'global', 0, 1);


-- ================================================================
-- 4. DOCUMENTS  (file_path = placeholder — sem ficheiros reais)
-- ================================================================
INSERT INTO `documents`
  (`id`,`company_id`,`uploaded_by`,`title`,`description`,`category`,
   `file_path`,`original_name`,`file_type`,`file_size`,`file_size_human`,
   `download_count`,`is_confidential`,`is_active`)
VALUES

(1,  1, 1, 'Manual de Governança Corporativa INOV 2026',
 'Políticas e princípios de governança do grupo',
 'Governança', 'documents/placeholder-001.pdf', 'manual-governanca-2026.pdf',
 'pdf', 2516582, '2.4 MB', 34, 0, 1),

(2,  1, 1, 'Regulamento Interno de Trabalho — Grupo INOV',
 'Regulamento aplicável a todas as empresas participadas',
 'RH', 'documents/placeholder-002.pdf', 'rit-grupo-inov.pdf',
 'pdf', 1887437, '1.8 MB', 89, 0, 1),

(3,  1, 1, 'Plano Estratégico INOV 2025–2028',
 'Visão, missão e objectivos estratégicos do grupo',
 'Estratégia', 'documents/placeholder-003.pdf', 'plano-estrategico.pdf',
 'pdf', 5347737, '5.1 MB', 45, 0, 1),

(4,  2, 1, 'Portfólio de Serviços Factory Ideas 2026',
 'Catálogo completo de serviços e preçário',
 'Comercial', 'documents/placeholder-004.pdf', 'portfolio-fi-2026.pdf',
 'pdf', 8702156, '8.3 MB', 22, 0, 1),

(5,  2, 1, 'Manual de Qualidade e Processos de Produção',
 'Procedimentos internos de controlo de qualidade',
 'Qualidade', 'documents/placeholder-005.pdf', 'manual-qualidade-fi.pdf',
 'pdf', 3355443, '3.2 MB', 15, 0, 1),

(6,  4, 1, 'Manual de Operações Anda-lá — Condutores e Parceiros',
 'Procedimentos para parceiros e condutores',
 'Operacional', 'documents/placeholder-006.pdf', 'manual-ops-andala.pdf',
 'pdf', 2202009, '2.1 MB', 38, 0, 1),

(7,  5, 1, 'Guia de Estilo Editorial Meteoro24',
 'Normas de escrita, estilo e ética jornalística',
 'Editorial', 'documents/placeholder-007.pdf', 'guia-editorial-m24.pdf',
 'pdf', 1572864, '1.5 MB', 20, 0, 1),

(8,  6, 1, 'Manual de Segurança e Saúde no Trabalho — Ziv Petroleum',
 'Procedimentos de HSE para operações de campo',
 'HSE', 'documents/placeholder-008.pdf', 'manual-hse-ziv.pdf',
 'pdf', 5033164, '4.8 MB', 12, 0, 1),

(9,  6, 1, 'Catálogo de Serviços Técnicos Ziv Petroleum',
 'Capacidades técnicas e equipamentos disponíveis',
 'Técnico', 'documents/placeholder-009.pdf', 'catalogo-ziv.pdf',
 'pdf', 6502349, '6.2 MB', 9, 0, 1),

(10, 7, 1, 'Guia de Produtos e Coberturas Hexa Seguros 2026',
 'Descrição detalhada de todos os produtos de seguro',
 'Produto', 'documents/placeholder-010.pdf', 'produtos-hexa-2026.pdf',
 'pdf', 3879731, '3.7 MB', 31, 0, 1),

(11, 1, 1, 'Formulário de Requisição de Material Interno',
 'Formulário para pedido de material de escritório',
 'Formulários', 'documents/placeholder-011.docx', 'form-requisicao.docx',
 'doc', 314572, '0.3 MB', 67, 0, 1),

(12, 1, 1, 'Modelo de Relatório de Despesas',
 'Template mensal de reporte de despesas',
 'Formulários', 'documents/placeholder-012.xlsx', 'form-despesas.xlsx',
 'xls', 524288, '0.5 MB', 55, 0, 1),

-- Confidenciais
(13, 1, 1, 'Relatório Financeiro Consolidado — Grupo INOV Q1 2026',
 'Resultados financeiros consolidados do 1.º trimestre 2026',
 'Confidencial', 'documents/placeholder-013.pdf', 'financeiro-q1-2026.pdf',
 'pdf', 4404019, '4.2 MB', 3, 1, 1),

(14, 1, 1, 'Pactos Parassociais e Acordos de Accionistas',
 'Documentos legais de estrutura accionista do grupo',
 'Confidencial', 'documents/placeholder-014.pdf', 'pactos-parassociais.pdf',
 'pdf', 2936012, '2.8 MB', 1, 1, 1),

(15, 1, 1, 'Plano Estratégico INOV 2025–2028 — Versão Executiva Completa',
 'Relatório de avaliação independente das participadas',
 'Confidencial', 'documents/placeholder-015.pdf', 'avaliacao-activos-2025.pdf',
 'pdf', 6396313, '6.1 MB', 2, 1, 1),

(16, 1, 1, 'Tabela Salarial e Estrutura de Remunerações — Direcção',
 'Remunerações e benefícios da equipa de direcção executiva',
 'Confidencial', 'documents/placeholder-016.xlsx', 'salarios-direccao-2026.xlsx',
 'xls', 943718, '0.9 MB', 2, 1, 1);


-- ================================================================
-- 5. BRAND ASSETS  (file_path = placeholder)
-- ================================================================
INSERT INTO `brand_assets`
  (`id`,`company_id`,`uploaded_by`,`name`,`asset_type`,`format`,`version`,
   `file_path`,`original_name`,`file_size`,`color`,`color_bg`,`initials`,`is_active`,`sort_order`)
VALUES

(1,  1, 1, 'INOV Holding — Logo Principal',      'logo-primary',   'SVG + PNG', 'v3.0', 'logos/placeholder-01.svg', 'inov-logo-principal.svg',    45212, '#C9A24C', '#0C1A35', 'INOV', 1, 1),
(2,  1, 1, 'INOV Holding — Logo Branco',          'logo-white',     'SVG + PNG', 'v3.0', 'logos/placeholder-02.svg', 'inov-logo-branco.svg',        42100, '#FFFFFF', '#0C1A35', 'INOV', 1, 2),
(3,  1, 1, 'INOV Holding — Favicon / Ícone',      'icon',           'SVG + ICO', 'v2.0', 'logos/placeholder-03.svg', 'inov-favicon.svg',             8192, '#C9A24C', '#F5F7FB', 'IN',   1, 3),
(4,  1, 1, 'Manual de Identidade Visual INOV',    'guideline',      'PDF',       'v2.1', 'logos/placeholder-04.pdf', 'manual-identidade-inov.pdf', 4194304, '#0C1A35', '#EEF2F8', 'MIV',  1, 4),
(5,  2, 1, 'Factory Ideas — Logo Principal',      'logo-primary',   'SVG + PNG', 'v2.0', 'logos/placeholder-05.svg', 'fi-logo-principal.svg',       41200, '#F5C800', '#0A0A0A', 'FI',   1, 1),
(6,  2, 1, 'Factory Ideas — Logo Branco',         'logo-white',     'SVG + PNG', 'v2.0', 'logos/placeholder-06.svg', 'fi-logo-branco.svg',          39800, '#FFFFFF', '#0A0A0A', 'FI',   1, 2),
(7,  2, 1, 'Factory Ideas — Logo Negro',          'logo-dark',      'SVG + PNG', 'v2.0', 'logos/placeholder-07.svg', 'fi-logo-negro.svg',           40100, '#0A0A0A', '#F5F7FB', 'FI',   1, 3),
(8,  3, 1, 'Adventure Media — Logo Principal',    'logo-primary',   'SVG + PNG', 'v1.5', 'logos/placeholder-08.svg', 'am-logo-principal.svg',       38400, '#E94560', '#1A1A2E', 'AM',   1, 1),
(9,  4, 1, 'Anda-lá — Logo Principal',            'logo-primary',   'SVG + PNG', 'v1.2', 'logos/placeholder-09.svg', 'andala-logo-principal.svg',   36700, '#34D399', '#064E3B', 'AL',   1, 1),
(10, 5, 1, 'Meteoro24 — Logo Principal',          'logo-primary',   'SVG + PNG', 'v2.0', 'logos/placeholder-10.svg', 'm24-logo-principal.svg',      43100, '#FB923C', '#7C2D12', 'M24',  1, 1),
(11, 6, 1, 'Ziv Petroleum — Logo Principal',      'logo-primary',   'SVG + PNG', 'v1.0', 'logos/placeholder-11.svg', 'ziv-logo-principal.svg',      37900, '#EAB308', '#1C1917', 'ZP',   1, 1),
(12, 7, 1, 'Hexa Seguros — Logo Principal',       'logo-primary',   'SVG + PNG', 'v1.3', 'logos/placeholder-12.svg', 'hexa-logo-principal.svg',     40500, '#60A5FA', '#1E3A5F', 'HS',   1, 1);


-- ================================================================
-- 6. GALLERY ALBUMS
-- ================================================================
INSERT INTO `gallery_albums`
  (`id`,`company_id`,`created_by`,`title`,`slug`,`description`,`category`,`cover_color`,`item_count`,`is_active`,`sort_order`)
VALUES

(1,  1, 1, 'Jantar de Gala INOV 2025',           'jantar-gala-inov-2025',           'Cerimónia anual de celebração e reconhecimento do grupo INOV',             'Evento',      '#0C1A35', 12, 1, 1),
(2,  1, 1, 'Reunião Estratégica Q4 2025',         'reuniao-estrategica-q4-2025',     'Sessão estratégica de planeamento do grupo para 2026',                     'Interno',     '#152744',  8, 1, 2),
(3,  2, 1, 'Stand Sika — FILDA 2026',             'stand-sika-filda-2026',           'Produção e montagem do stand de 80m² para a Sika na FILDA 2026',           'Stand',       '#1A1A1A', 18, 1, 1),
(4,  2, 1, 'Stand Cognito — Angotic 2025',        'stand-cognito-angotic-2025',      'Stand premium para a Cognito na conferência tecnológica Angotic 2025',     'Stand',       '#111111', 14, 1, 2),
(5,  2, 1, 'Lona Corporativa TIS Suntech',        'lona-corporativa-tis-suntech',    'Projecto de impressão de grande formato para a TIS Suntech',               'Impressão',   '#222222',  6, 1, 3),
(6,  2, 1, 'Kit Brindes Toyota CFAO',             'kit-brindes-toyota-cfao',         'Kit de brindes corporativos personalizados para Toyota CFAO Angola',       'Brindes',     '#2D2D2D', 10, 1, 4),
(7,  3, 1, 'Campanha Digital Keve 2025',          'campanha-digital-keve-2025',      'Campanha de comunicação digital para a cerveja Keve',                      'Campanha',    '#1A1A2E', 22, 1, 1),
(8,  3, 1, 'Sessão Fotográfica BFA',              'sessao-fotografica-bfa',          'Produção fotográfica institucional para o Banco de Fomento Angola',        'Fotografia',  '#16213E', 35, 1, 2),
(9,  4, 1, 'Frota Anda-lá — Apresentação',        'frota-andala-apresentacao',       'Registo fotográfico da frota inaugural da plataforma Anda-lá',             'Produto',     '#064E3B', 16, 1, 1),
(10, 5, 1, 'Newsroom Meteoro24',                  'newsroom-meteoro24',              'Registo das instalações e equipa do portal Meteoro24',                     'Interno',     '#7C2D12',  9, 1, 1),
(11, 6, 1, 'Operações de Campo — Cabinda',        'operacoes-campo-cabinda',         'Registo das operações de manutenção industrial em Cabinda',                'Operacional', '#1C1917', 20, 1, 1),
(12, 7, 1, 'Lançamento Hexa Saúde Premium',       'lancamento-hexa-saude-premium',   'Evento de lançamento do produto Hexa Saúde Premium em Luanda',            'Evento',      '#1E3A5F', 15, 1, 1);


SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- NOTE: Users are NOT created here.
-- Run: php database/setup.php
-- This generates proper bcrypt password hashes and inserts users.
-- ================================================================
