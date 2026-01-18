import { useState } from "react"

export function AdminPage() {
    const [formData, setFormData] = useState({
        url: '',
        bot_name: 'AI Консультант',
        primary_color: '#2563EB',
        welcome_message: 'Здравствуйте! Я готов ответить на ваши вопросы.'
    })

    const [isLoading, setIsLoading] = useState(false)
    const [generatedScript, setGeneratedScript] = useState<string | null>(null)
    const [generatedId, setGeneratedId] = useState<string | null>(null)

    const learnBot = async () => {
        if (!formData.url) return alert("Введите ссылку!")
        
        setIsLoading(true)
        setGeneratedScript(null)

        try {
            const res = await fetch("https://ai-widget-saas.onrender.com/admin", {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error("Ошибка при отправлении")
            
            const data = await res.json()
            
            setGeneratedScript(data.script_code)
            setGeneratedId(data.id)

        } catch (e) {
            alert("Ошибка: " + e)
        } finally {
            setIsLoading(false)
        }
    }
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-800">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Создание Виджета 🤖</h1>
                
                <div className="space-y-4">
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Ссылка на базу знаний (URL)</label>
                        <input
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="https://example.com"
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Имя бота</label>
                        <input
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Например: Помощник Олег"
                            type="text"
                            value={formData.bot_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, bot_name: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Основной цвет</label>
                        <div className="flex gap-3 h-12">
                            <input
                                type="color"
                                className="h-full w-16 cursor-pointer border-none bg-transparent p-0 rounded-lg overflow-hidden"
                                value={formData.primary_color}
                                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                            />
                            <input
                                type="text"
                                className="flex-1 p-3 border border-gray-300 rounded-lg uppercase font-mono"
                                value={formData.primary_color}
                                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Приветственное сообщение</label>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            value={formData.welcome_message}
                            onChange={(e) => setFormData(prev => ({ ...prev, welcome_message: e.target.value }))}
                        />
                    </div>

                    <button
                        onClick={learnBot}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md transform active:scale-95 ${
                            isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isLoading ? "Обучаю и создаю..." : "Создать Виджет"}
                    </button>

                </div>

                {generatedScript && (
                    <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-xl animate-bounce-in">
                        <h3 className="text-green-800 font-bold mb-2 flex items-center gap-2">
                            ✅ Готово! ID: {generatedId}
                        </h3>
                        <p className="text-sm text-green-700 mb-3">Вставьте этот код на ваш сайт:</p>
                        
                        <div className="bg-gray-900 p-4 rounded-lg relative group">
                            <code className="text-green-400 font-mono text-xs break-all block">
                                {generatedScript}
                            </code>
                            <button 
                                onClick={() => navigator.clipboard.writeText(generatedScript)}
                                className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}