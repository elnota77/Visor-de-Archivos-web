import { Settings, HardDrive, Menu, X, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface TopBarProps {
    currentPath: string;
    onNavigate: (path: string) => void;
    onOpenSettings: () => void;
    onGoRecycle: () => void;
}

export default function TopBar({ currentPath, onNavigate, onOpenSettings, onGoRecycle }: TopBarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const drives = [
        { label: 'Local Disk (C:)', path: '/c' },
        { label: 'Data (D:)', path: '/d' },
        { label: 'USB (E:)', path: '/e' },
    ];

    return (
        <header className="bg-black/90 backdrop-blur-md border-b border-white/10 z-50 relative">
            <div className="px-4 py-3 flex items-center justify-between">
                {/* Logo / Title */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center shadow-lg shadow-neon-blue/20">
                        <HardDrive size={18} className="text-black" />
                    </div>
                    <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden sm:block">
                        COMMANDER
                    </span>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Drive Selector */}
                    <div className="relative">
                        <select
                            onChange={(e) => onNavigate(e.target.value)}
                            value={drives.find(d => currentPath.startsWith(d.path))?.path || ''}
                            className="appearance-none bg-white/5 border border-white/10 rounded-lg py-1.5 pl-3 pr-8 text-sm font-bold text-gray-200 focus:outline-none focus:ring-1 focus:ring-neon-blue hover:bg-white/10 transition-all cursor-pointer min-w-[140px]"
                        >
                            <option value="" disabled>Select Drive</option>
                            {drives.map(drive => (
                                <option key={drive.path} value={drive.path} className="bg-[#0a0a12] text-gray-200">
                                    {drive.label}
                                </option>
                            ))}
                        </select>
                        <HardDrive size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    <button
                        onClick={onGoRecycle}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all text-xs font-bold uppercase tracking-widest"
                        title="View Recycle Bin"
                    >
                        <Trash2 size={16} />
                        <span className="hidden lg:inline">Recycle Bin</span>
                    </button>

                    <button
                        onClick={onOpenSettings}
                        className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-white/5 rounded-full transition-colors"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-gray-200"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a0a12] border-b border-white/10 p-4 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-2">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Select Drive</span>
                        {drives.map(drive => (
                            <button
                                key={drive.path}
                                onClick={() => {
                                    onNavigate(drive.path);
                                    setMobileMenuOpen(false);
                                }}
                                className={clsx(
                                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                    currentPath.startsWith(drive.path)
                                        ? "bg-neon-blue/10 border-neon-blue text-neon-cyan"
                                        : "bg-white/5 border-transparent text-gray-300 hover:bg-white/10"
                                )}
                            >
                                <HardDrive size={18} />
                                <span className="font-bold">{drive.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
                        <button
                            onClick={() => {
                                onGoRecycle();
                                setMobileMenuOpen(false);
                            }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 w-full"
                        >
                            <Trash2 size={18} />
                            <span className="font-bold">Recycle Bin</span>
                        </button>
                        <button
                            onClick={() => {
                                onOpenSettings();
                                setMobileMenuOpen(false);
                            }}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-gray-300 w-full"
                        >
                            <Settings size={18} />
                            <span className="font-bold">Settings</span>
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}

