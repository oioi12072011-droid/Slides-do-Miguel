import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';
import { supabase } from '../services/supabase';

const BLOCKED_KEY = 'slides-do-miguel-blocked';

export interface TeamMember {
    id: string;
    name: string;
    password?: string;
    role: 'Admin' | 'Editor' | 'Viewer';
    online: boolean;
    avatar: string | null;
    addedAt: number;
    lastSeen: number;
}

export interface ActivityEntry {
    id: string;
    user: string;
    action: string;
    target: string;
    time: number;
}

interface TeamsContextType {
    members: TeamMember[];
    activityLog: ActivityEntry[];
    addMember: (name: string, password: string, role: 'Admin' | 'Editor' | 'Viewer') => void;
    removeMember: (id: string) => void;
    updateRole: (id: string, role: 'Admin' | 'Editor' | 'Viewer') => void;
    updateMemberStatus: (id: string, online: boolean) => void;
    isBlocked: (password: string) => boolean;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

    const [blockedEmails, setBlockedEmails] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(BLOCKED_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.error("Failed to load blocked emails", e);
        }
        return [];
    });

    const { user } = useAuth();

    useEffect(() => {
        if (Array.isArray(blockedEmails)) {
            localStorage.setItem(BLOCKED_KEY, JSON.stringify(blockedEmails));
        }
    }, [blockedEmails]);

    const loadData = useCallback(async () => {
        // Load profiles
        const { data: profilesData } = await supabase.from('profiles').select('*');
        if (profilesData) {
            const parsedMembers = profilesData.map(p => ({
                id: p.id,
                name: p.name,
                role: p.role as any,
                online: p.is_online,
                avatar: p.avatar_url,
                addedAt: p.last_seen || Date.now(), // Fallback
                lastSeen: p.last_seen || Date.now()
            }));
            setMembers(parsedMembers);
        }

        // Load activity
        const { data: activityData } = await supabase.from('activity_logs').select('*, profiles(name)').order('time', { ascending: false }).limit(50);
        if (activityData) {
            const parsedActivity = activityData.map(a => ({
                id: a.id,
                user: a.profiles?.name || 'Usuário',
                action: a.action,
                target: a.target,
                time: a.time
            }));
            setActivityLog(parsedActivity);
        }
    }, []);

    useEffect(() => {
        loadData();

        // Polling every 15s to keep things updated
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, [loadData]);

    // Heartbeat for online status
    useEffect(() => {
        if (!user) return;

        const updateStatus = async (isOnline: boolean) => {
            await supabase.from('profiles').update({
                is_online: isOnline,
                last_seen: Date.now()
            }).eq('id', user.uid);
            loadData();
        };

        updateStatus(true);
        const interval = setInterval(() => updateStatus(true), 30000);

        return () => {
            clearInterval(interval);
            updateStatus(false);
        };
    }, [user, loadData]);

    const addActivity = useCallback(async (userId: string, action: string, target: string) => {
        const time = Date.now();
        await supabase.from('activity_logs').insert({
            user_id: userId,
            action,
            target,
            time
        });
        loadData();
    }, [loadData]);

    const { showAlert } = useModal();

    const addMember = useCallback(async (name: string, password: string, role: 'Admin' | 'Editor' | 'Viewer') => {
        await showAlert(
            "Adicionar Membros",
            "Para adicionar novos membros à sua equipe, eles devem clicar em 'Cadastre-se' na tela de Login do aplicativo principal. O sistema identificará automaticamente novos usuários autorizados."
        );
    }, [showAlert]);

    const removeMember = useCallback(async (id: string) => {
        // Delete profile
        await supabase.from('profiles').delete().eq('id', id);

        // Also add to local blocked list as a secondary measure
        const member = members.find(m => m.id === id);
        if (member) {
            setBlockedEmails(prev => [...prev, member.name]);
            if (user) {
                addActivity(user.uid, 'removeu o usuário', member.name);
            }
        }

        loadData();
    }, [members, user, addActivity, loadData]);

    const updateRole = useCallback(async (id: string, role: 'Admin' | 'Editor' | 'Viewer') => {
        await supabase.from('profiles').update({ role }).eq('id', id);
        loadData();

        const member = members.find(m => m.id === id);
        if (member && user) {
            addActivity(user.uid, `alterou papel de ${member.name} para`, role);
        }
    }, [members, user, addActivity, loadData]);

    const updateMemberStatus = useCallback((id: string, online: boolean) => {
        // Handled automatically via polling and heartbeat now
    }, []);

    const isBlocked = useCallback((email: string) => {
        return blockedEmails.includes(email);
    }, [blockedEmails]);

    return (
        <TeamsContext.Provider value={{ members, activityLog, addMember, removeMember, updateRole, updateMemberStatus, isBlocked }}>
            {children}
        </TeamsContext.Provider>
    );
}

export function useTeams() {
    const context = useContext(TeamsContext);
    if (context === undefined) {
        throw new Error('useTeams must be used within a TeamsProvider');
    }
    return context;
}
