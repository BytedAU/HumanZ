import { useParams } from 'wouter';
import { CollaborativeChallengeView } from '@/components/challenge/challenge-collaborative-view';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function ChallengePage() {
  const params = useParams<{ id: string }>();
  const challengeId = params.id ? parseInt(params.id) : undefined;
  
  const { data: challenge, isLoading } = useQuery({
    queryKey: ['/api/challenges', challengeId],
    queryFn: () => fetch(`/api/challenges/${challengeId}`).then(res => {
      if (!res.ok) throw new Error('Challenge not found');
      return res.json();
    }),
    enabled: !!challengeId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Challenge not found</h1>
        <p className="text-muted-foreground">The challenge you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  // Render appropriate view based on challenge type
  if (challenge.challengeType === 'collaborative') {
    return <CollaborativeChallengeView />;
  }

  // For individual challenges (to be implemented)
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{challenge.title}</h1>
      <p className="text-muted-foreground">Individual challenge view to be implemented.</p>
    </div>
  );
}