-- Seed para company_terms (termo vigente)
insert into public.company_terms (hash, version, text, effective_from, is_active)
values (
  md5('<p>Ao contratar um dos planos, você terá <b>10 dias de teste grátis</b>. Se não cancelar até o 10º dia, o valor do plano escolhido será cobrado automaticamente no cartão de crédito informado.</p><p>A cobrança será feita de acordo com o plano selecionado (<b>Semestral</b> ou <b>Anual</b>), sempre na mesma data da contratação, referente ao período contratado.</p><p>O plano será renovado automaticamente ao final de cada ciclo, salvo cancelamento prévio pelo usuário.</p><p>Ao marcar a opção abaixo e assinar, você declara que leu e concorda com estes termos.</p>'),
  'v1',
  '<p>Ao contratar um dos planos, você terá <b>10 dias de teste grátis</b>. Se não cancelar até o 10º dia, o valor do plano escolhido será cobrado automaticamente no cartão de crédito informado.</p><p>A cobrança será feita de acordo com o plano selecionado (<b>Semestral</b> ou <b>Anual</b>), sempre na mesma data da contratação, referente ao período contratado.</p><p>O plano será renovado automaticamente ao final de cada ciclo, salvo cancelamento prévio pelo usuário.</p><p>Ao marcar a opção abaixo e assinar, você declara que leu e concorda com estes termos.</p>',
  now(),
  true
); 