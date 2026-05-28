import zipfile
import xml.etree.ElementTree as ET
import os

def get_xlsx_data(path, out_path):
    if not os.path.exists(path):
        print(f"[ERROR] File not found: {path}")
        return
        
    z = zipfile.ZipFile(path)
    names = z.namelist()
    shared_strings = []
    if 'xl/sharedStrings.xml' in names:
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for node in root.findall('.//main:t', ns):
            shared_strings.append(node.text if node.text else "")
            
    workbook_root = ET.fromstring(z.read('xl/workbook.xml'))
    ns_wb = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    
    # Extract sheet name and sheet ID mapping
    sheets_info = []
    for s in workbook_root.findall('.//main:sheet', ns_wb):
        name = s.get('name')
        sheet_id = s.get('sheetId')
        sheets_info.append((name, sheet_id))
        
    output = []
    output.append(f"Excel File: {path}")
    output.append(f"Sheets in Excel: {[info[0] for info in sheets_info]}")
    
    # We will try to parse sheet xml files sequentially matching sheets_info order
    sheet_files = sorted([f for f in names if f.startswith('xl/worksheets/sheet')])
    
    for idx, (sheet_name, sheet_id) in enumerate(sheets_info):
        target_sheet_file = f"xl/worksheets/sheet{idx+1}.xml"
        if target_sheet_file not in names:
            if idx < len(sheet_files):
                target_sheet_file = sheet_files[idx]
            else:
                continue
                
        output.append(f"\n--- SHEET: {sheet_name} ---")
        sheet_root = ET.fromstring(z.read(target_sheet_file))
        ns_sh = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        
        rows = {}
        for r in sheet_root.findall('.//main:row', ns_sh):
            row_idx = int(r.get('r'))
            row_cells = {}
            for c in r.findall('.//main:c', ns_sh):
                cell_ref = c.get('r')
                val_node = c.find('main:v', ns_sh)
                val = val_node.text if val_node is not None else ""
                cell_type = c.get('t')
                if cell_type == 's' and val != "":
                    try:
                        val = shared_strings[int(val)]
                    except:
                        pass
                col_letter = "".join([char for char in cell_ref if char.isalpha()])
                row_cells[col_letter] = val
                rows[row_idx] = row_cells
                
        for k in sorted(rows.keys()):
            row = rows[k]
            if any(row.values()):
                non_empty = {col: val for col, val in row.items() if val != ""}
                output.append(f"Row {k}: {non_empty}")
                
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(output))

get_xlsx_data('design/보안 관련 기술 구현.xlsx', 'scratch/security_xlsx_content.txt')
print("Successfully extracted Excel contents to scratch/security_xlsx_content.txt!")
