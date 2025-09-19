import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, ExternalLink, Edit3, X, Send } from 'lucide-react';

interface PreviewPanelProps {
  htmlCode: string;
  isGenerating: boolean;
  onEditSelection?: (htmlSnippet: string, content: string, userChange: string) => void;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

interface SelectedElement {
  htmlSnippet: string;
  tag: string;
  classes: string;
  content: string;
}

const PreviewPanel = ({ htmlCode, isGenerating, onEditSelection }: PreviewPanelProps) => {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [editValue, setEditValue] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const viewportSizes = {
    desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' },
    tablet: { width: '768px', height: '100%', icon: Tablet, label: 'Tablet' },
    mobile: { width: '375px', height: '100%', icon: Smartphone, label: 'Mobile' },
  };

  // Load iframe content
  useEffect(() => {
    if (!iframeRef.current || !htmlCode) return;
    setIsLoading(true);
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Generated Landing Page</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { font-family: 'Inter', system-ui, sans-serif; }
  .highlight-edit { outline: 2px solid #3b82f6; cursor: pointer; }
</style>
</head>
<body>
${htmlCode}
<script>
  window.editMode = false;

  document.addEventListener('mouseover', e => {
    if (!window.editMode) return;
    if(e.target && e.target !== document.body) e.target.classList.add('highlight-edit');
  });

  document.addEventListener('mouseout', e => {
    if (!window.editMode) return;
    if(e.target && e.target !== document.body) e.target.classList.remove('highlight-edit');
  });

  document.addEventListener('click', e => {
    if (!window.editMode) return;
    e.preventDefault(); e.stopPropagation();
    const target = e.target;
    if (!target || target === document.body) return;

    window.parent.postMessage({
      type: 'element-selected',
      htmlSnippet: target.outerHTML,
      tag: target.tagName.toLowerCase(),
      classes: target.className,
      content: target.innerText
    }, '*');
  });

  window.addEventListener('message', e => {
    if(e.data?.type === 'toggle-edit') window.editMode = e.data.enabled;
  });
</script>
</body>
</html>
`;

    doc.open();
    doc.write(fullHtml);
    doc.close();
    setTimeout(() => setIsLoading(false), 300);
  }, [htmlCode]);

  // Toggle edit mode
  useEffect(() => {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow?.postMessage({ type: 'toggle-edit', enabled: isEditMode }, '*');
  }, [isEditMode]);

  // Handle selected element
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'element-selected') {
        const sel: SelectedElement = {
          htmlSnippet: event.data.htmlSnippet,
          tag: event.data.tag,
          classes: event.data.classes,
          content: event.data.content,
        };
        setSelected(sel);
        setEditValue(''); // reset user input
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendToAI = () => {
    if (!selected || !onEditSelection) return;
    onEditSelection(selected.htmlSnippet, selected.content, editValue);
    setSelected(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setSelected(null);
    setEditValue('');
  };

  const openInNewTab = () => {
    if (!htmlCode) return;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(htmlCode);
      newWindow.document.close();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border bg-card flex justify-between items-center">
        <div className="flex gap-2">
          {Object.entries(viewportSizes).map(([size, config]) => {
            const Icon = config.icon;
            const isActive = viewportSize === size;
            return (
              <Button key={size} variant={isActive ? 'default' : 'ghost'} size="sm"
                onClick={() => setViewportSize(size as ViewportSize)}
                className={`h-7 px-2 text-xs transition-smooth ${isActive ? 'bg-primary text-primary-foreground shadow-glow' : 'hover:bg-muted'}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Button>
            );
          })}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setIsEditMode(!isEditMode)}
            className={`h-7 px-2 text-xs transition-smooth ${isEditMode ? 'bg-blue-500 text-white' : 'hover:bg-muted'}`}>
            <Edit3 className="w-3 h-3 mr-1" /> {isEditMode ? 'Editing' : 'Edit'}
          </Button>
          <Button variant="ghost" size="sm" onClick={openInNewTab} className="h-7 px-2 text-xs hover:bg-muted" disabled={!htmlCode}>
            <ExternalLink className="w-3 h-3 mr-1" /> Open
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 border-b border-border bg-muted/30 text-xs text-muted-foreground flex justify-between">
        <span>Live Preview</span>
        <span>{viewportSizes[viewportSize].label}</span>
      </div>

      {/* Preview */}
      <div className="flex-1 bg-preview-background p-4 overflow-hidden relative">
        <div className="mx-auto transition-all duration-300 ease-out shadow-elevation"
          style={{ width: viewportSizes[viewportSize].width, height: viewportSizes[viewportSize].height, maxWidth: '100%' }}>
          <div className="relative w-full h-full bg-white rounded-lg overflow-hidden border border-preview-border">
            {(isGenerating || isLoading) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground">
                    {isGenerating ? 'Generating your page...' : 'Loading preview...'}
                  </p>
                </div>
              </div>
            )}
            {!htmlCode && !isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
                <Monitor className="w-12 h-12 mx-auto mb-3" />
                <h3 className="font-medium mb-2">Preview Panel</h3>
                <p className="text-sm max-w-xs">Start a conversation to see your landing page come to life here.</p>
              </div>
            )}
            {htmlCode && <iframe ref={iframeRef} className="w-full h-full border-0" title="Landing Page Preview" sandbox="allow-scripts allow-same-origin" />}
          </div>
        </div>

        {/* Edit Panel */}
        {selected && (
          <div className="absolute top-4 right-4 bg-white border border-blue-500 p-3 rounded shadow-md w-80 z-20">
            <h4 className="font-semibold mb-2 text-sm flex items-center justify-between">
              Edit Element <X className="w-4 h-4 cursor-pointer" onClick={cancelEdit} />
            </h4>
            <p className="text-xs text-gray-500 mb-1">
              Selected Element: <b>{selected.tag}{selected.classes && `.${selected.classes.split(' ').join('.')}`}</b>
            </p>
            <p className="text-xs text-gray-500 mb-2">Content: "{selected.content}"</p>
            <textarea
              className="w-full border border-gray-300 rounded p-1 text-sm mb-2 bg-black text-white placeholder-gray-400"
              rows={3}
              placeholder="Describe your changes..."
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
            />
            <Button size="sm" onClick={sendToAI} className="w-full flex items-center justify-center gap-1">
              <Send className="w-3 h-3" /> Send to AI
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
