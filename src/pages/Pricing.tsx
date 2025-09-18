import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Pricing = () => {
  const { user, session, subscription } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!session) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to upgrade your plan",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
        description: "Failed to create checkout session",
      });
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '€0',
      period: 'forever',
      description: 'Perfect for trying out our AI website builder',
      features: [
        '5 daily credits',
        'Basic AI generation',
        'Standard templates',
        'Community support',
      ],
      current: subscription?.status !== 'active',
      buttonText: 'Current Plan',
      buttonDisabled: true,
      icon: Zap,
    },
    {
      name: 'Pro',
      price: '€25',
      period: 'per month',
      description: 'For professionals and growing businesses',
      features: [
        '100 monthly credits',
        '5 daily credits (up to 150/month)',
        'Advanced AI features',
        'Premium templates',
        'Priority support',
        'Custom domains',
      ],
      current: subscription?.status === 'active',
      buttonText: subscription?.status === 'active' ? 'Current Plan' : 'Upgrade to Pro',
      buttonDisabled: subscription?.status === 'active',
      icon: Crown,
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">AI Builder</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Start building amazing websites with AI. Upgrade anytime to unlock more features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.name}
                className={`relative border-gray-700 bg-gray-800/50 backdrop-blur ${
                  plan.popular ? 'ring-2 ring-blue-500/50' : ''
                }`}
              >
                {plan.popular && (
                  <Badge 
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Icon className={`w-6 h-6 ${plan.name === 'Pro' ? 'text-yellow-500' : 'text-blue-500'}`} />
                    <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-1">/{plan.period}</span>
                  </div>
                  
                  <CardDescription className="text-gray-300">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={plan.name === 'Pro' && !plan.buttonDisabled ? handleUpgrade : undefined}
                    disabled={plan.buttonDisabled}
                    className={`w-full ${
                      plan.popular && !plan.buttonDisabled
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                        : plan.buttonDisabled
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">What are credits?</h3>
              <p className="text-gray-300 text-sm">
                Credits are used each time you generate or edit a website with AI. Free users get 5 daily credits, 
                while Pro users get 100 monthly credits plus 5 daily credits (up to 150 total per month).
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-300 text-sm">
                Yes! You can cancel your subscription at any time. You'll continue to have Pro access 
                until the end of your current billing period.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Do unused credits roll over?</h3>
              <p className="text-gray-300 text-sm">
                Daily credits reset every day. Monthly credits reset at the beginning of each billing cycle. 
                Unused credits do not roll over to the next period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;