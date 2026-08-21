-- ARTISTAS
insert into public.artistas (id, nome, tipo, contato, instagram, descricao, ativo) values
('a1000000-0000-4000-8000-000000000001','Cecília Vermelha','drag','(11) 98811-0001','@ceciliavermelha','Anfitriã da casa, número de abertura em veludo vermelho.',true),
('a1000000-0000-4000-8000-000000000002','Madame Lascívia','burlesco','(11) 98811-0002','@madamelascivia','Clássico burlesco com leque de plumas.',true),
('a1000000-0000-4000-8000-000000000003','DJ Nocturna','dj','(11) 98811-0003','@djnocturna','Set dark disco e italo até o amanhecer.',true),
('a1000000-0000-4000-8000-000000000004','Trio Bruma','banda','(11) 98811-0004','@triobruma','Jazz noir ao vivo com voz e contrabaixo.',true),
('a1000000-0000-4000-8000-000000000005','Vitrola Divina','performance','(11) 98811-0005','@vitroladivina','Performance de lip sync teatral.',true),
('a1000000-0000-4000-8000-000000000006','Kiko Estrela','drag','(11) 98811-0006','@kikoestrela','Drag king com número de tango.',false)
on conflict (id) do nothing;

-- EVENTOS
insert into public.eventos (id, nome, data_hora, tipo, artista, local, capacidade, status) values
('e1000000-0000-4000-8000-000000000001','Noite Escarlate', now() + interval '3 day' , 'festa','Cecília Vermelha','Salão Principal',180,'agendado'),
('e1000000-0000-4000-8000-000000000002','Cabaret Burlesco', now() + interval '10 day','show','Madame Lascívia','Salão Principal',160,'agendado'),
('e1000000-0000-4000-8000-000000000003','Bruma Jazz Session', now() + interval '17 day','show','Trio Bruma','Mezanino',90,'agendado'),
('e1000000-0000-4000-8000-000000000004','Baile Nocturna', now() + interval '24 day','festa','DJ Nocturna','Salão Principal',200,'agendado'),
('e1000000-0000-4000-8000-000000000005','Gala de Aniversário', now() - interval '9 day','especial','Elenco da Casa','Salão Principal',220,'realizado')
on conflict (id) do nothing;

-- PROGRAMAÇÃO
insert into public.evento_artistas (id, evento_id, artista_id, horario, cache, ordem) values
('b1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001', now() + interval '3 day' + interval '2 hour', 1200, 1),
('b1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000003', now() + interval '3 day' + interval '4 hour', 900, 2),
('b1000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000002', now() + interval '10 day' + interval '2 hour', 1500, 1),
('b1000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000005', now() + interval '10 day' + interval '3 hour', 700, 2),
('b1000000-0000-4000-8000-000000000005','e1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000004', now() + interval '17 day' + interval '2 hour', 1800, 1),
('b1000000-0000-4000-8000-000000000006','e1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000003', now() + interval '24 day' + interval '3 hour', 1100, 1),
('b1000000-0000-4000-8000-000000000007','e1000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000000001', now() - interval '9 day' + interval '2 hour', 1400, 1)
on conflict (id) do nothing;

-- INGRESSOS
insert into public.ingressos (id, evento_id, tipo, preco, quantidade, vendidos) values
('c1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','pista',70,120,64),
('c1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','camarote',150,40,18),
('c1000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000001','cortesia',0,20,7),
('c1000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000002','pista',80,110,41),
('c1000000-0000-4000-8000-000000000005','e1000000-0000-4000-8000-000000000002','meia',40,50,22),
('c1000000-0000-4000-8000-000000000006','e1000000-0000-4000-8000-000000000003','pista',60,70,12),
('c1000000-0000-4000-8000-000000000007','e1000000-0000-4000-8000-000000000004','pista',55,150,8),
('c1000000-0000-4000-8000-000000000008','e1000000-0000-4000-8000-000000000005','pista',90,180,171)
on conflict (id) do nothing;

-- CLIENTES
insert into public.clientes (id, nome, telefone, email, preferencias, tags, observacoes) values
('d1000000-0000-4000-8000-000000000001','Bianca Torres','(11) 99100-0001','bianca@exemplo.com','Gin tônica, mesa perto do palco', array['vip','frequente'],'Aniversário em março.'),
('d1000000-0000-4000-8000-000000000002','Rafael Andrade','(11) 99100-0002','rafael@exemplo.com','Cerveja artesanal', array['frequente'],null),
('d1000000-0000-4000-8000-000000000003','Cris Nogueira','(11) 99100-0003','cris@exemplo.com','Drinks sem álcool', array['novo'],'Veio pela primeira vez no burlesco.'),
('d1000000-0000-4000-8000-000000000004','Helena Prado','(11) 99100-0004','helena@exemplo.com','Espumante, camarote', array['vip'],'Costuma reservar camarote para 6.'),
('d1000000-0000-4000-8000-000000000005','Tom Bittencourt','(11) 99100-0005','tom@exemplo.com','Whisky', array['imprensa'],'Jornalista cultural.'),
('d1000000-0000-4000-8000-000000000006','Duda Freitas','(11) 99100-0006','duda@exemplo.com','Caipirinha de limão', array['frequente'],null),
('d1000000-0000-4000-8000-000000000007','Nina Rocha','(11) 99100-0007','nina@exemplo.com','Vinho tinto', array['aniversariante'],null),
('d1000000-0000-4000-8000-000000000008','Sérgio Lemos','(11) 99100-0008','sergio@exemplo.com','Água com gás', array['novo'],null)
on conflict (id) do nothing;

-- COMANDAS
insert into public.comandas (id, cliente_id, evento_id, mesa, status, valor_total) values
('f1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000005','12','fechada',268),
('f1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000005','Camarote 2','fechada',540),
('f1000000-0000-4000-8000-000000000003','d1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','7','aberta',96),
('f1000000-0000-4000-8000-000000000004','d1000000-0000-4000-8000-000000000006','e1000000-0000-4000-8000-000000000001','3','aberta',54)
on conflict (id) do nothing;

insert into public.itens_comanda (id, comanda_id, descricao, quantidade, valor_unitario) values
('11000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','Gin tônica',4,42),
('11000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000001','Couvert artístico',2,50),
('11000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000002','Espumante garrafa',2,220),
('11000000-0000-4000-8000-000000000004','f1000000-0000-4000-8000-000000000002','Porção de bolinho',2,50),
('11000000-0000-4000-8000-000000000005','f1000000-0000-4000-8000-000000000003','Cerveja artesanal',4,24),
('11000000-0000-4000-8000-000000000006','f1000000-0000-4000-8000-000000000004','Caipirinha',2,27)
on conflict (id) do nothing;

-- GUEST LIST
insert into public.guest_list (id, evento_id, nome, telefone, status) values
('21000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','Bianca Torres','(11) 99100-0001','confirmado'),
('21000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','Rafael Andrade','(11) 99100-0002','entrou'),
('21000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000001','Cris Nogueira','(11) 99100-0003','pendente'),
('21000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000002','Helena Prado','(11) 99100-0004','confirmado'),
('21000000-0000-4000-8000-000000000005','e1000000-0000-4000-8000-000000000002','Tom Bittencourt','(11) 99100-0005','pendente'),
('21000000-0000-4000-8000-000000000006','e1000000-0000-4000-8000-000000000005','Nina Rocha','(11) 99100-0007','entrou'),
('21000000-0000-4000-8000-000000000007','e1000000-0000-4000-8000-000000000005','Sérgio Lemos','(11) 99100-0008','nao_compareceu')
on conflict (id) do nothing;