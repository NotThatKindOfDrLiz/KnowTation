# KnowTation

> Own your sources. Organize your knowledge.

---

## 🚀 Overview

**KnowTation** is a lightweight, privacy-first, Nostr-native reference management system.  
Designed for researchers, writers, and communities who value freedom, portability, and trust.

With KnowTation, you can create, organize, and selectively share your citations — fully owned by you, fully decentralized.

---

## 🛠 Features

- Add, edit, and manage your reference library
- Public/Private visibility controls for each reference
- Private notes encrypted client-side
- Local-first, offline-capable design
- Search and filter references by Author, Tag, Year, Visibility
- Export to BibTeX (coming soon)
- Import from BibTeX (coming soon)
- Publish public references to Nostr (`kind: 50000`)
- Encrypted storage of private references on Nostr relays (`kind: 50001`)

---

## 📡 Nostr Integration

- **Public References**:  
  Published as `kind: 50000` events, including title, authors, year, tags, DOI.

- **Private References**:  
  Stored encrypted client-side and posted as `kind: 50001` events.

- **Unpublishing**:  
  Supports retraction via `kind: 5` deletion events.

---

## 📦 Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- nostr-tools
- Client-side AES encryption
- mkstack + Goose scaffolded

---

## 🗂 Folder Structure

src/
├── assets/ 
├── components/ 
├── pages/ 
├── services/ 
├── utils/ 
├── types/ 
App.tsx 
AppRouter.tsx 
main.tsx

---

## 🔗 Full License Text:

[https://creativecommons.org/licenses/by-nc/4.0/](https://creativecommons.org/licenses/by-nc/4.0/)

---

## 🛠 Tools & Frameworks

**Built with love using:**

- [mkstack](https://mkstack.xyz/) — Rapid Nostr app scaffolding
- [Goose](https://github.com/Blockxyz/goose) — AI-assisted code generation
- [React](https://react.dev/) — Declarative UI library
- [TypeScript](https://www.typescriptlang.org/) — Typed JavaScript
- [Vite](https://vitejs.dev/) — Lightning-fast build tool
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling framework
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) — Core client tools for working with Nostr
- [Surge](https://surge.sh) — Simple, static web publishing

