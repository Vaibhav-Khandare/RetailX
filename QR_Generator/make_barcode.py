"""
Barcode Generator – creates a barcode image from a numeric/alphanumeric string.
Supports formats: EAN-13, EAN-8, UPC-A, Code128, Code39, ISBN, etc.
"""

import sys
import barcode
from barcode.writer import ImageWriter

def generate_barcode(data, format='ean13', filename=None):
    """
    Generate a barcode image.
    
    :param data: the string to encode (e.g., '5901234123457')
    :param format: barcode format (default 'ean13')
                   Common formats: 'ean13', 'ean8', 'upca', 'code128', 'code39', 'isbn13'
    :param filename: output filename (without extension). If None, uses data as filename.
    :return: full path of saved image
    """
    try:
        # Get the barcode class for the specified format
        barcode_class = barcode.get_barcode_class(format)
        
        # Create the barcode
        barcode_obj = barcode_class(data, writer=ImageWriter())
        
        # Save the image (PNG by default)
        if filename is None:
            filename = data
        full_filename = barcode_obj.save(filename)
        
        print(f"✅ Barcode saved as {full_filename}")
        return full_filename
        
    except barcode.errors.BarcodeNotFoundError:
        print(f"❌ Unsupported barcode format: {format}")
        sys.exit(1)
    except barcode.errors.IllegalCharacterError:
        print(f"❌ The data '{data}' contains characters not allowed in {format} format.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Show help if not enough arguments
    if len(sys.argv) < 2:
        print("Usage: python make_barcode.py <data> [format] [filename]")
        print("\nExamples:")
        print("  python make_barcode.py 5901234123457")
        print("  python make_barcode.py 5901234123457 ean13")
        print("  python make_barcode.py 'Hello123' code128 my_barcode")
        print("\nSupported formats: ean13, ean8, upca, code128, code39, isbn13, gs1_128, etc.")
        sys.exit(1)
    
    # Parse arguments
    data = sys.argv[1]
    format = sys.argv[2] if len(sys.argv) > 2 else 'ean13'
    filename = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Generate barcode
    generate_barcode(data, format, filename)