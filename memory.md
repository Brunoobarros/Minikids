# 🧠 Mini Kids - Memória do Projeto

Este documento serve como a "Fonte Única da Verdade" para o estado técnico, arquitetural e conceitual da aplicação.

## 🚀 Visão Geral
E-commerce interativo e lúdico de roupas de bebê, moda infantil, brinquedos e acessórios.
- **Frontend:** React + Tailwind CSS (v4) + Vite + Lucide Icons + Motion.
- **Backend:** Node.js + Express (Serverless no Vercel).
- **Banco de Dados:** Supabase (PostgreSQL).
- **Integrações:** Mercado Pago (Checkout Transparente: PIX e Cartão) e Google Gemini (IA para descrições de produtos e Consultora de Estilo Virtual).
- **Aparência Padrão:** Rosa/coral vibrante (`#ff4f79`), ciano alegre (`#06b6d4`), fundo creme suave (`#fffdf9`) e fonte arredondada infantil **Quicksand**.

## 🧸 Recursos Interativos (Kids-Friendly)
1. **Mascote Solzinho "Mini":** Mascote flutuante no canto da tela. Ao clicar, interage com piadas e diálogos fofos.
2. **Jogo dos Balões Mágicos:** Jogo interativo onde balões sobem pela tela. Ao estourar 3 balões, o usuário ganha o cupom de 10% OFF `MINIKIDS10`.
3. **Efeito Confete:** Animação de confetes ao adicionar itens à sacola e finalizar compras.
4. **Grade de Tamanhos Dinâmica:** Adaptada para ler a grade real do produto (ex: `RN`, `3-6m`, `1a`, `2a`, `4a`), descartando os tamanhos rígidos de adulto.
5. **Solzinho AI:** Chatbot integrado que responde com o tom alegre do Solzinho (mascote), sugerindo combinações fofas de roupinhas e sapatos para crianças.

## 🛠️ Arquitetura de Persistência (Crítico)
A aplicação foi projetada para lidar com a natureza **Stateless** do Vercel:
1. **Ambiente Local:** Utiliza arquivos `.json` (`products.json`, etc.) para cache rápido e sementes iniciais.
2. **Produção (Vercel):** O sistema de arquivos é **Read-Only**. Toda persistência deve ser confirmada no **Supabase** antes da resposta da API.
3. **Sincronização:** Rotas `GET` sincronizam prioritariamente com o Supabase para evitar resets na RAM.

## 🔴 Problemas Resolvidos (Lessons Learned)

### 1. Reset de Dados no Vercel (F5)
**Solução:** Implementado `await syncFromSupabase()` dentro das rotas de `GET` e garantido que as operações de escrita aguardem o `upsert` no banco antes de retornar status `200 OK`.

### 2. Piscar de Cores (Flash Visual)
**Solução:** Removidos fallbacks agressivos e adicionada persistência das configurações de aparência no `localStorage` após a primeira carga, mantendo o tema de cores creme e rosa logo no início do boot.

### 3. Exposição de Senhas e Usabilidade de Login
**Solução:** Atualizada a senha do administrador do painel para `minikids2026*` (com email `admin@minikids.com.br`) e habilitado envio de formulário com a tecla "Enter".

### 4. Grade Rígida de Tamanhos
**Solução:** Removido o mapeamento estático de `P, M, G, GG` nos cards de produto e detalhes. Agora os tamanhos são carregados 100% dinamicamente a partir das opções cadastradas no banco de dados.

## 📊 Esquema do Banco (Supabase)
- `products`: IDs, Preços, Estoque, Imagens (JSONB), Tamanhos (JSONB), Cores (JSONB), Reviews (JSONB).
- `banners`: Imagem, link de redirecionamento de categoria, título e subtítulo.
- `orders`: Dados do cliente, status do pagamento e itens comprados.
- `appearance`: Configuração global de cores e fontes da loja (ID fixo: `default`).

## 📋 Checklist para Apresentação
- [ ] **Banco:** Executar SQL para criar tabelas e carregar a semente infantil inicial.
- [ ] **Cupom:** Testar fluxo de estouro de balões mágicos e verificação do cupom `MINIKIDS10` na sacola.
- [ ] **IA:** Testar geração automática de descrição de roupinha com o Gemini e chat interativo com o Solzinho AI.
- [ ] **Pix / Cartão:** Validar checkout simulado de pagamento com toast de sucesso.

---
*Última atualização: 2026-06-06*