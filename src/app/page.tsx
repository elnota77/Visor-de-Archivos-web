'use client';

import { useState, useCallback, useEffect } from 'react';
import Panel from '@/components/Panel';
import CommanderBar from '@/components/CommanderBar';
import Modal from '@/components/Modal';
import TopBar from '@/components/TopBar';
import SettingsModal from '@/components/SettingsModal';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Monitor, Smartphone } from 'lucide-react';

export default function Home() {
    const [leftPath, setLeftPath] = useState('/');
    const [rightPath, setRightPath] = useState('/');
    const [activePanel, setActivePanel] = useState<'left' | 'right'>('left');

    const [leftSelection, setLeftSelection] = useState<any[]>([]);
    const [rightSelection, setRightSelection] = useState<any[]>([]);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [modalMode, setModalMode] = useState<'none' | 'mkdir' | 'delete' | 'copy' | 'move' | 'download' | 'upload' | 'progress'>('none');
    const [inputValue, setInputValue] = useState('');
    const [pendingUploads, setPendingUploads] = useState<FileList | null>(null);
    const [conflictingFiles, setConflictingFiles] = useState<string[]>([]);
    const [progress, setProgress] = useState({ file: '', percent: 0, speed: '' });

    const router = useRouter();

    const activePath = activePanel === 'left' ? leftPath : rightPath;
    const inactivePath = activePanel === 'left' ? rightPath : leftPath;
    const activeSelection = activePanel === 'left' ? leftSelection : rightSelection;

    const refresh = () => setRefreshTrigger(prev => prev + 1);

    const handleAction = useCallback(async (key: string) => {
        setConflictingFiles([]); // Reset conflicts
        switch (key) {
            case 'F3': // Download
                if (activeSelection.length === 1 && !activeSelection[0].isDirectory) {
                    setModalMode('download');
                }
                break;
            case 'F5': // Copy
                if (activeSelection.length > 0) {
                    try {
                        // Check for conflicts
                        const res = await fetch(`/api/files?path=${encodeURIComponent(inactivePath)}`);
                        if (res.ok) {
                            const data = await res.json();
                            const destFiles: any[] = data.files || [];
                            const conflicts = activeSelection.filter(f => destFiles.some((df: any) => df.name === f.name)).map(f => f.name);
                            setConflictingFiles(conflicts);
                        }
                    } catch (err) {
                        console.error("Failed to check conflicts:", err);
                    }
                    setModalMode('copy');
                }
                break;
            case 'F6': // Move
                if (activeSelection.length > 0) {
                    try {
                        const res = await fetch(`/api/files?path=${encodeURIComponent(inactivePath)}`);
                        if (res.ok) {
                            const data = await res.json();
                            const destFiles: any[] = data.files || [];
                            const conflicts = activeSelection.filter(f => destFiles.some((df: any) => df.name === f.name)).map(f => f.name);
                            setConflictingFiles(conflicts);
                        }
                    } catch (err) {
                        console.error("Failed to check conflicts:", err);
                    }
                    setModalMode('move');
                }
                break;
            case 'F7': // MkDir
                setInputValue('');
                setModalMode('mkdir');
                break;
            case 'F8': // Delete
                if (activeSelection.length > 0) {
                    if (activePath.startsWith('/c')) {
                        alert("El disco local (C:) está protegido contra el borrado. / Local Disk (C:) is protected against deletion.");
                        return;
                    }
                    setModalMode('delete');
                }
                break;
            case 'F9': // Upload
                document.getElementById('file-upload')?.click();
                break;
            case 'F10': // Quit
                document.cookie = 'auth_token=; Max-Age=0; path=/;';
                router.push('/login');
                break;
        }
    }, [activeSelection, router, activePath, inactivePath]);

    const executeAction = async () => {
        // Prepare for execution
        setModalMode('progress');
        setProgress({ file: 'Starting...', percent: 0, speed: '0 MB/s' });

        const processStream = async (res: Response) => {
            if (!res.body) return;
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const msg = JSON.parse(line);
                            if (msg.type === 'progress') {
                                setProgress({ file: msg.file, percent: msg.percent, speed: msg.speed + ' MB/s' });
                            } else if (msg.type === 'error') {
                                console.error(msg.message);
                            }
                        } catch (e) { }
                    }
                }
            } catch (err) {
                console.error("Stream reading failed", err);
            }
        };

        const promises = [];

        if (modalMode === 'mkdir') {
            const body = { action: 'mkdir', path: (activePath === '/' ? '' : activePath) + '/' + inputValue };
            promises.push(fetch('/api/files', { method: 'POST', body: JSON.stringify(body) }).then(processStream));
        } else if (modalMode === 'download') {
            window.open(`/api/files/download?path=${encodeURIComponent((activePath === '/' ? '' : activePath) + '/' + activeSelection[0].name)}`, '_blank');
            setModalMode('none');
            return;
        } else if (modalMode === 'upload' && pendingUploads) {
            for (let i = 0; i < pendingUploads.length; i++) {
                const formData = new FormData();
                formData.append('file', pendingUploads[i]);
                formData.append('path', activePath);
                promises.push(fetch('/api/files/upload', { method: 'POST', body: formData }));
            }
        } else {
            // Batch operations for Delete, Copy, Move
            for (const file of activeSelection) {
                const cleanActive = activePath === '/' ? '' : activePath;
                const cleanInactive = inactivePath === '/' ? '' : inactivePath;

                const filePath = `${cleanActive}/${file.name}`;
                const destPath = `${cleanInactive}/${file.name}`;

                let body: any = {};
                if (modalMode === 'delete') {
                    body = { action: 'delete', path: filePath };
                } else if (modalMode === 'copy') {
                    body = { action: 'copy', path: filePath, destination: destPath };
                } else if (modalMode === 'move') {
                    body = { action: 'move', path: filePath, destination: destPath };
                }

                if (body.action) {
                    promises.push(fetch('/api/files', { method: 'POST', body: JSON.stringify(body) }).then(processStream));
                }
            }
        }

        await Promise.all(promises);
        setModalMode('none');
        setPendingUploads(null);
        refresh();
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                setActivePanel(p => p === 'left' ? 'right' : 'left');
            } else if (e.key === 'F5') { e.preventDefault(); handleAction('F5'); }
            else if (e.key === 'F6') { e.preventDefault(); handleAction('F6'); }
            else if (e.key === 'F7') { e.preventDefault(); handleAction('F7'); }
            else if (e.key === 'F8') { e.preventDefault(); handleAction('F8'); }
            else if (e.key === 'F10') { e.preventDefault(); handleAction('F10'); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [activePanel, handleAction]);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showHidden, setShowHidden] = useState(false);

    return (
        <main className="flex flex-col h-[100dvh] bg-[#0a0a12] text-gray-200 overflow-hidden relative font-mono">
            {/* Background Effects (Unified with Login) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(61,90,254,0.15),transparent_70%)] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-neon-blue/5 to-transparent pointer-events-none" />

            <TopBar
                currentPath={activePath}
                onNavigate={(path) => {
                    if (activePanel === 'left') setLeftPath(path);
                    else setRightPath(path);
                }}
                onOpenSettings={() => setSettingsOpen(true)}
                onGoRecycle={() => {
                    const drive = activePath.split('/')[1] || 'c';
                    const recyclePath = `/${drive}/$Recycle.Bin`;
                    if (activePanel === 'left') setLeftPath(recyclePath);
                    else setRightPath(recyclePath);
                }}
            />

            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                showHidden={showHidden}
                onToggleHidden={setShowHidden}
            />

            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex p-4 gap-3 z-10 shrink-0">
                <button
                    onClick={() => setActivePanel('left')}
                    className={clsx(
                        "flex-1 py-3 rounded-xl font-bold transition-all text-xs tracking-widest border",
                        activePanel === 'left'
                            ? "bg-neon-blue text-black border-neon-blue shadow-[0_0_15px_rgba(61,90,254,0.4)]"
                            : "bg-black/40 text-gray-500 border-white/10 hover:bg-white/5"
                    )}
                >
                    LEFT PANEL
                </button>
                <button
                    onClick={() => setActivePanel('right')}
                    className={clsx(
                        "flex-1 py-3 rounded-xl font-bold transition-all text-xs tracking-widest border",
                        activePanel === 'right'
                            ? "bg-neon-blue text-black border-neon-blue shadow-[0_0_15px_rgba(61,90,254,0.4)]"
                            : "bg-black/40 text-gray-500 border-white/10 hover:bg-white/5"
                    )}
                >
                    RIGHT PANEL
                </button>
            </div>

            <div className="flex-1 flex gap-6 min-h-0 px-4 pb-0 md:pb-4 z-10 overflow-hidden relative">
                {/* Left Panel */}
                <div className={clsx(
                    "flex-1 min-w-0 h-full transition-opacity duration-300 flex flex-col padding-bottom-safe",
                    "md:flex", // Always flex (visible) on desktop
                    activePanel === 'left' ? "flex" : "hidden"
                )} onClick={() => setActivePanel('left')}>
                    <Panel
                        isActive={activePanel === 'left'}
                        path={leftPath}
                        onPathChange={setLeftPath}
                        onSelect={setLeftSelection}
                        refreshTrigger={refreshTrigger}
                        showHidden={showHidden}
                    />
                </div>

                {/* Right Panel */}
                <div className={clsx(
                    "flex-1 min-w-0 h-full transition-opacity duration-300 flex flex-col padding-bottom-safe",
                    "md:flex", // Always flex (visible) on desktop
                    activePanel === 'right' ? "flex" : "hidden"
                )} onClick={() => setActivePanel('right')}>
                    <Panel
                        isActive={activePanel === 'right'}
                        path={rightPath}
                        onPathChange={setRightPath}
                        onSelect={setRightSelection}
                        refreshTrigger={refreshTrigger}
                        showHidden={showHidden}
                    />
                </div>
            </div>

            <div className="z-50">
                <CommanderBar onAction={handleAction} />
            </div>

            {/* Hidden Input for Upload */}
            <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple // Enable multi-file upload
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        setPendingUploads(e.target.files);
                        setModalMode('upload');
                        e.target.value = ''; // Reset input to allow re-selecting same files
                    }
                }}
            />

            <Modal
                isOpen={modalMode !== 'none'}
                title={
                    modalMode === 'copy' ? 'COPY FILE' :
                        modalMode === 'move' ? 'MOVE FILE' :
                            modalMode === 'mkdir' ? 'NEW FOLDER' :
                                modalMode === 'delete' ? 'RECYCLE BIN' :
                                    modalMode === 'download' ? 'DOWNLOAD FILE' :
                                        modalMode === 'progress' ? 'PROCESSING...' :
                                            'UPLOAD FILE'
                }
                onClose={() => { setModalMode('none'); setPendingUploads(null); }}
            >
                {(modalMode === 'mkdir') && (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-400 uppercase">Folder Name</label>
                            <input
                                className="bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                                autoFocus
                                placeholder="New Folder"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && executeAction()}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={executeAction} className="bg-neon-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors">Create</button>
                        </div>
                    </div>
                )}
                {(modalMode === 'delete') && (
                    <div className="flex flex-col gap-6">
                        <div className="text-lg">
                            Move to <b>Recycle Bin</b>:
                            <ul className="list-disc pl-5 mt-2 text-red-300 space-y-1 max-h-40 overflow-y-auto">
                                {activeSelection.slice(0, 5).map((f, i) => (
                                    <li key={i}>
                                        <b className="text-red-400">{f.name}</b>
                                        {f.isDirectory && <span className="text-xs text-red-500 ml-2">(Folder & contents)</span>}
                                    </li>
                                ))}
                                {activeSelection.length > 5 && <li>...and {activeSelection.length - 5} more</li>}
                            </ul>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setModalMode('none')} className="bg-white/10 px-6 py-2 rounded-lg font-bold hover:bg-white/20 transition-colors">Cancel</button>
                            <button onClick={executeAction} className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Recycle</button>
                        </div>
                    </div>
                )}
                {(modalMode === 'copy' || modalMode === 'move') && (
                    <div className="flex flex-col gap-6">
                        <p className="text-lg">
                            {modalMode === 'copy' ? 'Copy ' : 'Move '}
                            <b className="text-neon-cyan">{activeSelection.length > 1 ? `${activeSelection.length} files` : activeSelection[0]?.name}</b>
                            <span className="text-gray-400 mx-2">to</span>
                            <b className="text-neon-cyan">{inactivePath}</b>?
                        </p>
                        {conflictingFiles.length > 0 && (
                            <div className="bg-orange-500/20 border border-orange-500/50 p-3 rounded-lg text-orange-200 text-sm">
                                <b>Warning:</b> {conflictingFiles.length} file(s) already exist and will be overwritten:
                                <ul className="list-disc pl-5 mt-1 max-h-20 overflow-y-auto">
                                    {conflictingFiles.map(f => <li key={f}>{f}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setModalMode('none')} className="bg-white/10 px-6 py-2 rounded-lg font-bold hover:bg-white/20 transition-colors">Cancel</button>
                            <button onClick={executeAction} className="bg-neon-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-neon-blue/20">Confirm</button>
                        </div>
                    </div>
                )}
                {(modalMode === 'download') && (
                    <div className="flex flex-col gap-6">
                        <p className="text-lg">
                            Download <b className="text-neon-cyan">{activeSelection[0]?.name}</b>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setModalMode('none')} className="bg-white/10 px-6 py-2 rounded-lg font-bold hover:bg-white/20 transition-colors">Cancel</button>
                            <button onClick={executeAction} className="bg-neon-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-neon-blue/20">Download</button>
                        </div>
                    </div>
                )}
                {(modalMode === 'upload') && (
                    <div className="flex flex-col gap-6">
                        <p className="text-lg">
                            Upload <b className="text-neon-cyan">{pendingUploads?.length} files</b> to <b className="text-neon-cyan">{activePath}</b>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setModalMode('none'); setPendingUploads(null); }} className="bg-white/10 px-6 py-2 rounded-lg font-bold hover:bg-white/20 transition-colors">Cancel</button>
                            <button onClick={executeAction} className="bg-neon-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-neon-blue/20">Upload</button>
                        </div>
                    </div>
                )}
                {(modalMode === 'progress') && (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>{progress.file}</span>
                                <span>{progress.speed}</span>
                            </div>
                            <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                <div
                                    className="h-full bg-neon-blue transition-all duration-200"
                                    style={{ width: `${progress.percent}%` }}
                                />
                            </div>
                            <div className="text-right text-xs text-neon-cyan font-bold">{progress.percent}%</div>
                        </div>
                    </div>
                )}
            </Modal>
        </main>
    );
}
