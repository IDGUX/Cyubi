# Contributing to Cyubi

Thank you for your interest in Cyubi! We value every kind of contribution — and **you don't need to write code** to make an impact.

---

## 🧠 Thinking is Contributing

Cyubi is an early-stage project with real architectural questions. If you have experience with security, compliance, or incident management, your perspective is more valuable than a pull request.

### Open Questions We'd Love Your Input On

1. **Report Format:** Should incident reports default to **Markdown**, **PDF**, or **both**?
2. **Metadata:** What metadata is truly essential for a forensic incident report? (e.g., IP, hostname, user-agent, geo?)
3. **Multi-Tenancy:** How should Cyubi handle isolation if an IT provider manages multiple clients?
4. **Hash Chain Anchoring:** Should we periodically anchor hash chain checkpoints to an external service (e.g., RFC 3161 timestamping)?
5. **Export Standards:** Should Cyubi support standard formats like CEF (Common Event Format) or STIX for interoperability?

👉 **How to share your thoughts:** Open an [Issue](https://github.com/IDGUX/Cyubi/issues) or start a [Discussion](https://github.com/IDGUX/Cyubi/discussions). Label it with `question` or `architecture`.

---

## 🐛 Bug Reports

Found something broken? Open an issue with:

- **What happened:** Clear description of the unexpected behavior
- **Steps to reproduce:** How to trigger it
- **Environment:** OS, Node.js version, Docker version (if applicable)
- **Logs:** Relevant console output or screenshots

---

## 💡 Feature Requests

Have an idea? Open an issue with:

- **Use Case:** What problem does it solve?
- **Target User:** Who benefits?
- **Rough Idea:** How might it work? (no code needed)

---

## 🔧 Code Contributions

Want to contribute code? Great!

### Setup

```bash
git clone https://github.com/IDGUX/Cyubi.git
cd Cyubi
npm install
npx prisma db push
npm run dev
```

### Guidelines

- **Keep it simple.** Cyubi is deliberately minimal. Before adding complexity, ask: "Does an SMB admin need this?"
- **No new dependencies** without discussion. Open an issue first.
- **TypeScript only.** All new code must be typed.
- **Commit messages:** Use conventional format: `feat:`, `fix:`, `docs:`, `refactor:`

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`feat/my-feature`)
3. Make your changes
4. Ensure `npm run build` passes
5. Open a PR with a clear description of what and why

---

## 📜 Code of Conduct

Be respectful, be constructive, be curious. We're building something useful — together.

---

## 📬 Questions?

Open a [Discussion](https://github.com/IDGUX/Cyubi/discussions) or reach out at [datadus.at](https://datadus.at).
