import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text(path):
    z = zipfile.ZipFile(path)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    root = ET.fromstring(z.read('word/document.xml'))
    paragraphs = []
    for p in root.findall('.//w:p', ns):
        p_text = "".join([node.text for node in p.findall('.//w:t', ns) if node.text])
        paragraphs.append(p_text)
    return '\n'.join(paragraphs)

if __name__ == '__main__':
    docx_path = r'persona_prompt\어시스턴트 클로 프롬프트.docx'
    output_path = r'persona_prompt\chloe_prompt_fixed.txt'
    
    if os.path.exists(docx_path):
        text = extract_text(docx_path)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Successfully extracted {len(text)} characters to {output_path}")
    else:
        print(f"Error: {docx_path} does not exist")
