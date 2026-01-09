import openai
import httpx

async def get_ai_response(user_message, context_text=""):

    http_client = httpx.AsyncClient(verify=False)

    client = openai.AsyncOpenAI(
    api_key="Ваш АPI",
    base_url="https://openrouter.ai/api/v1",
    http_client=http_client
    )

    if context_text:
        system_content = f"Ты полезный ассистент. Ответь на вопрос пользователя, используя только следующий текст с сайта: \n\n{context_text}"
    else:
        system_content = "Ты профессиональный ассистент, умеющий кратко и содержательно отвечать на вопросы."

    message = [
        { "role": "system", "content": system_content},
        {"role": "user", "content": user_message}

        ]
    try:
        
        response = await client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=message,

            temperature=0.7,
            max_tokens=1000,
            stream=False
        )

        answer = response.choices[0].message.content
        return answer
    
    except Exception as e:
        print(f"Неизвестная ошибка: {e}")
        return "Произошла ошибка."