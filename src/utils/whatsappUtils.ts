import { loadFromDatabase } from '../database';
import { Notification, Freelancer } from '../types';

export interface SendWhatsAppParams {
  phone: string;
  message: string;
}

/**
 * Sends a WhatsApp message using the configured WhatsApp API settings
 * (Evolution API, Z-API, Meta Cloud API, CallMeBot, or Custom Webhook).
 */
export async function sendWhatsAppMessage({ phone, message }: SendWhatsAppParams): Promise<{ success: boolean; details?: string }> {
  try {
    const config = await loadFromDatabase('whatsapp_api_config');
    if (!config || (!config.enabled && !config.apiUrl) || !config.apiUrl || config.apiUrl === 'https://') {
      console.log('[WhatsApp] Integration is disabled or not configured in database.');
      return { success: false, details: 'WhatsApp não está ativado ou configurado nas configurações.' };
    }

    let rawPhone = (phone || '').replace(/\D/g, '');
    if (!rawPhone) {
      console.warn('[WhatsApp] No valid phone number provided.');
      return { success: false, details: 'Número de telefone inválido ou ausente.' };
    }

    // Ensure Brazilian numbers have 55 DDI if 10 or 11 digits
    if (rawPhone.length === 10 || rawPhone.length === 11) {
      rawPhone = `55${rawPhone}`;
    }

    // Generate phone variations (with and without 9th digit for Brazilian mobile numbers)
    const phoneCandidates: string[] = [rawPhone];
    if (rawPhone.startsWith('55') && rawPhone.length === 13 && rawPhone[4] === '9') {
      const without9 = rawPhone.slice(0, 4) + rawPhone.slice(5);
      if (!phoneCandidates.includes(without9)) phoneCandidates.push(without9);
    } else if (rawPhone.startsWith('55') && rawPhone.length === 12) {
      const with9 = rawPhone.slice(0, 4) + '9' + rawPhone.slice(4);
      if (!phoneCandidates.includes(with9)) phoneCandidates.push(with9);
    }

    const cleanPhone = phoneCandidates[0];

    const rawUrl = config.apiUrl.trim();
    const token = config.token || '';
    const instanceId = config.instanceId || 'default';

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
      let instance = instanceId.trim();

      if (cleanApiUrl.includes('/message/sendText')) {
        const match = cleanApiUrl.match(/\/message\/sendText\/([^\/]+)/);
        if (match && match[1]) {
          instance = match[1];
        }
        cleanApiUrl = cleanApiUrl.split('/message/sendText')[0];
      }

      const finalInstance = instance || 'default';

      attempts.push({
        name: 'Evolution API v2 (Instância na URL)',
        endpoint: `${cleanApiUrl}/message/sendText/${finalInstance}`,
        headers: {
          'Content-Type': 'application/json',
          'apikey': token,
          'apiKey': token,
        },
        body: {
          number: cleanPhone,
          text: message,
          options: { delay: 1200, presence: 'composing' }
        }
      });

      attempts.push({
        name: 'Evolution API v2 (Instância Header & Body)',
        endpoint: `${cleanApiUrl}/message/sendText`,
        headers: {
          'Content-Type': 'application/json',
          'apikey': token,
          'apiKey': token,
          'instance': finalInstance,
          'Instance': finalInstance,
        },
        body: {
          number: cleanPhone,
          text: message,
          instance: finalInstance,
          options: { delay: 1200, presence: 'composing' }
        }
      });

      attempts.push({
        name: 'Evolution API v2 (URL Exata)',
        endpoint: rawUrl,
        headers: {
          'Content-Type': 'application/json',
          'apikey': token,
          'apiKey': token,
        },
        body: {
          number: cleanPhone,
          text: message,
          instance: finalInstance,
        }
      });
    } else if (config.provider === 'zapi') {
      let cleanApiUrl = rawUrl.replace(/\/$/, '');
      let zInstance = instanceId.trim();
      let zToken = token.trim();

      if (cleanApiUrl.includes('/instances/')) {
        const parts = cleanApiUrl.split('/instances/');
        cleanApiUrl = parts[0];
        const subparts = parts[1].split('/');
        if (subparts[0]) zInstance = subparts[0];
        const tokenIndex = subparts.indexOf('token');
        if (tokenIndex !== -1 && subparts[tokenIndex + 1]) zToken = subparts[tokenIndex + 1];
      }

      const clientTokHeader = config.clientToken ? config.clientToken.trim() : (zToken || token);

      attempts.push({
        name: 'Z-API send-text',
        endpoint: `${cleanApiUrl}/instances/${zInstance}/token/${zToken}/send-text`,
        headers: {
          'Content-Type': 'application/json',
          'client-token': clientTokHeader
        },
        body: {
          phone: cleanPhone,
          message: message
        }
      });
    } else if (config.provider === 'meta') {
      let cleanApiUrl = rawUrl.replace(/\/$/, '');
      let metaEndpoint = cleanApiUrl;
      if (!cleanApiUrl.endsWith('/messages') && instanceId) {
        metaEndpoint = `${cleanApiUrl}/${instanceId}/messages`;
      }

      attempts.push({
        name: 'Meta Cloud API',
        endpoint: metaEndpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message }
        }
      });
    } else if (config.provider === 'callmebot') {
      let cleanApiUrl = rawUrl.trim().replace(/\/$/, '') || 'https://api.callmebot.com/whatsapp.php';
      attempts.push({
        name: 'CallMeBot',
        endpoint: `${cleanApiUrl}?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${token}`,
        headers: {},
        body: null,
        method: 'GET'
      });
    } else {
      // Custom Webhook
      attempts.push({
        name: 'Custom Webhook',
        endpoint: rawUrl,
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
          'Authorization': `Bearer ${token}`,
          'apikey': token,
        },
        body: {
          to: cleanPhone,
          phone: cleanPhone,
          number: cleanPhone,
          text: message,
          message: message,
          instance: instanceId
        }
      });
    }

    for (const attempt of attempts) {
      try {
        console.log(`[WhatsApp] Dispatching via ${attempt.name} to ${cleanPhone}...`);
        
        let response: Response;
        const isDirect = config.requestMode === 'direct';

        if (isDirect) {
          response = await fetch(attempt.endpoint, {
            method: attempt.method || 'POST',
            headers: attempt.headers,
            body: attempt.body ? JSON.stringify(attempt.body) : undefined,
          });
        } else {
          try {
            response = await fetch('/api/whatsapp/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: attempt.endpoint,
                method: attempt.method || 'POST',
                headers: attempt.headers,
                body: attempt.body
              })
            });
          } catch {
            response = await fetch(attempt.endpoint, {
              method: attempt.method || 'POST',
              headers: attempt.headers,
              body: attempt.body ? JSON.stringify(attempt.body) : undefined,
            });
          }
        }

        if (response.ok) {
          console.log(`[WhatsApp] Message successfully sent to ${cleanPhone}!`);
          return { success: true };
        } else {
          const errText = await response.text();
          console.warn(`[WhatsApp] Attempt "${attempt.name}" failed with status ${response.status}:`, errText);
        }
      } catch (err: any) {
        console.warn(`[WhatsApp] Network error on attempt "${attempt.name}":`, err?.message || err);
      }
    }

    return { success: false, details: 'Todas as tentativas de envio via WhatsApp falharam.' };
  } catch (err: any) {
    console.error('[WhatsApp] Unexpected error sending message:', err);
    return { success: false, details: err?.message || 'Erro inesperado' };
  }
}

/**
 * Dispatches a WhatsApp notification for a specific system Notification object to the relevant freelancer
 */
export async function sendWhatsAppNotificationForNotif(notif: Notification, freelancers: Freelancer[]) {
  if (!notif || !notif.freelancerId) return;

  let targets: Freelancer[] = [];
  if (notif.freelancerId === 'all') {
    targets = freelancers.filter(f => !f.arquivado);
  } else {
    const target = freelancers.find(f => f.id === notif.freelancerId);
    if (target) targets.push(target);
  }

  for (const free of targets) {
    const phone = free.celular || free.telefone;
    if (phone) {
      const message = `📢 *${notif.titulo}*\n\n${notif.mensagem}`;
      sendWhatsAppMessage({ phone, message }).catch(err => {
        console.warn(`[WhatsApp] Failed to send notification to ${free.nome}:`, err);
      });
    }
  }
}
