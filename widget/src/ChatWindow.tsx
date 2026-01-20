import { useState, useRef, useEffect } from 'react'
import { Send, X } from "lucide-react"
import { useWidgetConfig } from './widget_config'
import { AnimatePresence, motion } from "framer-motion"
export interface ChatWindowProps {
    onClose: () => void;
}

export function ChatWindow({ onClose }: ChatWindowProps) {

    const socketRef = useRef<WebSocket | null>(null)
    const config = useWidgetConfig()

    const [messageList, setMessageList] = useState([
        { id: 1, text: config.welcomeMessage || "Привет, чем могу помочь?", isUser: false }
    ])

    const [messageUser, setMessageUser] = useState<string>('')
    const [ isThinking, setIsThinking ] = useState<boolean>(false)

    const dotVariants = {
    initial: { y: 0 },
    animate: { y: -6 },
    }

    const dotTransition = {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
    }

    const lastMessageRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (config.welcomeMessage) {
            setMessageList(prev => {
                const newHistory = [...prev];
                if (newHistory[0] && !newHistory[0].isUser) {
                     newHistory[0].text = config.welcomeMessage;
                }
                return newHistory;
            })
        }
    }, [config.welcomeMessage])

    const scrollToBottom = () => {
        lastMessageRef.current?.scrollIntoView({ behavior: "smooth"});
    }

    useEffect(scrollToBottom, [messageList, isThinking]);

    const handleSend = () => {

        if (!messageUser.trim()) return;
        if (socketRef.current)
            socketRef.current.send(messageUser)
            setMessageList(mg => [...mg, { id: Date.now(), text: messageUser, isUser: true }])
            setMessageUser('')
            setIsThinking(true)


    }

    useEffect(() => {

            const socket = new WebSocket('wss://ai-widget-saas.onrender.com/ws?project_id=' + config.project_id)
            socketRef.current = socket

            socket.onopen = () => {
                console.log('Соединение установлено')
            }

            socket.onmessage = (message: MessageEvent) => {
                const dataMessage = message.data

                if (dataMessage === "Done") {
                    console.log('Ответ от сервера завершён')
                    return;
                }

                setIsThinking(false)

                setMessageList(mg => {
                    const newHistory = [...mg]
                    const lastMessage = mg[mg.length - 1]

                    if (lastMessage && lastMessage.isUser) {
                        return [...mg, {id: Date.now(), text: dataMessage, isUser: false}]
                    } else {
                        const updatedLastMessage = {
                            ...lastMessage,
                            text: lastMessage.text + dataMessage
                        }
                        newHistory[newHistory.length - 1] = updatedLastMessage
                        return newHistory
                    }
                })
                
            }

            socket.onclose = () => {
                console.log('Соединение закрыто')
            }

            return () => {
                console.log('Закрываем сокет')
                socket.close()
            }

        

    }, [config.project_id])



    return (
        <motion.div 
        className="w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 font-sans mb-4"
        initial={{ opacity: 0, y: 50, scale: 0.95}}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            
            <div className="p-4 flex justify-between items-center text-white shadow-md" 
            style = {{ backgroundColor: config.primaryColor }}>

                <div>
                    <h3 className="font-bold">{config.botName}</h3>
                    <p className="text-xs text-blue-100 opacity-80">В сети</p>
                </div>

                <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded transition-colors">
                    <X size={20} />
                </button>

            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                 {messageList.map(mg => (

                    <motion.div
                        layout="position"
                        key={mg.id} 
                        className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                            mg.isUser 
                                ? " text-white self-end rounded-br-none"
                                : "bg-white text-gray-800 border border-gray-200 self-start rounded-bl-none shadow-sm" 
                        }`}
                    style={mg.isUser ? { backgroundColor: config.primaryColor } : {}}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0}}
                    >
                        {mg.text}
                    </motion.div>

                ))}
                <AnimatePresence>
                    {isThinking && (
                        <motion.div 
                            layout="position"
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
                            className="self-start bg-white border border-gray-200 p-3 rounded-xl rounded-bl-none shadow-sm flex gap-1 items-center w-fit h-10"
                        >
                            {[0, 0.15, 0.3].map((delay, i) => (
                                <motion.div 
                                    key={i}
                                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                    variants={dotVariants}
                                    animate="animate"
                                    transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            repeatType: "reverse" as const,
                                            ease: "easeInOut",
                                            delay: delay
                                        }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">

                <input
                    className="flex-1 bg-gray-100 text-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    onChange={(e) => setMessageUser(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    value={messageUser}
                    type="text"
                    disabled={isThinking}
                    placeholder="Напишите сообщение..." 
                />

                <button
                    className=" text-white p-2 rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center justify-center"
                    onClick={() => handleSend()}
                    style={{ backgroundColor: config.primaryColor }}
                    disabled={isThinking}
                >
                    <Send size={18} />
                </button>
            </div>
            <div ref={lastMessageRef}></div>
        </motion.div>
    )
}