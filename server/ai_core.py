import sys

sys.stdout.reconfigure(encoding='utf-8')

import openai
import httpx
import asyncio

async def get_ai_response(history_message, context_text=""):



    http_client = httpx.AsyncClient(verify=False)

    client = openai.AsyncOpenAI(
    api_key="Ваш API",
    base_url="https://openrouter.ai/api/v1",
    http_client=http_client
    )

    if context_text:
        system_content = f"Ты полезный ассистент. Ответь на вопрос пользователя, используя только следующий текст с сайта: \n\n{context_text}"

    else:
        system_content = "Ты профессиональный ассистент, умеющий кратко и содержательно отвечать на вопросы."

    final_message = [{"role": "system", "content": system_content}]

    final_message.extend(history_message)
    try:
        
        response = await client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=final_message,

            temperature=0.7,
            max_tokens=1000,
            stream=True,
        )

        async for chunk in response:
            if chunk.choices[0].delta.content is not None:
                answer = chunk.choices[0].delta.content

                for char in answer: 
                    yield char

                    await asyncio.sleep(0.02)
            
        yield "Done"
    
    except Exception as e:
        print(f"Неизвестная ошибка: {e}")
        yield "Произошла ошибка."
        yield "Done"