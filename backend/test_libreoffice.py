#!/usr/bin/env python3
"""
Simple test script to verify LibreOffice installation and conversion capability
"""
import asyncio
import subprocess
import sys
from pathlib import Path

async def test_libreoffice_installation():
    """Test if LibreOffice is installed and accessible"""
    print("🔍 Testing LibreOffice installation...")
    
    try:
        # Test LibreOffice version
        process = await asyncio.create_subprocess_exec(
            "libreoffice", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode == 0:
            version = stdout.decode().strip()
            print(f"✅ LibreOffice found: {version}")
            return True
        else:
            print(f"❌ LibreOffice version check failed: {stderr.decode()}")
            return False
            
    except FileNotFoundError:
        print("❌ LibreOffice not found in PATH")
        print("📥 Install instructions:")
        print("   Windows: Download from https://www.libreoffice.org/download/download/")
        print("   Ubuntu/Debian: sudo apt-get install libreoffice")
        print("   macOS: brew install --cask libreoffice")
        return False
    except Exception as e:
        print(f"❌ Error testing LibreOffice: {e}")
        return False

async def test_conversion_capability():
    """Test if LibreOffice can convert files"""
    print("\n🔄 Testing conversion capability...")
    
    # Create a simple test DOCX content (minimal)
    test_content = """
    <html>
    <body>
    <p>Test document for conversion</p>
    </body>
    </html>
    """
    
    test_dir = Path("test_conversion")
    test_dir.mkdir(exist_ok=True)
    
    try:
        # Create a simple HTML file (LibreOffice can convert HTML to PDF)
        test_file = test_dir / "test.html"
        test_file.write_text(test_content)
        
        # Try conversion
        cmd = [
            "libreoffice",
            "--headless",
            "--convert-to", "pdf",
            "--outdir", str(test_dir),
            str(test_file)
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30.0)
        
        if process.returncode == 0:
            pdf_file = test_dir / "test.pdf"
            if pdf_file.exists():
                print("✅ Conversion test successful")
                print(f"   Created: {pdf_file}")
                return True
            else:
                print("❌ Conversion completed but PDF not found")
                return False
        else:
            print(f"❌ Conversion failed: {stderr.decode()}")
            return False
            
    except asyncio.TimeoutError:
        print("❌ Conversion timed out after 30 seconds")
        return False
    except Exception as e:
        print(f"❌ Conversion test error: {e}")
        return False
    finally:
        # Cleanup
        try:
            import shutil
            if test_dir.exists():
                shutil.rmtree(test_dir)
                print("🧹 Cleaned up test files")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")

async def main():
    """Run all tests"""
    print("🧪 LibreOffice Conversion Test Suite")
    print("=" * 40)
    
    # Test installation
    installation_ok = await test_libreoffice_installation()
    
    if installation_ok:
        # Test conversion capability
        conversion_ok = await test_conversion_capability()
        
        if conversion_ok:
            print("\n🎉 All tests passed! LibreOffice conversion is ready.")
            return 0
        else:
            print("\n❌ Conversion test failed. Check LibreOffice installation.")
            return 1
    else:
        print("\n❌ LibreOffice not available. Please install it first.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)