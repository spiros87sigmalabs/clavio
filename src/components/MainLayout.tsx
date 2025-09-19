import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ChatPanel from './ChatPanel';
import CodeEditor from './CodeEditor';
import PreviewPanel from './PreviewPanel';
import { SubscriptionBanner } from './SubscriptionBanner';
import { Button } from '@/components/ui/button';
import { Sparkles, User, Settings, Github, Download, Eye, EyeOff, LogOut, Crown, Zap, CreditCard, Save, Copy, FolderOpen } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
const MainLayout = () => {
  const navigate = useNavigate();
  const {
    user,
    session,
    credits,
    subscription,
    signOut,
    refreshCredits
  } = useAuth();
  const {
    toast
  } = useToast();
  const [htmlCode, setHtmlCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [lastReasoning, setLastReasoning] = useState('');
  const [currentReasoning, setCurrentReasoning] = useState('');
  const [isShowingReasoning, setIsShowingReasoning] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [showProjectsList, setShowProjectsList] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user && !session) {
      navigate('/auth');
    }
  }, [user, session, navigate]);

  // Sample HTML code to simulate AI generation
  const sampleLandingPages = {
    saas: `<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  <!-- Navigation -->
  <nav class="flex items-center justify-between p-6">
    <div class="flex items-center space-x-2">
      <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-sm">AI</span>
      </div>
      <span class="text-white font-semibold">WriteFlow</span>
    </div>
    <div class="hidden md:flex items-center space-x-8">
      <a href="#" class="text-gray-300 hover:text-white transition-colors">Features</a>
      <a href="#" class="text-gray-300 hover:text-white transition-colors">Pricing</a>
      <a href="#" class="text-gray-300 hover:text-white transition-colors">About</a>
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">Get Started</button>
    </div>
  </nav>

  <!-- Hero Section -->
  <div class="container mx-auto px-6 py-20">
    <div class="text-center">
      <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
        Write Smarter with
        <span class="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> AI Power</span>
      </h1>
      <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in">
        Transform your writing process with our advanced AI assistant. Create compelling content 10x faster.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
        <button class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
          Start Writing Free
        </button>
        <button class="border border-gray-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transition-colors">
          Watch Demo
        </button>
      </div>
    </div>

    <!-- Feature Cards -->
    <div class="grid md:grid-cols-3 gap-8 mt-20">
      <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 animate-float">
        <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
          <span class="text-white font-bold">✨</span>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">AI-Powered Writing</h3>
        <p class="text-gray-300">Generate high-quality content with advanced AI that understands your style.</p>
      </div>
      <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 animate-float" style="animation-delay: 0.2s">
        <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
          <span class="text-white font-bold">⚡</span>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
        <p class="text-gray-300">Create content in seconds, not hours. Boost your productivity instantly.</p>
      </div>
      <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 animate-float" style="animation-delay: 0.4s">
        <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
          <span class="text-white font-bold">🎯</span>
        </div>
        <h3 class="text-xl font-semibold text-white mb-3">Perfect Results</h3>
        <p class="text-gray-300">Get content that matches your brand voice and engages your audience.</p>
      </div>
    </div>
  </div>
</div>`,
    agency: `<div class="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
  <!-- Navigation -->
  <nav class="flex items-center justify-between p-6">
    <div class="text-2xl font-bold text-gray-800">Creative</div>
    <div class="hidden md:flex items-center space-x-8">
      <a href="#" class="text-gray-600 hover:text-orange-500 transition-colors">Work</a>
      <a href="#" class="text-gray-600 hover:text-orange-500 transition-colors">Services</a>
      <a href="#" class="text-gray-600 hover:text-orange-500 transition-colors">About</a>
      <button class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full transition-colors">Contact Us</button>
    </div>
  </nav>

  <!-- Hero Section -->
  <div class="container mx-auto px-6 py-16">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 class="text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
          We Create
          <span class="text-orange-500"> Bold</span> Experiences
        </h1>
        <p class="text-xl text-gray-600 mb-8 animate-fade-in">
          Award-winning creative agency specializing in branding, web design, and digital experiences that make your audience stop and stare.
        </p>
        <div class="flex gap-4 animate-fade-in">
          <button class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105">
            View Our Work
          </button>
          <button class="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-3 rounded-full font-semibold transition-colors">
            Get Quote
          </button>
        </div>
      </div>
      <div class="relative animate-float">
        <div class="w-80 h-80 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl transform rotate-6 shadow-2xl"></div>
        <div class="absolute inset-0 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl transform -rotate-6 shadow-2xl"></div>
      </div>
    </div>

    <!-- Services -->
    <div class="mt-24">
      <h2 class="text-4xl font-bold text-center text-gray-900 mb-12">What We Do Best</h2>
      <div class="grid md:grid-cols-4 gap-6">
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
            <span class="text-2xl">🎨</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Brand Design</h3>
          <p class="text-gray-600 text-sm">Creating memorable brand identities that stand out.</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
            <span class="text-2xl">💻</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Web Design</h3>
          <p class="text-gray-600 text-sm">Beautiful, functional websites that convert.</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
            <span class="text-2xl">📱</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Mobile Apps</h3>
          <p class="text-gray-600 text-sm">User-centered mobile experiences.</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <span class="text-2xl">🚀</span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Strategy</h3>
          <p class="text-gray-600 text-sm">Data-driven creative strategies.</p>
        </div>
      </div>
    </div>
  </div>
</div>`,
    mobile: `<div class="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
  <!-- Navigation -->
  <nav class="flex items-center justify-between p-6">
    <div class="flex items-center space-x-2">
      <div class="w-8 h-8 bg-indigo-600 rounded-lg"></div>
      <span class="text-xl font-bold text-gray-800">AppLand</span>
    </div>
    <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full transition-colors">
      Download
    </button>
  </nav>

  <!-- Hero Section -->
  <div class="container mx-auto px-6 py-16">
    <div class="text-center max-w-4xl mx-auto">
      <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
        The Future of
        <span class="text-indigo-600"> Mobile</span>
        is Here
      </h1>
      <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto animate-fade-in">
        Experience the next generation mobile app that revolutionizes how you connect, create, and collaborate on the go.
      </p>
      
      <!-- App Store Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
        <button class="bg-black text-white px-8 py-4 rounded-2xl flex items-center space-x-3 hover:bg-gray-800 transition-colors">
          <span class="text-2xl">📱</span>
          <div class="text-left">
            <div class="text-xs">Download on the</div>
            <div class="font-semibold">App Store</div>
          </div>
        </button>
        <button class="bg-black text-white px-8 py-4 rounded-2xl flex items-center space-x-3 hover:bg-gray-800 transition-colors">
          <span class="text-2xl">🤖</span>
          <div class="text-left">
            <div class="text-xs">Get it on</div>
            <div class="font-semibold">Google Play</div>
          </div>
        </button>
      </div>

      <!-- Phone Mockup -->
      <div class="relative mx-auto w-80 animate-float">
        <div class="bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
          <div class="bg-indigo-600 rounded-[2.5rem] h-96 flex flex-col items-center justify-center text-white">
            <div class="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <span class="text-3xl">✨</span>
            </div>
            <h3 class="text-xl font-semibold mb-2">Beautiful Interface</h3>
            <p class="text-indigo-200 text-center px-8 text-sm">Intuitive design that makes every interaction delightful</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="grid md:grid-cols-3 gap-8 mt-24">
      <div class="text-center">
        <div class="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">⚡</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
        <p class="text-gray-600">Optimized performance for instant loading and smooth interactions.</p>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">🔒</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Secure & Private</h3>
        <p class="text-gray-600">End-to-end encryption keeps your data safe and private.</p>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">🌟</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">Premium Experience</h3>
        <p class="text-gray-600">Crafted with attention to detail for the best user experience.</p>
      </div>
    </div>
  </div>
</div>`
  };
  const handleUpgrade = async () => {
    if (!session) return;
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create checkout session"
      });
    }
  };
  const handleManageSubscription = async () => {
    if (!session) return;
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open customer portal"
      });
    }
  };
  const handleSaveProject = async () => {
    if (!session) return;
    if (!htmlCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No code to save"
      });
      return;
    }
    const isPro = subscription?.status === 'active';
    if (!isPro) {
      toast({
        variant: "destructive",
        title: "Pro Plan Required",
        description: "Saving projects requires a Pro Plan subscription"
      });
      return;
    }
    let projectName;

    // If we have a current project, update it. Otherwise, ask for a new name.
    if (currentProject) {
      projectName = currentProject.project_name;
    } else {
      projectName = prompt(`Enter project name:`) || `Project ${new Date().toLocaleDateString()}`;
    }
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('save-project', {
        body: {
          project_name: projectName,
          html_content: htmlCode
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: currentProject ? "Project updated successfully" : "Project saved successfully"
      });

      // Refresh projects list and update current project
      loadSavedProjects();
      if (data?.project) {
        setCurrentProject(data.project);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save project"
      });
    }
  };
  const handleDownloadProject = async () => {
    if (!session) return;
    if (!htmlCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No code to download"
      });
      return;
    }
    const isPro = subscription?.status === 'active';
    if (!isPro) {
      toast({
        variant: "destructive",
        title: "Pro Plan Required",
        description: "Downloading projects requires a Pro Plan subscription"
      });
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('download-project', {
        body: {
          html_content: htmlCode,
          project_name: 'landing-page'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;

      // Create and download file
      const blob = new Blob([data.html], {
        type: 'text/html'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Success",
        description: "Project downloaded successfully"
      });
    } catch (error) {
      console.error('Error downloading project:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download project"
      });
    }
  };
  const handleCopyCode = async () => {
    if (!htmlCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No code to copy"
      });
      return;
    }
    const isPro = subscription?.status === 'active';
    if (!isPro) {
      toast({
        variant: "destructive",
        title: "Pro Plan Required",
        description: "Copying code requires a Pro Plan subscription"
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(htmlCode);
      toast({
        title: "Success",
        description: "Code copied to clipboard"
      });
    } catch (error) {
      console.error('Error copying code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy code"
      });
    }
  };
  const loadSavedProjects = async () => {
    if (!session) return;
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('load-projects', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      setSavedProjects(data.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };
  const loadProject = (project: any) => {
    setHtmlCode(project.html_content);
    setCurrentProject(project);
    setShowProjectsList(false);
    toast({
      title: "Success",
      description: `Loaded project: ${project.project_name}`
    });
  };

  // Load saved projects on mount
  useEffect(() => {
    if (session) {
      loadSavedProjects();
    }
  }, [session]);

  // Generate AI reasoning using OpenAI
  const generateAIReasoning = async (prompt: string): Promise<string> => {
    try {
      console.log('Calling AI reasoning function for prompt:', prompt);
      const { data, error } = await supabase.functions.invoke('ai-reasoning', {
        body: { prompt }
      });

      if (error) {
        console.error('Error calling ai-reasoning function:', error);
        // Fallback to default reasoning
      return `Analyzing your request...\nPlanning the best approach for your page.\nGenerating your design now...`;
      }

      return data?.reasoning || 'Thinking about your request...';
    } catch (error) {
      console.error('Error generating AI reasoning:', error);
      // Fallback to default reasoning
      return `Analyzing your request...\nPlanning the best approach for your page.\nGenerating your design now...`;
    }
  };

  const streamReasoning = (reasoning: string): Promise<void> => {
    return new Promise((resolve) => {
      setCurrentReasoning('');
      setIsShowingReasoning(true);
      
      let currentChar = 0;
      const reasoningInterval = setInterval(() => {
        if (currentChar < reasoning.length) {
          setCurrentReasoning(reasoning.slice(0, currentChar + 1));
          currentChar++;
        } else {
          clearInterval(reasoningInterval);
          setLastReasoning(reasoning);
          setIsShowingReasoning(false);
          setCurrentReasoning('');
          resolve();
        }
      }, 30); // Typing speed
    });
  };

  const generateLandingPage = async (prompt: string) => {
    setIsGenerating(true);
    setLastReasoning('');
    setCurrentReasoning('');
    setHtmlCode(''); // Clear previous code

    try {
      // Generate real AI reasoning first
      console.log('Generating AI reasoning for prompt:', prompt);
      const aiReasoning = await generateAIReasoning(prompt);
      
      // Stream the AI reasoning with typing effect and wait for it to complete
      await streamReasoning(aiReasoning);

      // Now generate the actual landing page
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('generate-landing-page', {
          body: {
            prompt,
            actionType: 'generate',
            isStreaming: false
          }
        });
        if (error) {
          console.error('Error generating landing page:', error);
          // Fallback to sample template
          fallbackToSample(prompt);
          return;
        }
        if (data?.content) {
          // Simulate streaming by gradually revealing the generated code
          const lines = data.content.split('\n');
          let currentLine = 0;
          const streamInterval = setInterval(() => {
            if (currentLine < lines.length) {
              setHtmlCode(lines.slice(0, currentLine + 1).join('\n'));
              currentLine++;
            } else {
              clearInterval(streamInterval);
              setIsGenerating(false);
            }
          }, 50); // Adjust speed for streaming effect
        } else {
          fallbackToSample(prompt);
        }
      } catch (error) {
        console.error('Error calling edge function:', error);
        fallbackToSample(prompt);
      }
    } catch (error) {
      console.error('Error in generateLandingPage:', error);
      setIsGenerating(false);
    }
  };
  const editLandingPage = async (prompt: string) => {
    if (!htmlCode.trim()) {
      // If no existing code, generate new
      generateLandingPage(prompt);
      return;
    }
    setIsGenerating(true);
    setLastReasoning('');
    setCurrentReasoning('');

    try {
      // Generate real AI reasoning for edit request
      console.log('Generating AI reasoning for edit request:', prompt);
      const aiReasoning = await generateAIReasoning(`Edit request: ${prompt}`);
      
      // Stream the AI reasoning with typing effect and wait for it to complete
      await streamReasoning(aiReasoning);

      // Now make the actual edits
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('generate-landing-page', {
          body: {
            prompt,
            existingCode: htmlCode,
            actionType: 'edit',
            isStreaming: false
          }
        });
        if (error) {
          console.error('Error editing landing page:', error);
          setIsGenerating(false);
          return;
        }
        if (data?.reasoning) {
  // Show actual API reasoning if available
  console.log('AI Reasoning:', data.reasoning);
  await streamReasoning(data.reasoning);
  if (data?.content) {
    setHtmlCode(data.content);
    setIsGenerating(false);
  } else {
    setIsGenerating(false);
  }
} else {
          if (data?.content) {
  // Validation: Έλεγχος αν η απάντηση είναι πλήρης HTML
  const content = data.content.trim();
  const isCompleteHTML = content.includes('<!DOCTYPE') || 
                         content.includes('<html') ||
                         (content.includes('<body') && content.length > htmlCode.length * 0.5);
  
  // Έλεγχος αν το περιεχόμενο δεν είναι υπερβολικά μικρό
  const isReasonableLength = content.length > 1000; // Τουλάχιστον 1KB για μια landing page
  
  // Έλεγχος για σημεία που δείχνουν πλήρη HTML
  const hasStructure = content.includes('<head>') && content.includes('<body>');
  
  if (isCompleteHTML && isReasonableLength && hasStructure) {
    console.log('✅ Received complete HTML, updating code');
    setHtmlCode(data.content);
  } else {
    console.warn('⚠️ Received incomplete HTML response:', {
      length: content.length,
      hasDoctype: content.includes('<!DOCTYPE'),
      hasHtml: content.includes('<html'),
      hasHead: content.includes('<head>'),
      hasBody: content.includes('<body>'),
      isReasonableLength
    });
    
    // Fallback: Μην αλλάξεις τίποτα και ενημέρωσε τον χρήστη
    toast({
      variant: "destructive",
      title: "Incomplete Response",
      description: "AI returned incomplete code. Please try rephrasing your request."
    });
  }
  setIsGenerating(false);
} else {
  setIsGenerating(false);
}
        }
      } catch (error) {
        console.error('Error calling edge function for edit:', error);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Error in editLandingPage:', error);
      setIsGenerating(false);
    }
  };
  const fallbackToSample = (prompt: string) => {
    // Fallback to sample templates if API fails
    let selectedTemplate = sampleLandingPages.saas; // default

    if (prompt.toLowerCase().includes('agency') || prompt.toLowerCase().includes('creative')) {
      selectedTemplate = sampleLandingPages.agency;
    } else if (prompt.toLowerCase().includes('mobile') || prompt.toLowerCase().includes('app')) {
      selectedTemplate = sampleLandingPages.mobile;
    }
    const lines = selectedTemplate.split('\n');
    let currentLine = 0;
    const streamInterval = setInterval(() => {
      if (currentLine < lines.length) {
        setHtmlCode(lines.slice(0, currentLine + 1).join('\n'));
        currentLine++;
      } else {
        clearInterval(streamInterval);
        setIsGenerating(false);
      }
    }, 50);
  };
  const handleSendMessage = (message: string) => {
    const lower = message.toLowerCase();
    const hasCode = htmlCode.trim().length > 0;

    // Default to EDIT when code exists, unless the user explicitly asks to start over/new
    const generateKeywords = ['start over', 'from scratch', 'regenerate', 'reset', 'fresh page', 'fresh site', 'new site', 'new page from scratch', 'create a website', 'create website', 'build a website', 'make a new website', 'another website', 'different template', 'new template'];
    const forceGenerate = generateKeywords.some(k => lower.includes(k));
    const shouldEdit = hasCode && !forceGenerate;
    if (shouldEdit) {
      editLandingPage(message);
    } else {
      generateLandingPage(message);
    }
  };
  const handleCodeChange = (newCode: string) => {
    setHtmlCode(newCode);
  };
  const toggleGeneration = () => {
    setIsGenerating(!isGenerating);
  };

  // Subscription/credits summary used in account dropdown
  const isProPlan = subscription?.status === 'active';
  const dailyLeft = Math.max(0, 5 - (credits?.daily_credits_used || 0));
  const monthlyLeft = isProPlan ? Math.max(0, 100 - (credits?.monthly_credits_used || 0)) : 0;
  return <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-glow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Clavio</h1>
            <p className="text-xs text-muted-foreground">Generate beautiful landing pages with AI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setShowCodeEditor(!showCodeEditor)}>
            {showCodeEditor ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showCodeEditor ? 'Hide Code' : 'Show Code'}
          </Button>
          
          {htmlCode && <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleSaveProject}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleDownloadProject}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleCopyCode}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
            </>}
          
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setShowProjectsList(!showProjectsList)}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Load Project
          </Button>
          
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          
          {/* User Menu */}
          {user ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <User className="w-4 h-4 mr-2" />
                  {user.email?.split('@')[0]}
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {isProPlan ? <Crown className="h-4 w-4 text-yellow-500" /> : <Zap className="h-4 w-4 text-blue-500" />}
                      <span className="text-sm font-medium">{isProPlan ? 'Pro Plan' : 'Free Plan'}</span>
                      {isProPlan && <Badge variant="secondary">Pro</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Daily: {dailyLeft}/5{isProPlan && <> • Monthly: {monthlyLeft}/100</>}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => refreshCredits()}>
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Refresh Credits</span>
                </DropdownMenuItem>
                {subscription?.status !== 'active' && <DropdownMenuItem onClick={handleUpgrade}>
                    <Crown className="mr-2 h-4 w-4" />
                    <span>Upgrade to Pro</span>
                  </DropdownMenuItem>}
                {subscription?.status === 'active' && <DropdownMenuItem onClick={handleManageSubscription}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Manage Subscription</span>
                  </DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/auth')}>
              <User className="w-4 h-4 mr-2" />
              Login
            </Button>}
        </div>
      </div>

      {/* Main Content - Two/Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - 30% */}
        <div className="w-[30%] min-w-[350px] flex flex-col min-h-0">
          {/* Subscription Banner */}
          
          <div className="flex-1 min-h-0">
            {showProjectsList ? <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Saved Projects</h3>
                  <Button onClick={() => setShowProjectsList(false)} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    ✕
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {savedProjects.length === 0 ? <div className="text-center text-muted-foreground mt-8">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No saved projects yet</p>
                      <p className="text-sm mt-2">Save your first project to see it here</p>
                    </div> : <div className="space-y-3">
                      {savedProjects.map((project: any) => <div key={project.id} className="p-3 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors" onClick={() => loadProject(project)}>
                          <h4 className="font-medium">{project.project_name}</h4>
                          <p className="text-muted-foreground text-sm mt-1">
                            Updated {new Date(project.updated_at).toLocaleDateString()}
                          </p>
                        </div>)}
                    </div>}
                </div>
              </div> : <ChatPanel onSendMessage={handleSendMessage} isGenerating={isGenerating} lastReasoning={lastReasoning} />}
          </div>
        </div>
        
        {/* Code Editor - 35% - Conditionally Rendered */}
        {showCodeEditor && <div className="w-[35%] min-w-[400px]">
            <CodeEditor code={htmlCode} isGenerating={isGenerating} onCodeChange={handleCodeChange} onToggleGeneration={toggleGeneration} />
          </div>}
        
        {/* Preview Panel - Flexible width */}
        <div className="flex-1">
         <PreviewPanel
  htmlCode={htmlCode}
  isGenerating={isGenerating}
  onEditSelection={(htmlSnippet, content, userChange) => {
    // Δημιουργούμε prompt που περιλαμβάνει HTML, αρχικό content και μήνυμα χρήστη
    const prompt = `
Edited section: ${htmlSnippet}
Content: "${content}"
User requested change: ${userChange}
`;
    handleSendMessage(prompt);
  }}
/>
        </div>
      </div>
    </div>;
};
export default MainLayout;