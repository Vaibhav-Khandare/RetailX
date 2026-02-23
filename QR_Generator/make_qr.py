import qrcode
import sys

def generate_qr(data, filename="qrcode.png"):
    """Generate a QR code from the given data and save it as an image."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)
    print(f"QR code saved as {filename}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python make_qr.py <barcode_number>")
        sys.exit(1)
    
    barcode = sys.argv[1]
    filename = f"{barcode}.png"  # e.g., 8801234567890.png
    generate_qr(barcode, filename)