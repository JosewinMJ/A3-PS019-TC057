import io
import datetime
import pandas as pd
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from backend.app.models.models import ScanResult, Dataset, ScanJob
from backend.app.metadata.manager import MetadataManager

class ReportGenerator:
    @staticmethod
    def get_inventory_records(db: Session) -> List[Dict[str, Any]]:
        results = db.query(ScanResult).order_by(ScanResult.created_at.desc()).all()
        records = []
        for r in results:
            meta, meta_status = MetadataManager.match_metadata(
                db, r.dataset_name, r.table_name, r.column_name
            )
            records.append({
                "id": r.id,
                "dataset_name": r.dataset_name,
                "source_type": r.source_type,
                "table_name": r.table_name or "N/A",
                "column_name": r.column_name,
                "candidate_class": r.candidate_class,
                "confidence_score": round(r.confidence_score, 3),
                "review_status": r.review_status,
                "declared_purpose": meta.declared_purpose if meta else "",
                "retention_period": meta.retention_period if meta else "",
                "metadata_owner": meta.metadata_owner if meta else "",
                "metadata_status": meta_status,
                "evidence_summary": r.evidence_summary,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return records

    @staticmethod
    def generate_inventory_csv(db: Session) -> str:
        records = ReportGenerator.get_inventory_records(db)
        if not records:
            return "id,dataset_name,source_type,table_name,column_name,candidate_class,confidence_score,review_status,declared_purpose,retention_period,metadata_owner,metadata_status,evidence_summary,created_at\n"
        df = pd.DataFrame(records)
        return df.to_csv(index=False)

    @staticmethod
    def generate_gaps_csv(db: Session) -> str:
        records = ReportGenerator.get_inventory_records(db)
        # Filter records with evidence gaps
        gap_records = [
            r for r in records
            if r["metadata_status"] in ("Missing purpose", "Missing retention", "Missing both", "Ambiguous metadata match")
            or r["review_status"] == "PENDING"
            or r["confidence_score"] < 0.70
        ]
        if not gap_records:
            return "id,dataset_name,table_name,column_name,candidate_class,confidence_score,review_status,metadata_status,evidence_summary,identified_gap\n"
        
        enriched_gaps = []
        for g in gap_records:
            gaps_found = []
            if g["metadata_status"] != "Complete metadata":
                gaps_found.append(f"Metadata Gap: {g['metadata_status']}")
            if g["review_status"] == "PENDING":
                gaps_found.append("Human Review Pending")
            if g["confidence_score"] < 0.70:
                gaps_found.append("Borderline Confidence Detection (<0.70)")
            
            item = dict(g)
            item["identified_gap"] = " | ".join(gaps_found)
            enriched_gaps.append(item)

        df = pd.DataFrame(enriched_gaps)
        return df.to_csv(index=False)

    @staticmethod
    def generate_inventory_pdf(db: Session) -> bytes:
        records = ReportGenerator.get_inventory_records(db)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=6
        )
        meta_style = ParagraphStyle(
            'ReportMeta',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=14
        )
        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor("#1e293b")
        )

        elements = [
            Paragraph("PrivacyLens — Personal-Data Discovery & Privacy Evidence Inventory", title_style),
            Paragraph(
                f"Generated: {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Total Candidates: {len(records)} | Technical Evidence Summary",
                meta_style
            ),
            Spacer(1, 10)
        ]

        # Table data headers
        table_data = [[
            Paragraph("<b>Dataset</b>", cell_style),
            Paragraph("<b>Table</b>", cell_style),
            Paragraph("<b>Column</b>", cell_style),
            Paragraph("<b>Data Class</b>", cell_style),
            Paragraph("<b>Conf</b>", cell_style),
            Paragraph("<b>Status</b>", cell_style),
            Paragraph("<b>Declared Purpose</b>", cell_style),
            Paragraph("<b>Retention</b>", cell_style),
            Paragraph("<b>Evidence Summary</b>", cell_style)
        ]]

        for r in records[:50]:  # Cap at 50 records for PDF legibility
            table_data.append([
                Paragraph(r["dataset_name"][:16], cell_style),
                Paragraph(r["table_name"][:14], cell_style),
                Paragraph(r["column_name"][:14], cell_style),
                Paragraph(r["candidate_class"].replace("_", " ").title(), cell_style),
                Paragraph(f"{r['confidence_score']:.2f}", cell_style),
                Paragraph(r["metadata_status"], cell_style),
                Paragraph((r["declared_purpose"] or "—")[:30], cell_style),
                Paragraph((r["retention_period"] or "—")[:15], cell_style),
                Paragraph(r["evidence_summary"][:45] + "...", cell_style),
            ])

        if len(table_data) == 1:
            table_data.append([Paragraph("No candidate personal data detected yet.", cell_style)] * 9)

        t = Table(table_data, colWidths=[80, 70, 75, 80, 40, 90, 110, 70, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)

        elements.append(Spacer(1, 15))
        disclaimer = Paragraph(
            "<b>Important Legal & Technical Disclaimer:</b> This report provides automated technical discovery evidence "
            "for human review and data governance audits. It does not constitute legal counsel or universal compliance certification.",
            ParagraphStyle('Disclaimer', parent=styles['Normal'], fontSize=7, textColor=colors.HexColor("#94a3b8"))
        )
        elements.append(disclaimer)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
