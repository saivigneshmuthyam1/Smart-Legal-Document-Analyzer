import httpx
import json
import sys
import os

def test_pdf_analyze(pdf_path: str):
    if not os.path.exists(pdf_path):
        print(f"Error: File '{pdf_path}' does not exist.")
        return

    url = "http://127.0.0.1:8000/analyze"
    print(f"Uploading and analyzing PDF '{pdf_path}' at {url}...")
    
    try:
        with open(pdf_path, "rb") as f:
            files = {"file": (os.path.basename(pdf_path), f, "application/pdf")}
            response = httpx.post(url, files=files, timeout=60.0)
            
        if response.status_code == 200:
            print("\nAnalysis Result:\n")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"\nRequest failed with status code: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"\nConnection failed. Please ensure the FastAPI server is running. Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_pdf_client.py <path_to_pdf_file>")
    else:
        # Join arguments to handle filenames with spaces
        pdf_file_path = " ".join(sys.argv[1:])
        test_pdf_analyze(pdf_file_path)
