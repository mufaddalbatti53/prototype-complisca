import os
from pathlib import Path
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
import datetime

class InspectionReportGenerator:
    @staticmethod
    def generate_pdf_report(inspection_data: dict, output_path: str) -> str:
        """
        Generates an official Legal Metrology Notice of Inspection & Seizure Report PDF.
        """
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom typography styles
        title_style = ParagraphStyle(
            'GovTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=18,
            textColor=colors.HexColor('#0B132B'),
            alignment=1
        )
        subtitle_style = ParagraphStyle(
            'GovSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#3A506B'),
            alignment=1
        )
        section_style = ParagraphStyle(
            'GovSection',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1C2541'),
            spaceBefore=10,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            'GovBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#222222')
        )
        bold_body_style = ParagraphStyle(
            'GovBodyBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph("<b>GOVERNMENT OF INDIA</b>", title_style))
        story.append(Paragraph("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", subtitle_style))
        story.append(Paragraph("DEPARTMENT OF LEGAL METROLOGY — ENFORCEMENT DIVISION", subtitle_style))
        story.append(Paragraph("<b>INSPECTION CUM NOTICE OF NON-COMPLIANCE</b>", ParagraphStyle('SubSub', parent=title_style, fontSize=12, leading=15, textColor=colors.HexColor('#8B0000'))))
        story.append(Paragraph("<i>Issued under Section 15 & 18 of Legal Metrology Act, 2009 read with LMPC Rules, 2011</i>", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0B132B'), spaceBefore=2, spaceAfter=8))

        # 2. Metadata Grid
        notice_no = inspection_data.get("notice_number") or f"LMPC-INSP-{datetime.datetime.now().strftime('%Y%m%d%H%M')}"
        created_at_str = datetime.datetime.now().strftime("%d-%b-%Y %H:%M:%S IST")
        
        verdict = inspection_data.get("compliance_verdict", "NON_COMPLIANT")
        verdict_color = colors.HexColor('#E74C3C') if verdict == "NON_COMPLIANT" else (colors.HexColor('#F39C12') if verdict == "WARNING" else colors.HexColor('#2ECC71'))

        meta_data = [
            [
                Paragraph("<b>Notice / Memo Ref No:</b>", bold_body_style),
                Paragraph(f"<b>{notice_no}</b>", body_style),
                Paragraph("<b>Inspection Date:</b>", bold_body_style),
                Paragraph(created_at_str, body_style)
            ],
            [
                Paragraph("<b>Inspector ID & Name:</b>", bold_body_style),
                Paragraph(f"{inspection_data.get('inspector_id', 'OFFICER-DL-2026-084')} ({inspection_data.get('inspector_name', 'Field Officer')})", body_style),
                Paragraph("<b>Inspection Location:</b>", bold_body_style),
                Paragraph(inspection_data.get("location", "New Delhi, India"), body_style)
            ],
            [
                Paragraph("<b>Inspected Entity/Store:</b>", bold_body_style),
                Paragraph(inspection_data.get("store_name", "Retail Store Sample"), body_style),
                Paragraph("<b>Overall Verdict:</b>", bold_body_style),
                Paragraph(f"<b><font color='{verdict_color.hexval()}'>{verdict}</font></b> (Score: {inspection_data.get('overall_compliance_score', 0)}%)", bold_body_style)
            ],
            [
                Paragraph("<b>Product / Brand:</b>", bold_body_style),
                Paragraph(f"{inspection_data.get('product_name', 'Packaged Commodity')} ({inspection_data.get('brand', 'Unknown')})", body_style),
                Paragraph("<b>PDP Area (sq. cm):</b>", bold_body_style),
                Paragraph(f"{inspection_data.get('pdp_area_sqcm', 100.0)} cm²", body_style)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[120, 160, 110, 130])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F4F6F9')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#D0D7DE')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E1E4E8')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # 3. Declarations Audit Table
        story.append(Paragraph("<b>MANDATORY DECLARATIONS AUDIT MATRIX (LMPC RULES, 2011)</b>", section_style))
        
        declarations = inspection_data.get("declarations", [])
        decl_rows = [
            [
                Paragraph("<b>Mandatory Clause</b>", bold_body_style),
                Paragraph("<b>Rule Reference</b>", bold_body_style),
                Paragraph("<b>Detected Content</b>", bold_body_style),
                Paragraph("<b>Font (mm)</b>", bold_body_style),
                Paragraph("<b>Status</b>", bold_body_style),
                Paragraph("<b>Findings & Violation Reason</b>", bold_body_style)
            ]
        ]

        for d in declarations:
            st = d.get("compliance_status", "COMPLIANT").upper()
            status_font_color = "#E74C3C" if st == "VIOLATION" else ("#F39C12" if st == "WARNING" else "#2ECC71")
            
            detected = d.get("detected_value") or "<font color='#999999'>[MISSING]</font>"
            if len(detected) > 60:
                detected = detected[:57] + "..."

            reason = d.get("violation_description") or "Satisfies statutory requirements."
            if len(reason) > 100:
                reason = reason[:97] + "..."

            font_h = f"{d.get('measured_font_height_mm', '-')}" if d.get('measured_font_height_mm') else "-"

            decl_rows.append([
                Paragraph(d.get("field_name", ""), body_style),
                Paragraph(d.get("statutory_rule_ref", ""), body_style),
                Paragraph(detected, body_style),
                Paragraph(font_h, body_style),
                Paragraph(f"<b><font color='{status_font_color}'>{st}</font></b>", body_style),
                Paragraph(reason, body_style)
            ])

        decl_table = Table(decl_rows, colWidths=[110, 65, 120, 45, 60, 120])
        decl_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1C2541')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOTTOMPADDING', (0,0), (-1,0), 5),
            ('TOPPADDING', (0,0), (-1,0), 5),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#D0D7DE')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E1E4E8')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,1), (-1,-1), 3),
            ('BOTTOMPADDING', (0,1), (-1,-1), 3),
        ]))
        story.append(decl_table)
        story.append(Spacer(1, 10))

        # 4. Packaging Photographic Evidence (if image exists)
        images = inspection_data.get("images", [])
        annotated_img_path = None
        if images and len(images) > 0:
            first_img = images[0]
            annotated_img_path = first_img.get("annotated_path") or first_img.get("preprocessed_path") or first_img.get("original_path")

        if annotated_img_path and os.path.exists(annotated_img_path):
            try:
                story.append(Paragraph("<b>PHOTOGRAPHIC EVIDENCE & SPATIAL BOUNDING BOX OVERLAY</b>", section_style))
                story.append(RLImage(annotated_img_path, width=4.8*inch, height=2.8*inch))
                story.append(Spacer(1, 8))
            except Exception:
                pass

        # 5. Statutory Warnings & Legal Notice
        story.append(Paragraph("<b>STATUTORY NOTICE & LEGAL IMPLICATIONS:</b>", section_style))
        legal_text = (
            "1. <b>Contravention of Section 18:</b> Any manufacturer, packer or importer who sells or offers for sale "
            "any pre-packaged commodity not in conformity with the Legal Metrology (Packaged Commodities) Rules, 2011 "
            "is punishable under Section 36 of the Legal Metrology Act, 2009.<br/>"
            "2. <b>Penal Provisions:</b> Fine up to ₹25,000 for first offence, ₹50,000 for second offence, and imprisonment up to "
            "one year for subsequent offences.<br/>"
            "3. <b>Direction:</b> The noticee is hereby directed to show cause within <b>15 days</b> of receipt of this notice as to "
            "why legal proceedings under Section 36/39 should not be initiated."
        )
        story.append(Paragraph(legal_text, body_style))
        story.append(Spacer(1, 15))

        # 6. Signatures
        sig_data = [
            [
                Paragraph("<b>Signature of Noticee / Representative:</b><br/><br/>___________________________<br/>Date:", body_style),
                Paragraph("<b>Authorized Enforcement Officer:</b><br/><br/><i>Digitally Verified & Logged</i><br/>Inspectorate of Legal Metrology", body_style)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[260, 260])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(KeepTogether([sig_table]))

        doc.build(story)
        return output_path
