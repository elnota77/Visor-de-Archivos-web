'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { Folder, File, ArrowUp, HardDrive, FileText, Image as ImageIcon, Film, Music, Code, ChevronRight } from 'lucide-react';

interface FileEntry {
    name: string;
    isDirectory: boolean;
    size: number;
    mtime: string;
}

interface PanelProps {
    isActive: boolean;
    path: string;
    onPathChange: (path: string) => void;
    onSelect: (files: FileEntry[]) => void;
    refreshTrigger: number;
    showHidden: boolean;
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getIcon = (file: FileEntry) => {
    if (file.name === '..') return <ArrowUp size={20} className="text-neon-cyan" />;
    if (file.isDirectory) return <Folder size={20} className="text-yellow-400 fill-yellow-400/20" />;

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'png': case 'jpg': case 'jpeg': case 'gif': return <ImageIcon size={20} className="text-purple-400" />;
        case 'mp4': case 'mkv': case 'mov': return <Film size={20} className="text-red-400" />;
        case 'mp3': case 'wav': return <Music size={20} className="text-green-400" />;
        case 'js': case 'ts': case 'json': case 'css': case 'html': return <Code size={20} className="text-blue-400" />;
        default: return <FileText size={20} className="text-gray-400" />;
    }
};

export default function Panel({ isActive, path, onPathChange, onSelect, refreshTrigger, showHidden }: PanelProps) {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set([0]));
    const [lastSelectedIndex, setLastSelectedIndex] = useState(0); // For Shift+Click range
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.details || res.statusText || 'Failed to fetch');
            }
            const data = await res.json();

            let list = data.files || [];

            // Filter hidden files if showHidden is false
            if (!showHidden) {
                const hiddenPrefixes = ['.', '$', 'System Volume Information', 'pagefile.sys', 'swapfile.sys', 'hiberfil.sys', 'Config.Msi', 'Recovery'];
                list = list.filter((f: any) => {
                    if (f.name.toLowerCase() === '$recycle.bin') return true; // Always show recycle bin
                    return !hiddenPrefixes.some(prefix => f.name.startsWith(prefix) || f.name === prefix);
                });
            }

            if (path !== '/' && path !== '' && path !== 'd:/' && path !== 'c:/' && path !== 'e:/') {
                list.unshift({ name: '..', isDirectory: true, size: 0, mtime: '' });
            }

            setFiles(list);
            setSelectedIndices(new Set([0]));
            setLastSelectedIndex(0);
        } catch (e: any) {
            console.error(e);
            setError(e.message);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [path, showHidden]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles, refreshTrigger]);

    useEffect(() => {
        const selectedFiles = Array.from(selectedIndices).map(i => files[i]).filter(Boolean);
        onSelect(selectedFiles);
    }, [selectedIndices, files, onSelect]);

    const handleNavigate = useCallback((file: FileEntry) => {
        if (file.name === '..') {
            const parts = path.split('/').filter(Boolean);
            parts.pop();
            onPathChange(parts.length ? '/' + parts.join('/') : '/');
        } else if (file.isDirectory) {
            const newPath = path === '/' ? '/' + file.name : path + '/' + file.name;
            onPathChange(newPath);
        }
    }, [path, onPathChange]);

    const handleSelection = (idx: number, e: React.MouseEvent | KeyboardEvent) => {
        const isCtrl = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;

        const newSet = new Set(isCtrl ? selectedIndices : []);

        if (isShift) {
            const start = Math.min(lastSelectedIndex, idx);
            const end = Math.max(lastSelectedIndex, idx);
            for (let i = start; i <= end; i++) {
                newSet.add(i);
            }
        } else {
            if (isCtrl) {
                if (newSet.has(idx)) newSet.delete(idx);
                else newSet.add(idx);
            } else {
                newSet.add(idx);
            }
            setLastSelectedIndex(idx);
        }

        // Ensure at least one item is selected if not Ctrl clicking to deselect everything (optional, but Norton style usually has cursor)
        // But for modern multi-select, empty selection is allowed. 
        // Let's allow empty selection if Ctrl clicking the last item.

        setSelectedIndices(newSet);
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setLastSelectedIndex(prev => {
                    const next = Math.min(prev + 1, files.length - 1);
                    if (!e.shiftKey && !e.ctrlKey) setSelectedIndices(new Set([next]));
                    return next;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setLastSelectedIndex(prev => {
                    const next = Math.max(prev - 1, 0);
                    if (!e.shiftKey && !e.ctrlKey) setSelectedIndices(new Set([next]));
                    return next;
                });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const file = files[lastSelectedIndex];
                if (file) handleNavigate(file);
            } else if (e.key === ' ' && e.ctrlKey) {
                // Space to toggle selection like classic managers? Or just Ctrl+Space
                e.preventDefault();
                handleSelection(lastSelectedIndex, e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, files, lastSelectedIndex, path, selectedIndices, handleNavigate]);

    // Scroll into view
    useEffect(() => {
        const el = document.getElementById(`file-${isActive ? 'active' : 'inactive'}-${lastSelectedIndex}`);
        if (el) {
            el.scrollIntoView({ block: 'nearest' });
        }
    }, [lastSelectedIndex, isActive]);

    return (
        <div className={clsx(
            "flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 backdrop-blur-xl border-2",
            isActive
                ? "border-neon-blue shadow-[0_0_30px_rgba(61,90,254,0.3)] bg-glass-blue/90"
                : "border-white/10 bg-black/40 hover:bg-black/60 opacity-80"
        )}>
            {/* breadcrumb header */}
            <div className={clsx(
                "px-4 py-3 font-mono text-sm border-b flex items-center gap-3 transition-colors",
                isActive ? "bg-neon-blue/20 text-white border-neon-blue/50" : "bg-transparent text-gray-400 border-white/10"
            )}>
                {/* Select All Checkbox */}
                <input
                    type="checkbox"
                    className="accent-neon-cyan w-4 h-4 cursor-pointer"
                    checked={files.length > 0 && selectedIndices.size === files.length}
                    onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                            setSelectedIndices(new Set(files.map((_, i) => i)));
                        } else {
                            setSelectedIndices(new Set());
                        }
                    }}
                />
                <HardDrive size={18} className={isActive ? "text-neon-cyan" : "text-gray-500"} />
                <span className="truncate flex-1 tracking-wide font-bold">{path || '/'}</span>
                {path !== '/' && (
                    <button
                        onClick={() => handleNavigate({ name: '..', isDirectory: true, size: 0, mtime: '' })}
                        className="p-1 rounded hover:bg-white/10 text-neon-cyan"
                        title="Go Up"
                    >
                        <ArrowUp size={18} />
                    </button>
                )}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-auto custom-scrollbar p-2" ref={scrollRef}>
                {loading && <div className="p-4 text-center text-neon-cyan animate-pulse">Loading...</div>}

                {error && (
                    <div className="p-4 m-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                        <strong className="block mb-1 text-red-400 uppercase tracking-wider text-xs">Error Accessing Drive</strong>
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    {files.map((file, idx) => {
                        const isSelected = selectedIndices.has(idx);
                        const isFocused = idx === lastSelectedIndex && isActive;

                        return (
                            <div
                                key={idx}
                                id={`file-${isActive ? 'active' : 'inactive'}-${idx}`}
                                className={clsx(
                                    "group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 border",
                                    isSelected
                                        ? (isActive ? "bg-neon-blue/20 border-neon-blue/50 shadow-[0_0_15px_rgba(0,229,255,0.1)] translate-x-1" : "bg-white/10 border-white/20")
                                        : "border-transparent hover:bg-white/5 hover:border-white/10",
                                    isFocused && !isSelected && "ring-1 ring-white/50"
                                )}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate(file);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (file.name === '..') {
                                        handleNavigate(file);
                                    } else {
                                        handleSelection(idx, e);
                                    }
                                }}
                            >
                                {/* Icon */}
                                <div className={clsx(
                                    "p-2 rounded-lg bg-black/30 shadow-inner",
                                    isSelected ? "ring-1 ring-neon-cyan/50" : ""
                                )}>
                                    {getIcon(file)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <span className={clsx(
                                        "font-bold truncate text-base",
                                        isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
                                    )}>
                                        {file.name}
                                    </span>
                                    <div className="flex gap-4 text-xs text-gray-500 font-mono">
                                        <span>{file.isDirectory ? '<DIR>' : formatSize(file.size)}</span>
                                        <span className="hidden sm:inline opacity-50">|</span>
                                        <span className="hidden sm:inline">{file.mtime ? new Date(file.mtime).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>

                                {/* Arrow for folders */}
                                {file.isDirectory && (
                                    <ChevronRight size={18} className={clsx(
                                        "text-gray-600 transition-transform",
                                        isSelected ? "text-neon-cyan translate-x-1" : "group-hover:text-gray-400"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                    {files.length === 0 && !loading && !error && (
                        <div className="text-center p-12 text-gray-600 flex flex-col items-center gap-4">
                            <Folder size={48} className="opacity-20" />
                            <span>Empty Directory</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer stats */}
            <div className={clsx(
                "px-4 py-2 text-xs font-mono flex justify-between items-center border-t",
                isActive ? "bg-neon-blue/10 border-neon-blue/30 text-neon-cyan" : "bg-transparent border-white/5 text-gray-600"
            )}>
                <span className="font-bold">{files.length} ITEMS</span>
                <span>
                    {selectedIndices.size > 0 ? `${selectedIndices.size} SELECTED` :
                        (files.reduce((acc, f) => acc + f.size, 0) > 0 ? formatSize(files.reduce((acc, f) => acc + f.size, 0)) : '0 B')}
                </span>
            </div>
        </div>
    );
}
