import React, { useState, useEffect, useCallback } from 'react';
import { FileText, AlertCircle, CheckCircle, Loader2, Copy, Download, ZoomIn, ZoomOut, RotateCcw, Zap, Clock, Edit, KeyRound } from 'lucide-react';

// A biblioteca jsdiff será carregada dinamicamente via CDN
// (The jsdiff library will be dynamically loaded via CDN)

const App = () => {
  const [originalText, setOriginalText] = useState('');
  const [currentDiffTargetText, setCurrentDiffTargetText] = useState('');
  const [isTranscription, setIsTranscription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copySuccessMessage, setCopySuccessMessage] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [diffResultForDisplay, setDiffResultForDisplay] = useState([]);
  const [fontSize, setFontSize] = useState(1);

  // Estado para API Key do Usuário
  // (State for User's API Key)
  const [userApiKeyInput, setUserApiKeyInput] = useState('');
  const [activeUserApiKey, setActiveUserApiKey] = useState('');
  const [apiKeyMessage, setApiKeyMessage] = useState('');

  const [scriptLoadStatus, setScriptLoadStatus] = useState({
    'jsdiff-script': 'pending',
  });

  // Métricas de Performance da Revisão
  // (Review Performance Metrics)
  const [reviewTime, setReviewTime] = useState(null); // em segundos (in seconds)
  const [numAdditions, setNumAdditions] = useState(0);
  const [numDeletions, setNumDeletions] = useState(0);

  // Efeito para carregar API Key do localStorage ao iniciar
  // (Effect to load API Key from localStorage on start)
  useEffect(() => {
    const storedApiKey = localStorage.getItem('userGeminiApiKey');
    if (storedApiKey) {
      setActiveUserApiKey(storedApiKey);
      setApiKeyMessage('Chave API carregada do armazenamento local.');
      // (API Key loaded from local storage.)
    } else {
      setApiKeyMessage('Por favor, insira sua API Key do Google Gemini para começar.');
      // (Please enter your Google Gemini API Key to start.)
    }
  }, []);

  // Funções para gerenciar API Key
  // (Functions to manage API Key)
  const handleSaveApiKey = () => {
    if (userApiKeyInput.trim()) {
      localStorage.setItem('userGeminiApiKey', userApiKeyInput.trim());
      setActiveUserApiKey(userApiKeyInput.trim());
      setApiKeyMessage('Chave API salva com sucesso!');
      // (API Key saved successfully!)
      setUserApiKeyInput('');
    } else {
      setApiKeyMessage('O campo da API Key não pode estar vazio para salvar.');
      // (The API Key field cannot be empty to save.)
    }
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('userGeminiApiKey');
    setActiveUserApiKey('');
    setApiKeyMessage('Chave API removida. Por favor, insira uma nova chave para usar o revisor.');
    // (API Key removed. Please enter a new key to use the reviewer.)
    setError(''); // Limpa erros anteriores que podem ser relacionados à chave (Clears previous errors that might be related to the key)
  };

  useEffect(() => {
    const loadScript = (src, id, checkGlobal, onLoadCallback, onErrorCallback) => {
      if (document.getElementById(id) && scriptLoadStatus[id] !== 'pending' && scriptLoadStatus[id] !== 'loading') {
        if (scriptLoadStatus[id] === 'loaded' && onLoadCallback) onLoadCallback();
        else if (scriptLoadStatus[id] === 'failed' && onErrorCallback) onErrorCallback();
        return;
      }
      setScriptLoadStatus(prev => ({ ...prev, [id]: 'loading' }));
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.onload = () => {
        console.log(`${id} SCRIPT tag loaded.`);
        if (checkGlobal && typeof window[checkGlobal] === 'undefined') {
          setTimeout(() => {
            if (checkGlobal && typeof window[checkGlobal] === 'undefined') {
              console.error(`${id} loaded, but global '${checkGlobal}' not found.`);
              setScriptLoadStatus(prev => ({ ...prev, [id]: 'failed' }));
              if (onErrorCallback) onErrorCallback();
            } else {
              setScriptLoadStatus(prev => ({ ...prev, [id]: 'loaded' }));
              if (onLoadCallback) onLoadCallback();
            }
          }, 200);
        } else {
          setScriptLoadStatus(prev => ({ ...prev, [id]: 'loaded' }));
          if (onLoadCallback) onLoadCallback();
        }
      };
      script.onerror = () => {
        console.error(`Failed to load ${id} from ${src}.`);
        setScriptLoadStatus(prev => ({ ...prev, [id]: 'failed' }));
        if (onErrorCallback) onErrorCallback();  
      };
      const existingScript = document.getElementById(id);
      if (existingScript) existingScript.remove();
      document.body.appendChild(script);
    };

    loadScript(
      'https://cdn.jsdelivr.net/npm/diff@5.1.0/dist/diff.min.js',
      'jsdiff-script',
      'Diff',
      () => console.log('jsdiff-script onLoadCallback executed.'),
      () => console.error('jsdiff-script onErrorCallback executed.')
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (scriptLoadStatus['jsdiff-script'] === 'loaded' &&
        typeof Diff !== 'undefined' && // eslint-disable-line no-undef
        typeof Diff.diffChars === 'function') { // eslint-disable-line no-undef
      if (originalText || currentDiffTargetText) {
        try {
          const diffs = Diff.diffChars(originalText, currentDiffTargetText); // eslint-disable-line no-undef
          setDiffResultForDisplay(diffs);
          
          let additions = 0;
          let deletions = 0;
          diffs.forEach(part => {
            if (part.added) {
              additions += part.count;
            } else if (part.removed) {
              deletions += part.count;
            }
          });
          setNumAdditions(additions);
          setNumDeletions(deletions);

        } catch (e) {
          console.error("Error using Diff.diffChars:", e);
          setDiffResultForDisplay([]);
          setNumAdditions(0);
          setNumDeletions(0);
        }
      } else {
        setDiffResultForDisplay([]);
        setNumAdditions(0);
        setNumDeletions(0);
      }
    } else if (scriptLoadStatus['jsdiff-script'] === 'failed') {
        setDiffResultForDisplay([]);
        setNumAdditions(0);
        setNumDeletions(0);
        console.warn("jsDiff library failed to load, diff functionality disabled.");
    }
  }, [originalText, currentDiffTargetText, scriptLoadStatus]);


  const resetReviewState = () => {
    if (error) setError('');
    if (copySuccessMessage) setCopySuccessMessage('');
    setShowComparison(false);
    setCurrentDiffTargetText('');
    setReviewTime(null);
    setNumAdditions(0);
    setNumDeletions(0);
  }

  const handleTextChange = (e) => {
    setOriginalText(e.target.value);
    resetReviewState();
  };

  const generatePromptForRevision = useCallback((textToRevise) => {
    let styleGuidance = "Mantenha a formalidade típica de textos legislativos e administrativos.";
    // (Maintain the typical formality of legislative and administrative texts.)
    if (isTranscription) {
      styleGuidance = "PRESERVE AO MÁXIMO a originalidade da fala, pois este texto é uma transcrição de discurso. Mantenha hesitações comuns (como 'ééé', 'ããã'), marcadores conversacionais (como 'né?', 'tá?', 'então') e o léxico do orador, corrigindo apenas erros gramaticais e ortográficos claros que comprometam a compreensão formal e a norma culta. Não suavize a linguagem falada para uma escrita excessivamente formal, a menos que seja um erro gramatical claro.";
      // (PRESERVE AS MUCH AS POSSIBLE the originality of the speech, as this text is a transcription of a discourse. Maintain common hesitations (like 'uhh', 'umm'), conversational markers (like 'right?', 'okay?', 'so') and the speaker's lexicon, correcting only clear grammatical and spelling errors that compromise formal understanding and the educated norm. Do not smooth spoken language into excessively formal writing, unless it is a clear grammatical error.)
    }

    return `
Você é um revisor de textos altamente competente e meticuloso, especialista em língua portuguesa do Brasil, com foco em documentos legislativos e textos para câmaras municipais, prefeituras, e assembleias legislativas.
Sua tarefa é revisar o seguinte texto de forma exaustiva, atentando a todos os detalhes.

**Critérios de Revisão Mandatórios:**

1.  **Revisão Gramatical e Ortográfica Rigorosa e Completa (Norma Culta Legislativa):**
    * Corrija todos os erros de ortografia (incluindo o Novo Acordo Ortográfico), pontuação (vírgulas, pontos, crases, etc.) e acentuação.
    * Ajuste a concordância verbal e nominal para garantir a correção absoluta.
    * Verifique e corrija minuciosamente a regência verbal e nominal, conforme o uso formal em textos legais.
    * Corrija a colocação pronominal (próclise, mesóclise, ênclise) conforme a norma culta e o estilo formal de documentos legislativos.
    * Aplique estritamente a norma culta da língua portuguesa em todos os aspetos, com atenção ao vocabulário e jargão técnico-jurídico, se presente e adequado.

2.  **Revisão de Estilo (Foco em Clareza, Precisão e Formalidade Legislativa – MÍNIMA intervenção no conteúdo):**
    * Melhore a fluidez do texto SEM ALTERAR o conteúdo, o significado original ou a intenção do autor.
    * Torne o texto mais claro, preciso, coeso e coerente através de ajustes sutis.
    * ${styleGuidance}
    * Evite alterar a estrutura das frases drasticamente, a menos que seja absolutamente essencial para a clareza ou correção gramatical.
    * Não adicione novas informações nem remova informações existentes. Apenas corrija e refine o que foi fornecido.
    * Se houver trechos ambíguos, tente torná-los mais precisos sem alterar o significado, mantendo a objetividade.
    * Substitua palavras ou expressões coloquiais inadequadas por termos formais equivalentes, exceto se for uma transcrição de discurso e a coloquialidade for característica da fala (nesse caso, manter, a menos que seja um erro gramatical).

3.  **Manutenção da Formatação Estrutural Original (Parágrafos e Quebras de Linha):**
    * **CRÍTICO:** Preserve a estrutura de parágrafos e as quebras de linha (caracteres '\\n') do texto original com a maior fidelidade possível.
    * **NÃO ALTERE** a divisão de parágrafos (não junte parágrafos que estavam separados, nem separe parágrafos que estavam juntos), a menos que seja uma correção gramatical absolutamente óbvia e inquestionável (ex: um diálogo mal formatado que precise de novas linhas para cada fala) ou se a ausência de uma quebra de parágrafo crie uma ambiguidade gramatical severa.
    * **MANTENHA** as quebras de linha intencionais dentro dos parágrafos (quebras de linha simples), a menos que prejudiquem claramente a leitura ou criem erros gramaticais.
    * O objetivo é que o texto revisado mantenha uma estrutura de parágrafos e linhas visualmente IDÊNTICA ou O MAIS PRÓXIMA POSSÍVEL à do original, alterando apenas o conteúdo textual para correções e melhorias de estilo mínimas. Evite reformatar blocos de texto.

**Formato da Resposta:**
Retorne APENAS o texto revisado. Não inclua NENHUM comentário, introdução, observação, cabeçalho ou rodapé antes ou depois do texto revisado.

**Texto Original para Revisão:**
---
${textToRevise}
---
`;
  }, [isTranscription]);
  
  const fetchRevisedTextFromAPI = useCallback(async () => {
    if (!originalText.trim()) {
      setError("O texto original não pode estar vazio."); return;
      // (The original text cannot be empty.)
    }
    if (!activeUserApiKey) {
      setError("API Key não configurada. Por favor, insira sua API Key do Google Gemini na seção de configurações.");
      // (API Key not configured. Please enter your Google Gemini API Key in the settings section.)
      setApiKeyMessage("API Key necessária para a revisão. Configure-a acima.");
      // (API Key required for review. Configure it above.)
      return;
    }

    setIsLoading(true); setError(''); setSuccessMessage(''); setShowComparison(false);
    if (copySuccessMessage) setCopySuccessMessage('');
    setReviewTime(null); setNumAdditions(0); setNumDeletions(0);

    const startTime = performance.now();

    const prompt = generatePromptForRevision(originalText);
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeUserApiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      
      const endTime = performance.now();
      setReviewTime( ((endTime - startTime) / 1000).toFixed(2) );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } })); 
        let specificError = `Erro da API: ${errorData?.error?.message || response.statusText}`;
        // (API Error:)
        if (response.status === 400 && errorData?.error?.message?.toLowerCase().includes('api key not valid')) {
          specificError = "A API Key fornecida é inválida. Verifique a chave e tente novamente. Se persistir, pode ser um problema com a chave ou faturamento na sua conta Google AI.";
          // (The provided API Key is invalid. Check the key and try again. If it persists, it might be an issue with the key or billing on your Google AI account.)
          setApiKeyMessage("A API Key parece ser inválida. Verifique-a.");
          // (The API Key seems to be invalid. Check it.)
        } else if (response.status === 429) {
          specificError = "Limite de requisições da sua API Key foi excedido. Tente novamente mais tarde.";
          // (Request limit for your API Key has been exceeded. Try again later.)
          setApiKeyMessage("Limite de requisições da API Key excedido.");
          // (API Key request limit exceeded.)
        } else if (response.status === 403) {
             specificError = "Permissão negada. Verifique se sua API Key tem as permissões corretas para o modelo Gemini ou se o faturamento está ativo em sua conta Google Cloud.";
             // (Permission denied. Check if your API Key has the correct permissions for the Gemini model or if billing is active on your Google Cloud account.)
             setApiKeyMessage("Permissão negada pela API. Verifique sua chave e conta Google AI.");
             // (Permission denied by API. Check your key and Google AI account.)
        }
        throw new Error(specificError);
      }
      const result = await response.json();
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const revisedByAI = result.candidates[0].content.parts[0].text;
        setCurrentDiffTargetText(revisedByAI);
        setSuccessMessage('Texto revisado pela IA com sucesso!');
        // (Text successfully revised by AI!)
        setShowComparison(true);
      } else {
        console.error("API Response Missing Text:", result);
        throw new Error("Resposta da API não contém texto revisado ou está em formato inesperado.");
        // (API response does not contain revised text or is in an unexpected format.)
      }
    } catch (err) {
      console.error("Fetch API Error:", err);
      setError(`Falha na revisão pela IA: ${err.message}`);
      // (AI review failed:)
      setCurrentDiffTargetText(originalText); 
    } finally {
      setIsLoading(false);
    }
  }, [originalText, generatePromptForRevision, copySuccessMessage, activeUserApiKey]);


  const handleCopyToClipboard = () => {
    if (!currentDiffTargetText) {
      setCopySuccessMessage('Nada para copiar.');
      // (Nothing to copy.)
      setTimeout(() => setCopySuccessMessage(''), 2000);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = currentDiffTargetText;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopySuccessMessage('Texto revisado copiado!');
      // (Revised text copied!)
    } catch (err) {
      setCopySuccessMessage('Falha ao copiar.');
      // (Failed to copy.)
      console.error('Falha ao copiar texto: ', err);
      // (Failed to copy text:)
    }
    document.body.removeChild(textarea);
    setTimeout(() => setCopySuccessMessage(''), 2000);
  };

  const handleDownloadTxt = () => {
    if (!currentDiffTargetText) return;
    const blob = new Blob([currentDiffTargetText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeOriginalTextPrefix = originalText.substring(0,20).replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const downloadFileName = (safeOriginalTextPrefix || 'texto') + '_revisado.txt';
    // ((safeOriginalTextPrefix || 'text') + '_revised.txt')
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const zoomIn = () => setFontSize(prev => Math.min(prev + 0.1, 2.5));
  const zoomOut = () => setFontSize(prev => Math.max(prev - 0.1, 0.7));
  const resetZoom = () => setFontSize(1);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 font-sans p-4 md:p-8 text-slate-800">
      <header className="mb-6 md:mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-sky-700 drop-shadow-sm">Revitlegis - Revisor de Textos Legislativos</h1>
        {/* (Revitlegis - Legislative Text Reviewer) */}
        <p className="text-slate-600 mt-2 text-lg">Ferramenta inteligente de auxílio à revisão textual.</p>
        {/* (Intelligent tool to assist with text review.) */}
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* Seção para Gerenciamento da API Key */}
        {/* (Section for API Key Management) */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-lg border border-sky-200">
          <div className="flex items-center mb-3">
            <KeyRound size={24} className="text-sky-600 mr-3" />
            <h2 className="text-xl font-semibold text-slate-700">Configuração da API Key do Google Gemini</h2>
            {/* (Google Gemini API Key Configuration) */}
          </div>
          <p className="text-sm text-slate-600 mb-1">
            Para usar o revisor, você precisa de uma API Key do Google Gemini.
            {/* (To use the reviewer, you need a Google Gemini API Key.) */}
            Obtenha a sua em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-medium">Google AI Studio</a>.
            {/* (Get yours at Google AI Studio.) */}
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Sua API Key é salva apenas localmente no seu navegador e não é compartilhada com nossos servidores.
            {/* (Your API Key is saved only locally in your browser and is not shared with our servers.) */}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
            <input
              type="password"
              id="userApiKey"
              value={userApiKeyInput}
              onChange={(e) => setUserApiKeyInput(e.target.value)}
              placeholder="Cole sua API Key aqui"
              // (Paste your API Key here)
              className="flex-grow p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
              aria-label="API Key do Google Gemini"
              // (Google Gemini API Key)
            />
            <button
              onClick={handleSaveApiKey}
              className="px-5 py-2.5 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 transition-colors shadow hover:shadow-md whitespace-nowrap"
            >
              Salvar Chave
              {/* (Save Key) */}
            </button>
            {activeUserApiKey && (
              <button
                onClick={handleRemoveApiKey}
                className="px-5 py-2.5 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors shadow hover:shadow-md whitespace-nowrap"
                title="Remover chave salva"
                // (Remove saved key)
              >
                Remover Chave
                {/* (Remove Key) */}
              </button>
            )}
          </div>
          {apiKeyMessage && (
            <p className={`text-sm mt-2 ${
                apiKeyMessage.includes('sucesso') ? 'text-green-700' : 
                (apiKeyMessage.includes('removida') || apiKeyMessage.includes('inválida') || apiKeyMessage.includes('necessária') || apiKeyMessage.includes('excedido') || apiKeyMessage.includes('negada')) ? 'text-red-700' : 
                'text-slate-600'
              } font-medium flex items-center`}
            >
                {apiKeyMessage.includes('sucesso') ? <CheckCircle size={16} className="mr-1.5"/> : 
                 (apiKeyMessage.includes('removida') || apiKeyMessage.includes('inválida') || apiKeyMessage.includes('necessária') || apiKeyMessage.includes('excedido') || apiKeyMessage.includes('negada')) ? <AlertCircle size={16} className="mr-1.5"/> : 
                 null}
              {apiKeyMessage}
            </p>
          )}
        </div>

        {scriptLoadStatus['jsdiff-script'] === 'failed' && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg shadow-md" role="alert">
            <span className="font-medium">Alerta de Carregamento:</span> Falha ao carregar a biblioteca jsDiff (comparação de texto). A funcionalidade de destacar diferenças pode estar indisponível. Verifique a sua ligação à Internet e tente recarregar a página.
            {/* (Loading Alert: Failed to load jsDiff library (text comparison). The feature to highlight differences may be unavailable. Check your internet connection and try reloading the page.) */}
            </div>
        )}
        
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl transition-all duration-300 ease-in-out hover:shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Coluna de Entrada */}
            {/* (Input Column) */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="originalText" className="block text-xl font-semibold text-slate-700">
                    1. Texto Original
                    {/* (1. Original Text) */}
                    </label>
                    <div className="flex items-center space-x-1">
                        <button onClick={zoomIn} title="Aumentar texto" className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md transition-colors"><ZoomIn size={20}/></button>
                        {/* (Increase text size) */}
                        <button onClick={zoomOut} title="Diminuir texto" className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md transition-colors"><ZoomOut size={20}/></button>
                        {/* (Decrease text size) */}
                        <button onClick={resetZoom} title="Restaurar tamanho" className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md transition-colors"><RotateCcw size={18}/></button>
                        {/* (Restore size) */}
                    </div>
                </div>
                <textarea
                  id="originalText" value={originalText} onChange={handleTextChange}
                  placeholder="Cole o seu texto aqui para revisão."
                  // (Paste your text here for review.)
                  className="w-full h-96 p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow resize-y text-base"
                  style={{ fontSize: `${fontSize}rem`, lineHeight: `${fontSize * 1.6}rem` }}
                  aria-label="Texto Original"
                  // (Original Text)
                />
                <p className="text-sm text-slate-500 mt-1">Caracteres: {originalText.length}</p>
                {/* (Characters:) */}
              </div>
              
              <div className="flex items-center pt-2">
                <input type="checkbox" id="isTranscription" checked={isTranscription} onChange={(e) => setIsTranscription(e.target.checked)}
                  className="h-4 w-4 text-sky-600 border-slate-400 rounded focus:ring-sky-500 focus:ring-offset-1"
                />
                <label htmlFor="isTranscription" className="ml-2 block text-sm text-slate-700">Este texto é uma transcrição de discurso?</label>
                {/* (Is this text a speech transcription?) */}
              </div>
              <button onClick={fetchRevisedTextFromAPI} 
                disabled={isLoading || !originalText.trim() || !activeUserApiKey} 
                className="w-full flex items-center justify-center px-6 py-3.5 bg-sky-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:shadow-lg transform hover:scale-105"
              >
                {isLoading ? <><Loader2 className="animate-spin mr-2 h-6 w-6" />Processando...</> : "2. Revisar Texto com IA"}
                {/* (Processing... | 2. Review Text with AI) */}
              </button>
              {!activeUserApiKey && !isLoading && (
                 <div className="mt-4 p-3 bg-amber-100 border border-amber-300 text-amber-700 rounded-lg flex items-start animate-fadeIn">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"/> 
                    <p className="text-sm">Uma API Key do Google Gemini é necessária para a revisão. Por favor, configure-a na seção acima.</p>
                    {/* (A Google Gemini API Key is required for review. Please configure it in the section above.) */}
                </div>
              )}
              {error && ( 
                <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-start animate-fadeIn">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"/> <p className="text-sm">{error}</p>
                </div>
              )}
              {successMessage && !error && ( 
                <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-start animate-fadeIn">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"/> <p className="text-sm">{successMessage}</p>
                </div>
              )}
            </div>

            {/* Coluna de Saída/Comparação */}
            {/* (Output/Comparison Column) */}
             <div className="space-y-6">
              {(isLoading || showComparison) ? (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold text-slate-700">3. Texto Revisado</h2>
                        {/* (3. Revised Text) */}
                        <div className="flex items-center space-x-1">
                            <button onClick={zoomIn} title="Aumentar texto" className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md transition-colors"><ZoomIn size={20}/></button>
                            <button onClick={zoomOut} title="Diminuir texto" className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md transition-colors"><ZoomOut size={20}/></button>
                            <button onClick={resetZoom} title="Restaurar tamanho" className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md transition-colors"><RotateCcw size={18}/></button>
                        </div>
                    </div>
                     <div className="flex justify-end items-center mb-2 space-x-2">
                        <button 
                            onClick={handleCopyToClipboard} 
                            title="Copiar texto revisado"
                            // (Copy revised text)
                            className="p-2 text-sky-600 hover:text-sky-800 hover:bg-sky-100 rounded-md transition-colors flex items-center text-sm"
                            disabled={!currentDiffTargetText}
                        >
                            <Copy className="h-5 w-5 mr-1.5"/> Copiar
                            {/* (Copy) */}
                        </button>
                        <button 
                            onClick={handleDownloadTxt} 
                            title="Baixar como .txt"
                            // (Download as .txt)
                            className="p-2 text-sky-600 hover:text-sky-800 hover:bg-sky-100 rounded-md transition-colors flex items-center text-sm"
                            disabled={!currentDiffTargetText}
                        >
                            <Download className="h-5 w-5 mr-1.5"/> .txt
                        </button>
                      </div>
                    {copySuccessMessage && <p className="text-sm text-green-600 mb-2 animate-fadeIn text-right">{copySuccessMessage}</p>}
                    
                    <div 
                        className="w-full h-96 p-4 border border-slate-300 rounded-lg bg-slate-50 overflow-y-auto prose prose-sm max-w-none shadow-sm text-base custom-scrollbar"
                        style={{ fontSize: `${fontSize}rem`, lineHeight: `${fontSize * 1.6}rem` }}
                        aria-live="polite"
                    >
                      {isLoading && !showComparison && <div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 text-sky-600 animate-spin" /></div>}
                      {scriptLoadStatus['jsdiff-script'] === 'loaded' && Array.isArray(diffResultForDisplay) && diffResultForDisplay.length > 0 ? (
                        diffResultForDisplay.map((part, index) => {
                          const style = {
                            backgroundColor: part.added ? 'rgba(187, 247, 208, 0.7)' : part.removed ? 'rgba(254, 202, 202, 0.7)' : 'transparent', 
                            textDecoration: part.removed ? 'line-through' : 'none',
                            color: part.removed ? 'rgb(120, 120, 120)' : 'inherit', 
                            padding: '0.5px 0',
                            borderRadius: '2px'
                          };
                          if (typeof part.value !== 'string') {
                            console.error('Error: part.value is not a string!', part);
                            return <span key={`diff-error-${index}`} style={{color: 'red'}}>!ERRO DE DADOS INTERNO!</span>; 
                            // (!INTERNAL DATA ERROR!)
                          }
                          return <span key={`diff-${index}`} style={style} className="whitespace-pre-wrap">{part.value}</span>;
                        })
                      ) : !isLoading && showComparison && scriptLoadStatus['jsdiff-script'] === 'loaded' && (!diffResultForDisplay || diffResultForDisplay.length === 0) && <p className="text-slate-500 p-4 text-center">O texto revisado está vazio ou idêntico ao original.</p>}
                      {/* (The revised text is empty or identical to the original.) */}
                      {!isLoading && scriptLoadStatus['jsdiff-script'] !== 'loaded' && <p className="text-red-500 p-4 text-center">Falha ao carregar a funcionalidade de comparação de texto.</p>}
                      {/* (Failed to load text comparison functionality.) */}
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-slate-500">
                        <span>Caracteres: {currentDiffTargetText.length}</span>
                        {/* (Characters:) */}
                        {showComparison && scriptLoadStatus['jsdiff-script'] === 'loaded' && (
                            <span className="flex items-center">
                                <Edit size={14} className="mr-1 text-blue-500"/> Alterações (caracteres): 
                                {/* (Changes (characters):) */}
                                <span className="text-green-600 ml-1">+{numAdditions}</span>
                                <span className="text-red-600 ml-1">-{numDeletions}</span>
                            </span>
                        )}
                    </div>
                     {reviewTime && showComparison && (
                        <div className="mt-2 text-sm text-slate-500 flex items-center">
                           <Clock size={14} className="mr-1 text-sky-600"/> Tempo de revisão IA: {reviewTime}s
                           {/* (AI review time:) */}
                        </div>
                    )}
                  </div>
                </>
              ) : (
                 <div className="w-full h-96 p-3 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-center">
                    <FileText className="h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">Aguardando Texto para Revisão</h3>
                    {/* (Waiting for Text to Review) */}
                    <p className="text-sm text-slate-500 mt-1">
                        {activeUserApiKey 
                            ? "Cole o seu texto e clique em \"Revisar Texto com IA\"."
                            // (Paste your text and click "Review Text with AI".)
                            : "Configure sua API Key na seção acima para habilitar a revisão."}
                            // (Configure your API Key in the section above to enable review.)
                    </p>
                 </div>
              )}
            </div>


          </div>

          {showComparison && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-700 mb-4">Comparação Detalhada</h2>
              {/* (Detailed Comparison) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">Texto Original</h3>
                      {/* (Original Text) */}
                      <div 
                          className="w-full h-96 p-4 border border-slate-300 rounded-lg bg-white overflow-y-auto prose prose-sm max-w-none shadow-sm text-base custom-scrollbar"
                          style={{ fontSize: `${fontSize}rem`, lineHeight: `${fontSize * 1.6}rem` }} 
                      >
                          <pre className="whitespace-pre-wrap break-words">{originalText || "Nenhum texto original."}</pre>
                          {/* (No original text.) */}
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-slate-600">Texto Revisado Atual</h3>
                          {/* (Current Revised Text) */}
                          <button 
                              onClick={handleCopyToClipboard} 
                              title="Copiar este texto revisado"
                              // (Copy this revised text)
                              className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-100 rounded-md transition-colors flex items-center text-xs"
                              disabled={!currentDiffTargetText}
                          >
                              <Copy className="h-4 w-4 mr-1"/> Copiar
                              {/* (Copy) */}
                          </button>
                      </div>
                      <div 
                          className="w-full h-96 p-4 border border-slate-300 rounded-lg bg-white overflow-y-auto prose prose-sm max-w-none shadow-sm text-base custom-scrollbar"
                          style={{ fontSize: `${fontSize}rem`, lineHeight: `${fontSize * 1.6}rem` }} 
                      >
                         <pre className="whitespace-pre-wrap break-words">{currentDiffTargetText || "Nenhum texto revisado."}</pre>
                         {/* (No revised text.) */}
                      </div>
                  </div>
              </div>
            </div>
          )}
        </div> 
      </main>

      <footer className="mt-16 mb-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Revitlegis - Revisor de Textos Legislativos. Todos os direitos reservados.</p>
        {/* (Revitlegis - Legislative Text Reviewer. All rights reserved.) */}
        <p className="mt-1">Lembre-se: esta é uma ferramenta de auxílio e a revisão humana final é sempre recomendada.</p>
        {/* (Remember: this is an assistive tool and final human review is always recommended.) */}
        <p className="mt-1">Esta ferramenta usa a API Google Gemini. Ao usar sua API Key, você concorda com os termos de serviço da Google.</p>
        {/* (This tool uses the Google Gemini API. By using your API Key, you agree to Google's terms of service.) */}
      </footer>
      <style jsx global>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #94a3b8; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b; 
        }
        textarea, .prose, pre { 
            line-height: 1.6; 
        }
      `}</style>
    </div>
  );
};

export default App;
