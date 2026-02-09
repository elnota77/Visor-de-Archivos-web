export default function Modal({ isOpen, title, children, onClose }: { isOpen: boolean; title: string, children: React.ReactNode, onClose: () => void }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md border border-white/10 bg-[#0a0a12]/90 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden ring-1 ring-white/5">
                <div className="flex justify-between items-center bg-white/5 px-6 py-4 border-b border-white/5">
                    <span className="font-bold text-white tracking-widest text-lg">{title}</span>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">✕</button>
                </div>
                <div className="p-6 text-gray-200">
                    {children}
                </div>
            </div>
        </div>
    );
}
