import zipfile
import xml.etree.ElementTree as ET

def extract_text(path, ext):
    try:
        z = zipfile.ZipFile(path)
        text = ''
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
              'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
        if ext == 'docx':
            root = ET.fromstring(z.read('word/document.xml'))
            text = '\n'.join([node.text for node in root.findall('.//w:t', ns) if node.text])
        elif ext == 'pptx':
            slides = [name for name in z.namelist() if name.startswith('ppt/slides/slide')]
            for slide in slides:
                root = ET.fromstring(z.read(slide))
                text += '\n' + '\n'.join([node.text for node in root.findall('.//a:t', ns) if node.text])
        return text
    except Exception as e:
        return str(e)

print('--- PRD ---')
print(extract_text('data/ver.3_말랑해도 돼 PRD .docx', 'docx')[:3000])
print('--- PPTX ---')
print(extract_text('data/ver.1_상담자 화면 구성(말랑해도 돼).pptx', 'pptx')[:3000])
