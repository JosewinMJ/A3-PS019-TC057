# PrivacyLens — Technical Limitations & Security Considerations

## 1. Compliance & Legal Disclaimers

> [!IMPORTANT]
> **PrivacyLens provides technical evidence for human review; it does NOT provide legal advice or universal compliance certifications.**
> 
> The system automates candidate pattern discovery and metadata mapping. It does not certify legal basis under the Digital Personal Data Protection (DPDP) Act 2023, the General Data Protection Regulation (GDPR), HIPAA, or any other jurisdiction-specific privacy framework. A human data protection officer (DPO) or privacy legal counsel must review the technical findings.

---

## 2. Technical Scope & Limitations

### 1. Indian Aadhaar Format Validation
- **Current Capability:** Verifies candidate format conformance: 12 numeric digits, structured with or without standard 4-digit whitespace/hyphen separation, strictly enforcing UIDAI format rule that the first digit cannot be `0` or `1`.
- **Limitation:** Does not claim or execute live UIDAI server queries or official biometric authentication. Official UIDAI online verification requires licensed KYC agency access and is outside the scope of offline/local data inventory scanners.
- **Configurability:** Documented as candidate format validation in `rules.yaml` and frontend badges.

### 2. Sample-Based Inspection
- **Default Limit:** Inspects up to 100 non-null values per column (configurable via `MAX_SAMPLE_ROWS`).
- **Rationale:** Prevents memory exhaustion and enables sub-second scan speeds on large multi-gigabyte files.
- **Edge Case:** If an improperly structured column contains PII only in row 50,000, sample-based scanning may miss it unless full-table scanning is configured.

### 3. Encrypted or Binary Payloads
- Unstructured binary blobs (BLOBs), salted hashes, or encrypted columns (e.g. AES-256 encrypted fields) cannot be identified without schema annotations or decryption keys.

### 4. Database Connectors
- **Initial Implementation:** Full native support for SQLite files and local relational schemas.
- **Future Extensibility:** Architecture uses SQLAlchemy and connector interfaces designed for straightforward extension to PostgreSQL, MySQL, Snowflake, and Microsoft SQL Server.

---

## 3. Security & Privacy Safeguards

### 1. Synthetic Demonstration Data Only
- All demonstration datasets (`synthetic_customers.csv`, `synthetic_employees.csv`, `sample_enterprise.db`, `labelled_test_set.csv`) contain 100% fictional names, synthetic numbers, and test identifiers. No real individuals' data is used or stored.

### 2. Zero-Exposure Memory Redaction
- Raw sampled PII is never permanently stored in scan results or exported in reports.
- Redaction functions mask names (`J*** D**`), emails (`j***@example.com`), phone numbers (`+XX-XXXXX-1234`), Aadhaar numbers (`XXXX-XXXX-1234`), PAN (`AB*****4F`), and dates of birth (`****-**-15`).

### 3. Read-Only Database Sampling
- SQLite connections are opened exclusively with URI read-only flags (`mode=ro`).
- Queries are strictly parameterized. Table names are validated against `sqlite_master` before schema extraction to eliminate arbitrary SQL execution vulnerabilities.

### 4. Controlled Upload Storage & Path Traversal Defense
- Uploaded files are isolated inside `backend/uploads/` with UUID-prefixed filenames.
- Directory traversal sequences (`../`, `..\\`) are stripped using `Path(filename).name`.

### 5. Configurable Rule Isolation
- Rule YAML parsing uses `yaml.safe_load`.
- Executable Python statements or unsafe deserialization payloads are strictly forbidden.
- Regular expressions are validated and compiled in a sandboxed test pass before being loaded into the active scanner.
