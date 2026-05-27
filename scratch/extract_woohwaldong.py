import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text(path):
    z = zipfile.ZipFile(path)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    root = ET.fromstring(z.read('word/document.xml'))
    text_nodes = root.findall('.//w:t', ns)
    
    # We want to preserve paragraphs if possible, by finding w:p elements
    paragraphs = []
    for p in root.findall('.//w:p', ns):
        p_text = "".join([t.text for t in p.findall('.//w:t', ns) if t.text])
        if p_text.strip():
            paragraphs.append(p_text)
            
    return '\n'.join(paragraphs)

docx_path = "persona_prompt/우활동 프롬프트.docx"
txt_path = "persona_prompt/woohwaldong_prompt_fixed.txt"

if os.path.exists(docx_path):
    text = extract_text(docx_path)
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"SUCCESS: Extracted docx to {txt_path}! Characters: {len(text)}")
    print("Preview of first 300 chars:")
    print(text[:300])
else:
    print(f"Error: {docx_path} does not exist!")
