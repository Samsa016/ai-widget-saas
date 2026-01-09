from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from scraper import scrape_website
from ai_core import get_ai_response
from pydantic import BaseModel
app = FastAPI()

url_massive = []

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
        url_massive.append(parse_data)
        return {"status": "success"}
    except Exception as e:
        print(f"Ошибка при парсинге {e}")

    

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    
    await websocket.accept()

    try:
        
        while True:
            
            data = await websocket.receive_text()

            print(f"Получена сообщение: {data}")

            if url_massive:
                knowledge_base = "\n\n".join(url_massive)
                ai_answer = await get_ai_response(data, knowledge_base)
                await websocket.send_text(ai_answer)
            else:
                await websocket.send_text("Я еще не обучен. Попросите админа добавить ссылку.")

    except WebSocketDisconnect:
        print("Клиент отключился")

