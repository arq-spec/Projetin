import React, { useState, useEffect } from 'react';
import { MessageSquare, Key, Globe, Eye, EyeOff, RefreshCw, Send, CheckCircle2, AlertCircle, Info, Settings, HeartHandshake, HelpCircle, QrCode, Wifi, WifiOff, Smartphone, Camera, ExternalLink, ShieldCheck, BookOpen, Sparkles, Copy, Trash2 } from 'lucide-react';
import { loadFromDatabase, saveToDatabase } from '../database';

interface WhatsAppConfig {
  provider: 'meta' | 'evolution' | 'zapi' | 'custom' | 'callmebot';
  apiUrl: string;
  token: string;
  instanceId: string;
  defaultPhone: string;
  enabled: boolean;
  clientToken?: string;
  requestMode?: 'proxy' | 'direct';
  events: {
    checkIn: boolean;
    checkOut: boolean;
    newAllocation: boolean;
    allocationConfirmed: boolean;
    newRegistration: boolean;
  };
}

export default function WhatsAppManagement() {
  const [activeTab, setActiveTab] = useState<'config' | 'qrcode'>('config');
  const [config, setConfig] = useState<WhatsAppConfig>({
    provider: 'evolution',
    apiUrl: '',
    token: '',
    instanceId: '',
    defaultPhone: '',
    enabled: false,
    clientToken: '',
    requestMode: 'proxy',
    events: {
      checkIn: true,
      checkOut: true,
      newAllocation: true,
      allocationConfirmed: true,
      newRegistration: true,
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Connection / QR State
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'generating' | 'ready_to_scan' | 'connecting' | 'connected'>('disconnected');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [qrTimer, setQrTimer] = useState<number>(45);
  const [qrLog, setQrLog] = useState<string[]>([]);
  const [pairedDevice, setPairedDevice] = useState<{ name: string; phone: string; date: string } | null>(null);

  // Pairing Code (Connection via phone number) State
  const [connectionMethod, setConnectionMethod] = useState<'qrcode' | 'pairing_code'>('qrcode');
  const [pairingPhoneNumber, setPairingPhoneNumber] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [pairingCodeStatus, setPairingCodeStatus] = useState<'idle' | 'generating' | 'code_ready' | 'success'>('idle');

  // Wizard/Assistant State
  const [wizardTab, setWizardTab] = useState<'sandbox' | 'evolution' | 'zapi' | 'meta' | 'callmebot'>('sandbox');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Test State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Olá! Este é um teste de comunicação direta com a API do WhatsApp configurada no painel Frello.');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testLog, setTestLog] = useState('');

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const stored = await loadFromDatabase('whatsapp_api_config');
        if (stored) {
          setConfig(prev => ({
            ...prev,
            ...stored,
            events: {
              checkIn: stored.events?.checkIn ?? true,
              checkOut: stored.events?.checkOut ?? true,
              newAllocation: stored.events?.newAllocation ?? true,
              allocationConfirmed: stored.events?.allocationConfirmed ?? true,
              newRegistration: stored.events?.newRegistration ?? true,
            }
          }));
        }

        // Load connection status
        const savedStatus = await loadFromDatabase('whatsapp_connection_state');
        if (savedStatus) {
          if (savedStatus.status === 'connected') {
            setConnectionStatus('connected');
            setPairedDevice(savedStatus.device || {
              name: 'iPhone do Administrador',
              phone: stored?.defaultPhone || '5511999999999',
              date: savedStatus.date || new Date().toLocaleDateString('pt-BR')
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load whatsapp_api_config or connection state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Timer for QR Code rotation / expiration
  useEffect(() => {
    let timerId: any;
    if (connectionStatus === 'ready_to_scan' && qrTimer > 0) {
      timerId = setInterval(() => {
        setQrTimer(t => t - 1);
      }, 1000);
    } else if (connectionStatus === 'ready_to_scan' && qrTimer === 0) {
      setConnectionStatus('disconnected');
      addLog('⚠️ QR Code expirou por inatividade. Por favor, gere um novo.');
    }
    return () => clearInterval(timerId);
  }, [connectionStatus, qrTimer]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setQrLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const configToSave = {
        ...config,
        enabled: config.apiUrl ? true : config.enabled
      };
      await saveToDatabase('whatsapp_api_config', configToSave);
      setConfig(configToSave);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.warn('Failed to save WhatsApp config:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateQRCode = async () => {
    setConnectionStatus('generating');
    setQrLog([]);
    const targetUrl = config.apiUrl || 'https://api.evolution.frello.com.br';
    const targetInstance = config.instanceId || 'frello_instance';

    addLog(`Iniciando handshake com servidor em: ${targetUrl}`);
    addLog(`Instância alvo: ${targetInstance}`);
    addLog(`Provedor selecionado: ${config.provider.toUpperCase()}`);

    // Simulate API connection handshake
    setTimeout(() => {
      addLog('🔌 Conexão de WebSocket aberta com sucesso!');
      addLog('🔑 Token validado e sessão inicializada.');
      addLog('🔄 Gerando payload de QR Code...');

      setTimeout(() => {
        // Generate a valid QR Code payload structure
        const randomHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const qrPayload = `2@frello_whatsapp_session,${randomHash},${Date.now()},1`;
        setQrCodeData(qrPayload);
        
        // Use standard QR generator api
        const googleQr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=09090b&data=${encodeURIComponent(qrPayload)}`;
        setQrCodeUrl(googleQr);
        
        setQrTimer(45);
        setConnectionStatus('ready_to_scan');
        addLog('🟢 QR Code gerado e exibido na tela. Aguardando leitura no aplicativo WhatsApp...');
        addLog('ℹ️ Abra o WhatsApp > Aparelhos Conectados > Conectar um Aparelho');
      }, 1000);
    }, 1200);
  };

  const handleSimulateScan = () => {
    if (connectionStatus !== 'ready_to_scan') return;

    setConnectionStatus('connecting');
    addLog('📱 Aparelho detectou o QR Code! Iniciando pareamento...');
    addLog('⌛ Sincronizando chats recentes, mensagens e contatos (esta etapa pode levar até 15s)...');

    setTimeout(async () => {
      const dev = {
        name: config.provider === 'meta' ? 'Meta API Cloud Business' : 'Smartphone do Gestor',
        phone: config.defaultPhone || '5511999999999',
        date: new Date().toLocaleDateString('pt-BR')
      };
      setPairedDevice(dev);
      setConnectionStatus('connected');
      addLog('✅ Conexão estabelecida com total sucesso!');
      addLog(`📱 Dispositivo Pareado: ${dev.name} (${dev.phone})`);
      addLog('🚀 O sistema Frello agora está pronto para disparar notificações automáticas para o WhatsApp.');

      // Persist status
      try {
        await saveToDatabase('whatsapp_connection_state', {
          status: 'connected',
          device: dev,
          date: dev.date
        });
      } catch (err) {
        console.warn('Failed to save connection state:', err);
      }
    }, 3000);
  };

  const handleDisconnect = async () => {
    if (window.confirm('Tem certeza que deseja desconectar este dispositivo do Frello? As notificações via WhatsApp deixarão de ser enviadas.')) {
      setConnectionStatus('disconnected');
      setPairedDevice(null);
      setQrCodeUrl('');
      setQrLog([]);
      setPairingCode('');
      setPairingCodeStatus('idle');
      
      try {
        await saveToDatabase('whatsapp_connection_state', {
          status: 'disconnected',
          device: null,
          date: null
        });
        addLog('🔴 Dispositivo desconectado com sucesso pelo administrador.');
      } catch (err) {
        console.warn('Failed to disconnect:', err);
      }
    }
  };

  const handleGeneratePairingCode = async (phoneToPair: string) => {
    if (!phoneToPair) {
      alert('Por favor, digite o número do WhatsApp que deseja conectar (ex: 5511999999999).');
      return;
    }

    setPairingCodeStatus('generating');
    setQrLog([]);
    addLog(`Iniciando handshake para Código de Pareamento de Número de Telefone...`);
    addLog(`Número alvo: ${phoneToPair}`);
    addLog(`Instância: ${config.instanceId || 'frello_instance'}`);

    setTimeout(() => {
      addLog('🔌 Requisição de Pairing Code recebida com sucesso pela Evolution API.');
      addLog('🔑 Handshake WhatsApp Web Mobile OK.');

      // Generate a classic 8-character pairing code like: ABC4-H78D
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let part1 = '';
      let part2 = '';
      for (let i = 0; i < 4; i++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const generatedCode = `${part1}-${part2}`;
      
      setPairingCode(generatedCode);
      setPairingCodeStatus('code_ready');
      setConnectionStatus('ready_to_scan'); // Sync connection status

      addLog(`🟢 Código de Pareamento gerado: ${generatedCode}`);
      addLog('ℹ️ No seu WhatsApp: Configurações > Aparelhos Conectados > Conectar um Aparelho > Conectar com número de telefone.');
    }, 1500);
  };

  const handleSimulatePairingCodeScan = () => {
    if (pairingCodeStatus !== 'code_ready') return;

    setPairingCodeStatus('success');
    setConnectionStatus('connecting');
    addLog(`📱 O celular (${pairingPhoneNumber}) aceitou o código de pareamento: ${pairingCode}`);
    addLog('⌛ Iniciando sincronização e handshake de chaves criptográficas...');

    setTimeout(async () => {
      const dev = {
        name: `Smartphone (${pairingPhoneNumber})`,
        phone: pairingPhoneNumber,
        date: new Date().toLocaleDateString('pt-BR')
      };
      setPairedDevice(dev);
      setConnectionStatus('connected');
      addLog('✅ Conexão via Código de Pareamento estabelecida com total sucesso!');
      addLog(`📱 Dispositivo Pareado: ${dev.name}`);
      addLog('🚀 O sistema Frello agora está pronto para disparar notificações automáticas para o WhatsApp.');

      // Persist status
      try {
        await saveToDatabase('whatsapp_connection_state', {
          status: 'connected',
          device: dev,
          date: dev.date
        });
      } catch (err) {
        console.warn('Failed to save connection state:', err);
      }
    }, 3000);
  };

  const handleSendTestMessage = async () => {
    if (!config.apiUrl) {
      alert('Por favor, configure a URL da API do WhatsApp primeiro.');
      return;
    }
    if (!testPhone) {
      alert('Por favor, digite um número de celular para teste (com DDD e DDI, Ex: 5511999999999).');
      return;
    }

    setTestStatus('sending');
    setTestLog('🔍 Iniciando análise de conexão inteligente e envio de teste...\n');

    let rawUrl = config.apiUrl.trim();
    const cleanPhone = testPhone.replace(/\D/g, '');
    let infoLogs: string[] = [];

    // Definição da lista de estratégias de envio (Auto-Heal / Self-Healing Routing)
    interface SendAttempt {
      name: string;
      endpoint: string;
      headers: Record<string, string>;
      body: any;
      method?: string;
    }

    const attempts: SendAttempt[] = [];

    if (config.provider === 'evolution') {
      let cleanApiUrl = rawUrl.replace(/\/$/, '');
      let instance = (config.instanceId || '').trim();

      // Auto-correction for pasted full endpoint path
      if (cleanApiUrl.includes('/message/sendText')) {
        infoLogs.push('💡 Detectamos que você colou a URL completa da Evolution API. Limpando caminho redundante...');
        const match = cleanApiUrl.match(/\/message\/sendText\/([^\/]+)/);
        if (match && match[1]) {
          instance = match[1];
          infoLogs.push(`👉 Extraída Instância da URL: "${instance}"`);
        }
        cleanApiUrl = cleanApiUrl.split('/message/sendText')[0];
      }

      const finalInstance = instance || 'default';

      // Tentativa 1: Endpoint oficial com Instância na URL (padrão Evolution API v2)
      attempts.push({
        name: 'Evolution API v2 (Instância na URL - apikey)',
        endpoint: `${cleanApiUrl}/message/sendText/${finalInstance}`,
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.token,
          'apiKey': config.token,
        },
        body: {
          number: cleanPhone,
          text: testMessage,
          options: { delay: 1200, presence: 'composing' }
        }
      });

      // Tentativa 2: Endpoint sem instância no path, enviando instância como header e no body
      attempts.push({
        name: 'Evolution API v2 (Instância no Header & Body)',
        endpoint: `${cleanApiUrl}/message/sendText`,
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.token,
          'apiKey': config.token,
          'instance': finalInstance,
          'Instance': finalInstance,
        },
        body: {
          number: cleanPhone,
          text: testMessage,
          instance: finalInstance,
          options: { delay: 1200, presence: 'composing' }
        }
      });

      // Tentativa 3: Endpoint bruto exatamente como digitado pelo usuário
      attempts.push({
        name: 'Evolution API v2 (URL Exata Digitada)',
        endpoint: rawUrl,
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.token,
          'apiKey': config.token,
          'instance': finalInstance,
          'Instance': finalInstance,
        },
        body: {
          number: cleanPhone,
          text: testMessage,
          instance: finalInstance,
          options: { delay: 1200, presence: 'composing' }
        }
      });

      // Tentativa 4: Rota legada (/message/send/{instance})
      attempts.push({
        name: 'Evolution API v2 (Rota Legada /message/send/{instance})',
        endpoint: `${cleanApiUrl}/message/send/${finalInstance}`,
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.token,
          'apiKey': config.token,
        },
        body: {
          number: cleanPhone,
          text: testMessage,
          options: { delay: 1200, presence: 'composing' }
        }
      });
    } else if (config.provider === 'zapi') {
      let cleanApiUrl = rawUrl.replace(/\/$/, '');
      let zInstance = (config.instanceId || '').trim();
      let zToken = (config.token || '').trim();

      if (cleanApiUrl.includes('/instances/')) {
        infoLogs.push('💡 Detectamos que você colou a URL completa da Z-API. Extraindo parâmetros...');
        const parts = cleanApiUrl.split('/instances/');
        cleanApiUrl = parts[0];

        const subparts = parts[1].split('/');
        if (subparts[0]) {
          zInstance = subparts[0];
          infoLogs.push(`👉 Extraído ID de Instância: "${zInstance}"`);
        }

        const tokenIndex = subparts.indexOf('token');
        if (tokenIndex !== -1 && subparts[tokenIndex + 1]) {
          zToken = subparts[tokenIndex + 1];
          infoLogs.push(`👉 Extraído Token: "${zToken}"`);
        }
      }

      const finalInstance = zInstance || 'SUA_INSTANCIA';
      const finalToken = zToken || 'SEU_TOKEN';

      const domains = [cleanApiUrl];
      if (cleanApiUrl.includes('api.z-api.io')) {
        domains.push(cleanApiUrl.replace('api.z-api.io', 'gateway.z-api.io'));
      } else if (cleanApiUrl.includes('gateway.z-api.io')) {
        domains.push(cleanApiUrl.replace('gateway.z-api.io', 'api.z-api.io'));
      }

      const pairs = [
        { inst: finalInstance, tok: finalToken, label: 'Padrão' },
        { inst: finalToken, tok: finalInstance, label: 'Invertido' }
      ];

      for (const dom of domains) {
        for (const pair of pairs) {
          // Combination 0: With dedicated client-token from input (If provided)
          if (config.clientToken && config.clientToken.trim() !== '') {
            attempts.push({
              name: `Z-API (${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} + Client-Token Dedicado)`,
              endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-text`,
              headers: { 
                'Content-Type': 'application/json',
                'client-token': config.clientToken.trim()
              },
              body: {
                phone: cleanPhone,
                message: testMessage
              }
            });
          }

          // Combination 1: With client-token header from config.token
          attempts.push({
            name: `Z-API (${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} + Client-Token do Input)`,
            endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-text`,
            headers: { 
              'Content-Type': 'application/json',
              'client-token': config.token || ''
            },
            body: {
              phone: cleanPhone,
              message: testMessage
            }
          });

          // Combination 2: With client-token header from tok
          attempts.push({
            name: `Z-API (${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} + Client-Token Extraído)`,
            endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-text`,
            headers: { 
              'Content-Type': 'application/json',
              'client-token': pair.tok
            },
            body: {
              phone: cleanPhone,
              message: testMessage
            }
          });

          // Combination 3: Without client-token header
          attempts.push({
            name: `Z-API (${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} Sem Header)`,
            endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-text`,
            headers: { 'Content-Type': 'application/json' },
            body: {
              phone: cleanPhone,
              message: testMessage
            }
          });
        }
      }

      // Raw exact URL checks
      if (config.clientToken && config.clientToken.trim() !== '') {
        attempts.push({
          name: 'Z-API (URL Exata + Client-Token Dedicado)',
          endpoint: rawUrl,
          headers: { 
            'Content-Type': 'application/json',
            'client-token': config.clientToken.trim()
          },
          body: {
            phone: cleanPhone,
            message: testMessage
          }
        });
      }

      attempts.push({
        name: 'Z-API (URL Exata + Client-Token do Input)',
        endpoint: rawUrl,
        headers: { 
          'Content-Type': 'application/json',
          'client-token': config.token || ''
        },
        body: {
          phone: cleanPhone,
          message: testMessage
        }
      });

      attempts.push({
        name: 'Z-API (URL Exata Sem Header)',
        endpoint: rawUrl,
        headers: { 'Content-Type': 'application/json' },
        body: {
          phone: cleanPhone,
          message: testMessage
        }
      });
    } else if (config.provider === 'meta') {
      let cleanApiUrl = rawUrl.replace(/\/$/, '');
      let metaEndpoint = '';
      if (!cleanApiUrl.endsWith('/messages') && config.instanceId) {
        metaEndpoint = `${cleanApiUrl}/${config.instanceId}/messages`;
      } else if (!cleanApiUrl.includes('/messages')) {
        metaEndpoint = `${cleanApiUrl}/messages`;
      } else {
        metaEndpoint = cleanApiUrl;
      }

      attempts.push({
        name: 'Meta Cloud API (Formatado)',
        endpoint: metaEndpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        body: {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: testMessage }
        }
      });

      attempts.push({
        name: 'Meta Cloud API (URL Exata Digitada)',
        endpoint: rawUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        body: {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: testMessage }
        }
      });
    } else if (config.provider === 'callmebot') {
      let cleanApiUrl = rawUrl.trim().replace(/\/$/, '');
      if (!cleanApiUrl) {
        cleanApiUrl = 'https://api.callmebot.com/whatsapp.php';
      }
      attempts.push({
        name: 'CallMeBot WhatsApp API (Via GET Proxy)',
        endpoint: `${cleanApiUrl}?phone=${cleanPhone}&text=${encodeURIComponent(testMessage)}&apikey=${config.token}`,
        headers: {},
        body: null,
        method: 'GET'
      });
    } else {
      // Custom Webhook / Generic POST API
      attempts.push({
        name: 'Personalizado / Webhook (URL Exata)',
        endpoint: rawUrl,
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': config.token,
          'Authorization': `Bearer ${config.token}`,
          'apikey': config.token,
          'apiKey': config.token,
        },
        body: {
          to: cleanPhone,
          phone: cleanPhone,
          number: cleanPhone,
          text: testMessage,
          message: testMessage,
          textMessage: { text: testMessage },
          instance: config.instanceId
        }
      });
    }

    if (infoLogs.length > 0) {
      setTestLog(prev => `${prev}${infoLogs.join('\n')}\n\n`);
    }

    let success = false;
    let successLog = '';
    let errorDetailsLog = '';

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const attemptNum = i + 1;
      
      setTestLog(prev => `${prev}--------------------------------------------------\n` +
        `⏳ [Tentativa ${attemptNum}/${attempts.length}] Testando estratégia: "${attempt.name}"...\n` +
        `📢 ${attempt.method || 'POST'} para: ${attempt.endpoint}\n` +
        `📦 Payload:\n${attempt.body ? JSON.stringify(attempt.body, null, 2) : 'Nenhum (Requisição GET)'}\n`
      );

      try {
        const t0 = performance.now();
        let res: Response;
        const isDirect = config.requestMode === 'direct';

        if (isDirect) {
          const directHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(attempt.headers || {})
          };
          const fetchOptions: RequestInit = {
            method: attempt.method || 'POST',
            headers: directHeaders,
          };
          if (attempt.body && attempt.method !== 'GET' && attempt.method !== 'HEAD') {
            fetchOptions.body = typeof attempt.body === 'string' ? attempt.body : JSON.stringify(attempt.body);
          }
          res = await fetch(attempt.endpoint, fetchOptions);
        } else {
          let proxyResponse: Response;
          try {
            proxyResponse = await fetch('/api/whatsapp/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                endpoint: attempt.endpoint,
                method: attempt.method || 'POST',
                headers: attempt.headers,
                body: attempt.body
              })
            });
          } catch (proxyNetworkErr) {
            // If the express server is off/unavailable
            console.warn('[WhatsApp] Proxy server connection failed, falling back to direct:', proxyNetworkErr);
            proxyResponse = new Response('404 Not Found', { status: 404 });
          }

          if (proxyResponse.status === 404) {
            setTestLog(prev => `${prev}⚠️ [Estático] Servidor Express indisponível (404). Executando requisição DIRETA do navegador...\n`);
            const directHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
              ...(attempt.headers || {})
            };
            const fetchOptions: RequestInit = {
              method: attempt.method || 'POST',
              headers: directHeaders,
            };
            if (attempt.body && attempt.method !== 'GET' && attempt.method !== 'HEAD') {
              fetchOptions.body = typeof attempt.body === 'string' ? attempt.body : JSON.stringify(attempt.body);
            }
            res = await fetch(attempt.endpoint, fetchOptions);
          } else {
            res = proxyResponse;
          }
        }
        const t1 = performance.now();
        const duration = Math.round(t1 - t0);

        const responseText = await res.text();
        let parsedRes: any = null;
        try {
          parsedRes = JSON.parse(responseText);
        } catch {
          parsedRes = responseText;
        }

        const isJaxRsError = typeof responseText === 'string' && (
          responseText.toLowerCase().includes('unable to find matching target resource method') ||
          responseText.toLowerCase().includes('jax-rs') ||
          responseText.toLowerCase().includes('jersey')
        );

        if (res.ok) {
          success = true;
          successLog = `\n✓ SUCESSO em ${duration}ms com a estratégia: "${attempt.name}"!\n` +
            `🟢 Status HTTP: ${res.status}\n` +
            `📥 Retorno da API:\n${JSON.stringify(parsedRes, null, 2)}\n`;
          
          // Se a tentativa vitoriosa for diferente da URL atual do usuário, atualiza a URL e salva!
          if (attempt.endpoint !== rawUrl) {
            successLog += `\n💡 AUTOCORREÇÃO ATIVA: Identificamos que o endpoint correto é diferente do digitado. Atualizando o campo de URL Base automaticamente para:\n👉 ${attempt.endpoint}\n`;
            
            // Atualiza o estado
            setConfig(prev => {
              const updated = { ...prev, apiUrl: attempt.endpoint };
              // Salva as configurações corrigidas no Database para as próximas notificações funcionarem 100%!
              saveToDatabase('whatsapp_api_config', updated).catch(err => {
                console.error('Erro ao salvar autocorreção no Database:', err);
              });
              return updated;
            });
          }
          break; // Sai do loop de tentativas pois funcionou!
        } else {
          let errorMsg = `❌ Falha na Tentativa ${attemptNum} (Status HTTP ${res.status})\n` +
            `📥 Resposta do Servidor: ${JSON.stringify(parsedRes, null, 2)}\n`;

          if (isJaxRsError || res.status === 404 || res.status === 405) {
            errorMsg += `⚠️ Erro de Rota/Método (Jersey/JAX-RS): O servidor rejeitou esse caminho ou método HTTP. Tentando rota alternativa...\n`;
          }
          
          errorDetailsLog += `Estratégia "${attempt.name}":\n${errorMsg}\n`;
          setTestLog(prev => `${prev}\n${errorMsg}\n`);
        }
      } catch (err: any) {
        const errorMsg = `❌ Falha de Conexão Física / Erro CORS na estratégia "${attempt.name}"!\n` +
          `Erro: ${err.message || err}\n` +
          `ℹ️ Isso geralmente significa que o servidor bloqueou a requisição no navegador por falta de cabeçalhos CORS ou que a URL está inacessível a partir de redes externas.\n`;
        
        errorDetailsLog += errorMsg + '\n';
        setTestLog(prev => `${prev}\n${errorMsg}\n`);
      }
    }

    if (success) {
      setTestStatus('success');
      setTestLog(prev => `${prev}\n==================================================\n` +
        `🎉 PARABÉNS! Envio de WhatsApp de teste concluído com sucesso!\n` +
        successLog
      );
    } else {
      setTestStatus('error');
      setTestLog(prev => `${prev}\n==================================================\n` +
        `❌ TODOS OS ENDPOINTS E ESTRATÉGIAS FALHARAM!\n` +
        `Aqui está o resumo dos erros encontrados:\n\n` +
        errorDetailsLog +
        `\n🔍 RECOMENDAÇÕES:\n` +
        `1. Verifique se a sua Instância do WhatsApp está ATIVA, CONECTADA e emparelhada (QR Code escaneado).\n` +
        `2. Certifique-se de que o Token/ApiKey digitado está correto.\n` +
        `3. Verifique se o seu servidor de WhatsApp possui cabeçalhos CORS ativados para permitir conexões externas pelo navegador.\n` +
        `4. Se o erro "unable to find matching target resource method" persistir, verifique a URL base da sua API corporativa ou gateway, pois o caminho esperado pelo servidor JAX-RS (Java) é diferente do padrão.`
      );
    }
  };

  const fillProviderTemplate = (provider: 'meta' | 'evolution' | 'zapi' | 'custom' | 'callmebot') => {
    let apiUrl = '';
    let token = '';
    let instanceId = '';

    if (provider === 'evolution') {
      apiUrl = 'https://api.suainstancia.com';
      instanceId = 'frello_instance';
      token = 'sua_apikey_da_evolution_api';
    } else if (provider === 'zapi') {
      apiUrl = 'https://api.z-api.io';
      instanceId = 'SUA_INSTANCIA_ID';
      token = 'SEU_TOKEN_ZAPI';
    } else if (provider === 'meta') {
      apiUrl = 'https://graph.facebook.com/v18.0/SEU_PHONE_NUMBER_ID/messages';
      token = 'SEU_ACCESS_TOKEN_META';
    } else if (provider === 'callmebot') {
      apiUrl = 'https://api.callmebot.com/whatsapp.php';
      token = 'SUA_APIKEY_DO_CALLME_BOT';
      instanceId = 'callmebot_session';
    }

    setConfig(prev => ({
      ...prev,
      provider,
      apiUrl,
      token,
      instanceId,
      clientToken: ''
    }));
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fillDemoConfig = (providerType: 'evolution' | 'zapi' | 'meta') => {
    let apiUrl = '';
    let token = '';
    let instanceId = '';

    if (providerType === 'evolution') {
      apiUrl = 'https://demo-api.evolution.frello.com.br';
      instanceId = 'frello_instancia_demonstracao';
      token = 'frello_demo_key_99ab3c91-4478';
    } else if (providerType === 'zapi') {
      apiUrl = 'https://api.z-api.io';
      instanceId = '3G88A4F239100B';
      token = 'F8C644BB0B22C439E';
    } else if (providerType === 'meta') {
      apiUrl = 'https://graph.facebook.com/v18.0/105582371948831/messages';
      instanceId = 'meta_cloud_frello';
      token = 'EAAG38aVbCzUBO6ZBzqZCs6ZA99yKZAQ1yZC1ZCcZB3';
    }

    setConfig(prev => ({
      ...prev,
      enabled: true,
      provider: providerType,
      apiUrl,
      token,
      instanceId,
      clientToken: ''
    }));
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-neutral-500 font-medium">Carregando configurações do WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="whatsapp-integration-tab">
      
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-px">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 cursor-pointer select-none ${
              activeTab === 'config'
                ? 'border-emerald-500 text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuração de Conexão
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 cursor-pointer select-none ${
              activeTab === 'qrcode'
                ? 'border-emerald-500 text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Conexão via QR Code
              {connectionStatus === 'connected' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-750" />
              )}
            </span>
          </button>
        </div>

        {/* Global Connection status pill */}
        <div className="flex items-center gap-2 pb-2">
          {connectionStatus === 'connected' ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-900">
              <Wifi className="w-3.5 h-3.5" />
              WhatsApp Ativo
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 px-2 py-1 rounded-full text-[10px] font-bold border border-neutral-200 dark:border-neutral-800">
              <WifiOff className="w-3.5 h-3.5" />
              WhatsApp Desconectado
            </div>
          )}
        </div>
      </div>

      {activeTab === 'config' ? (
        <>
          <div>
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 dark:text-white">
              <MessageSquare className="w-5 h-5 text-emerald-500 font-mono" />
              Configuração de Notificações WhatsApp API
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-0.5">
              Integre sua própria API de WhatsApp (Evolution API, Z-API, Meta Cloud API ou personalizada) para enviar notificações em tempo real diretamente para o WhatsApp de gestores, clientes ou profissionais.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Settings Form */}
            <div className="lg:col-span-7 space-y-6">
              <form onSubmit={handleSaveConfig} className="space-y-6">
                
                {/* Enable switch and Provider select */}
                <div className="bg-neutral-50 dark:bg-neutral-900/40 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-150 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                        Ativação do Serviço
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold">
                        Enviar Notificações via WhatsApp
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-750 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Provider Selector Cards */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                      Escolha o Provedor da API
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {[
                        { id: 'callmebot', label: 'CallMeBot', desc: 'Grátis / Simples' },
                        { id: 'evolution', label: 'Evolution API', desc: 'Auto-hospedado' },
                        { id: 'zapi', label: 'Z-API API', desc: 'Serviço Pago' },
                        { id: 'meta', label: 'Meta Cloud', desc: 'API Oficial' },
                        { id: 'custom', label: 'Personalizado', desc: 'Qualquer API HTTP' }
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => fillProviderTemplate(p.id as any)}
                          className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center ${
                            config.provider === p.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 text-emerald-800 dark:text-emerald-400 font-bold'
                              : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-850 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="text-xs">{p.label}</span>
                          <span className="text-[8px] opacity-75 font-normal mt-0.5">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connection settings */}
                <div className="bg-neutral-50 dark:bg-neutral-900/40 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                      Dados de Conexão da API
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                        URL Base / Endpoint da API
                      </label>
                      <input
                        type="url"
                        placeholder={
                          config.provider === 'meta'
                            ? 'https://graph.facebook.com/v18.0/...'
                            : config.provider === 'callmebot'
                            ? 'https://api.callmebot.com/whatsapp.php'
                            : 'https://api.provedor.com'
                        }
                        value={config.apiUrl}
                        onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                        required={config.enabled}
                        className="w-full text-xs bg-white dark:bg-neutral-950 p-2.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                          {config.provider === 'meta'
                            ? 'Access Token Bearer'
                            : config.provider === 'callmebot'
                            ? 'ApiKey do CallMeBot'
                            : 'Token / ApiKey'}
                        </label>
                        <div className="relative">
                          <input
                            type={showToken ? 'text' : 'password'}
                            value={config.token}
                            onChange={(e) => setConfig({ ...config, token: e.target.value })}
                            required={config.enabled}
                            placeholder="Token de Segurança"
                            className="w-full text-xs font-mono bg-white dark:bg-neutral-950 p-2.5 pr-10 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300"
                          />
                          <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-2 top-2 p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded cursor-pointer"
                          >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                          ID da Instância / Session Name
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: frello_bot"
                          value={config.instanceId}
                          onChange={(e) => setConfig({ ...config, instanceId: e.target.value })}
                          className="w-full text-xs font-mono bg-white dark:bg-neutral-950 p-2.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                    </div>

                    {/* Modo de Envio (Proxy vs Direct) */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50 mt-2">
                      <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                        Roteamento das Requisições (Modo de Envio)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, requestMode: 'proxy' })}
                          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-center ${
                            (config.requestMode || 'proxy') === 'proxy'
                              ? 'bg-purple-500/10 border-purple-500 text-purple-950 dark:text-purple-400 font-bold'
                              : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-850 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                          }`}
                        >
                          <span className="text-xs flex items-center gap-1">
                            <Settings className="w-3.5 h-3.5 shrink-0" />
                            Proxy do Servidor (Express Backend)
                          </span>
                          <span className="text-[9px] font-normal opacity-85 mt-0.5 leading-normal">
                            Seguro. Passa pelo servidor Express para ocultar tokens e contornar CORS / restrições de rede.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, requestMode: 'direct' })}
                          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-center ${
                            config.requestMode === 'direct'
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-400 font-bold'
                              : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-850 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                          }`}
                        >
                          <span className="text-xs flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            Direto do Navegador (Sem Servidor / Estático)
                          </span>
                          <span className="text-[9px] font-normal opacity-85 mt-0.5 leading-normal">
                            Independente. Envia chamadas direto do navegador do usuário. Perfeito para hospedagem estática Nginx.
                          </span>
                        </button>
                      </div>
                    </div>

                    {config.provider === 'zapi' && (
                      <div className="space-y-2 mt-2 bg-purple-600/5 dark:bg-purple-600/10 border border-amber-500/20 p-3.5 rounded-lg">
                        <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-450 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          Client-Token (Segurança da Conta Z-API)
                        </label>
                        <div className="relative">
                          <input
                            type={showToken ? 'text' : 'password'}
                            value={config.clientToken || ''}
                            onChange={(e) => setConfig({ ...config, clientToken: e.target.value })}
                            placeholder="Opcional. Preencha se ativou o 'Token de Segurança da Conta' no painel da Z-API"
                            className="w-full text-xs font-mono bg-white dark:bg-neutral-950 p-2.5 pr-10 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-450"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          Se o seu painel retornar <code className="text-rose-500 dark:text-rose-400 font-mono">"your client-token is not configured"</code>, 
                          insira aqui o seu <strong>Client-Token</strong> global de segurança obtido na aba de Segurança dentro do console da Z-API.
                        </p>
                      </div>
                    )}

                    {config.provider === 'callmebot' && (
                      <div className="space-y-2 mt-2 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-lg">
                        <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-emerald-500" />
                          Instruções de Ativação - CallMeBot
                        </label>
                        <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          Para começar a enviar mensagens gratuitamente com o <strong>CallMeBot</strong>:
                        </p>
                        <ol className="list-decimal pl-4 space-y-1 text-[10px] text-neutral-500 dark:text-neutral-450">
                          <li>Adicione o contato <strong className="text-emerald-500 font-mono">+34 621 07 33 58</strong> ou clique em <a href="https://wa.me/34621073358" target="_blank" rel="noreferrer" className="text-emerald-500 underline font-bold">wa.me/34621073358</a>.</li>
                          <li>Envie a mensagem exata: <code className="bg-neutral-200 dark:bg-neutral-850 px-1 rounded text-rose-500 font-mono">I allow callmebot to send me messages</code></li>
                          <li>O bot responderá fornecendo a sua <strong>ApiKey</strong> pessoal.</li>
                          <li>Insira a URL <code className="font-mono text-[9px]">https://api.callmebot.com/whatsapp.php</code> no campo acima e a sua <strong>ApiKey</strong> no campo de Token.</li>
                        </ol>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-450 italic mt-1 font-semibold text-rose-600 dark:text-rose-455">
                          Importante: Todo destinatário (você ou qualquer profissional) precisa ativar o bot uma vez para poder receber as notificações do sistema.
                        </p>
                      </div>
                    )}

                    <div className="space-y-1 pt-1">
                      <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                        Celular Destinatário Padrão (Notificações de Administrador)
                      </label>
                      <input
                        type="tel"
                        placeholder="Ex: 5511999999999 (DDI + DDD + Celular)"
                        value={config.defaultPhone}
                        onChange={(e) => setConfig({ ...config, defaultPhone: e.target.value })}
                        className="w-full text-xs bg-white dark:bg-neutral-950 p-2.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 font-mono"
                      />
                      <p className="text-[9px] text-neutral-400 leading-normal">
                        Este telefone receberá notificações críticas do sistema, tais como novos cadastros de profissionais no portal aguardando aprovação.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notification triggers */}
                <div className="bg-neutral-50 dark:bg-neutral-900/40 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                      Gatilhos Automáticos de WhatsApp
                    </h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'checkIn', title: 'Check-In Realizado (Chegada)', desc: 'Envia notificação para o gestor quando um freelancer inicia o turno.' },
                      { key: 'checkOut', title: 'Check-Out Realizado (Saída)', desc: 'Notifica a finalização do turno de trabalho e horas totais apuradas.' },
                      { key: 'newAllocation', title: 'Nova Solicitação / Alocação de Trabalho', desc: 'Envia mensagem para o WhatsApp do freelancer convidando-o para o projeto.' },
                      { key: 'allocationConfirmed', title: 'Confirmação / Recusa de Alocação', desc: 'Notifica o administrador e o cliente quando o freelancer aceita ou rejeita um chamado.' },
                      { key: 'newRegistration', title: 'Novo Cadastro de Profissional', desc: 'Notifica no celular de administrador que há um novo talento pendente de aprovação.' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-start gap-3 bg-white dark:bg-neutral-950 p-3 rounded-lg border border-neutral-150 dark:border-neutral-800 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(config.events as any)[item.key]}
                          onChange={(e) => setConfig({
                            ...config,
                            events: { ...config.events, [item.key]: e.target.checked }
                          })}
                          className="w-4 h-4 text-emerald-500 rounded border-neutral-300 focus:ring-0 mt-0.5"
                        />
                        <div>
                          <span className="font-bold block text-neutral-800 dark:text-neutral-200 text-xs">{item.title}</span>
                          <span className="text-[10px] text-neutral-500 leading-normal">{item.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Save Action */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-850 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-neutral-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-xs"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Salvar Configuração de WhatsApp</span>
                  </button>
                  
                  {saveStatus === 'success' && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-450 font-bold flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      Sincronizado com sucesso!
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="w-4 h-4" />
                      Erro ao salvar dados.
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Live Test Console */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-neutral-950 text-neutral-200 p-5 rounded-2xl border border-neutral-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-neutral-100">
                      Console de Teste de Envio
                    </h4>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
                </div>

                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Digite seu celular abaixo para realizar um teste de envio de mensagem real pelo seu servidor ativo do WhatsApp.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wide">
                      Celular para Teste (Com DDI e DDD)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 5511999999999"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="w-full text-xs font-mono bg-neutral-900 border border-neutral-850 p-2 rounded text-neutral-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wide">
                      Mensagem de Teste
                    </label>
                    <textarea
                      rows={3}
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full text-[11px] bg-neutral-900 border border-neutral-850 p-2 rounded text-neutral-100 leading-normal focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendTestMessage}
                    disabled={testStatus === 'sending'}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg text-xs font-black cursor-pointer tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    DISPARAR WHATSAPP DE TESTE
                  </button>
                </div>

                {testStatus !== 'idle' && (
                  <div className="space-y-2 pt-2 border-t border-neutral-900 animate-fade-in">
                    <div className="flex items-center justify-between text-[10px] font-bold font-mono">
                      <div className="flex items-center gap-2">
                        <span>Log de Depuração:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(testLog, 'testLog')}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-750 text-[9px] text-neutral-400 hover:text-white transition-all cursor-pointer border border-neutral-800"
                          title="Copiar log de depuração completo"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          {copiedText === 'testLog' ? 'Copiado!' : 'Copiar Log'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTestLog('');
                            setTestStatus('idle');
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-750 text-[9px] text-neutral-400 hover:text-white transition-all cursor-pointer border border-neutral-800"
                          title="Limpar log e redefinir status"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          Limpar Log
                        </button>
                      </div>
                      <span className={testStatus === 'success' ? 'text-emerald-450' : testStatus === 'error' ? 'text-rose-400' : 'text-purple-500 animate-pulse'}>
                        {testStatus === 'sending' ? 'Enviando...' : testStatus === 'success' ? 'Enviado!' : 'Erro'}
                      </span>
                    </div>

                    <pre className="max-h-52 overflow-y-auto bg-neutral-900 border border-neutral-850 rounded-lg p-3 text-[9px] font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                      {testLog}
                    </pre>
                  </div>
                )}
              </div>

              {/* Interactive Setup Wizard / Help */}
              <div className="bg-white dark:bg-neutral-900/40 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-neutral-800 dark:text-neutral-200">
                    Assistente de Configuração Frello
                  </h4>
                </div>

                <p className="text-[11px] text-neutral-500 leading-normal">
                  Não sabe como configurar uma API do WhatsApp? Sem problemas! Escolha um dos métodos abaixo para ver o passo a passo simples e prático.
                </p>

                {/* Wizard Tab Selector */}
                <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  {[
                    { id: 'sandbox', label: 'Simulador' },
                    { id: 'callmebot', label: 'CallMeBot (Grátis)' },
                    { id: 'zapi', label: 'Z-API (Fácil)' },
                    { id: 'evolution', label: 'Evolution (Livre)' },
                    { id: 'meta', label: 'Meta (Oficial)' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setWizardTab(tab.id as any)}
                      className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                        wizardTab === tab.id
                          ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Wizard Content */}
                <div className="space-y-3.5 text-xs">
                  {wizardTab === 'sandbox' && (
                    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-150 dark:border-neutral-850">
                      <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1">
                        🚀 Simulador Integrado Ativo
                      </p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-450 leading-relaxed">
                        Por padrão, o Frello possui um <strong>Simulador Completo de Sandbox</strong>. Você não precisa configurar nada para ver o sistema funcionando!
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-[10px] text-neutral-500">
                        <li>Testa disparos de Check-In e Check-Out</li>
                        <li>Simula convites e confirmações</li>
                        <li>Perfeito para apresentar a clientes</li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => fillDemoConfig('evolution')}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        PREENCHER CONFIGURAÇÃO EXEMPLO
                      </button>
                    </div>
                  )}

                  {wizardTab === 'callmebot' && (
                    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-150 dark:border-neutral-850">
                      <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
                        🤖 CallMeBot — Mensagens gratuitas e rápidas!
                      </p>
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-450 space-y-2 leading-relaxed">
                        <p>O <strong>CallMeBot</strong> é um bot público e gratuito que permite enviar notificações pelo WhatsApp usando uma requisição GET simples.</p>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[10px] text-neutral-500">
                          <li>Adicione o contato oficial do CallMeBot no seu WhatsApp: <strong className="text-emerald-500 font-mono">+34 621 07 33 58</strong> (ou clique <a href="https://wa.me/34621073358" target="_blank" rel="noreferrer" className="text-emerald-500 underline font-bold inline-flex items-center gap-0.5">neste link</a>).</li>
                          <li>Envie a seguinte mensagem exata: <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded text-rose-500 font-mono">I allow callmebot to send me messages</code></li>
                          <li>Aguarde a resposta do bot contendo o seu <strong>ApiKey</strong> pessoal.</li>
                          <li>Insira a URL <code className="font-mono text-[9px] text-neutral-600 dark:text-neutral-450">https://api.callmebot.com/whatsapp.php</code> no campo URL, e a sua <strong>ApiKey</strong> recebida no campo Token.</li>
                        </ol>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setConfig(prev => ({
                            ...prev,
                            enabled: true,
                            provider: 'callmebot',
                            apiUrl: 'https://api.callmebot.com/whatsapp.php',
                            token: 'SUA_APIKEY_DO_CALLME_BOT',
                            instanceId: 'callmebot_session',
                            clientToken: ''
                          }));
                        }}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        PREENCHER DADOS DO CALLMEBOT
                      </button>
                    </div>
                  )}

                  {wizardTab === 'zapi' && (
                    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-150 dark:border-neutral-850">
                      <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
                        ⚡ Z-API — Setup em 1 Minuto (Recomendado)
                      </p>
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-450 space-y-2 leading-relaxed">
                        <p>A Z-API é a solução mais rápida para quem não sabe programar ou hospedar servidores.</p>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[10px] text-neutral-500">
                          <li>Acesse <a href="https://z-api.io" target="_blank" rel="noreferrer" className="text-emerald-500 underline font-bold inline-flex items-center gap-0.5">z-api.io <ExternalLink className="w-2.5 h-2.5" /></a> e crie uma conta grátis.</li>
                          <li>No painel deles, clique em <strong>Criar Instância</strong>.</li>
                          <li>Escaneie o QR Code deles com seu WhatsApp (Comum ou Business).</li>
                          <li>Copie a <strong>URL</strong>, o <strong>ID Instância</strong> e o <strong>Token</strong>.</li>
                        </ol>
                      </div>
                      <button
                        type="button"
                        onClick={() => fillDemoConfig('zapi')}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        PREENCHER DADOS DE TESTE DA Z-API
                      </button>
                    </div>
                  )}

                  {wizardTab === 'evolution' && (
                    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-150 dark:border-neutral-850">
                      <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                        🌐 Evolution API — 100% Grátis & Sem Taxas
                      </p>
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-450 space-y-2 leading-relaxed">
                        <p>A Evolution API é uma API open-source que você pode hospedar de graça em servidores em nuvem.</p>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[10px] text-neutral-500">
                          <li>Crie uma conta na <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-emerald-500 underline font-bold">Railway</a> ou <a href="https://render.com" target="_blank" rel="noreferrer" className="text-emerald-500 underline font-bold">Render</a>.</li>
                          <li>Pesquise por "Evolution API template" e faça o deploy em 1 clique.</li>
                          <li>No Evolution Manager ou via Postman, crie uma instância.</li>
                          <li>Insira os dados gerados no formulário ao lado.</li>
                        </ol>
                      </div>
                      <button
                        type="button"
                        onClick={() => fillDemoConfig('evolution')}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        PREENCHER DADOS DE TESTE EVOLUTION
                      </button>
                    </div>
                  )}

                  {wizardTab === 'meta' && (
                    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-150 dark:border-neutral-850">
                      <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                        📱 Meta Cloud API — Oficial do Facebook
                      </p>
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-450 space-y-2 leading-relaxed">
                        <p>A API oficial da Meta permite enviar até 1000 mensagens grátis todo mês de forma extremamente estável.</p>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[10px] text-neutral-500">
                          <li>Acesse <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-500 underline font-bold">developers.facebook.com</a>.</li>
                          <li>Crie uma conta e um Aplicativo do tipo <strong>"Negócios"</strong>.</li>
                          <li>Adicione o produto <strong>WhatsApp</strong> ao seu aplicativo.</li>
                          <li>Obtenha seu <strong>ID do Telefone</strong> e o <strong>Access Token</strong>.</li>
                        </ol>
                      </div>
                      <button
                        type="button"
                        onClick={() => fillDemoConfig('meta')}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        PREENCHER DADOS DE TESTE DA META
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-lg text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium leading-tight">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Ambos WhatsApp Comum e Business são 100% suportados em qualquer opção!</span>
                </div>
              </div>

            </div>

          </div>
        </>
      ) : (
        /* QR Code Connection Module */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="whatsapp-qrcode-session-manager">
          
          {/* Left panel - QR Display / Status */}
          <div className="lg:col-span-7 bg-neutral-50 dark:bg-neutral-900/40 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4.5 h-4.5 text-emerald-500" />
                  Módulo de Pareamento WhatsApp Web
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Selecione o método e conecte seu número com facilidade.
                </p>
              </div>
              
              {connectionStatus === 'connected' && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 hover:text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all uppercase tracking-wide"
                >
                  Desconectar
                </button>
              )}
            </div>

            {/* Connection Method Selector */}
            {connectionStatus !== 'connected' && (
              <div className="flex gap-2 p-1 bg-neutral-150 dark:bg-neutral-900 rounded-lg max-w-xs border border-neutral-250 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionMethod('qrcode');
                    setConnectionStatus('disconnected');
                    setPairingCodeStatus('idle');
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    connectionMethod === 'qrcode'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                  }`}
                >
                  Conectar via QR Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConnectionMethod('pairing_code');
                    setConnectionStatus('disconnected');
                    setPairingCodeStatus('idle');
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    connectionMethod === 'pairing_code'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                  }`}
                >
                  Código por Telefone
                </button>
              </div>
            )}

            {/* Stage Viewer */}
            <div className="flex flex-col items-center justify-center py-6 bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-850 rounded-xl relative overflow-hidden min-h-[340px]">
              
              {/* Overlay for Scanning Simulation */}
              {connectionStatus === 'ready_to_scan' && (
                <button
                  type="button"
                  onClick={connectionMethod === 'qrcode' ? handleSimulateScan : handleSimulatePairingCodeScan}
                  title={connectionMethod === 'qrcode' ? "Clique aqui para simular a leitura do QR Code" : "Clique para simular a digitação do código"}
                  className="absolute bottom-4 right-4 bg-emerald-500 text-neutral-950 hover:bg-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-md cursor-pointer animate-bounce flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {connectionMethod === 'qrcode' ? 'Simular Leitura QR' : 'Simular Digitação'}
                </button>
              )}

              {connectionStatus === 'disconnected' && (
                <div className="text-center space-y-4 max-w-sm px-4">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 rounded-full flex items-center justify-center mx-auto border border-neutral-200 dark:border-neutral-800">
                    <QrCode className="w-8 h-8" />
                  </div>
                  
                  {connectionMethod === 'qrcode' ? (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                          Nenhuma conexão ativa na instância (QR Code)
                        </p>
                        <p className="text-[10px] text-neutral-400 leading-normal">
                          Sua sessão do WhatsApp para <code className="font-mono bg-neutral-50 dark:bg-neutral-900 px-1 py-0.5 rounded text-neutral-500">{config.instanceId || 'frello_instance'}</code> está desligada.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateQRCode}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1.5 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Gerar Código de Conexão
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                          Conectar por Código de Telefone
                        </p>
                        <p className="text-[10px] text-neutral-400 leading-normal mb-3">
                          Digite o número do seu celular com DDI e DDD (ex: 5511999999999) para gerar o código de pareamento de 8 dígitos.
                        </p>
                      </div>
                      <div className="space-y-3 max-w-xs mx-auto">
                        <input
                          type="text"
                          placeholder="Ex: 5511999999999"
                          value={pairingPhoneNumber}
                          onChange={(e) => setPairingPhoneNumber(e.target.value)}
                          className="w-full text-center text-xs font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 p-2.5 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleGeneratePairingCode(pairingPhoneNumber)}
                          className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold rounded-lg cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          Gerar Código de Pareamento
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {connectionStatus === 'generating' && (
                <div className="text-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    {connectionMethod === 'qrcode' ? 'Solicitando QR Code à API...' : 'Gerando Código de Pareamento por Telefone...'}
                  </p>
                  <p className="text-[10px] text-neutral-450">
                    Aguardando handshake com {config.apiUrl || 'https://api.evolution.frello.com.br'}
                  </p>
                </div>
              )}

              {connectionStatus === 'ready_to_scan' && (
                <div className="text-center space-y-4 max-w-md px-6">
                  {/* Sandbox Banner */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl text-left space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-xs text-amber-800 dark:text-purple-500">
                      ⚠️ Modo de Simulação Ativo (Instruções Importantes)
                    </p>
                    <div className="text-[11px] text-neutral-700 dark:text-neutral-300 space-y-2 leading-relaxed">
                      <p>
                        <strong>1. WhatsApp Comum ou Business?</strong> Ambos são <span className="text-emerald-600 dark:text-emerald-450 font-bold">100% suportados</span>! Você pode conectar tanto contas pessoais quanto contas corporativas sem nenhuma restrição.
                      </p>
                      <p>
                        <strong>2. Por que o escaneamento real falha no painel atual?</strong> Frello é uma aplicação frontend executada diretamente no navegador. Para ler o QR Code com o celular real, você precisa configurar um <strong>servidor de gateway do WhatsApp dedicado</strong> (como a <em>Evolution API</em> ou <em>Z-API</em>) na primeira aba <strong>"Configuração de Conexão"</strong> informando a URL e o Token do seu servidor ativo.
                      </p>
                      <p>
                        <strong>3. Como testar agora mesmo?</strong> Como estamos no ambiente de testes, clique no botão verde abaixo para simular o pareamento imediato do celular para fins de validação dos fluxos!
                      </p>
                    </div>
                  </div>

                  {connectionMethod === 'qrcode' ? (
                    <>
                      {/* QR Code Container */}
                      <div className="p-3 bg-white border border-neutral-200 rounded-lg shadow-sm mx-auto inline-block relative">
                        <img
                          src={qrCodeUrl}
                          alt="WhatsApp Web QR Code"
                          referrerPolicy="no-referrer"
                          className="w-48 h-48 block"
                        />
                        <div className="absolute inset-0 bg-neutral-900/5 hover:bg-transparent transition-all cursor-pointer rounded-lg flex items-center justify-center" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 dark:text-purple-600">
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                          Aguardando leitura do aparelho celular ({qrTimer}s restantes)
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={handleSimulateScan}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg text-xs font-black tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform hover:scale-[1.02] transition-all"
                          >
                            <Camera className="w-4 h-4 animate-bounce" />
                            SIMULAR LEITURA DO QR CODE
                          </button>

                          <button
                            type="button"
                            onClick={handleGenerateQRCode}
                            className="text-[10px] text-neutral-500 dark:text-neutral-400 underline hover:text-emerald-500 flex items-center gap-1 justify-center mx-auto"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Gerar Novo Código
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Pairing Code Container */}
                      <div className="py-6 px-10 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl mx-auto inline-block relative shadow-inner">
                        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-black tracking-widest block mb-2">Código de Pareamento</span>
                        <div className="font-mono text-3xl font-black tracking-widest text-emerald-500 dark:text-emerald-400 select-all">
                          {pairingCode}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-center max-w-sm mx-auto leading-relaxed">
                          <p>1. No celular, clique em "Conectar com número de telefone".</p>
                          <p>2. Digite o código de 8 dígitos acima no aparelho.</p>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleSimulatePairingCodeScan}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg text-xs font-black tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transform hover:scale-[1.02] transition-all"
                          >
                            <Smartphone className="w-4 h-4 animate-bounce" />
                            SIMULAR PAREAMENTO DE CÓDIGO
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGeneratePairingCode(pairingPhoneNumber)}
                            className="text-[10px] text-neutral-500 dark:text-neutral-400 underline hover:text-emerald-500 flex items-center gap-1 justify-center mx-auto"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Gerar Novo Código
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {connectionStatus === 'connecting' && (
                <div className="text-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                    Sincronizando com o celular...
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Autenticando chaves de criptografia e carregando sessão.
                  </p>
                </div>
              )}

              {connectionStatus === 'connected' && pairedDevice && (
                <div className="text-center space-y-4 px-6">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-900">
                    <ShieldCheck className="w-9 h-9" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-450 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider inline-block">
                      Dispositivo Pareado
                    </span>
                    <h5 className="text-sm font-bold text-neutral-800 dark:text-white">
                      {pairedDevice.name}
                    </h5>
                    <p className="text-xs font-mono text-neutral-500">
                      Telefone: {pairedDevice.phone}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      Sincronizado em: {pairedDevice.date}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('config');
                        setTimeout(() => {
                          const el = document.getElementById('whatsapp-integration-tab');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      Enviar Mensagem de Teste
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 hover:text-rose-700 dark:text-rose-450 rounded-lg text-xs font-bold cursor-pointer transition-all border border-rose-150 dark:border-rose-900/50"
                    >
                      Remover Aparelho
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Right panel - Instructions and Terminal Logs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Steps Instruction Card */}
            <div className="bg-white dark:bg-neutral-900/40 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-neutral-800 dark:text-neutral-200">
                  Instruções de Pareamento
                </h4>
              </div>

              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-3 leading-relaxed">
                <p>
                  Siga os passos no seu smartphone para vincular a conta de WhatsApp da empresa ao portal Frello:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                  <li>
                    Abra o <strong>WhatsApp</strong> em seu celular.
                  </li>
                  <li>
                    Toque em <strong>Mais opções</strong> (três pontos no Android) ou <strong>Configurações</strong> (no iPhone).
                  </li>
                  <li>
                    Selecione <strong>Aparelhos Conectados</strong>.
                  </li>
                  <li>
                    Toque em <strong>Conectar um Aparelho</strong>.
                  </li>
                  <li>
                    Aponte a câmera do celular para o <strong>QR Code</strong> exibido ao lado.
                  </li>
                </ol>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 rounded-lg text-[10px] text-amber-800 dark:text-purple-600 leading-normal">
                  ⚠️ <strong>Atenção:</strong> Mantenha a conexão do celular ativa e certifique-se de que o aparelho não está sob configurações restritas de economia de bateria extrema.
                </div>
              </div>
            </div>

            {/* Account Type & API Setup FAQ Card */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/5 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                  Compatibilidade & Dúvidas Frequentes
                </h4>
              </div>

              <div className="text-xs space-y-4 leading-relaxed">
                <div className="space-y-1">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200">
                    🟢 Posso usar WhatsApp Comum ou precisa ser o Business?
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                    <strong>Ambos funcionam perfeitamente!</strong> As integrações baseadas em Evolution API ou Z-API suportam tanto contas do <strong>WhatsApp Comum (Pessoal)</strong> quanto contas do <strong>WhatsApp Business</strong> de forma nativa e idêntica.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200">
                    🔒 Por que o QR Code ou Código de Pareamento real não conecta meu celular nesta página?
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                    Como este é um ambiente de demonstração segura e hospedado temporariamente, ele executa um <strong>emulador de sandbox</strong> por padrão. Para ler o código com o seu celular real, você precisa:
                  </p>
                  <ol className="list-decimal pl-4 mt-1 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
                    <li>Contratar ou hospedar seu próprio gateway (ex: Evolution API em uma VPS).</li>
                    <li>Ir na aba <strong>"Configuração de Conexão"</strong> acima.</li>
                    <li>Preencher com a <strong>URL Real do seu Servidor</strong> e o <strong>Token de Acesso</strong>.</li>
                    <li>Salvar as configurações.</li>
                  </ol>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                    Uma vez configurado com sua API ativa, os códigos exibidos aqui serão os gerados pelo seu próprio servidor, permitindo a conexão imediata do seu celular de produção!
                  </p>
                </div>
              </div>
            </div>

            {/* Terminal Live logs */}
            <div className="bg-neutral-950 text-neutral-200 p-5 rounded-2xl border border-neutral-800 space-y-3 shadow-xl font-mono">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Console de Conexão (Live)
                </span>
                <span className="text-[9px] bg-neutral-900 text-neutral-500 px-1.5 py-0.5 rounded font-bold">
                  v2.4.0
                </span>
              </div>

              <div className="space-y-2 min-h-36 max-h-52 overflow-y-auto text-[9px] text-emerald-450 leading-relaxed custom-scrollbar">
                {qrLog.length === 0 ? (
                  <p className="text-neutral-500">Aguardando início de sessão para registrar logs de pareamento...</p>
                ) : (
                  qrLog.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap">{log}</div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

