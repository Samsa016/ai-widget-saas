import sys

sys.stdout.reconfigure(encoding='utf-8')

import openai
import httpx


async def get_ai_response(history_message, context_text=""):



    http_client = httpx.AsyncClient(verify=False)

    client = openai.AsyncOpenAI(
    api_key="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",
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
            stream=False
        )

        answer = response.choices[0].message.content
        return answer
    
    except Exception as e:
        print(f"Неизвестная ошибка: {e}")
        return "Произошла ошибка."