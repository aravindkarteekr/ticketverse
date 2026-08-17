#!/usr/bin/env python3
"""Customizes pandoc's default reference.docx to match the Scaler Neovarsity / Woolf
Applied Software Project Report format guidelines:
  - Margins: 1.25in left/right, 1in top/bottom
  - Body text: Times New Roman, 12pt, black, justified, 1.5 line spacing
  - Headings (chapter titles): Times New Roman, 14pt, bold, centered
  - Subheadings: Times New Roman, 14pt, bold, left-aligned
  - Table captions/List of Tables: single-spaced
Run after `pandoc --print-default-data-file reference.docx > template/reference.docx`.
"""
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn

doc = Document("template/reference.docx")

# --- Page margins ---
for section in doc.sections:
    section.left_margin = Inches(1.25)
    section.right_margin = Inches(1.25)
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)


def set_font(style, name="Times New Roman", size=12, bold=None, color_black=True):
    style.font.name = name
    style.font.size = Pt(size)
    if bold is not None:
        style.font.bold = bold
    if color_black:
        style.font.color.rgb = None  # inherit theme black; explicit black set below
    # Ensure east-asian font matches too (needed for consistent rendering)
    rpr = style.element.get_or_add_rPr()
    rFonts = rpr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = rpr.makeelement(qn("w:rFonts"), {})
        rpr.append(rFonts)
    rFonts.set(qn("w:ascii"), name)
    rFonts.set(qn("w:hAnsi"), name)
    rFonts.set(qn("w:cs"), name)


# --- Normal / body style ---
normal = doc.styles["Normal"]
set_font(normal, size=12, bold=False)
pf = normal.paragraph_format
pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
pf.space_after = Pt(8)

# --- Heading 1 (chapter titles) — centered, 14pt bold ---
h1 = doc.styles["Heading 1"]
set_font(h1, size=14, bold=True)
h1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
h1.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
h1.paragraph_format.space_before = Pt(12)
h1.paragraph_format.space_after = Pt(12)

# --- Heading 2 (subheadings) — left-aligned, 14pt bold ---
h2 = doc.styles["Heading 2"]
set_font(h2, size=14, bold=True)
h2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
h2.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
h2.paragraph_format.space_before = Pt(10)
h2.paragraph_format.space_after = Pt(6)

# --- Heading 3 (sub-subheadings) — left-aligned, 12pt bold ---
h3 = doc.styles["Heading 3"]
set_font(h3, size=12, bold=True)
h3.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
h3.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE

# --- Title style (title page main title) — centered, larger ---
try:
    title = doc.styles["Title"]
    set_font(title, size=20, bold=True)
    title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
except KeyError:
    pass

# --- Table text — single-spaced, 11pt for density (still Times New Roman) ---
try:
    table_style = doc.styles["Table Paragraph"]
    set_font(table_style, size=11, bold=False)
    table_style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
except KeyError:
    pass

# Compact/Body Text style used for captions — single-spaced
for name in ("Compact", "Caption", "Body Text"):
    try:
        s = doc.styles[name]
        set_font(s, size=11, bold=False)
        s.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    except KeyError:
        continue

doc.save("template/reference.docx")
print("Updated template/reference.docx")
