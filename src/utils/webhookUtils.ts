import { loadFromDatabase } from '../database';

/**
 * Triggers a real webhook POST request to the configured destination URL.
 * Catches all exceptions and handles them gracefully.
 */
export async function triggerWebhook(event: string, data: any) {
  try {
    // Lazy-load API configuration from Database so we always have the freshest configuration
    const apiConfig = await loadFromDatabase('api_config');
    if (!apiConfig || !apiConfig.webhooksEnabled || !apiConfig.webhookUrl) {
      return;
    }

    // Determine if the specific event type is enabled in settings
    let isEventEnabled = true;
    if (apiConfig.events) {
      if (event.startsWith('transaction') && apiConfig.events.transactions === false) {
        isEventEnabled = false;
      } else if (event.startsWith('freelancer') && apiConfig.events.freelancers === false) {
        isEventEnabled = false;
      } else if (event.startsWith('user') && apiConfig.events.users === false) {
        isEventEnabled = false;
      } else if (event.startsWith('task') && apiConfig.events.tasks === false) {
        isEventEnabled = false;
      }
    }

    if (!isEventEnabled) {
      return;
    }

    // Strip sensitive fields (e.g. raw password fields if any)
    const cleanData = JSON.parse(JSON.stringify(data));
    if (Array.isArray(cleanData)) {
      cleanData.forEach((item: any) => {
        if (item && item.password) item.password = '***';
      });
    } else if (cleanData && cleanData.password) {
      cleanData.password = '***';
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      apiKey: apiConfig.apiKey,
      data: cleanData
    };

    console.log(`[Webhook] Dispatching event "${event}" to ${apiConfig.webhookUrl}...`);

    // Execute real asynchronous POST request to the destination webhook URL (e.g. n8n)
    fetch(apiConfig.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiConfig.apiKey || '',
        'Authorization': `Basic ${btoa(`${apiConfig.apiUsername || 'frello_api_user'}:${apiConfig.apiPassword || ''}`)}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      console.log(`[Webhook] Dispatch status for "${event}":`, res.status);
    })
    .catch(err => {
      console.warn(`[Webhook] Connection error dispatching "${event}" to ${apiConfig.webhookUrl}:`, err);
    });
  } catch (err) {
    console.warn('[Webhook] Error executing triggerWebhook:', err);
  }
}
