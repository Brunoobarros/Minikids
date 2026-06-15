# 🧠 Mini Kids - Memória do Projeto

Este documento serve como a "Fonte Única da Verdade" para o estado técnico e arquitetural da aplicação.

## 🚀 Visão Geral
E-commerce de mantos esportivos premium.
- **Frontend:** React + Tailwind CSS + Vite.
- **Backend:** Node.js + Express (Serverless no Vercel).
- **Banco de Dados:** Supabase (PostgreSQL).
- **Integrações:** Mercado Pago (Pagamentos) e Google Gemini (IA para descrições).

## 🛠️ Arquitetura de Persistência (Crítico)
A aplicação foi projetada para lidar com a natureza **Stateless** do Vercel:
1. **Ambiente Local:** Utiliza arquivos `.json` (`products.json`, etc.) para cache rápido.
2. **Produção (Vercel):** O sistema de arquivos é **Read-Only**. Toda persistência deve ser confirmada no **Supabase** antes da resposta da API.
3. **Sincronização:** No `GET`, o servidor prioriza o Supabase para evitar o reset dos arrays em memória RAM.

## 🔴 Problemas Resolvidos (Lessons Learned)

### 1. Reset de Dados no F5
**Causa:** O servidor Vercel reiniciava e limpava o array `products = []`. No boot, ele entregava o estado vazio antes de sincronizar com o banco.
**Solução:** Implementado `await syncFromSupabase()` dentro das rotas de `GET` e garantido que o `POST` aguarde o `upsert` no banco antes de retornar `200 OK`.

### 2. Reset de Cores/Tema (Flash Visual)
**Causa:** Fallbacks manuais no frontend sobrescreviam o `localStorage` quando a API demorava a responder, e havia um piscar vermelho antes de aplicar o tema azul.
**Solução:** Removidos fallbacks agressivos e adicionada persistência das configurações de aparência no `localStorage` após a primeira carga, evitando o flash visual de cor no F5.

### 3. Crash "Function Invocation Failed" (Erro 500)
**Causa:** Tentativa de escrita em disco (`fs.writeFileSync`) no Vercel e importação de arquivos `.ts` do frontend pelo backend.
**Solução:** Proteção `if (IS_VERCEL)` em todas as funções de escrita e isolamento total das interfaces do backend.

### 4. Segurança e Usabilidade do Login
**Causa:** Exposição da senha do admin como exemplo e impossibilidade de realizar o login ao pressionar a tecla "Enter".
**Solução:** Removido o placeholder que mostrava a senha, implementado o envio ao pressionar "Enter", e atualizada a senha mestre do admin para `camisa72026*`.

### 5. Links e Navegação Geral
**Causa:** O clique no logotipo não redirecionava para a página inicial e as categorias no menu superior não estavam funcionando.
**Solução:** Configurado o logotipo para limpar filtros e restaurar a página inicial e corrigidos os caminhos de categoria no menu de navegação.

### 6. Fluxo de Reordenação e Controle de Estoque
**Causa:** Instabilidade e mistura de conceitos ao arrastar para reordenar na lista de estoque.
**Solução:** O drag-and-drop de reordenação de produtos foi movido para o grid da página inicial para administradores logados (robusto, utilizando mapeamento por IDs de produtos). Na aba de Estoque, a ordenação passou a ser automática pela quantidade em estoque (menor primeiro), para rápido controle de reabastecimento.

## 📊 Esquema do Banco (Supabase)
- `products`: IDs, Preços, Estoque, Imagens (JSONB), Reviews (JSONB).
- `banners`: Conteúdo do carrossel e ordenação.
- `orders`: Dados do cliente, status da reserva e itens.
- `appearance`: Configuração global de cores e fontes (ID fixo: `default`).

## 📋 Checklist para Apresentação (3 Dias)
- [ ] **Limpeza:** Executar `TRUNCATE` nas tabelas do Supabase para começar do zero.
- [ ] **Imagens:** Usar URLs públicas ou strings Base64 estáveis (evitar caminhos relativos locais).
- [ ] **Logs:** Monitorar o painel do Vercel em tempo real para capturar falhas de conexão com o banco.
- [ ] **Pagamento:** Garantir que o `MERCADO_PAGO_ACCESS_TOKEN` esteja configurado no Vercel para o fluxo de PIX.

## 💡 Dica de Engenharia
Sempre que realizar um `POST` no Admin ou reordenar itens na home, aguarde o toast de sucesso. Ele garante que o dado está persistido no Supabase e salvo no JSON local.

---
*Última atualização: 2026-06-06*