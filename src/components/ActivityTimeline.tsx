import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Phone, Mail, FileText, Calendar, Plus } from 'lucide-react';
import { db, type Activity } from '../db';


interface ActivityTimelineProps {
    entityType: 'contact' | 'company' | 'deal' | 'ticket';
    entityId: string;
}

export function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newNote, setNewNote] = useState('');

    const activities = useLiveQuery(async () => {
        return await db.activities
            .where(entityType + 'Id')
            .equals(entityId)
            .reverse()
            .sortBy('timestamp');
    }, [entityType, entityId]);

    const [attachments, setAttachments] = useState<{ name: string; type: string; data: string }[]>([]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setAttachments([...attachments, {
                    name: file.name,
                    type: file.type,
                    data: reader.result as string
                }]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() && attachments.length === 0) return;

        const timestamp = Date.now();
        const tempId = crypto.randomUUID();

        const activity: Activity = {
            id: tempId,
            type: 'note' as const,
            content: newNote,
            timestamp,
            syncStatus: 'pending_create' as const,
            updatedAt: timestamp,
            [entityType + 'Id']: entityId,
            attachments
        };

        await db.activities.add(activity);
        await db.syncQueue.add({
            type: 'create',
            entity: 'activity',
            data: activity,
            timestamp
        });

        setNewNote('');
        setAttachments([]);
        setIsAdding(false);
    };

    const getIcon = (type: Activity['type']) => {
        switch (type) {
            case 'call': return <Phone size={16} className="text-orange-500" />;
            case 'email': return <Mail size={16} className="text-blue-500" />;
            case 'meeting': return <Calendar size={16} className="text-red-500" />;
            default: return <FileText size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Activity Timeline</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                    <Plus size={16} />
                    Add Note
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddNote} className="mb-6 bg-gray-50 p-4 rounded-md">
                    <textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="Write a note..."
                        className="w-full p-2 border border-gray-300 rounded-md mb-2 text-sm"
                        rows={3}
                    />

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-600">
                                    <FileText size={12} />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                        className="text-red-500 hover:text-red-700 ml-1"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <div>
                            <label className="cursor-pointer flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
                                <input type="file" className="hidden" onChange={handleFileChange} />
                                <span className="p-1 hover:bg-gray-200 rounded">📎 Attach File</span>
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="flow-root">
                <ul className="-mb-8">
                    {activities?.map((activity, activityIdx) => (
                        <li key={activity.id}>
                            <div className="relative pb-8">
                                {activityIdx !== activities.length - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div className="h-8 w-8 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                                        {getIcon(activity.type)}
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                        <div>
                                            {activity.type === 'email' ? (
                                                <div
                                                    className="text-sm text-gray-500 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: activity.content }}
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-500 whitespace-pre-wrap">
                                                    {activity.content}
                                                </p>
                                            )}

                                            {/* Display Attachments */}
                                            {activity.attachments && activity.attachments.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {activity.attachments.map((file, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={file.data}
                                                            download={file.name}
                                                            className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded text-xs text-blue-600 hover:underline"
                                                        >
                                                            <FileText size={12} />
                                                            {file.name}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                            <time dateTime={new Date(activity.timestamp).toISOString()}>
                                                {new Date(activity.timestamp).toLocaleDateString()}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {activities?.length === 0 && !isAdding && (
                        <li className="text-sm text-gray-500 text-center py-4">No activities yet.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
