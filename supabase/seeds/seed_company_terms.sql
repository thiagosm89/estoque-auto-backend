-- Seed para company_terms (termo vigente)
insert into public.company_terms (hash, version, text, effective_from, is_active)
values (
  encode(digest('v1:2024-06-28', 'sha256'), 'hex'),
  'v1',
  'Ao contratar um dos planos, você terá 10 dias de teste grátis. Se não cancelar até o 10º dia, o valor do plano escolhido será cobrado automaticamente no cartão de crédito informado.\n\nA cobrança será feita de acordo com o plano selecionado (Semestral ou Anual), sempre na mesma data da contratação, referente ao período contratado.\n\nO plano será renovado automaticamente ao final de cada ciclo, salvo cancelamento prévio pelo usuário.\n\nAo marcar a opção abaixo e assinar, você declara que leu e concorda com estes termos.',
  now(),
  true
); 