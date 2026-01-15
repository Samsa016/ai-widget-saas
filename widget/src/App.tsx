import { useState } from 'react'
import { ChatWindow } from './ChatWindow'
import styles from './index.css?inline'
import { MessageCircle, X } from 'lucide-react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage'
import { motion, AnimatePresence } from "framer-motion"
function UserChat() {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <>
      <style>{styles}</style>
      
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 font-sans">

        <AnimatePresence>
          {isOpen && (
            <ChatWindow onClose={() => setIsOpen(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              h-14 w-14 rounded-full shadow-xl flex items-center justify-center 
              transition-all duration-300 transform hover:scale-110 active:scale-95
              ${isOpen ? "bg-gray-700 rotate-90" : "bg-blue-600 hover:bg-blue-700"}
            `}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1}}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            transition={{
              type: "spring", stiffness: 260, damping: 20, delay: 0.5
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isOpen ? (
              <X size={24} color="white" /> 
            ) : (
              <MessageCircle size={28} color="white" />
            )}      
          </motion.button>
        </AnimatePresence>

      </div>
    </>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserChat />}></Route>
        <Route path="/admin" element={<AdminPage />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App