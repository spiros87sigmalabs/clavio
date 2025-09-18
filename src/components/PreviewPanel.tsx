import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, RotateCcw, ExternalLink } from 'lucide-react';
interface PreviewPanelProps {
  htmlCode: string;
  isGenerating: boolean;
}
type ViewportSize = 'desktop' | 'tablet' | 'mobile';
const PreviewPanel = ({
  htmlCode,
  isGenerating
}: PreviewPanelProps) => {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const viewportSizes = {
    desktop: {
      width: '100%',
      height: '100%',
      icon: Monitor,
      label: 'Desktop'
    },
    tablet: {
      width: '768px',
      height: '100%',
      icon: Tablet,
      label: 'Tablet'
    },
    mobile: {
      width: '375px',
      height: '100%',
      icon: Smartphone,
      label: 'Mobile'
    }
  };
  useEffect(() => {
    if (!htmlCode || !iframeRef.current) return;
    setIsLoading(true);
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      // Enhanced HTML template with Tailwind CSS
      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated Landing Page</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#eff6ff',
                            500: '#3b82f6',
                            600: '#2563eb',
                            900: '#1e3a8a'
                        }
                    }
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
${htmlCode}
</body>
</html>`;
      doc.open();
      doc.write(fullHtml);
      doc.close();
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [htmlCode]);
  const refreshPreview = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
      setTimeout(() => setIsLoading(false), 300);
    }
  };
  const openInNewTab = () => {
    if (!htmlCode) return;
    const newWindow = window.open();
    if (newWindow) {
      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated Landing Page</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; }
    </style>
</head>
<body>
${htmlCode}
</body>
</html>`;
      newWindow.document.write(fullHtml);
      newWindow.document.close();
    }
  };
  return <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Object.entries(viewportSizes).map(([size, config]) => {
              const Icon = config.icon;
              const isActive = viewportSize === size;
              return <Button key={size} variant={isActive ? "default" : "ghost"} size="sm" onClick={() => setViewportSize(size as ViewportSize)} className={`h-7 px-2 text-xs transition-smooth ${isActive ? 'bg-primary text-primary-foreground shadow-glow' : 'hover:bg-muted'}`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Button>;
            })}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            
            <Button variant="ghost" size="sm" onClick={openInNewTab} className="h-7 px-2 text-xs hover:bg-muted transition-smooth" disabled={!htmlCode}>
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 border-b border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>Live Preview</span>
          <div className="flex items-center gap-3">
            {(isGenerating || isLoading) && <span className="flex items-center gap-1 text-primary">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                {isGenerating ? 'Building...' : 'Loading...'}
              </span>}
            <span>{viewportSizes[viewportSize].label}</span>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 bg-preview-background p-4 overflow-hidden">
        <div className="mx-auto transition-all duration-300 ease-out shadow-elevation" style={{
        width: viewportSizes[viewportSize].width,
        height: viewportSizes[viewportSize].height,
        maxWidth: '100%'
      }}>
          <div className="relative w-full h-full bg-white rounded-lg overflow-hidden border border-preview-border">
            {/* Loading Overlay */}
            {(isGenerating || isLoading) && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground">
                    {isGenerating ? 'Generating your page...' : 'Loading preview...'}
                  </p>
                </div>
              </div>}
            
            {/* Empty State */}
            {!htmlCode && !isGenerating && <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-2">Preview Panel</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Start a conversation to see your landing page come to life here.
                  </p>
                </div>
              </div>}
            
            {/* Iframe Preview */}
            {htmlCode && <iframe ref={iframeRef} className="w-full h-full border-0" title="Landing Page Preview" sandbox="allow-scripts allow-same-origin" />}
          </div>
        </div>
      </div>
    </div>;
};
export default PreviewPanel;