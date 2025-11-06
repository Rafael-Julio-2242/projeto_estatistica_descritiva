# Estrutura do Projeto - Estatística Descritiva

## Árvore de Diretórios

```
projeto_estatistica_descritiva/
│
├── .git/                           # Controle de versão Git
├── .next/                          # Build do Next.js (gerado automaticamente)
├── node_modules/                   # Dependências npm
│
├── app/                            # Diretório principal da aplicação Next.js (App Router)
│   ├── favicon.ico                 # Ícone do site
│   ├── globals.css                 # Estilos globais
│   ├── layout.tsx                  # Layout principal da aplicação
│   └── page.tsx                    # Página inicial
│
├── components/                     # Componentes React reutilizáveis
│   └── ui/                         # Componentes de UI (shadcn/ui)
│       ├── button.tsx              # Componente de botão
│       ├── card.tsx                # Componente de card
│       ├── input.tsx               # Componente de input
│       ├── label.tsx               # Componente de label
│       ├── table.tsx               # Componente de tabela
│       └── tabs.tsx                # Componente de tabs
│
├── helpers/                        # Funções auxiliares
│   ├── extract-data.ts             # Extração de dados
│   └── json-convertions.ts         # Conversões JSON
│
├── lib/                            # Bibliotecas e utilitários
│   └── utils.ts                    # Funções utilitárias
│
├── .gitignore                      # Arquivos ignorados pelo Git
├── components.json                 # Configuração do shadcn/ui
├── eslint.config.mjs               # Configuração do ESLint
├── globals.d.ts                    # Declarações TypeScript globais
├── next.config.ts                  # Configuração do Next.js
├── next-env.d.ts                   # Tipos do Next.js (gerado automaticamente)
├── package.json                    # Dependências e scripts do projeto
├── package-lock.json               # Lock de versões das dependências
├── tsconfig.json                   # Configuração do TypeScript
└── README.md                       # Documentação do projeto
```

## Descrição dos Diretórios Principais

### 📁 `/app` - Aplicação Next.js
Diretório principal da aplicação usando o App Router do Next.js 15.
- **layout.tsx**: Define o layout base de todas as páginas
- **page.tsx**: Página inicial da aplicação
- **globals.css**: Estilos CSS globais (Tailwind CSS)

### 📁 `/components` - Componentes Reutilizáveis
Contém todos os componentes React da aplicação.
- **ui/**: Componentes de interface baseados em shadcn/ui (button, card, input, label, table, tabs)

### 📁 `/helpers` - Funções Auxiliares
Funções utilitárias para processamento de dados.
- **extract-data.ts**: Lógica de extração de dados
- **json-convertions.ts**: Conversões entre formatos JSON

### 📁 `/lib` - Bibliotecas e Utilitários
Funções compartilhadas e configurações de bibliotecas.
- **utils.ts**: Funções utilitárias gerais (ex: `cn` para classes CSS)

## Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| **components.json** | Configuração do sistema de componentes shadcn/ui |
| **eslint.config.mjs** | Regras de linting e qualidade de código |
| **next.config.ts** | Configurações do framework Next.js |
| **tsconfig.json** | Configurações do compilador TypeScript |
| **package.json** | Dependências, scripts e metadados do projeto |
| **.gitignore** | Arquivos e pastas ignorados pelo Git |

## Tecnologias Utilizadas

- ⚛️ **Next.js 15**: Framework React com App Router
- 📘 **TypeScript**: Linguagem com tipagem estática
- 🎨 **Tailwind CSS**: Framework CSS utility-first
- 🧩 **shadcn/ui**: Sistema de componentes acessíveis
- 📊 **xlsx**: Biblioteca para manipulação de arquivos Excel
- 🔧 **Radix UI**: Componentes primitivos acessíveis

## Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa o linter ESLint
```

---

**Estrutura criada para projeto de Estatística Descritiva**