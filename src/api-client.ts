import { SettingsManager } from "./settings";

export interface APIConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  endpoint: string;
  maxTokens: number;
  temperature: number;
}

export class APIClient {
  private settingsManager: SettingsManager;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  /**
   * API 호출 메서드
   */
  async callAPI(prompt: string, systemPrompt?: string): Promise<string> {
    const config = this.settingsManager.getApiConfiguration();
    
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API 키가 설정되지 않았습니다.');
    }

    try {
      if (config.provider === 'openai') {
        return await this.callOpenAIAPI(prompt, systemPrompt, config);
      } else if (config.provider === 'anthropic') {
        return await this.callAnthropicAPI(prompt, systemPrompt, config);
      } else {
        throw new Error(`지원하지 않는 API 공급자: ${config.provider}`);
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      throw new Error(`API 호출 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private async callOpenAIAPI(prompt: string, systemPrompt: string | undefined, config: APIConfig): Promise<string> {
    console.log(`Calling OpenAI API with model: ${config.model}`);
    
    // omni 모델 여부 확인 (o1-mini, o1-preview 등)
    const isOmniModel = config.model.startsWith('o');
    
    const messages: any[] = [];
    
    if (systemPrompt && !isOmniModel) {
      // omni 모델은 system 메시지를 지원하지 않음
      messages.push({
        role: "system",
        content: systemPrompt
      });
    }
    
    messages.push({
      role: "user",
      content: isOmniModel && systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
    });
    
    const requestBody: any = {
      model: config.model,
      messages: messages
    };
    
    // 모델에 따른 파라미터 설정
    if (isOmniModel) {
      // omni 모델은 max_completion_tokens 사용, temperature는 기본값(1)만 지원
      requestBody.max_completion_tokens = config.maxTokens;
      // temperature는 설정하지 않음 (기본값 1 사용)
    } else {
      // 기존 GPT 모델은 max_tokens와 temperature 사용
      requestBody.max_tokens = config.maxTokens;
      requestBody.temperature = config.temperature;
    }
    
    console.log(`Using model: ${config.model}, isOmniModel: ${isOmniModel}`);

    const response = await fetch(`${config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API 오류 (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenAI API로부터 유효한 응답을 받지 못했습니다.');
    }

    return data.choices[0].message.content.trim();
  }

  private async callAnthropicAPI(prompt: string, systemPrompt: string | undefined, config: APIConfig): Promise<string> {
    console.log(`Calling Anthropic API with model: ${config.model}`);
    
    const userContent = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    
    const requestBody = {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [
        {
          role: "user",
          content: userContent
        }
      ]
    };

    const response = await fetch(`${config.endpoint}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API 오류 (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.content || data.content.length === 0) {
      throw new Error('Anthropic API로부터 유효한 응답을 받지 못했습니다.');
    }

    return data.content[0].text.trim();
  }
}
