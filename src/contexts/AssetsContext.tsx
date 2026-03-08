import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export interface Asset {
    id: string;
    name: string;
    type: 'image' | 'video' | 'document' | 'archive';
    size: number; // bytes
    data: string; // base64 or URL
    thumbnail: string | null; // base64 preview for images
    isGlobal: boolean;
    userId: string | null;
    createdAt: number;
}

interface AssetsContextType {
    assets: Asset[];
    addAsset: (file: File) => Promise<void>;
    deleteAsset: (id: string) => void;
    renameAsset: (id: string, newName: string) => void;
    toggleGlobal: (id: string) => Promise<void>;
    totalStorageUsed: number; // bytes
}

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

function getFileType(file: File): Asset['type'] {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) return 'archive';
    return 'document';
}

export function AssetsProvider({ children }: { children: React.ReactNode }) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const { user } = useAuth();

    const loadAssets = useCallback(async () => {
        // Fetch both global assets and user assets
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Erro ao carregar arquivos:", error);
            return;
        }
        if (data) {
            setAssets(data.map(d => ({
                id: d.id,
                name: d.name,
                type: d.type as any,
                size: d.size || 0,
                data: d.data || '',
                thumbnail: d.thumbnail,
                isGlobal: d.is_global || false,
                userId: d.user_id,
                createdAt: d.created_at || Date.now()
            })));
        }
    }, []);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    const totalStorageUsed = assets.reduce((sum, a) => sum + (a.size || 0), 0);

    const addAsset = useCallback(async (file: File) => {
        if (!user) return;
        const id = uuidv4();
        const fileExt = file.name.split('.').pop();
        const filePath = `${id}.${fileExt}`;

        // 1. Upload to Supabase Storage Bucket
        const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, file);
        if (uploadError) {
            console.error("Upload error:", uploadError);
            throw uploadError;
        }

        // 2. Get Public URL
        const { data: urlData } = supabase.storage.from('assets').getPublicUrl(filePath);

        // 3. Define Thumbnail
        let thumbnail = null;
        if (file.type.startsWith('image/')) {
            thumbnail = urlData.publicUrl; // Use original image as thumbnail 
        }

        // 4. Save metadata in the database
        const newAssetData = {
            id,
            name: file.name,
            type: getFileType(file),
            size: file.size,
            data: urlData.publicUrl,
            thumbnail,
            user_id: user.uid,
            is_global: false,
            created_at: Date.now()
        };

        const { error: dbError } = await supabase.from('assets').insert(newAssetData);
        if (dbError) {
            console.error("DB insert error:", dbError);
            throw dbError;
        }

        loadAssets(); // Refresh list
    }, [loadAssets, user]);

    const deleteAsset = useCallback(async (id: string) => {
        const asset = assets.find(a => a.id === id);

        // Optimistic UI update
        setAssets(prev => prev.filter(a => a.id !== id));

        if (asset && asset.data) {
            try {
                // Parse filename from standard Supabase storage URL
                const urlParts = asset.data.split('/');
                const filename = urlParts[urlParts.length - 1];

                // Remove from bucket
                await supabase.storage.from('assets').remove([filename]);
            } catch (e) {
                console.error("Storage remove error:", e);
            }
        }

        // Remove from database
        await supabase.from('assets').delete().eq('id', id);
        loadAssets();
    }, [assets, loadAssets]);

    const renameAsset = useCallback(async (id: string, newName: string) => {
        // Optimistic UI update
        setAssets(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));

        await supabase.from('assets').update({ name: newName }).eq('id', id);
        loadAssets();
    }, [loadAssets]);

    const toggleGlobal = useCallback(async (id: string) => {
        const asset = assets.find(a => a.id === id);
        if (!asset) return;

        const newState = !asset.isGlobal;

        // Optimistic UI update
        setAssets(prev => prev.map(a => a.id === id ? { ...a, isGlobal: newState } : a));

        await supabase.from('assets').update({ is_global: newState }).eq('id', id);
        loadAssets();
    }, [assets, loadAssets]);

    return (
        <AssetsContext.Provider value={{ assets, addAsset, deleteAsset, renameAsset, toggleGlobal, totalStorageUsed }}>
            {children}
        </AssetsContext.Provider>
    );
}

export function useAssets() {
    const context = useContext(AssetsContext);
    if (context === undefined) {
        throw new Error('useAssets must be used within an AssetsProvider');
    }
    return context;
}
