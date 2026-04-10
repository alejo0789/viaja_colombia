import uvicorn
import os
import sys

# Añadir el directorio actual al path para que Python encuentre el módulo 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Iniciando Backend de ViajaColombia en modo local...")
    print("📌 URL: http://localhost:8000")
    print("📖 Documentación: http://localhost:8000/docs")
    
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True
    )
