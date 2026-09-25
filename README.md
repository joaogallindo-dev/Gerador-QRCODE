# Gerador-QRCODE

Gerador de QR Code completo, com múltiplos tipos de conteúdo, personalização visual e exportação — evolução do projeto original "Gerador-QRCODE".

## Estrutura do projeto

```
qrcode-studio/
├── index.html          # marcação e estrutura da página
├── css/
│   └── style.css        # tema, layout, animações
├── js/
│   └── app.js            # toda a lógica da aplicação
├── data/
│   └── config.json       # tipos de QR Code, campos do formulário, presets de cor
├── assets/
│   └── favicon.png
└── README.md
```

## Funcionalidades

- **7 tipos de QR Code**: Link, Texto, Wi-Fi, Contato (vCard), E-mail, Telefone e WhatsApp — cada um com seu próprio formulário, gerado dinamicamente a partir de `data/config.json`.
- **Geração ao vivo**: o QR Code é atualizado automaticamente enquanto você digita (com debounce), sem precisar clicar em nada.
- **Personalização**: cor de frente/fundo (presets prontos ou seletor de cor livre), tamanho ajustável e nível de correção de erro (L/M/Q/H).
- **Logo central**: opção de sobrepor uma imagem/logo no meio do QR Code (usa correção de erro alta automaticamente recomendada em H para manter a leitura).
- **Exportação**: baixar em PNG ou SVG, copiar a imagem para a área de transferência, copiar o conteúdo bruto.
- **Tema claro/escuro** com persistência da preferência do usuário.
- **Animações**: linha de varredura no topo, transições ao trocar de tipo, entrada suave do QR Code gerado, feedback com toasts em vez de `alert()`.
- **Acessível e responsivo**: foco visível, `aria-selected` nas abas, layout centralizado que se adapta de celular a desktop, respeita `prefers-reduced-motion`.

## Como usar

Basta abrir `index.html` no navegador. Não é necessário build nem instalação.

> Se `data/config.json` não puder ser carregado (por exemplo, ao abrir o arquivo diretamente via `file://` em alguns navegadores, que bloqueiam `fetch` local), o app usa automaticamente uma cópia de segurança dos mesmos dados incluída em `js/app.js`, então tudo continua funcionando normalmente. Para ter certeza de que o `config.json` externo é usado (útil se você quiser editar os tipos de QR Code sem mexer no JS), sirva a pasta com um servidor local simples, por exemplo:
>
> ```bash
> npx serve .
> # ou
> python3 -m http.server
> ```

## Personalizando

- **Adicionar um novo tipo de QR Code**: edite `data/config.json`, adicione um objeto em `qrTypes` com `id`, `label`, `icon` (veja os ícones disponíveis em `ICONS` no `app.js`), `fields` e `build` (o nome da função em `BUILDERS`, em `js/app.js`, que monta o texto final do QR Code). Se `build` for um tipo novo, crie a função correspondente em `BUILDERS`.
- **Adicionar presets de cor**: edite o array `colorPresets` em `data/config.json`.
- **Ajustar o visual**: as cores, espaçamentos e raios de borda ficam centralizados em variáveis CSS no topo de `css/style.css` (`:root` e `body[data-theme="light"]`).

## Bibliotecas usadas

- [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator) — geração dos módulos do QR Code (via CDN).
- Fontes: Space Grotesk (títulos) e Inter (texto), via Google Fonts.

Nenhuma outra dependência externa é necessária — a exportação em PNG/SVG e a cópia para área de transferência usam APIs nativas do navegador (`canvas`, `Blob`, `Clipboard API`).

---
Desenvolvido por João Galindo.
