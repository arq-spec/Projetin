import React, { useState, useEffect } from 'react';
import { Key, Globe, Eye, EyeOff, RefreshCw, Copy, Check, Send, Sparkles, Code, Terminal, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { loadFromDatabase, saveToDatabase } from '../database';
import { Freelancer, Task, Client, SystemUser } from '../types';

interface ApiWebhooksManagementProps {
  freelancers: Freelancer[];
  tasks: Task[];
  clients: Client[];
  users: SystemUser[];
}

interface ApiConfig {
  apiKey: string;
  apiUsername?: string;
  apiPassword?: string;
  webhookUrl?: string;
  webhooksEnabled?: boolean;
  events?: {
    transactions?: boolean;
    freelancers?: boolean;
    users?: boolean;
    tasks?: boolean;
  };
}

export default function ApiWebhooksManagement({
  freelancers,
  tasks,
  clients,
  users,
}: ApiWebhooksManagementProps) {
  const [config, setConfig] = useState<ApiConfig>({
    apiKey: '',
    apiUsername: 'frello_api_user',
    apiPassword: 'frello_secure_password_2026',
    webhookUrl: '',
    webhooksEnabled: false,
    events: {
      transactions: true,
      freelancers: true,
      users: true,
      tasks: true,
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [webhookTestLog, setWebhookTestLog] = useState<string>('');

  // API Playground State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('freelancers');
  const [playgroundHeaderKey, setPlaygroundHeaderKey] = useState<string>('');
  const [playgroundUser, setPlaygroundUser] = useState<string>('');
  const [playgroundPass, setPlaygroundPass] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiResponseStatus, setApiResponseStatus] = useState<number | null>(null);
  const [apiResponseTime, setApiResponseTime] = useState<number | null>(null);

  // Active Integration Code Language tab
  const [activeCodeLang, setActiveCodeLang] = useState<'curl' | 'n8n' | 'node' | 'python'>('n8n');

  // Load API config on component mount
  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const stored = await loadFromDatabase('api_config');
        if (stored) {
          setConfig(prev => ({
            ...prev,
            ...stored,
            events: {
              transactions: stored.events?.transactions ?? true,
              freelancers: stored.events?.freelancers ?? true,
              users: stored.events?.users ?? true,
              tasks: stored.events?.tasks ?? true,
            }
          }));
          // Pre-fill playground credentials
          setPlaygroundHeaderKey(stored.apiKey || '');
          setPlaygroundUser(stored.apiUsername || 'frello_api_user');
          setPlaygroundPass(stored.apiPassword || 'frello_secure_password_2026');
        } else {
          // Generate a default API Key if none exists
          const defaultKey = generateApiKey();
          const defaultUser = 'frello_api_user';
          const defaultPass = 'frello_secure_password_2026';
          const newConfig: ApiConfig = {
            apiKey: defaultKey,
            apiUsername: defaultUser,
            apiPassword: defaultPass,
            webhookUrl: '',
            webhooksEnabled: false,
            events: {
              transactions: true,
              freelancers: true,
              users: true,
              tasks: true,
            }
          };
          setConfig(newConfig);
          setPlaygroundHeaderKey(defaultKey);
          setPlaygroundUser(defaultUser);
          setPlaygroundPass(defaultPass);
          await saveToDatabase('api_config', newConfig);
        }
      } catch (err) {
        console.warn('Failed to load api_config:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  function generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'fr_live_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  const handleRegenerateKey = async () => {
    if (confirm('Deseja realmente REGENERAR a chave de segurança? Qualquer integração ativa (n8n, APIs externas) que utilize a chave antiga parará de funcionar imediatamente.')) {
      const newKey = generateApiKey();
      const updatedConfig = { ...config, apiKey: newKey };
      setConfig(updatedConfig);
      setPlaygroundHeaderKey(newKey);
      await saveToDatabase('api_config', updatedConfig);
      alert('Nova chave de segurança gerada e salva com sucesso!');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await saveToDatabase('api_config', config);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.warn('Failed to save API config:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestWebhook = async () => {
    if (!config.webhookUrl) {
      alert('Por favor, configure uma URL de Webhook válida antes de testar.');
      return;
    }

    setWebhookTestStatus('sending');
    setWebhookTestLog('Iniciando envio de payload de teste...');

    const payload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      apiKey: config.apiKey,
      message: 'Olá n8n! Esta é uma transmissão de teste do painel Frello.',
      summary: 'Webhook ativado com sucesso para todas as transações.',
      testData: {
        totalFreelancers: freelancers.length,
        totalTasks: tasks.length,
        totalClients: clients.length,
        systemVersion: '2.5.0-production'
      }
    };

    try {
      const t0 = performance.now();
      const res = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey,
          'Authorization': `Basic ${btoa(`${config.apiUsername}:${config.apiPassword}`)}`
        },
        body: JSON.stringify(payload),
      });

      const t1 = performance.now();
      const latency = Math.round(t1 - t0);

      if (res.ok) {
        setWebhookTestStatus('success');
        setWebhookTestLog(`✓ Sucesso! Recebido status ${res.status} (${res.statusText}) em ${latency}ms.\nWebhook processado pelo destino.`);
      } else {
        setWebhookTestStatus('error');
        setWebhookTestLog(`✗ Erro! Recebido status ${res.status} de ${config.webhookUrl}.\nResposta: ${res.statusText}`);
      }
    } catch (err: any) {
      setWebhookTestStatus('error');
      setWebhookTestLog(`✗ Falha na Conexão!\nVerifique se o endpoint aceita CORS ou se a URL está correta.\nErro técnico: ${err.message || err}`);
    }
  };

  // API Client-side simulation
  const handleExecutePlayground = () => {
    const t0 = performance.now();
    
    // Auth Validation simulation
    const isApiKeyValid = playgroundHeaderKey === config.apiKey;
    const isBasicAuthValid = playgroundUser === config.apiUsername && playgroundPass === config.apiPassword;

    if (!isApiKeyValid && !isBasicAuthValid) {
      const t1 = performance.now();
      setApiResponseStatus(401);
      setApiResponseTime(Math.round(t1 - t0));
      setApiResponse({
        error: 'Unauthorized',
        message: 'Acesso negado. Chave de Segurança (API Key) inválida ou Credenciais de Usuário/Senha incorretas.'
      });
      return;
    }

    // Simulate endpoint return data
    let responseData: any = {};
    if (selectedEndpoint === 'freelancers') {
      responseData = freelancers.map(f => ({
        id: f.id,
        nome: f.nome,
        cargo: f.cargo,
        email: f.email,
        telefone: f.telefone,
        disponibilidade: f.disponibilidade || 'Disponível',
        valorHora: f.valorHora,
        habilidades: f.habilidades,
        chavePix: f.chavePix || 'Não informada'
      }));
    } else if (selectedEndpoint === 'projects') {
      responseData = tasks.map(t => ({
        id: t.id,
        titulo: t.titulo,
        projeto: t.projeto,
        progresso: t.progresso,
        status: t.status,
        prioridade: t.prioridade,
        dataEntrega: t.dataEntrega || '',
        custoReal: t.custoRealExecutado || 0,
        alocacoesCount: t.alocacoes?.length || 0
      }));
    } else if (selectedEndpoint === 'users') {
      responseData = users.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        perfil: u.perfil,
        username: u.username,
        cpf: u.cpf
      }));
    } else if (selectedEndpoint === 'clients') {
      responseData = clients.map(c => ({
        id: c.id,
        nome: c.nome,
        cnpj: c.cnpj || '',
        segmento: c.segmento || '',
        email: c.email || '',
        telefone: c.telefone || ''
      }));
    }

    const t1 = performance.now();
    setApiResponseStatus(200);
    setApiResponseTime(Math.round(t1 - t0));
    setApiResponse({
      ok: true,
      timestamp: new Date().toISOString(),
      endpoint: `GET /api/v1/${selectedEndpoint}`,
      totalRecords: Array.isArray(responseData) ? responseData.length : 1,
      results: responseData
    });
  };

  // Get generated code example string
  const getCodeExample = () => {
    const basicAuthB64 = btoa(`${config.apiUsername}:${config.apiPassword}`);
    
    if (activeCodeLang === 'curl') {
      return `curl -X GET "https://frello-api.companhia.com/api/v1/${selectedEndpoint}" \\
  -H "X-API-Key: ${config.apiKey || 'CHAVE_API_AQUI'}" \\
  -H "Authorization: Basic ${basicAuthB64}" \\
  -H "Content-Type: application/json"`;
    }

    if (activeCodeLang === 'node') {
      return `import fetch from 'node-fetch';

const url = 'https://frello-api.companhia.com/api/v1/${selectedEndpoint}';
const options = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${config.apiKey || 'CHAVE_API_AQUI'}',
    'Authorization': 'Basic ${basicAuthB64}'
  }
};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log('Sucesso:', data);
} catch (error) {
  console.error('Erro na integração:', error);
}`;
    }

    if (activeCodeLang === 'python') {
      return `import requests

url = "https://frello-api.companhia.com/api/v1/${selectedEndpoint}"
headers = {
    "X-API-Key": "${config.apiKey || 'CHAVE_API_AQUI'}",
    "Authorization": "Basic ${basicAuthB64}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
if response.status_code == 200:
    data = response.json()
    print("Sucesso:", data["totalRecords"], "registros encontrados.")
else:
    print("Falha:", response.status_code, response.text)`;
    }

    // n8n workflow JSON snippet representing an HTTP Request node configured with this API setup
    return `{
  "meta": {
    "instanceId": "frello_integration_workflow"
  },
  "nodes": [
    {
      "parameters": {
        "url": "https://frello-api.companhia.com/api/v1/${selectedEndpoint}",
        "authentication": "basicAuth",
        "options": {}
      },
      "id": "frello-http-node",
      "name": "Frello API Client",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [250, 300],
      "credentials": {
        "basicAuth": {
          "id": "frello-api-credentials",
          "username": "${config.apiUsername}",
          "password": "${config.apiPassword}"
        }
      },
      "headers": [
        {
          "name": "X-API-Key",
          "value": "${config.apiKey}"
        }
      ]
    }
  ]
}`;
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm text-neutral-500 font-medium">Carregando configurações de API...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="api-webhooks-tab">
      <div>
        <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 dark:text-white">
          <Globe className="w-5 h-5 text-purple-600 font-mono" />
          Integração API & Webhooks (n8n, Make e outros)
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-0.5">
          Libere as chaves de segurança e integre o Frello em fluxos automatizados. Use webhooks para receber notificações em tempo real de todas as transações, alocações e check-ins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* API Credentials and Webhook Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveConfig} className="space-y-6">
            
            {/* Chave de Segurança Card */}
            <div className="bg-neutral-50 dark:bg-neutral-900/40 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                    Chave de Segurança (API Token)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  className="text-[10px] text-amber-600 dark:text-purple-500 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  title="Revogar chave antiga e criar nova"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerar Chave
                </button>
              </div>

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  readOnly
                  value={config.apiKey}
                  className="w-full text-xs font-mono bg-white dark:bg-neutral-950 p-3 pr-24 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 select-all"
                />
                <div className="absolute right-2 top-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded cursor-pointer"
                    title={showApiKey ? 'Ocultar Chave' : 'Mostrar Chave'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(config.apiKey, setCopiedKey)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded cursor-pointer relative"
                    title="Copiar Chave"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-450 leading-relaxed">
                Envie essa chave no cabeçalho <strong className="font-mono">X-API-Key</strong> de cada requisição externa. Ela identifica e autoriza de forma segura sua conta Frello.
              </p>
            </div>

            {/* API Username / Password for site access */}
            <div className="bg-neutral-50 dark:bg-neutral-900/40 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                  Autenticação Básica (Usuário e Senha do Site)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                    Usuário API
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={config.apiUsername}
                      onChange={(e) => setConfig({ ...config, apiUsername: e.target.value })}
                      className="w-full text-xs font-mono bg-white dark:bg-neutral-950 p-2.5 pr-10 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config.apiUsername || '', setCopiedUser)}
                      className="absolute right-2 top-2 p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded cursor-pointer"
                    >
                      {copiedUser ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                    Senha API
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={config.apiPassword}
                      onChange={(e) => setConfig({ ...config, apiPassword: e.target.value })}
                      className="w-full text-xs font-mono bg-white dark:bg-neutral-950 p-2.5 pr-16 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300"
                    />
                    <div className="absolute right-2 top-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config.apiPassword || '', setCopiedPass)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded cursor-pointer"
                      >
                        {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-450 leading-relaxed">
                Utilize este par de usuário/senha para configurar a autenticação de tipo <strong className="font-medium">Basic Auth</strong> nas chamadas externas para o Frello.
              </p>
            </div>

            {/* Webhook Configuration Card */}
            <div className="bg-neutral-50 dark:bg-neutral-900/40 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                    Configuração de Webhook Ativo
                  </h4>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold">Ativar Webhooks</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.webhooksEnabled}
                      onChange={(e) => setConfig({ ...config, webhooksEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-750 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                  URL de Destino do Webhook (Ex: n8n, Zapier, Make)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://n8n.seudominio.com/webhook/..."
                    value={config.webhookUrl}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    className="w-full text-xs p-2.5 pr-20 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300"
                  />
                  {config.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config.webhookUrl || '', setCopiedUrl)}
                      className="absolute right-2 top-2 p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider">
                  Eventos Selecionados para Envio
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 bg-white dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-150 dark:border-neutral-800 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.events?.transactions}
                      onChange={(e) => setConfig({
                        ...config,
                        events: { ...config.events, transactions: e.target.checked }
                      })}
                      className="w-4 h-4 text-purple-600 rounded border-neutral-300 focus:ring-0"
                    />
                    <div>
                      <span className="font-bold block text-neutral-800 dark:text-neutral-200">Todas as Transações</span>
                      <span className="text-[10px] text-neutral-500">Diárias, taxas, alocações e pagamentos</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 bg-white dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-150 dark:border-neutral-800 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.events?.freelancers}
                      onChange={(e) => setConfig({
                        ...config,
                        events: { ...config.events, freelancers: e.target.checked }
                      })}
                      className="w-4 h-4 text-purple-600 rounded border-neutral-300 focus:ring-0"
                    />
                    <div>
                      <span className="font-bold block text-neutral-800 dark:text-neutral-200">Talentos & Cadastros</span>
                      <span className="text-[10px] text-neutral-500">Novos profissionais, revisões e edição</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 bg-white dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-150 dark:border-neutral-800 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.events?.users}
                      onChange={(e) => setConfig({
                        ...config,
                        events: { ...config.events, users: e.target.checked }
                      })}
                      className="w-4 h-4 text-purple-600 rounded border-neutral-300 focus:ring-0"
                    />
                    <div>
                      <span className="font-bold block text-neutral-800 dark:text-neutral-200">Contas de Usuários</span>
                      <span className="text-[10px] text-neutral-500">Criação, redefinição de senhas</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 bg-white dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-150 dark:border-neutral-800 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.events?.tasks}
                      onChange={(e) => setConfig({
                        ...config,
                        events: { ...config.events, tasks: e.target.checked }
                      })}
                      className="w-4 h-4 text-purple-600 rounded border-neutral-300 focus:ring-0"
                    />
                    <div>
                      <span className="font-bold block text-neutral-800 dark:text-neutral-200">Projetos & Kanban</span>
                      <span className="text-[10px] text-neutral-500">Workspaces, colunas, cartões de tarefas</span>
                    </div>
                  </label>
                </div>
              </div>

              {config.webhookUrl && (
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestWebhook}
                    disabled={webhookTestStatus === 'sending'}
                    className={`w-fit px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer flex items-center gap-1.5 transition-all ${
                      webhookTestStatus === 'sending'
                        ? 'bg-neutral-100 border-neutral-200 text-neutral-400'
                        : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <Send className={`w-3.5 h-3.5 ${webhookTestStatus === 'sending' ? 'animate-pulse' : ''}`} />
                    Enviar Webhook de Teste (Ping n8n)
                  </button>
                  {webhookTestLog && (
                    <pre className={`text-[10px] font-mono p-3 rounded-lg border overflow-x-auto leading-normal whitespace-pre-wrap ${
                      webhookTestStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-150 dark:border-emerald-900/60' :
                      webhookTestStatus === 'error' ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-150 dark:border-red-900/60' :
                      'bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-250 dark:border-neutral-850'
                    }`}>
                      {webhookTestLog}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-850 dark:bg-purple-600 dark:hover:bg-amber-600 text-white dark:text-neutral-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-xs"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 fill-current" />
                )}
                <span>Salvar Configurações de API</span>
              </button>
              
              {saveStatus === 'success' && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Configurações salvas e sincronizadas!
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 animate-fade-in">
                  <AlertCircle className="w-4 h-4" />
                  Erro ao salvar. Verifique a conexão.
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Live Playground and Integration Guides */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Interactive API Client Simulator */}
          <div className="bg-neutral-950 text-neutral-200 p-5 rounded-2xl border border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-purple-500" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-neutral-100">
                  Simulador de Chamada API (Playground)
                </h4>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Servidor API Local Ativo" />
            </div>

            <p className="text-[10px] text-neutral-400 leading-normal">
              Como a API roda com segurança, teste requisições de consulta abaixo sem precisar sair do painel corporativo.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wide">
                  Endpoint da Requisição
                </label>
                <div className="flex gap-2">
                  <span className="bg-neutral-900 border border-neutral-800 px-2 py-1 text-[11px] rounded text-neutral-400 font-bold flex items-center shrink-0">
                    GET
                  </span>
                  <select
                    value={selectedEndpoint}
                    onChange={(e) => {
                      setSelectedEndpoint(e.target.value);
                      setApiResponse(null);
                      setApiResponseStatus(null);
                    }}
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-xs p-1.5 rounded-lg text-neutral-100 focus:outline-none"
                  >
                    <option value="freelancers">/api/v1/freelancers (Talentos)</option>
                    <option value="projects">/api/v1/projects (Projetos e Diárias)</option>
                    <option value="clients">/api/v1/clients (Clientes Cadastrados)</option>
                    <option value="users">/api/v1/users (Usuários e Logins)</option>
                  </select>
                </div>
              </div>

              {/* Simulation Header / Auth inputs */}
              <div className="grid grid-cols-1 gap-2 pt-1 border-t border-neutral-900">
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wide">
                    Header: X-API-Key
                  </label>
                  <input
                    type="text"
                    value={playgroundHeaderKey}
                    onChange={(e) => setPlaygroundHeaderKey(e.target.value)}
                    className="w-full text-[10px] font-mono bg-neutral-900 border border-neutral-850 p-1.5 rounded text-neutral-200"
                    placeholder="Chave de Segurança de Teste"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wide">
                      Basic Auth User
                    </label>
                    <input
                      type="text"
                      value={playgroundUser}
                      onChange={(e) => setPlaygroundUser(e.target.value)}
                      className="w-full text-[10px] font-mono bg-neutral-900 border border-neutral-850 p-1.5 rounded text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wide">
                      Basic Auth Pass
                    </label>
                    <input
                      type="password"
                      value={playgroundPass}
                      onChange={(e) => setPlaygroundPass(e.target.value)}
                      className="w-full text-[10px] font-mono bg-neutral-900 border border-neutral-850 p-1.5 rounded text-neutral-200"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExecutePlayground}
                className="w-full py-2 bg-purple-600 hover:bg-amber-600 text-neutral-950 rounded-lg text-xs font-black cursor-pointer tracking-wider flex items-center justify-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                EXECUÇÃO ENVIAR REQUISIÇÃO
              </button>
            </div>

            {/* Playgound response panel */}
            {apiResponseStatus !== null && (
              <div className="space-y-2 pt-2 border-t border-neutral-900 animate-fade-in">
                <div className="flex items-center justify-between text-[10px] font-bold font-mono">
                  <span className="flex items-center gap-1">
                    Status: 
                    <span className={apiResponseStatus === 200 ? 'text-emerald-450' : 'text-rose-400'}>
                      {apiResponseStatus} {apiResponseStatus === 200 ? 'OK' : 'Unauthorized'}
                    </span>
                  </span>
                  <span className="text-neutral-500">Tempo: {apiResponseTime}ms</span>
                </div>

                <div className="max-h-60 overflow-y-auto bg-neutral-900 border border-neutral-850 rounded-lg p-3 text-[10px] font-mono">
                  <pre className="text-neutral-300 leading-relaxed overflow-x-auto">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Quick copy-paste integration guide */}
          <div className="bg-white dark:bg-neutral-900/40 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center gap-1.5">
              <Code className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-neutral-800 dark:text-neutral-200">
                Guias de Integração Rápida
              </h4>
            </div>

            {/* Language tabs */}
            <div className="flex gap-1 border-b border-neutral-100 dark:border-neutral-800 pb-1">
              <button
                type="button"
                onClick={() => setActiveCodeLang('n8n')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  activeCodeLang === 'n8n'
                    ? 'bg-purple-600 text-neutral-950'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                }`}
              >
                n8n Workflow
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeLang('curl')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  activeCodeLang === 'curl'
                    ? 'bg-neutral-900 text-white dark:bg-purple-600 dark:text-neutral-950'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                }`}
              >
                cURL
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeLang('node')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  activeCodeLang === 'node'
                    ? 'bg-neutral-900 text-white dark:bg-purple-600 dark:text-neutral-950'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                }`}
              >
                NodeJS
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeLang('python')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  activeCodeLang === 'python'
                    ? 'bg-neutral-900 text-white dark:bg-purple-600 dark:text-neutral-950'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                }`}
              >
                Python
              </button>
            </div>

            <div className="space-y-3">
              {activeCodeLang === 'n8n' ? (
                <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <p className="leading-relaxed text-[11px]">
                    <strong>Como integrar no n8n:</strong>
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                    <li>Copie o código JSON do nó HTTP abaixo.</li>
                    <li>Abra seu editor do n8n e simplesmente dê <kbd className="bg-neutral-100 px-1 py-0.5 border rounded">Ctrl+V</kbd> para colar o nó pronto.</li>
                    <li>O nó importará pré-configurado com sua Chave de Segurança e Credenciais Básicas!</li>
                  </ol>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Copie o código customizado abaixo para fazer requisições à API do Frello:
                </p>
              )}

              <div className="relative">
                <pre className="text-[9px] font-mono bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-lg border border-neutral-250 dark:border-neutral-850 overflow-x-auto text-neutral-700 dark:text-neutral-300 leading-normal max-h-48">
                  {getCodeExample()}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getCodeExample(), setCopiedUrl)}
                  className="absolute right-2 top-2 p-1.5 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-md text-neutral-450 hover:text-neutral-700 cursor-pointer"
                  title="Copiar código"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
