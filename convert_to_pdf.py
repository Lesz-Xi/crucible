import os
import re
from PIL import Image

image_dir = "/Users/lesz/Documents/Synthetic Mind/Image/new"
output_pdf = "/Users/lesz/Documents/Synthetic Mind/MASA_Breakthrough_Carousel.pdf"
tmp_pdf = "/tmp/MASA_Breakthrough_Carousel.pdf"

def get_num(filename):
    match = re.search(r'(\d+)', filename)
    return int(match.group(1)) if match else 999

# Get all images
files = [f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg')) and not f.startswith('.')]
files.sort(key=get_num)

img_list = []
for f in files:
    path = os.path.join(image_dir, f)
    img = Image.open(path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    img_list.append(img)

if img_list:
    try:
        # Save to tmp first
        img_list[0].save(tmp_pdf, save_all=True, append_images=img_list[1:])
        print(f"Successfully created in tmp: {tmp_pdf}")
        
        # Now move it to the final location
        import shutil
        shutil.move(tmp_pdf, output_pdf)
        print(f"Successfully moved to: {output_pdf}")
    except Exception as e:
        print(f"Error during save/move: {str(e)}")
else:
    print("No images found.")
