from PIL import Image, ImageDraw

img = Image.open(r'd:\Road-Warrior\public\og-image-English.png')
draw = ImageDraw.Draw(img)

canvas_width, canvas_height = img.size

oldQrX = int(canvas_width * 0.65)
oldQrY = int(canvas_height * 0.905)
oldQrSize = int(canvas_width * 0.135)

draw.rectangle([oldQrX, oldQrY, oldQrX + oldQrSize, oldQrY + oldQrSize], fill="#ffffff")

qrWidth = int(canvas_width * 0.166)
qrHeight = qrWidth
x = int(canvas_width * 0.654)
y = int(canvas_height * 0.722)
padding = int(canvas_width * 0.01)

draw.rectangle([x - padding, y - padding, x + qrWidth + padding*2, y + qrHeight + padding*2], fill="#ffffff")
draw.rectangle([x, y, x + qrWidth, y + qrHeight], fill="#ff0000") # red placeholder for new QR

img.save(r'd:\Road-Warrior\scratch\verification.png')
