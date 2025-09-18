import { Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SubscriptionBannerProps {
  credits: any;
  subscription: any;
  onUpgrade: () => void;
}

export const SubscriptionBanner = ({ credits, subscription, onUpgrade }: SubscriptionBannerProps) => {
  const isPro = subscription?.status === 'active';
  const dailyCreditsLeft = Math.max(0, 5 - (credits?.daily_credits_used || 0));
  const monthlyCreditsLeft = isPro ? Math.max(0, 100 - (credits?.monthly_credits_used || 0)) : 0;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isPro ? (
            <Crown className="w-5 h-5 text-yellow-500" />
          ) : (
            <Zap className="w-5 h-5 text-blue-500" />
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </span>
              {isPro && <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">Pro</Badge>}
            </div>
            <div className="text-sm text-gray-400">
              Daily: {dailyCreditsLeft}/5 credits
              {isPro && ` • Monthly: ${monthlyCreditsLeft}/100 credits`}
            </div>
          </div>
        </div>
        {!isPro && (
          <Button
            onClick={onUpgrade}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Upgrade to Pro
          </Button>
        )}
      </div>
    </div>
  );
};