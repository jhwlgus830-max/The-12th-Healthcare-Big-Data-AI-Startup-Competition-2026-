import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text(path):
    try:
        z = zipfile.ZipFile(path)
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        root = ET.fromstring(z.read('word/document.xml'))
        # Using a list comprehension to keep spaces and newlines if they are represented nicely in nodes
        paragraphs = []
        for paragraph in root.findall('.//w:p', ns):
            p_text = "".join([node.text for node in paragraph.findall('.//w:t', ns) if node.text])
            paragraphs.append(p_text)
        return '\n'.join(paragraphs)
    except Exception as e:
        return str(e)

docx_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\persona_prompt\구조봇 프롬프트.docx"
txt_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\persona_prompt\gujobot_prompt_fixed.txt"

print(f"Extracting from {docx_path}...")
text = extract_text(docx_path)
print(f"Extracted length: {len(text)}")
print("Sample:")
print(text[:1000])

with open(txt_path, "w", encoding="utf-8") as f:
    f.write(text)
print(f"Saved to {txt_path}")
