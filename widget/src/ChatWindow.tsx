import { useState, useRef, useEffect } from 'react'
import { Send, X } from "lucide-react"

export interface ChatWindowProps {
    onClose: () => void;
}

export function ChatWindow({ onClose }: ChatWindowProps) {

    const socketRef = useRef<WebSocket | null>(null)

    const [messageList, setMessageList] = useState([
        { id: 1, text: "Привет, чем могу помочь?", isUser: false }
    ])

    const [messageUser, setMessageUser] = useState<string>('')

    const handleSend = () => {

        if (!messageUser.trim()) return;
        if (socketRef.current)
            socketRef.current.send(messageUser)
            setMessageList(mg => [...mg, { id: Date.now(), text: messageUser, isUser: true }])
            setMessageUser('')

    }

    useEffect(() => {


            const socket = new WebSocket('ws://localhost:8000/ws')

            socketRef.current = socket

            socket.onopen = () => {
                console.log('Соединение установлено')
            }

            socket.onmessage = (message: MessageEvent) => {
                const dataMessage = message.data
                setMessageList(mg => [...mg, {id: Date.now(), text: dataMessage, isUser: false}])
                console.log('Полученно сообщение от сервера:', dataMessage)
            }

            socket.onclose = () => {
                console.log('Соединение закрыто')
            }

            return () => {
                console.log('Закрываем сокет')
                socket.close()
            }

        

    }, [])



    return (
        <div className="w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-gray-200 font-sans">
            
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white shadow-md">

                <div>
                    <h3 className="font-bold">AI Помощник</h3>
                    <p className="text-xs text-blue-100 opacity-80">В сети</p>
                </div>

                <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded transition-colors">
                    <X size={20} />
                </button>

            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                {messageList.map(mg => (

                    <div 
                        key={mg.id} 
                        className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                            mg.isUser 
                                ? "bg-blue-600 text-white self-end rounded-br-none" // Сообщения юзера справа синие
                                : "bg-white text-gray-800 border border-gray-200 self-start rounded-bl-none shadow-sm" // Сообщения бота слева белые
                        }`}
                    >
                        {mg.text}
                    </div>

                ))}
                
            </div>

            <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">

                <input
                    className="flex-1 bg-gray-100 text-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    onChange={(e) => setMessageUser(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    value={messageUser}
                    type="text"
                    placeholder="Напишите сообщение..." 
                />

                <button
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center justify-center"
                    onClick={() => handleSend()}
                >
                    <Send size={18} />
                </button>

            </div>
        </div>
    )
}