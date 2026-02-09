'use client';

import { X } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    showHidden: boolean;
    onToggleHidden: (val: boolean) => void;
}

export default function SettingsModal({ isOpen, onClose, showHidden, onToggleHidden }: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm border border-white/10 bg-[#0a0a12]/95 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden ring-1 ring-white/5">
                <div className="flex justify-between items-center bg-white/5 px-6 py-4 border-b border-white/5">
                    <span className="font-bold text-white tracking-widest text-lg">SETTINGS</span>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 flex flex-col gap-4">

                    {/* Show Hidden Files Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-gray-300 font-bold text-sm">Show Hidden Files</span>
                        <button
                            onClick={() => onToggleHidden(!showHidden)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${showHidden ? 'bg-neon-blue' : 'bg-gray-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${showHidden ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="text-xs text-center text-gray-600 mt-4 tracking-widest uppercase">
                        Web File Manager v2.1
                    </div>
                </div>
            </div>
        </div>
    );
}
