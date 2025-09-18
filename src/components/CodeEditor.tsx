import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Play, Pause, FileText, Globe, Edit, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeEditorProps {
  code: string;
  isGenerating: boolean;
  onCodeChange: (code: string) => void;
  onToggleGeneration: () => void;
}

interface PublishedProject {
  id: string;
  name: string;
  url: string;
}

const CodeEditor = ({ code, isGenerating, onCodeChange, onToggleGeneration }: CodeEditorProps) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [projectName, setProjectName] = useState("My Awesome Project");
  const [publishedProject, setPublishedProject] = useState<PublishedProject | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const { toast } = useToast();

  // Χρήση σχετικού URL για Netlify function
  const NETLIFY_FUNCTION_URL = "/.netlify/functions/publish-project";

  const handleEditorDidMount = (editor: any, monaco: any) => {
    monaco.editor.defineTheme("ai-builder-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A737D", fontStyle: "italic" },
        { token: "string", foreground: "9ECBFF" },
        { token: "keyword", foreground: "FF7B72" },
        { token: "number", foreground: "79C0FF" },
        { token: "tag", foreground: "7EE787" },
        { token: "attribute.name", foreground: "FFA657" },
        { token: "attribute.value", foreground: "9ECBFF" },
      ],
      colors: {
        "editor.background": "#141414",
        "editor.foreground": "#F0F6FC",
        "editor.lineHighlightBackground": "#161B22",
        "editor.selectionBackground": "#0969DA33",
        "editorLineNumber.foreground": "#656D76",
        "editorLineNumber.activeForeground": "#F0F6FC",
        "editor.selectionHighlightBackground": "#0969DA22",
        "editorBracketMatch.background": "#0969DA33",
        "editorBracketMatch.border": "#0969DA",
      },
    });

    monaco.editor.setTheme("ai-builder-dark");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Αντιγράφτηκε!", description: "Το περιεχόμενο αντιγράφτηκε στο clipboard." });
    } catch {
      toast({ title: "Αποτυχία αντιγραφής", description: "Δεν ήταν δυνατή η αντιγραφή του περιεχομένου.", variant: "destructive" });
    }
  };

  const publishToNetlify = async (name: string) => {
    if (!code.trim()) return;

    try {
      setIsPublishing(true);
      setPublishError(null);

      console.log("Publishing to:", NETLIFY_FUNCTION_URL);
      console.log("Payload:", { html_content: code.substring(0, 100) + "...", project_name: name });

      const response = await fetch(NETLIFY_FUNCTION_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          html_content: code,
          project_name: name,
          project_id: publishedProject?.id,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      // Ανάγνωση του response ως text πρώτα για debugging
      const responseText = await response.text();
      console.log("Response text:", responseText);

      // Έλεγχος αν το response είναι JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${data.message || "Unknown error"}`);
      }

      // Success!
      setPublishedProject({ 
        id: data.id, 
        name: data.project_name, 
        url: data.public_url 
      });

      toast({
        title: data.action === "updated" ? "Ενημερώθηκε!" : "Δημοσιεύτηκε!",
        description: (
          <div className="flex flex-col gap-1">
            <span>{data.message}</span>
            <a 
              href={data.public_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline text-primary hover:text-primary/80"
            >
              Προβολή Project →
            </a>
          </div>
        ),
      });

      // Copy URL to clipboard
      try {
        await navigator.clipboard.writeText(data.public_url);
        console.log("URL copied to clipboard:", data.public_url);
      } catch (clipboardError) {
        console.warn("Could not copy URL to clipboard:", clipboardError);
      }

      setShowPublishDialog(false);

    } catch (err: any) {
      console.error("Publish error:", err);
      const errorMessage = err.message || "Απροσδόκητο σφάλμα";
      setPublishError(errorMessage);
      
      toast({ 
        title: "Αποτυχία δημοσίευσης", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishClick = () => {
    setPublishError(null);
    setShowPublishDialog(true);
  };

  const handlePublishConfirm = () => {
    if (!projectName.trim()) {
      toast({ title: "Απαιτείται όνομα project", variant: "destructive" });
      return;
    }
    publishToNetlify(projectName.trim());
  };

  const lineCount = code.split("\n").length;

  return (
    <div className="flex flex-col h-full bg-editor-background border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border bg-editor-sidebar flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{publishedProject?.name || "index.html"}</span>
          {isGenerating && (
            <span className="text-xs text-primary ml-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Live
            </span>
          )}
          {publishedProject && (
            <span className="text-xs text-green-500 ml-2 flex items-center gap-1">
              <Globe className="w-3 h-3 text-green-500" />
              Δημοσιεύτηκε
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code)}>
            <Copy className="w-3 h-3 mr-1" />
            Αντιγραφή
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleGeneration}>
            {isGenerating ? (
              <>
                <Pause className="w-3 h-3 mr-1" />
                Παύση
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                Συνέχεια
              </>
            )}
          </Button>
          {publishedProject && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => copyToClipboard(publishedProject.url)} 
              className="text-green-500"
            >
              <Globe className="w-3 h-3 mr-1" />
              URL
            </Button>
          )}
          <Button 
            variant={isPublishing ? "secondary" : "ghost"} 
            size="sm" 
            onClick={handlePublishClick} 
            disabled={isPublishing || !code.trim()}
          >
            {publishedProject ? (
              <>
                <Edit className="w-3 h-3 mr-1" />
                {isPublishing ? "Ενημέρωση..." : "Ενημέρωση"}
              </>
            ) : (
              <>
                <Globe className="w-3 h-3 mr-1" />
                {isPublishing ? "Δημοσίευση..." : "Δημοσίευση"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Publish Dialog */}
      {showPublishDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {publishedProject ? "Ενημέρωση Project" : "Δημοσίευση Project"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPublishDialog(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {publishError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                  <div className="text-sm text-destructive">{publishError}</div>
                </div>
              </div>
            )}

            <Input 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)} 
              placeholder="Όνομα project..." 
              className="w-full mb-3" 
            />
            <div className="text-sm text-muted-foreground mb-4">
              <p>📋 Περιεχόμενο: {code.length} χαρακτήρες</p>
              <p>📄 Γραμμές: {lineCount}</p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPublishDialog(false)} 
                disabled={isPublishing}
              >
                Ακύρωση
              </Button>
              <Button 
                onClick={handlePublishConfirm} 
                disabled={isPublishing || !projectName.trim()}
              >
                {isPublishing ? (
                  publishedProject ? "Ενημέρωση..." : "Δημοσίευση..."
                ) : (
                  publishedProject ? "Ενημέρωση" : "Δημοσίευση"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language="html"
          value={code}
          onChange={(v) => onCodeChange(v || "")}
          onMount={handleEditorDidMount}
          theme="ai-builder-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            renderLineHighlight: "all",
            wordWrap: "on",
            tabSize: 2,
            insertSpaces: true,
            fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
            fontLigatures: true,
            readOnly: isGenerating || isPublishing,
          }}
        />
        {(isGenerating || isPublishing) && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-primary animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default CodeEditor;