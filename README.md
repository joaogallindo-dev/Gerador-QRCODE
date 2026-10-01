# Gerador-QRCODE

Gerador de QR Code completo, com múltiplos tipos de conteúdo, personalização visual e exportação — evolução do projeto original "Gerador-QRCODE".

## Funcionalidades

- **7 tipos de QR Code**: Link, Texto, Wi-Fi, Contato (vCard), E-mail, Telefone e WhatsApp — cada um com seu próprio formulário, gerado dinamicamente a partir de `data/config.json`.
- **Geração ao vivo**: o QR Code é atualizado automaticamente enquanto você digita (com debounce), sem precisar clicar em nada.
- **Personalização**: cor de frente/fundo (presets prontos ou seletor de cor livre), tamanho ajustável e nível de correção de erro (L/M/Q/H).
- **Logo central**: opção de sobrepor uma imagem/logo no meio do QR Code (usa correção de erro alta automaticamente recomendada em H para manter a leitura).
- **Exportação**: baixar em PNG ou SVG, copiar a imagem para a área de transferência, copiar o conteúdo bruto.
- **Tema claro/escuro** com persistência da preferência do usuário.
- **Animações**: linha de varredura no topo, transições ao trocar de tipo, entrada suave do QR Code gerado, feedback com toasts em vez de `alert()`.
- **Acessível e responsivo**: foco visível, `aria-selected` nas abas, layout centralizado que se adapta de celular a desktop, respeita `prefers-reduced-motion`.

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
