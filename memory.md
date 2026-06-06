# 🧠 Camisa 7 Store - Memória do Projeto

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

### 2. Reset de Cores/Tema
**Causa:** Fallbacks manuais no frontend sobrescreviam o `localStorage` quando a API demorava a responder.
**Solução:** Removidos fallbacks agressivos. O backend agora é o mestre da aparência.

### 3. Crash "Function Invocation Failed" (Erro 500)
**Causa:** Tentativa de escrita em disco (`fs.writeFileSync`) no Vercel e importação de arquivos `.ts` do frontend pelo backend.
**Solução:** Proteção `if (IS_VERCEL)` em todas as funções de escrita e isolamento total das interfaces do backend.

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
Sempre que realizar um `POST` no Admin, espere o Toast de sucesso. Ele agora garante que o dado está seguro no Supabase, não apenas na memória temporária do site.

---
*Última atualização: 3 dias antes do lançamento.*