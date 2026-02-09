'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Copy, Move, FolderPlus, Trash2, Upload, LogOut, ChevronUp, ChevronDown, Menu, Download } from 'lucide-react';

interface CommanderBarProps {
    onAction: (key: string) => void;
}

export default function CommanderBar({ onAction }: CommanderBarProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const actions = [
        { key: 'F3', label: 'Download', icon: Download, color: 'text-cyan-400' },
        { key: 'F5', label: 'Copy', icon: Copy, color: 'text-blue-400' },
        { key: 'F6', label: 'Move', icon: Move, color: 'text-yellow-400' },
        { key: 'F7', label: 'New Folder', icon: FolderPlus, color: 'text-green-400' },
        { key: 'F8', label: 'Delete', icon: Trash2, color: 'text-red-400' },
        { key: 'F9', label: 'Upload', icon: Upload, color: 'text-purple-400' },
        { key: 'F10', label: 'Quit', icon: LogOut, color: 'text-gray-400' },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="md:hidden fixed bottom-4 right-4 z-50 p-3 rounded-full bg-neon-blue text-black shadow-[0_0_20px_rgba(61,90,254,0.5)] hover:bg-white transition-colors"
            >
                {isExpanded ? <ChevronDown size={24} /> : <Menu size={24} />}
            </button>

            <div className={clsx(
                "fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 md:translate-y-0 md:static",
                isExpanded ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="grid grid-cols-3 md:flex gap-2 md:gap-4 p-2 md:p-0 bg-black/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t border-white/10 md:border-t-0 pb-16 md:pb-0">
                    {actions.map((action) => (
                        <button
                            key={action.key}
                            onClick={() => {
                                onAction(action.key);
                                // Optional: collapse on mobile after action?
                                // setIsExpanded(false); 
                            }}
                            className="group relative flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl bg-glass-blue/50 border border-white/5 hover:border-neon-blue/50 hover:bg-neon-blue/10 hover:shadow-[0_0_20px_rgba(61,90,254,0.3)] transition-all duration-300 active:scale-95"
                        >
                            <div className={clsx("p-2 rounded-full bg-black/40 group-hover:bg-black/60 transition-colors", action.color)}>
                                <action.icon size={18} />
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-neon-cyan transition-colors">{action.key}</span>
                                <span className="text-xs md:text-sm font-bold text-gray-200 group-hover:text-white">{action.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
