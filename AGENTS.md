# Regras e Instruções do Projeto

## Dados de Usuários e Autenticação (Logins e Cadastros)
- **REGRA CRÍTICA**: NUNCA altere os valores de login existentes.
- **REGRA CRÍTICA**: NUNCA crie exemplos ou mocks de login/senha no banco de dados.
- **REGRA CRÍTICA**: NUNCA substitua valores de login existentes por conta própria.
- **REGRA CRÍTICA**: As mesmas restrições se aplicam aos dados de cadastro (registros de usuários/freelancers/clientes).
- **Substituição de Dados no Banco**: Se qualquer tarefa exigir a substituição ou deleção de algum item salvo no banco de dados (especialmente dados reais de usuários), você DEVE perguntar ao usuário e obter confirmação antes de prosseguir.
