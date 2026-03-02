import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (needRefresh) {
    toast({
      title: 'Nova versão disponível!',
      description: 'Clique em atualizar para carregar as últimas alterações.',
      action: (
        <Button onClick={() => updateServiceWorker(true)}>Atualizar</Button>
      ),
      duration: Infinity, 
    });
  }

  return null; 
}

export default ReloadPrompt;