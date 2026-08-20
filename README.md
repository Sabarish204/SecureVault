# SecureVault — Personal Credential & Card Vault

**SecureVault** is a modern, mobile-first, zero-knowledge, local-first personal credential vault built with modern Angular, Angular Material, and native W3C Web Cryptography APIs (`crypto.subtle`).

---

## 1. Technology Stack & Versions

| Layer / Technology | Specification & Version | Description |
|---|---|---|
| **Frontend Framework** | **Angular `v22.1.0`** | Standalone Components, Angular Signals, Reactive Forms, modern Router |
| **Component UI Library** | **Angular Material `v22.1.3`** | Material Design controls, dialogs, bottom sheets, snackbars |
| **Component Dev Kit** | **Angular CDK `v22.1.3`** | Layout, accessibility, overlays, and responsive breakpoints |
| **Language** | **TypeScript `~6.0.2`** | Strict type-checking, modern ECMAScript target |
| **Runtime & Package Manager** | **Node.js `v24.19.0` (LTS)** / **npm `11.17.0`** | High-performance modern JavaScript runtime |
| **Build & Dev Tooling** | **Angular CLI `v22.1.5`** (`@angular/build`) | High-speed Vite / esbuild application builder |
| **Unit Testing Engine** | **Vitest `v4.0.8`** + **jsdom `v28.0.0`** | Ultra-fast single-run & watch mode unit testing |
| **Cryptography Standard** | **Native W3C Web Crypto API (`crypto.subtle`)** | Zero third-party crypto dependencies: PBKDF2 (SHA-256, 600,000 iterations) + AES-256-GCM |
| **Styling & Design System** | **SCSS + CSS Custom Properties** | Glassmorphism, dark vault palette, responsive mobile touch targets |
| **Typography & Icons** | **Inter**, **JetBrains Mono**, **Material Symbols Outlined** | Crisp high-density font rendering for numbers and passwords |

---

## 2. Storage Mechanism & Limitations

SecureVault uses a **local-first, zero-plaintext architecture**. No sensitive credentials, card numbers, CVVs, PINs, or passwords are ever stored unencrypted.

### Storage Engine: IndexedDB (`secure_vault_db`)
All vault metadata and encrypted payloads are persisted locally in native browser **IndexedDB**:
* `vault_meta` Object Store: Contains salt, PBKDF2 iteration parameters, and encrypted zero-knowledge verification tokens.
* `vault_records` Object Store: Contains item IDs, category tags, masked previews, and **AES-256-GCM encrypted binary payloads**.

### Storage Quotas & Limits by Browser
Unlike `localStorage` (which is strictly capped at **5 MB** and stored synchronously in plaintext), **IndexedDB** is asynchronous, transactional, and provides generous storage:

| Browser / Platform | Maximum Storage Quota | Persistence Guarantee |
|---|---|---|
| **Google Chrome / Chromium / Edge** | **Up to 60% of available disk space** (typically dozens of Gigabytes) | High (persisted unless user clears browser site data) |
| **Mozilla Firefox** | **Up to 50% of free disk space** (up to 2 GB per origin group) | High (supports persistent storage request) |
| **Apple Safari (macOS / iOS)** | **1 GB initial quota** (prompts if exceeded) | *Note: Safari may evict data after 7 days if opened as a regular tab without user interaction unless installed as a PWA / added to Home Screen.* |

---

## 3. Capacity: Maximum Items & Details You Can Store

### Record Footprint
Each stored credential (Internet Banking account or Payment Card) includes:
* Metadata (UUID, category, timestamps, masked preview): `~300 bytes`
* AES-256-GCM Ciphertext + 12-byte IV + Auth Tag: `~700 to 1,200 bytes`
* **Total average size per record**: **~1 KB to 1.5 KB**

### Theoretical & Practical Capacity Limits

| Vault Category | Maximum Items Capacity | Practical Performance Guideline |
|---|---|---|
| **Internet Banking Accounts** | **100,000+ accounts** | Instant search & sub-millisecond filtering |
| **Credit Cards** | **100,000+ cards** | Full cardholder, Luhn-validated number, CVV, PIN, expiry |
| **Debit Cards** | **100,000+ cards** | Full bank debit details with ATM PIN |
| **Other / Custom Items** | **100,000+ items** | General credentials and secure notes |
| **Total Combined Vault Items** | **500,000+ items** (within a standard 500 MB - 1 GB browser quota) | Recommended up to 10,000 items in-memory for zero-latency UI |

---

## 4. Key Security Invariants

1. **Zero-Knowledge Master Password**: The master password is never stored or hashed in plaintext; a validation token encrypted under the derived master key verifies password correctness upon unlock.
2. **Volatile Key Memory**: The derived `CryptoKey` reference exists solely in volatile service memory and is dereferenced/zeroed immediately on vault lock.
3. **Inactivity Auto-Lock**: Automatically locks the vault after a configurable timeout (1, 3, 5, or 10 minutes) or upon background tab visibility change.
4. **Safe Clipboard Actions**: Zero-log clipboard copying with visual toast feedback and an automatic 30-second clipboard clearing timer.
5. **Masking by Default**: Passwords and card numbers are masked across all list and detail screens.

---

## 5. Development & Running Locally

### Development Server
```bash
# Start local development server on port 4200
npm start
# or
npx ng serve --port 4200
```
Open [http://localhost:4200/](http://localhost:4200/) in your browser.

### Running Automated Tests
```bash
# Run complete unit test suite (39 tests across 8 suites)
npm run test:ci
# or in watch mode
npm test
```

### Production Build
```bash
# Compile optimized production bundle
npm run build
```
The output will be generated in `dist/secure-vault/`.

---

## 6. Security Notice & Test Data Policy

> [!WARNING]
> **SAMPLE TEST DATA ONLY**: When testing or developing SecureVault, never input real banking credentials, real payment card numbers, or real PINs. Always use dummy test data (e.g. `demo.user`, `NOT-A-REAL-PASSWORD`, `4111111111111111`, CVV `123`, PIN `1234`).
