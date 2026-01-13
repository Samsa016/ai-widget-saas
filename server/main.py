import sys

sys.stdout.reconfigure(encoding='utf-8')

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from scraper import scrape_website
from ai_core import get_ai_response
from pydantic import BaseModel
from vector_db import VectorStore


app = FastAPI()

db = VectorStore()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

class urlAdmin(BaseModel):
    url: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/admin")
async def adminChat(url: urlAdmin):
    if not url: return print("Ошибка! Ссылка не найдена")
    try:
        parse_data = await scrape_website(url.url)
        if parse_data:
            db.add_document(parse_data, url.url)
            return {"status": "success"}
        else: return {"status": "error", "message": "Не удалось прочитать сайт"}

    except Exception as e:
        print(f"Ошибка при парсинге {e}")

    

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    history = []
    
    await websocket.accept()

    try:
        
        while True:
            
            data = await websocket.receive_text()
            print(f"Получена сообщение: {data}")

            history.append({"role": "user", "content": data})

            if len(history) > 6:
                history = history[-6:]

            context_text = ""
            if db.count() > 0:
                search_data = db.search(data)
                if search_data:
                    context_text = "\n\n".join(search_data)

                ai_answer = await get_ai_response(history, context_text)

                await websocket.send_text(ai_answer)

                history.append({"role": "assistant", "content": ai_answer})

            else:
                await websocket.send_text("Я еще не обучен. Попросите админа добавить ссылку.")
            

    except WebSocketDisconnect:
        print("Клиент отключился")
    

