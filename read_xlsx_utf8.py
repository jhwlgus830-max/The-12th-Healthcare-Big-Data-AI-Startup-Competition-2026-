import zipfile
import xml.etree.ElementTree as ET

def get_xlsx_data(path):
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
    sheets = [s.get('name') for s in workbook_root.findall('.//main:sheet', ns_wb)]
    
    sheet_root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
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
                val = shared_strings[int(val)]
            col_letter = "".join([char for char in cell_ref if char.isalpha()])
            row_cells[col_letter] = val
            rows[row_idx] = row_cells
            
    output = []
    output.append(f"Sheets in Excel: {sheets}")
    for k in sorted(rows.keys()):
        row = rows[k]
        if any(row.values()):
            non_empty = {col: val for col, val in row.items() if val != ""}
            output.append(f"Row {k}: {non_empty}")
            
    with open('xlsx_content.txt', 'w', encoding='utf-8') as f:
        f.write("\n".join(output))

get_xlsx_data('design/RAG_기술_심리케어_구현표 (2).xlsx')
print("Successfully extracted Excel contents to xlsx_content.txt!")
