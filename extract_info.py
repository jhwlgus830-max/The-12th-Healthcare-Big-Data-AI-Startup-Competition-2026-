import zipfile
import xml.etree.ElementTree as ET
import os

def extract_docx_text(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
    try:
        z = zipfile.ZipFile(path)
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        root = ET.fromstring(z.read('word/document.xml'))
        # Gather all paragraph nodes
        paragraphs = []
        for p in root.findall('.//w:p', ns):
            p_text = "".join([node.text for node in p.findall('.//w:t', ns) if node.text])
            if p_text:
                paragraphs.append(p_text)
        return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error extracting DOCX: {e}"

def inspect_xlsx(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
    try:
        z = zipfile.ZipFile(path)
        # List files in the zip to see sheet names and shared strings
        names = z.namelist()
        shared_strings = []
        if 'xl/sharedStrings.xml' in names:
            root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            shared_strings = [node.text if node.text else "" for node in root.findall('.//main:t', ns)]
            
        workbook_root = ET.fromstring(z.read('xl/workbook.xml'))
        ns_wb = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        sheets = []
        for s in workbook_root.findall('.//main:sheet', ns_wb):
            sheets.append((s.get('name'), s.get('sheetId')))
            
        result = f"Sheets: {sheets}\n"
        # Let's read the first sheet (usually sheet1.xml)
        if 'xl/worksheets/sheet1.xml' in names:
            sheet_root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
            ns_sh = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            
            # Simple row/cell parser
            rows = {}
            for r in sheet_root.findall('.//main:row', ns_sh):
                row_idx = int(r.get('r'))
                row_cells = []
                for c in r.findall('.//main:c', ns_sh):
                    val_node = c.find('main:v', ns_sh)
                    val = val_node.text if val_node is not None else ""
                    cell_type = c.get('t')
                    if cell_type == 's' and val:
                        val = shared_strings[int(val)]
                    row_cells.append((c.get('r'), val))
                rows[row_idx] = row_cells
            
            result += "--- Sheet 1 Sample Rows ---\n"
            for k in sorted(rows.keys())[:100]:  # print first 100 rows
                cells_str = ", ".join([f"{cell[0]}:{cell[1]}" for cell in rows[k]])
                result += f"Row {k}: {cells_str}\n"
        return result
    except Exception as e:
        return f"Error extracting XLSX: {e}"

# Write to text file
os.makedirs('C:/Users/asia/.gemini/antigravity/brain/7ba89dc1-672b-43bc-9e40-12328eeb8077/scratch', exist_ok=True)
docx_text = extract_docx_text('design/ver.3_말랑해도 돼 PRD .docx')
xlsx_text = inspect_xlsx('design/RAG_기술_심리케어_구현표 (2).xlsx')

with open('C:/Users/asia/.gemini/antigravity/brain/7ba89dc1-672b-43bc-9e40-12328eeb8077/scratch/prd_extracted.txt', 'w', encoding='utf-8') as f:
    f.write("=== DOCX PRD TEXT ===\n")
    f.write(docx_text)
    f.write("\n\n=== XLSX TEXT ===\n")
    f.write(xlsx_text)

print("Extraction completed.")
