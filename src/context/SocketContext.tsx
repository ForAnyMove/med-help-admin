import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../features/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const SocketContext = createContext<{ socket: Socket | null }>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated || !session?.access_token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    
    const newSocket = io(backendUrl, {
      auth: { token: session.access_token }
    });

    newSocket.on('connect', () => {
      console.log('[Socket.io] Connected Admin:', newSocket.id);
      newSocket.emit('join_admin');
    });

    newSocket.on('new_moderation_request', (data) => {
      console.log('[Socket.io] new_moderation_request:', data);
      
      // Invalidate relevant queries so the lists refresh
      if (data.type === 'report') {
        queryClient.invalidateQueries({ queryKey: ['adminReports'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        toast.info(t('notifications.newReport', 'Новая жалоба на модерацию'));
      } else if (data.type === 'profile_update') {
        queryClient.invalidateQueries({ queryKey: ['moderationProfiles'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        toast.info(t('notifications.newProfileModeration', 'Новый запрос на модерацию профиля (аватар/описание)'));
      } else if (data.type === 'doc_verification') {
        queryClient.invalidateQueries({ queryKey: ['verificationDoctors'] });
        queryClient.invalidateQueries({ queryKey: ['verificationOrgs'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        toast.info(t('notifications.newDocVerification', 'Новая заявка на верификацию документов'));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, session?.access_token, queryClient, t]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
