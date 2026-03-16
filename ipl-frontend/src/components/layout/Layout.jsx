import Sidebar from './Sidebar'
import { useUI } from '../../context/UIContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Layout({ children }) {
  const { isSidebarOpen, closeSidebar } = useUI()

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-dark-900 transition-colors duration-300 overflow-hidden flex relative">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar />
      
      <main className="flex-1 lg:ml-64 flex flex-col h-full overflow-hidden transition-all duration-300">
        <div className="flex-1 flex flex-col h-full"> 
          {children}
        </div>
      </main>
    </div>
  )
}
