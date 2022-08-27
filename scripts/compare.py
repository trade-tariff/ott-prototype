import os
from Markdown2docx import Markdown2docx


path = '/Users/mattlavis/sites and projects/1. Online Tariff/ott prototype/app/content/hs22/section_chapter_notes'
ext = ('.md')
file_list = []
for file in os.listdir(path):
    if file.endswith(ext):
        file_list.append(file)
        print(file)  

file_list = sorted(file_list)

diff_list = []
for file in file_list:
    if "eu" in file:
        file2 = file.replace("_eu", "")
        diff_list.append(file)
        diff_list.append(file2)
        a = 1

txt = ""
for file in diff_list:
    full_path = os.path.join(path, file)
    f = open(full_path, "r")
    filename_string = file.replace(".md", "")
    txt += filename_string + "\n"
    txt += "-" * len(filename_string) + "\n\n"
    txt += f.read()
    
    txt += "-----------------\n\n"

# Write the file
filename = 'chapter_notes_differences.md'
dest = os.path.join(os.getcwd(), filename)
with open(dest, 'w') as f:
    f.write(txt)


project = Markdown2docx('README')
project.eat_soup()
project.save()
