# Security Policy & Responsible Disclosure

Shoppage (Pty) Ltd operates a zero-tolerance policy towards unmitigated security vulnerabilities across our distributed commerce intelligence platform, merchant operating systems, and public edge services.

---

## 1. Reporting a Vulnerability

If you discover a security vulnerability within any Shoppage code repository, API endpoint, or infrastructure component, please report it promptly to our security engineering team:

* **Email**: security@shoppage.co.za
* **Response Time**: Initial acknowledgment within 24 hours; severity assessment and triage update within 72 hours.
* **Coordination**: We request that you observe responsible disclosure principles and do not disclose vulnerabilities publicly until a patch has been verified and deployed.

---

## 2. Secrets & Credential Management Policy

1. **Zero Hardcoded Secrets**:
   - Production secrets, signing keys, and API tokens (PAYLOAD_SECRET, DATABASE_URI, REDIS_URL, external sweeper tokens) must never be committed to source control.
   - All runtime environments inject secrets through encrypted secrets managers (e.g. Dokploy encrypted environment storage, HashiCorp Vault, or AWS Secrets Manager).

2. **Automated Key Rotation & Git Audits**:
   - Continuous integration workflows enforce secret scanning prior to deployment.
   - Any leaked or exposed credential must be immediately invalidated at the provider level and rotated across active deployments.

---

## 3. Network Transport & Edge Hardening

* **Strict Transport Security (HSTS)**: All production domains enforce Strict-Transport-Security: max-age=31536000; includeSubDomains; preload.
* **Cookie & Session Hygiene**: All authentication and CSRF session cookies enforce SameSite=Lax, Secure=True, and HttpOnly flags where applicable.
* **Header Policies**:
  - X-Frame-Options: DENY (prevents clickjacking attacks)
  - X-Content-Type-Options: nosniff (prevents MIME sniffing)
  - Referrer-Policy: origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()

---

## 4. Architecture & Access Control

* **Headless CMS & Operations Authority**: Powered by Payload CMS 3.0 on Next.js 16 with role-based access control (RBAC) governing merchant and super-admin collections.
* **0% Take-Rate Isolation**: Shoppage does not process or hold buyer credit cards or merchant payment funds directly in checkout flows (transactions route merchant-buyer directly via WhatsApp or verified merchant POS gateways), minimizing PCI-DSS scope and liability.
* **Rate Limiting & DoS Mitigation**: Edge and API gateway rate-limiting policies govern search omnibox endpoints and AI inference requests.

---

## 5. Security Updates & Audits

| Date | Scope | Status |
| :--- | :--- | :--- |
| **Q3 2026** | Secret sanitization, HTTP security headers, CI quality test gates | **Enforced** |
| **Q3 2026** | Deprecation of legacy Django backend in favor of Payload CMS 3.0 & @shoppage/kernel | **Completed** |

For general inquiries regarding compliance, enterprise verification, or audit reports, contact compliance@shoppage.co.za.
