"""
Script to generate 'Proposed-structure-hackathon.pdf' for AIORI Hackathon 3 (Problem Statement PS-019).
"""

import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_submission_pdf(output_path: Path):
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        alignment=0,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0284c7"),
        spaceAfter=8
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'CodeStyleCustom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeaderCustom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCellCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    disclaimer_style = ParagraphStyle(
        'DisclaimerCustom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#7c2d12")
    )

    story = []

    # Title & Header
    story.append(Paragraph("AIORI Hackathon 3 — Proposed Project Structure", title_style))
    story.append(Paragraph("Problem Statement PS-019: Personal-Data Discovery and Privacy Evidence Inventory | Category: Cybersecurity", subtitle_style))
    story.append(Paragraph("<b>Project:</b> PrivacyLens &nbsp;|&nbsp; <b>Deliverable:</b> Proposed-structure-hackathon.pdf &nbsp;|&nbsp; <b>Framework:</b> MeitY Data Protection & DPDP Act 2023", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=10))

    # 1. Executive Summary & Challenge
    story.append(Paragraph("1. Executive Summary & Problem Challenge Alignment", h2_style))
    story.append(Paragraph(
        "Modern enterprise systems routinely accumulate Personally Identifiable Information (PII) across unindexed spreadsheets, operational dumps, and legacy database tables without verifiable documentation. "
        "<b>PrivacyLens</b> addresses this governance gap by implementing an automated, evidence-driven scanner that inspects synthetic CSV files and relational SQLite databases. "
        "The system identifies candidate personal-data fields across five predefined data classes, links them to declared business purpose and statutory retention metadata, and generates an auditable privacy evidence inventory for human-in-the-loop review without making automated legal compliance decisions.",
        body_style
    ))

    # 2. Key System Architecture & Technology Stack
    story.append(Paragraph("2. Proposed System Architecture & Core Components", h2_style))
    arch_data = [
        [Paragraph("Component", table_header_style), Paragraph("Technology", table_header_style), Paragraph("Architectural Role & Scope", table_header_style)],
        [Paragraph("Frontend UI", table_cell_style), Paragraph("React 18, TypeScript, Tailwind CSS, Lucide", table_cell_style), Paragraph("Slate/Navy cybersecurity interface with 9 workflows: Dashboard, Data Sources, Scanner, Inventory, Metadata, Gaps, Review Center, Evaluation, and Rules.", table_cell_style)],
        [Paragraph("Backend API", table_cell_style), Paragraph("FastAPI, Uvicorn, Pydantic v2", table_cell_style), Paragraph("High-throughput REST API with safe file ingestion, memory PII redaction, background scan execution, and export generation.", table_cell_style)],
        [Paragraph("Data Connectors", table_cell_style), Paragraph("CSVConnector, SQLiteConnector (Pandas)", table_cell_style), Paragraph("Read-only URI connection mode (mode=ro), schema inspection, non-null sampling, and memory protection (MAX_SAMPLE_ROWS).", table_cell_style)],
        [Paragraph("Detection Engine", table_cell_style), Paragraph("RulesEngine, ScannerEngine, PyYAML", table_cell_style), Paragraph("Multi-signal scoring: Column header regex (W_col), Value pattern match ratio (W_val), and format/plausibility validators (W_fmt).", table_cell_style)],
        [Paragraph("Evidence Register", table_cell_style), Paragraph("MetadataManager, SQLite (privacylens.db)", table_cell_style), Paragraph("Tri-part compound mapping (dataset, table, column) preventing ambiguous assignments, flagging missing purpose/retention.", table_cell_style)],
        [Paragraph("Evaluation Unit", table_cell_style), Paragraph("AccuracyEvaluator, Scikit-Learn standard", table_cell_style), Paragraph("Transparent benchmark scoring on labelled test set (50+ samples) calculating TP, FP, FN, Precision, Recall, and F1.", table_cell_style)]
    ]
    t_arch = Table(arch_data, colWidths=[100, 140, 300])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    # 3. Predefined 5 Data Classes
    story.append(Paragraph("3. Predefined Five Personal Data Classes & Configurable Rules", h2_style))
    classes_data = [
        [Paragraph("Data Class", table_header_style), Paragraph("Header Signals & Negative Controls", table_header_style), Paragraph("Value Syntax & Format Validators", table_header_style)],
        [Paragraph("1. Person Name", table_cell_style), Paragraph("Regex: first_name, last_name, cust_name, etc.<br/>Negative: company_name, product_name, file_name", table_cell_style), Paragraph("Multi-word alphabetic regex, alphabetic density > 75%, character length boundaries (2-60 chars).", table_cell_style)],
        [Paragraph("2. Email Address", table_cell_style), Paragraph("Regex: email, work_email, contact_email<br/>Negative: mailbox_id, mailer_daemon, template", table_cell_style), Paragraph("RFC-compliant email pattern, single @ symbol check, valid TLD segment length >= 2.", table_cell_style)],
        [Paragraph("3. Phone Number", table_cell_style), Paragraph("Regex: phone, mobile, contact_no, tel_no<br/>Negative: imei, ip_address, serial, order_no, zip_code", table_cell_style), Paragraph("Indian 10-digit mobile (+91/0 starting 6-9) & E.164 formats, non-digit stripping, repetitive dummy filter.", table_cell_style)],
        [Paragraph("4. Government ID", table_cell_style), Paragraph("Regex: aadhaar, uidai, pan, ssn, gov_id<br/>Negative: session_id, uuid, transaction_id, order_id", table_cell_style), Paragraph("Aadhaar 12-digit format (cannot start with 0/1), Indian PAN (5 letters, 4 digits, 1 letter), US SSN format.", table_cell_style)],
        [Paragraph("5. Date of Birth", table_cell_style), Paragraph("Regex: dob, date_of_birth, birth_date<br/>Negative: created_at, updated_at, order_date, timestamp", table_cell_style), Paragraph("ISO/standard date parsing, age plausibility check (0 to 125 years), automatic rejection of future dates.", table_cell_style)]
    ]
    t_classes = Table(classes_data, colWidths=[90, 220, 230])
    t_classes.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0284c7")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_classes)
    story.append(Spacer(1, 8))

    # 4. Pseudocode Snippet
    story.append(Paragraph("4. Multi-Signal Detection Algorithm Pseudocode (Mentor Deliverable)", h2_style))
    pseudocode_lines = [
        "ALGORITHM ScanColumnForPersonalData(col_name, sample_vals, rules):",
        "  best_candidate = NULL, max_conf = 0.0",
        "  FOR EACH (class_name, class_def) IN rules.classes:",
        "    // 1. Column Signal (with explicit negative suppression)",
        "    matched_col = AnyRegexMatch(class_def.column_patterns, col_name)",
        "    neg_col = AnyRegexMatch(class_def.negative_column_patterns, col_name)",
        "    col_score = 0.0 IF neg_col ELSE (1.0 IF matched_col ELSE 0.0)",
        "    // 2. Sample Value Match Ratio",
        "    matched_vals = CountMatching(class_def.value_patterns, sample_vals)",
        "    val_ratio = matched_vals / Length(sample_vals) IF sample_vals ELSE 0.0",
        "    // 3. Domain Format & Plausibility Validation",
        "    valid_count = CountValid(class_def.validator, sample_vals)",
        "    fmt_ratio = valid_count / Length(sample_vals) IF sample_vals ELSE 0.0",
        "    // 4. Weighted Confidence Combination",
        "    conf = (col_score * W_col) + (val_ratio * W_val) + (fmt_ratio * W_fmt)",
        "    IF conf >= rules.threshold AND conf > max_conf:",
        "      max_conf = conf, best_candidate = Candidate(class_name, conf, MaskSample(sample_vals))",
        "  RETURN best_candidate"
    ]
    p_code = "<br/>".join(pseudocode_lines)
    story.append(Table(
        [[Paragraph(p_code, code_style)]],
        colWidths=[540],
        style=[
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]
    ))
    story.append(Spacer(1, 8))

    # 5. Metadata Mapping & Evidence Gap Report
    story.append(Paragraph("5. Metadata Mapping, Evidence Gap Detection & Audit Exports", h2_style))
    story.append(Paragraph(
        "To satisfy the core requirement of linking fields to purpose and retention without legal guesswork: "
        "<br/>• <b>Compound Key Matching:</b> Exact triple resolution <code>(dataset_name, table_name, column_name)</code> resolves ambiguity when common column names (e.g. <code>id</code> or <code>email</code>) appear across different tables. "
        "<br/>• <b>Gap Classification:</b> Detections are automatically audited against declared registries and flagged with states: <i>Complete metadata</i>, <i>Missing purpose</i>, <i>Missing retention</i>, <i>Missing both</i>, or <i>Ambiguous match</i>. "
        "<br/>• <b>Human-in-the-Loop Review:</b> Security analysts and DPOs can confirm or reject candidate detections, log audit notes, and download structured CSV and printable PDF inventory reports.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # 6. Evaluation Methodology
    story.append(Paragraph("6. Benchmark Evaluation & Precision / Recall Metrics", h2_style))
    story.append(Paragraph(
        "PrivacyLens includes a synthetic benchmark dataset (<code>sample_data/labelled_test_set.csv</code>) containing over 50 ground-truth annotated fields across all 5 classes as well as non-personal negative controls (e.g. <code>created_at</code>, <code>quantity</code>, <code>company_name</code>). "
        "The automated evaluation engine computes True Positives (TP), False Positives (FP), False Negatives (FN), True Negatives (TN), per-class Precision, Recall, and F1 scores, and Macro Averages in compliance with standard Scikit-Learn evaluation protocols.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # 7. Regulatory Scope & Legal Disclaimers
    story.append(Paragraph("7. Technical Evidence vs. Legal Interpretation Boundary", h2_style))
    disclaimer_box = (
        "<b>Important Technical & Legal Disclaimer (AIORI PS-019 Requirement):</b><br/>"
        "PrivacyLens is an engineering discovery tool that produces transparent technical evidence for human review. "
        "In strict adherence to the problem statement requirements, the system DOES NOT make automatic lawful-basis determinations, "
        "infer universal cross-system data flows, or provide automated statutory compliance certificates under the DPDP Act 2023 or GDPR. "
        "All candidate detections and metadata gaps require validation by qualified human privacy professionals or Data Protection Officers (DPOs)."
    )
    story.append(Table(
        [[Paragraph(disclaimer_box, disclaimer_style)]],
        colWidths=[540],
        style=[
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fff7ed")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#fdba74")),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]
    ))

    doc.build(story)
    print(f"[+] Successfully generated submission PDF at: {output_path}")

if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "Proposed-structure-hackathon.pdf"
    generate_submission_pdf(out)

