import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCredits, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh user data after successful payment
    const refreshUserData = async () => {
      try {
        await Promise.all([
          refreshCredits(),
          refreshSubscription(),
        ]);
        
        toast({
          title: "Welcome to Pro!",
          description: "Your subscription is now active. Enjoy unlimited access!",
        });
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };

    if (sessionId) {
      // Wait a bit for Stripe to process the webhook
      setTimeout(refreshUserData, 2000);
    }
  }, [sessionId, refreshCredits, refreshSubscription, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-700 bg-gray-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-white text-2xl">Payment Successful!</CardTitle>
          <CardDescription className="text-gray-300">
            Welcome to the Pro plan! Your subscription is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h3 className="text-white font-semibold">Pro Plan Active</h3>
            </div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 100 monthly credits</li>
              <li>• 5 daily credits (up to 150/month total)</li>
              <li>• Priority support</li>
              <li>• Advanced AI features</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Start Building
            </Button>
            
            <p className="text-xs text-gray-400 text-center">
              You can manage your subscription anytime from your account settings
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Success;