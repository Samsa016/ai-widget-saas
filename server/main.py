import sys
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from scraper import scrape_website
from ai_core import get_ai_response
from pydantic import BaseModel
from vector_db import VectorStore
from sqlalchemy.orm import Session
import models
from database import engine, get_db, SessionLocal
from uuid import uuid4

models.Base.metadata.create_all(bind=engine)

sys.stdout.reconfigure(encoding='utf-8')

app = FastAPI()

dbVector = VectorStore()

class urlAdmin(BaseModel):
    url: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProjectCreate(BaseModel):
    url: str
    bot_name: str = "AI Помощник"
    primary_color: str = "#2563EB"
    welcome_message: str = "Привет! Чем могу помочь?"

@app.post("/admin")
async def adminChat(user_widget_config: ProjectCreate, db: Session = Depends(get_db)):
    ip_adress = "http://localhost:5173/"
    new_id = str(uuid4())[:8]

    if not user_widget_config.url: return {"status": "error", "message": "Ошибка! Ссылка не найдена"}
    try:
        parse_data = await scrape_website(user_widget_config.url)
        if parse_data:
            dbVector.add_document(parse_data, user_widget_config.url, project_id=new_id)
        else: return {"status": "error", "message": "Ошибка при парсинге сайта"}

    except Exception as e:
        print(f"Ошибка при парсинге {e}")

    project = models.Project(
        id=new_id,
        url=user_widget_config.url,
        bot_name=user_widget_config.bot_name,
        primary_color=user_widget_config.primary_color,
        welcome_message=user_widget_config.welcome_message
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return {
        "status": "success",
        "script_code": f'<script src="{ip_adress}widget.js" data-id="{new_id}"></script>',
        "id": new_id
    }

@app.get("/admin/{project_id}")
async def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, project_id: str, db: Session = Depends(get_db)):

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        await websocket.send_text("Ошибка: Неверный ID проекта")
        await websocket.close()
        return

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
            if dbVector.count() > 0:
                search_data = dbVector.search(data, project_id=project_id)
                if search_data:
                    context_text = "\n\n".join(search_data)

            if dbVector.count() == 0:
                async def fake_generator():
                    yield "Я еще не обучен. Попросите админа добавить ссылку."
                ai_response = fake_generator()
            else:
                ai_response = get_ai_response(history, context_text)
            
            full_answer = ""
            async for ai_answer in ai_response:

                if ai_answer == "Done":
                    await websocket.send_text("Done")
                else:
                    full_answer += ai_answer
                    await websocket.send_text(ai_answer)
                

            history.append({"role": "assistant", "content": full_answer})
            

    except WebSocketDisconnect:
        print("Клиент отключился")
    

