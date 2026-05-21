import zipfile
import xml.etree.ElementTree as ET
import os
import json

def extract_docx_text(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
    try:
        z = zipfile.ZipFile(path)
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        root = ET.fromstring(z.read('word/document.xml'))
        paragraphs = []
        for p in root.findall('.//w:p', ns):
            p_text = "".join([node.text for node in p.findall('.//w:t', ns) if node.text])
            if p_text:
                paragraphs.append(p_text)
        return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error DOCX: {e}"

def extract_pptx_text(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
    try:
        z = zipfile.ZipFile(path)
        ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
              'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
        
        # Sort slides numerically
        slide_names = [name for name in z.namelist() if name.startswith('ppt/slides/slide')]
        slide_names.sort(key=lambda x: int(os.path.basename(x).replace('slide', '').replace('.xml', '')))
        
        slides_text = []
        for slide in slide_names:
            slide_num = os.path.basename(slide).replace('slide', '').replace('.xml', '')
            root = ET.fromstring(z.read(slide))
            # Find all text nodes
            texts = []
            for t in root.findall('.//a:t', ns):
                if t.text:
                    texts.append(t.text)
            slides_text.append(f"--- Slide {slide_num} ---\n" + "\n".join(texts))
        return '\n\n'.join(slides_text)
    except Exception as e:
        return f"Error PPTX: {e}"

def extract_xlsx_info(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
    try:
        z = zipfile.ZipFile(path)
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
            sheets.append((s.get('name'), s.get('sheetId'), s.get('r:id')))
            
        result = f"Sheets: {sheets}\n\n"
        
        # Let's read sheets
        for sheet_name, sheet_id, r_id in sheets:
            # We can find sheet XML file. Typically xl/worksheets/sheetN.xml where N is sheet_id or index
            sheet_file = f"xl/worksheets/sheet{sheet_id}.xml"
            if sheet_file not in names:
                # Fallback to matching order in names
                sheet_files = [n for n in names if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')]
                sheet_files.sort()
                # Use corresponding sheet index
                idx = len(sheets) - 1
                sheet_file = sheet_files[min(int(sheet_id)-1, len(sheet_files)-1)]
                
            if sheet_file in names:
                result += f"=== Sheet: {sheet_name} ({sheet_file}) ===\n"
                sheet_root = ET.fromstring(z.read(sheet_file))
                ns_sh = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                
                rows = {}
                for r in sheet_root.findall('.//main:row', ns_sh):
                    row_idx = int(r.get('r'))
                    row_cells = []
                    for c in r.findall('.//main:c', ns_sh):
                        val_node = c.find('main:v', ns_sh)
                        val = val_node.text if val_node is not None else ""
                        cell_type = c.get('t')
                        if cell_type == 's' and val:
                            try:
                                val = shared_strings[int(val)]
                            except:
                                pass
                        row_cells.append((c.get('r'), val))
                    rows[row_idx] = row_cells
                
                for k in sorted(rows.keys()):
                    cells_str = ", ".join([f"{cell[0]}:{cell[1]}" for cell in rows[k]])
                    result += f"Row {k}: {cells_str}\n"
                result += "\n"
        return result
    except Exception as e:
        return f"Error XLSX: {e}"

print("Extracting docx...")
docx_text = extract_docx_text('design/ver.3_말랑해도 돼 PRD .docx')
print("Extracting pptx...")
pptx_text = extract_pptx_text('design/NLP 기반 우울 감정 지표 예측 및 스마트 심리케어 솔루션_보완.pptx')
print("Extracting xlsx...")
xlsx_text = extract_xlsx_info('design/RAG_기술_심리케어_구현표 (2).xlsx')

os.makedirs('extracted_design', exist_ok=True)
with open('extracted_design/prd.txt', 'w', encoding='utf-8') as f:
    f.write(docx_text)
with open('extracted_design/pptx.txt', 'w', encoding='utf-8') as f:
    f.write(pptx_text)
with open('extracted_design/xlsx.txt', 'w', encoding='utf-8') as f:
    f.write(xlsx_text)

print("Done! Extracted files to extracted_design folder.")
