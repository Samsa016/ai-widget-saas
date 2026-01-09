import { useState } from "react"

export function AdminPage() {
    const [httpAdmin, setHttpAdmin] = useState<string>('')
    
    const learnBot = async () => {
        const res = await fetch("http://127.0.0.1:8000/admin", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ url: httpAdmin })
        })

        if (!res.ok) throw new Error("Ошибка при отправлении ссылки")
        alert("Бот обучен!");
        return await res.json()
    


    }
    
    return (
        <div>
            <h1>Панель упарвления</h1>
            <input
            placeholder="Введите ссылку по которой бот будет обучаться"
            onChange={(e) => setHttpAdmin(e.target.value)}
            value={httpAdmin}
            type="text"
            ></input>
            <button
            onClick={() => learnBot()}>Обучить</button>
        </div>
    )
}